
import type { QueryOptions } from "./types";
import type { QueryKey } from "./query-key";

import { hashQueryKey } from "./query-key";

export class QueryClient {
  private cache = new Map<string, unknown>();

  // Store currently running requests
  private inFlight = new Map<string, Promise<unknown>>();

  async fetchQuery<TData>(
    options: QueryOptions<TData>
  ): Promise<TData> {
    const queryHash = hashQueryKey(options.key);

    // 1. Check existing cached data
    if (this.cache.has(queryHash)) {
      return this.cache.get(queryHash) as TData;
    }

    // 2. Check if the same request is already running
    const existingRequest = this.inFlight.get(queryHash);

    if (existingRequest) {
      return existingRequest as Promise<TData>;
    }

    // 3. Create a new request
    const controller = new AbortController();

    const request = options.queryFn({
      signal: controller.signal
    });

    // 4. Save the running request
    this.inFlight.set(queryHash, request);

    try {
      // 5. Wait for API response
      const data = await request;

      // 6. Save response in cache
      this.cache.set(queryHash, data);

      return data;
    } finally {
      // 7. Remove completed request
      this.inFlight.delete(queryHash);
    }
  }

  getQueryData<TData>(
    key: QueryKey
  ): TData | undefined {
    return this.cache.get(
      hashQueryKey(key)
    ) as TData | undefined;
  }

  setQueryData<TData>(
    key: QueryKey,
    data: TData
  ): void {
    this.cache.set(
      hashQueryKey(key),
      data
    );
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }
}
