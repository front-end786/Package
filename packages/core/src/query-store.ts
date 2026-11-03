
import type { QueryState } from "./types";
import type { QueryKey } from "./query-key";
import { hashQueryKey } from "./query-key";

type QueryListener<TData = unknown> = (
  state: QueryState<TData>
) => void;

const IDLE_STATE: QueryState<unknown> = Object.freeze({
  data: undefined,
  error: null,
  status: "idle",
  isFetching: false,
  updatedAt: null,
  isInvalidated: false
});

export class QueryStore {
  private states = new Map<string, QueryState<unknown>>();

  private listeners = new Map<
    string,
    Set<QueryListener<unknown>>
  >();

  getState<TData>(key: QueryKey): QueryState<TData> {
    const queryHash = hashQueryKey(key);
    const state = this.states.get(queryHash);

    return (state ?? IDLE_STATE) as QueryState<TData>;
  }

  setState<TData>(
    key: QueryKey,
    state: QueryState<TData>
  ): void {
    const queryHash = hashQueryKey(key);

    this.states.set(
      queryHash,
      Object.freeze({ ...state }) as QueryState<unknown>
    );

    this.notify(queryHash);
  }

  updateState<TData>(
    key: QueryKey,
    updater: (previous: QueryState<TData>) => QueryState<TData>
  ): void {
    const previous = this.getState<TData>(key);
    this.setState(key, updater(previous));
  }

  subscribe<TData>(
    key: QueryKey,
    listener: QueryListener<TData>
  ): () => void {
    const queryHash = hashQueryKey(key);

    let queryListeners = this.listeners.get(queryHash);

    if (!queryListeners) {
      queryListeners = new Set();
      this.listeners.set(queryHash, queryListeners);
    }

    const typedListener = listener as QueryListener<unknown>;

    queryListeners.add(typedListener);

    return () => {
      queryListeners?.delete(typedListener);

      if (queryListeners?.size === 0) {
        this.listeners.delete(queryHash);
      }
    };
  }

  private notify(queryHash: string): void {
    const listeners = this.listeners.get(queryHash);
    const state = this.states.get(queryHash);

    if (!listeners || !state) return;

    for (const listener of [...listeners]) {
      try {
        listener(state);
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    }
  }

  clear(): void {
    this.states.clear();
    this.listeners.clear();
  }
}
