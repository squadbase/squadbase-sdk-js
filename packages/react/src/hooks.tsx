import {
  createBrowserClient,
  BrowserClientOptions,
  BrowserClient,
  User,
} from "@squadbase/browser";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { QueryResult } from "./types";
import { match } from "ts-pattern";

type SquadbaseProviderProps = PropsWithChildren<BrowserClientOptions>;

const SquadbaseContext = createContext<BrowserClient | null>(null);

export function useSquadbaseClient() {
  const client = useContext(SquadbaseContext);

  if (!client) {
    throw new Error("<SquadbaseProvider> is not found");
  }
  return client;
}

const queryClient = new QueryClient();

export function SquadbaseProvider(props: SquadbaseProviderProps) {
  const { children, ...options } = props;

  // optionsが変更されてもclientを再生成しない
  const client = useMemo(() => createBrowserClient(options), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SquadbaseContext.Provider value={client}>
        {children}
      </SquadbaseContext.Provider>
    </QueryClientProvider>
  );
}

const getUserQueryKey = () => ["user"] as const;

export function useUser(): QueryResult<User, string> {
  const client = useSquadbaseClient();

  const result = useQuery<
    User,
    string,
    User,
    ReturnType<typeof getUserQueryKey>
  >({
    queryKey: getUserQueryKey(),
    queryFn: useCallback(() => client.getUser(), [client]),
  });

  return match(result)
    .with({ status: "pending" }, () => ({ status: "pending" } as const))
    .with(
      { status: "success" },
      ({ data }) => ({ status: "success", data } as const)
    )
    .with(
      { status: "error" },
      () => ({ status: "error", error: "Failed to get user" } as const)
    )
    .exhaustive();
}
