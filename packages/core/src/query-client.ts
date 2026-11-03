
import type {
  QueryOptions,
  QueryState
} from "./types";

import type { QueryKey } from "./query-key";

import { hashQueryKey } from "./query-key";
import { QueryStore } from "./query-store";

interface ActiveRequest {
  id: number;
  controller: AbortController;
  promise: Promise<unknown>;
}

export class QueryClient {
  private store = new QueryStore();

  private inFlight = new Map<string, ActiveRequest>();

  private requestCounter = 0;

  getQueryState<TData>(
    key: QueryKey
  ): QueryState<TData> {
    return this.store.getState<TData>(key);
  }

  getQueryData<TData>(
    key: QueryKey
  ): TData | undefined {
    return this.store.getState<TData>(key).data;
  }

  subscribe<TData>(
    key: QueryKey,
    listener: (state: QueryState<TData>) => void
  ): () => void {
    return this.store.subscribe(key, listener);
  }

  async fetchQuery<TData>(
    options: QueryOptions<TData>
  ): Promise<TData> {
    const queryHash = hashQueryKey(options.key);

    const currentState =
      this.store.getState<TData>(options.key);

    const staleTime = Math.max(
      0,
      options.staleTime ?? 0
    );

    const hasData = currentState.status === "success";

    const isFresh =
      hasData &&
      !currentState.isInvalidated &&
      currentState.updatedAt !== null &&
      Date.now() - currentState.updatedAt < staleTime;

    if (isFresh) {
      return currentState.data as TData;
    }

    const existingRequest = this.inFlight.get(queryHash);

    if (existingRequest) {
      return existingRequest.promise as Promise<TData>;
    }

    const requestId = ++this.requestCounter;

    const controller = new AbortController();

    this.store.setState<TData>(options.key, {
      ...currentState,
      error: null,
      status: hasData ? "success" : "pending",
      isFetching: true
    });

    const promise = (async () => {
      try {
        const data = await options.queryFn({
          signal: controller.signal
        });

        const activeRequest = this.inFlight.get(queryHash);

        if (activeRequest?.id !== requestId) {
          return data;
        }

        this.store.setState<TData>(options.key, {
          data,
          error: null,
          status: "success",
          isFetching: false,
          updatedAt: Date.now(),
          isInvalidated: false
        });

        return data;
      } catch (error) {
        const activeRequest = this.inFlight.get(queryHash);

        if (activeRequest?.id === requestId) {
          const normalizedError =
            error instanceof Error
              ? error
              : new Error(String(error));

          this.store.setState<TData>(options.key, {
            ...this.store.getState<TData>(options.key),
            error: normalizedError,
            status: "error",
            isFetching: false
          });

          throw normalizedError;
        }

        throw error;
      } finally {
        const activeRequest = this.inFlight.get(queryHash);

        if (activeRequest?.id === requestId) {
          this.inFlight.delete(queryHash);
        }
      }
    })();

    this.inFlight.set(queryHash, {
      id: requestId,
      controller,
      promise
    });

    return promise;
  }

  setQueryData<TData>(
    key: QueryKey,
    data: TData
  ): void {
    const queryHash = hashQueryKey(key);

    const activeRequest = this.inFlight.get(queryHash);

    if (activeRequest) {
      this.inFlight.delete(queryHash);
      activeRequest.controller.abort();
    }

    this.store.setState<TData>(key, {
      data,
      error: null,
      status: "success",
      isFetching: false,
      updatedAt: Date.now(),
      isInvalidated: false
    });
  }

  invalidateQueries(key: QueryKey): void {
    const queryHash = hashQueryKey(key);

    const currentState =
      this.store.getState(key);

    if (currentState.status === "idle") {
      return;
    }

    this.store.setState(key, {
      ...currentState,
      isInvalidated: true
    });

    // A running request may have started before invalidation.
    // Its result must not silently make the query fresh.
    const activeRequest = this.inFlight.get(queryHash);

    if (activeRequest) {
      this.inFlight.delete(queryHash);
      activeRequest.controller.abort();
    }
  }

  clear(): void {
    for (const request of this.inFlight.values()) {
      request.controller.abort();
    }

    this.inFlight.clear();
    this.store.clear();
  }
}
