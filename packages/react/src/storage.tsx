import { z } from "zod";

/**
 * Browser client for the Project Storage uploads namespace.
 *
 * Requests target the same-origin path `/_sqcore/storage/*` with
 * `credentials: "include"`, reusing the session cookie that already
 * authenticates the hosted app. It must run inside a Squadbase-hosted app
 * where that cookie is present.
 *
 * Provides reads (list / head / get / getUrl) and writes
 * (put / delete / copy / move).
 */

const STORAGE_BASE_PATH = "/_sqcore/storage";

/* ------------------------------------------------------------------ *
 * Internal schemas validating the raw backend responses. Kept private and
 * mapped to the public types below so the backend wire format never leaks
 * into the public API.
 * ------------------------------------------------------------------ */

const zApiListItem = z.object({
  key: z.string(),
  size: z.number(),
  lastModified: z.string(),
});

const zApiListResult = z.object({
  objects: z.array(zApiListItem),
  commonPrefixes: z.array(z.string()).default([]),
  nextCursor: z.string().optional(),
});

const zApiMetadata = z.object({
  key: z.string(),
  size: z.number(),
  contentType: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  source: z.enum(["upload", "agent", "system"]),
});

const zApiPresignedGet = z.object({
  url: z.string(),
  expiresAt: z.string(),
});

const zApiPresignedPut = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string(),
});

/* ------------------------------------------------------------------ *
 * Public types. Defined independently of the backend schemas and limited to
 * the fields a dashboard app needs.
 * ------------------------------------------------------------------ */

/** A single file in a listing. */
export type StorageObject = {
  /** Relative key within the uploads namespace. */
  key: string;
  /** Size in bytes. */
  size: number;
  /** Last modified time (ISO 8601). */
  lastModified: string;
};

export type StorageListResult = {
  /** Files under the requested prefix. */
  objects: StorageObject[];
  /** Sub-prefixes (folders) returned when `delimiter` is set; otherwise empty. */
  commonPrefixes: string[];
  /** Cursor to pass back for the next page, if any. */
  nextCursor?: string;
};

/** Metadata for a single file. */
export type StorageMetadata = {
  key: string;
  size: number;
  /** MIME type. */
  contentType: string;
  /** Creation time (ISO 8601). */
  createdAt: string;
};

/** A presigned URL and its expiry. */
export type PresignedUrl = {
  url: string;
  /** Expiry time (ISO 8601). Re-fetch before it expires. */
  expiresAt: string;
};

export type StorageListOptions = {
  /** Maximum number of entries to return. */
  limit?: number;
  /** Pagination cursor from a previous `nextCursor`. */
  cursor?: string;
  /**
   * When set to `"/"`, splits the result into direct files and
   * `commonPrefixes` (folders). When omitted, lists every file under the
   * prefix recursively as a flat list.
   */
  delimiter?: string;
};

export type StoragePutOptions = {
  /** Defaults to `application/octet-stream`. */
  contentType?: string;
};

export type StorageCopyOptions = {
  /** When omitted, an existing destination is overwritten. */
  overwrite?: boolean;
};

/** Builds a `/_sqcore/storage` URL, appending defined query params. */
const storageUrl = (
  path: string,
  query?: Record<string, string | undefined>,
): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value != null) params.set(key, value);
  }
  const qs = params.toString();
  return `${STORAGE_BASE_PATH}${path}${qs.length > 0 ? `?${qs}` : ""}`;
};

/** Throws with the response text when `res` is not a 2xx. */
const throwIfNotOk = async (res: Response, label: string): Promise<void> => {
  if (res.ok) return;
  const text = await res.text();
  throw new Error(
    `Project Storage ${label} failed: ${res.status} ${res.statusText}: ${text}`,
  );
};

