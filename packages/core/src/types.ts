
export type QueryStatus = 
  | "idle"
  | "pending"
  | "success"
  | "error";

export interface QueryState<TData = unknown> {
  data: TData | undefined;
  error: Error | null;
  status: QueryStatus;
  isFetching: boolean;
  updatedAt: number | null;
}

export interface QueryOptions<TData> {
  key: readonly unknown[];
  queryFn: (context: {
    signal: AbortSignal;
  }) => Promise<TData>;
}

export interface QueryResult<TData> {
  data: TData | undefined;
  error: Error | null;
  status: QueryStatus;
  isFetching: boolean;
}
