import { type ReactNode } from "react";
import { UserProvider } from "./user";

export function SquadbaseProvider({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