export class StorageUploadsClient {
  /**
   * Lists files under a prefix. Pass `delimiter: "/"` for a folder-style
   * listing, or omit it for a flat recursive listing.
   */
  async list(
    prefix?: string,
    options?: StorageListOptions,
  ): Promise<StorageListResult> {
    const res = await fetch(
      storageUrl("/list", {
        prefix,
        limit: options?.limit != null ? String(options.limit) : undefined,
        cursor: options?.cursor,
        delimiter: options?.delimiter,
      }),
      { credentials: "include" },
    );
    await throwIfNotOk(res, "list");
    const data = zApiListResult.parse(await res.json());
    return {
      objects: data.objects.map((o) => ({
        key: o.key,
        size: o.size,
        lastModified: o.lastModified,
      })),
      commonPrefixes: data.commonPrefixes,
      nextCursor: data.nextCursor,
    };
  }

  /**
   * Fetches a file's metadata without reading its body.
   */
  async head(key: string): Promise<StorageMetadata> {
    const res = await fetch(storageUrl("/head", { key }), {
      credentials: "include",
    });
    await throwIfNotOk(res, "head");
    const data = zApiMetadata.parse(await res.json());
    return {
      key: data.key,
      size: data.size,
      contentType: data.contentType,
      createdAt: data.createdAt,
    };
  }

  /**
   * Returns a short-lived presigned GET URL for a file. Re-fetch before
   * `expiresAt` to keep the URL valid.
   */
  async getUrl(key: string): Promise<PresignedUrl> {
    const res = await fetch(storageUrl("/sign", { key }), {
      credentials: "include",
    });
    await throwIfNotOk(res, "getUrl");
    const data = zApiPresignedGet.parse(await res.json());
    return { url: data.url, expiresAt: data.expiresAt };
  }

  /**
   * Fetches a file's contents and returns the raw `Response`. Use the standard
   * `Response` methods (`.text()` / `.json()` / `.blob()` / `.arrayBuffer()`)
   * to read the body.
   */
  async get(key: string): Promise<Response> {
    const { url } = await this.getUrl(key);
    const res = await fetch(url, { method: "GET" });
    await throwIfNotOk(res, "get");
    return res;
  }

  /**
   * Uploads a file. `data` may be a `Blob` (including `File`), `ArrayBuffer`,
   * `Uint8Array`, or `string`.
   */
  async put(
    key: string,
    data: Blob | ArrayBuffer | Uint8Array | string,
    options?: StoragePutOptions,
  ): Promise<void> {
    const contentType = options?.contentType ?? "application/octet-stream";
    const body =
      typeof data === "string" ? new Blob([data], { type: contentType }) : data;
    const contentLength =
      body instanceof Blob
        ? body.size
        : (body as ArrayBuffer | Uint8Array).byteLength;

    const signRes = await fetch(storageUrl("/sign"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, contentType, contentLength }),
    });
    await throwIfNotOk(signRes, "put (sign)");
    const signed = zApiPresignedPut.parse(await signRes.json());

    const putRes = await fetch(signed.url, {
      method: "PUT",
      headers: signed.headers,
      body,
    });
    await throwIfNotOk(putRes, "put (S3)");
  }

  /**
   * Deletes a file.
   */
  async delete(key: string): Promise<void> {
    const res = await fetch(storageUrl("/objects", { key }), {
      method: "DELETE",
      credentials: "include",
    });
    await throwIfNotOk(res, "delete");
  }

  /**
   * Copies a file to a new key.
   */
  async copy(
    srcKey: string,
    destKey: string,
    options?: StorageCopyOptions,
  ): Promise<void> {
    const res = await fetch(storageUrl("/copy"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srcKey, destKey, overwrite: options?.overwrite }),
    });
    await throwIfNotOk(res, "copy");
  }

  /**
   * Moves (renames) a file to a new key.
   */
  async move(
    srcKey: string,
    destKey: string,
    options?: StorageCopyOptions,
  ): Promise<void> {
    const res = await fetch(storageUrl("/move"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srcKey, destKey, overwrite: options?.overwrite }),
    });
    await throwIfNotOk(res, "move");
  }
}

export type StorageClient = {
  uploads: StorageUploadsClient;
};

const storageClient: StorageClient = {
  uploads: new StorageUploadsClient(),
};

/** Returns the Project Storage client. */
export function useStorage(): StorageClient {
  return storageClient;
}
