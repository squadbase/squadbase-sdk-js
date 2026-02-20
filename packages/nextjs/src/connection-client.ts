import {
  createConnectionClient as createBaseConnectionClient,
  ConnectionClientOptions,
} from "@squadbase/server";
import { cookies } from "next/headers";

type NextjsConnectionClientOptions = Omit<
  ConnectionClientOptions,
  "cookieOptions"
>;

export function createConnectionClient(options: NextjsConnectionClientOptions) {
  return createBaseConnectionClient({
    ...options,
    cookieOptions: { getCookie: async () => (await cookies()).toString() },
  });
}
