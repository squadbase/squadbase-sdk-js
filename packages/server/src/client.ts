import { parse as parseCookie } from "cookie";
import { APP_BASE_DOMAIN, SESSION_COOKIE_NAME } from "./constants";
import { User, zUser } from "./types";

export type GetCookie = () => Promise<string | undefined> | string | undefined;

export type ServerClientOptions = {
  projectId: string;
  cookieOptions: {
    getCookie: GetCookie;
  };
  mockUser?: User;
  _internal?: { app_base_domain?: string };
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

    const sessionToken = cookie[SESSION_COOKIE_NAME];

    // ホスティング環境では認証がプロキシで通った場合にのみアプリケーションに到達するためsessionTokenが必ず存在する
    // ローカル環境の場合はmockUserを返す
    if (!sessionToken) {
      if (!this.options.mockUser) {
        throw new Error(
          "No session token or mock user provided. Please provide one of them to use getUser in local environment."
        );
      }

      return this.options.mockUser;
    }

    const request = new Request(
      `https://${this.options.projectId}.${
        this.options._internal?.app_base_domain ?? APP_BASE_DOMAIN
      }/_sqcore/auth`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    const response = await fetch(request);

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    const body = await response.json();

    const user = zUser.parse(body);

    return user;
  }
}

export const createServerClient = (options: ServerClientOptions) =>
  new ServerClient(options);
