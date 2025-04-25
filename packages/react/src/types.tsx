export type PendingQueryResult<T, E> = {
  status: "pending";
  data?: T;
  error?: E;
};

export type SuccessQueryResult<T, E> = {
  status: "success";
  data: T;
  error?: E;
};

export type ErrorQueryResult<T, E> = {
  status: "error";
  data?: T;
  error: E;
};

export type QueryResult<T, E> =
  | PendingQueryResult<T, E>
  | SuccessQueryResult<T, E>
  | ErrorQueryResult<T, E>;
