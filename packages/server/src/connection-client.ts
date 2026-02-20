import { parse as parseCookie } from "cookie";
import {
  APP_BASE_DOMAIN,
  APP_SESSION_COOKIE_NAME,
  MACHINE_CREDENTIAL_ENV_NAME,
  PREVIEW_BASE_DOMAIN,
  PREVIEW_SESSION_COOKIE_NAME,
  SANDBOX_ID_ENV_NAME,
} from "./constants";
import type { GetCookie } from "./client";

export type ConnectionClientOptions = {
  connectionId: string;
  projectId?: string;
  cookieOptions: {
    getCookie: GetCookie;
  };
  _internal?: {
    app_base_domain?: string;
    preview_base_domain?: string;
  };
};

export type ConnectionFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export type ConnectionFetchResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  isBase64Encoded: boolean;
};

export class ConnectionClient {
  private readonly options: ConnectionClientOptions;

  constructor(options: ConnectionClientOptions) {
    this.options = options;
  }

  async fetch(
    url: string,
    fetchOptions?: ConnectionFetchOptions
  ): Promise<ConnectionFetchResponse> {
    const proxyUrl = this.resolveProxyUrl();
    const authHeaders = await this.resolveAuthHeaders();

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        url,
        method: fetchOptions?.method,
        headers: fetchOptions?.headers,
        body: fetchOptions?.body,
        timeoutMs: fetchOptions?.timeoutMs,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Connection proxy request failed with status ${response.status}`
      );
    }

    return (await response.json()) as ConnectionFetchResponse;
  }

  private get projectIdOrThrow(): string {
    const projectId =
      this.options.projectId ?? process.env["SQUADBASE_PROJECT_ID"];

    if (!projectId) {
      throw new Error(
        "Project ID is required. Please set SQUADBASE_PROJECT_ID environment variable or provide projectId in ConnectionClient options."
      );
    }

    return projectId;
  }

  private get connectionPath(): string {
    return `/_sqcore/connections/${this.options.connectionId}/request`;
  }

  private resolveProxyUrl(): string {
    const sandboxId = process.env[SANDBOX_ID_ENV_NAME];

    if (sandboxId) {
      const baseDomain =
        this.options._internal?.preview_base_domain ?? PREVIEW_BASE_DOMAIN;
      return `https://${sandboxId}.${baseDomain}${this.connectionPath}`;
    }

    const baseDomain =
      this.options._internal?.app_base_domain ?? APP_BASE_DOMAIN;
    return `https://${this.projectIdOrThrow}.${baseDomain}${this.connectionPath}`;
  }

  private async resolveAuthHeaders(): Promise<Record<string, string>> {
    const machineCredential = process.env[MACHINE_CREDENTIAL_ENV_NAME];
    if (machineCredential) {
      return { Authorization: `Bearer ${machineCredential}` };
    }

    const cookieString =
      (await this.options.cookieOptions.getCookie()) ?? "";
    const cookie = parseCookie(cookieString);

    const previewSessionToken = cookie[PREVIEW_SESSION_COOKIE_NAME];
    if (previewSessionToken) {
      return {
        Cookie: `${PREVIEW_SESSION_COOKIE_NAME}=${previewSessionToken}`,
      };
    }

    const appSessionToken = cookie[APP_SESSION_COOKIE_NAME];
    if (appSessionToken) {
      return { Authorization: `Bearer ${appSessionToken}` };
    }

    throw new Error(
      "No authentication method available for connection proxy. " +
        "Expected one of: INTERNAL_SQUADBASE_OAUTH_MACHINE_CREDENTIAL env var, " +
        "preview session cookie, or app session cookie."
    );
  }
}

export const createConnectionClient = (options: ConnectionClientOptions) =>
  new ConnectionClient(options);
