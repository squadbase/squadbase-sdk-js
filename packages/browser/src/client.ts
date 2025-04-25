import { User, zUser } from "./types";

export type BrowserClientOptions = {
  projectId: string;
  mockUser?: User;
};

export class BrowserClient {
  private readonly options: BrowserClientOptions;

  constructor(options: BrowserClientOptions) {
    this.options = options;
  }

  async getUser() {
    const isLocal = window.location.hostname === "localhost";

    // ホスティング環境では認証がプロキシで通った場合にのみアプリケーションに到達するためsessionTokenが必ず存在する
    // ローカル環境の場合はmockUserを返す
    if (isLocal) {
      if (!this.options.mockUser) {
        throw new Error(
          "No session token or mock user provided. Please provide one of them to use getUser in local environment."
        );
      }

      return this.options.mockUser;
    }

    const response = await fetch("/_sqcore/auth", { method: "POST" });

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    const body = await response.json();

    const user = zUser.parse(body);

    return user;
  }
}

export const createBrowserClient = (options: BrowserClientOptions) =>
  new BrowserClient(options);
