import { parse as parseCookie } from "cookie";
import {
  APP_BASE_DOMAIN,
  APP_SESSION_COOKIE_NAME,
  PREVIEW_BASE_DOMAIN,
  PREVIEW_SESSION_COOKIE_NAME,
  PROJECT_ID_ENV_NAME,
  SANDBOX_ID_ENV_NAME,
} from "./constants";
import { User, zUser } from "./types";

export type GetCookie = () => Promise<string | undefined> | string | undefined;

export type ServerClientOptions = {
  projectId?: string; // legacy compatibility only
  cookieOptions: {
    getCookie: GetCookie;
  };
  mockUser?: User;
  _internal?: { app_base_domain?: string; preview_base_domain?: string };
};

export class ServerClient {
  private readonly options: ServerClientOptions;

  constructor(options: ServerClientOptions) {
    this.options = options;
  }

  async getUser() {
    const cookie = parseCookie(
      (await this.options.cookieOptions.getCookie()) ?? ""
    );

    const appSessionToken = cookie[APP_SESSION_COOKIE_NAME];
    const previewSessionToken = cookie[PREVIEW_SESSION_COOKIE_NAME];

    // ホスティング環境では認証がプロキシで通った場合にのみアプリケーションに到達するためsessionTokenが必ず存在する
    // Editor環境ではAPP_SESSION_COOKIE_NAMEではなくPREVIEW_SESSION_COOKIE_NAMEが使われる
    // ローカル環境の場合はmockUserを返す
    if (!appSessionToken && !previewSessionToken) {
      if (!this.options.mockUser) {
        throw new Error(
          "No session token or mock user provided. Please provide one of them to use getUser in local environment."
        );
      }

      return this.options.mockUser;
    }

    // one of appSessionToken or previewSessionToken must be defined here, so we can use non-null assertion
    const request = appSessionToken
      ? this.getUserWithAppSessionRequest(appSessionToken)
      : this.getUserWithPreviewSession(previewSessionToken!);

    const response = await fetch(request);

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    const body = await response.json();

    const user = zUser.parse(body);

    return user;
  }

  private get projectIdOrThrow() {
    const projectId =
      this.options.projectId ?? process.env[PROJECT_ID_ENV_NAME];

    if (!projectId) {
      throw new Error(
        `Project ID is required. Please provide projectId in ServerClient options if you are running in local development environment.`
      );
    }

    return projectId;
  }

  private get sandboxIdOrThrow() {
    const sandboxId = process.env[SANDBOX_ID_ENV_NAME];

    if (!sandboxId) {
      throw new Error(
        `Sandbox ID is required. Please set ${SANDBOX_ID_ENV_NAME} environment variable.`
      );
    }

    return sandboxId;
  }

  private getUserWithAppSessionRequest(appSessionToken: string) {
    return new Request(
      `https://${this.projectIdOrThrow}.${
        this.options._internal?.app_base_domain ?? APP_BASE_DOMAIN
      }/_sqcore/auth`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appSessionToken}`,
        },
      }
    );
  }

  private getUserWithPreviewSession(previewSessionToken: string) {
    return new Request(
      `https://${this.sandboxIdOrThrow}.${
        this.options._internal?.preview_base_domain ?? PREVIEW_BASE_DOMAIN
      }/_sqcore/auth`,
      {
        method: "POST",
        headers: {
          Cookie: `${PREVIEW_SESSION_COOKIE_NAME}=${previewSessionToken}`,
        },
      }
    );
  }
}

export const createServerClient = (options: ServerClientOptions) =>
  new ServerClient(options);
