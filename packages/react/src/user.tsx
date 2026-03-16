import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

const zUser = z.object({
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  iconUrl: z.string().nullable(),
  roles: z.array(z.string()),
});

export type User = z.infer<typeof zUser>;

async function fetchUser() {
  const response = await fetch("/_sqcore/auth", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to get user");
  }
  return zUser.parse(await response.json());
}

export type UserState =
  | { status: "pending" }
  | { status: "success"; data: User }
  | { status: "error"; error: string };

const UserContext = createContext<UserState | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>({ status: "pending" });

  useEffect(() => {
    fetchUser()
      .then((data) => setState({ status: "success", data }))
      .catch((e) =>
        setState({
          status: "error",
          error: e instanceof Error ? e.message : "Failed to get user",
        }),
      );
  }, []);

  return (
    <UserContext.Provider value={state}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserState {
  const state = useContext(UserContext);
  if (!state) {
    throw new Error("<SquadbaseProvider> is not found");
  }
  return state;
}
