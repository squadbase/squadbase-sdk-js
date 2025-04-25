import { createServerClient, ServerClientOptions } from "@squadbase/server";
import { cookies } from "next/headers";

type NextjsServerClientOptions = Omit<ServerClientOptions, "cookieOptions">;

export function createNextjsServerClient(options: NextjsServerClientOptions) {
  return createServerClient({
    ...options,
    cookieOptions: { getCookie: async () => (await cookies()).toString() },
  });
}
