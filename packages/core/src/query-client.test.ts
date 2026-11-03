
import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "./query-client";

describe("QueryClient", () => {
  it("should set and get cached data", () => {
    const client = new QueryClient();

    client.setQueryData(["user"], { name: "Asad" });

    expect(client.getQueryData(["user"])).toEqual({
      name: "Asad"
    });
  });

  it("should clear cached data", () => {
    const client = new QueryClient();

    client.setQueryData(["user"], { name: "Asad" });
    client.clear();

    expect(client.getQueryData(["user"])).toBeUndefined();
  });

  it("should fetch and cache data", async () => {
    const client = new QueryClient();

    const data = await client.fetchQuery({
      key: ["user"],
      queryFn: async () => ({ name: "Asad" })
    });

    expect(data).toEqual({ name: "Asad" });
    expect(client.getQueryData(["user"])).toEqual({
      name: "Asad"
    });
  });

  it("should deduplicate simultaneous requests", async () => {
    const client = new QueryClient();

    const queryFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { name: "Asad" };
    });

    const options = { key: ["user"], queryFn };

    const [first, second, third] = await Promise.all([
      client.fetchQuery(options),
      client.fetchQuery(options),
      client.fetchQuery(options)
    ]);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ name: "Asad" });
    expect(second).toEqual({ name: "Asad" });
    expect(third).toEqual({ name: "Asad" });
  });

  it("should keep different query keys independent", async () => {
    const client = new QueryClient();

    const first = await client.fetchQuery({
      key: ["user", 1],
      queryFn: async () => "User 1"
    });

    const second = await client.fetchQuery({
      key: ["user", 2],
      queryFn: async () => "User 2"
    });

    expect(first).toBe("User 1");
    expect(second).toBe("User 2");
    expect(client.getQueryData(["user", 1])).toBe("User 1");
    expect(client.getQueryData(["user", 2])).toBe("User 2");
  });

  it("should allow retry after a failed request", async () => {
    const client = new QueryClient();

    const queryFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce("Success");

    await expect(
      client.fetchQuery({
        key: ["retry"],
        queryFn
      })
    ).rejects.toThrow("Network error");

    const result = await client.fetchQuery({
      key: ["retry"],
      queryFn
    });

    expect(result).toBe("Success");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});

describe("QueryClient race condition protection", () => {
  it("should not cache an old response after clear()", async () => {
    const client = new QueryClient();

    let resolveRequest!: (value: string) => void;

    const request = client.fetchQuery({
      key: ["old-request"],
      queryFn: () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        })
    });

    client.clear();
    resolveRequest("old data");

    await request;

    expect(client.getQueryData(["old-request"])).toBeUndefined();
  });

  it("should not overwrite setQueryData with an old response", async () => {
    const client = new QueryClient();

    let resolveRequest!: (value: string) => void;

    const request = client.fetchQuery({
      key: ["user"],
      queryFn: () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        })
    });

    client.setQueryData(["user"], "latest data");
    resolveRequest("old data");

    await request;

    expect(client.getQueryData(["user"])).toBe("latest data");
  });
});

describe("QueryClient staleTime", () => {
  it("should return cached data while it is fresh", async () => {
    const client = new QueryClient();
    const queryFn = vi.fn(async () => "First response");

    const options = {
      key: ["fresh-user"],
      queryFn,
      staleTime: 5000
    };

    const first = await client.fetchQuery(options);
    const second = await client.fetchQuery(options);

    expect(first).toBe("First response");
    expect(second).toBe("First response");
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should refetch data when staleTime is zero", async () => {
    const client = new QueryClient();

    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("First response")
      .mockResolvedValueOnce("Second response");

    const options = {
      key: ["stale-user"],
      queryFn,
      staleTime: 0
    };

    const first = await client.fetchQuery(options);
    const second = await client.fetchQuery(options);

    expect(first).toBe("First response");
    expect(second).toBe("Second response");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});

describe("QueryClient invalidateQueries", () => {
  it("should mark a query as invalidated", async () => {
    const client = new QueryClient();

    await client.fetchQuery({
      key: ["users"],
      queryFn: async () => ["Asad", "Ali"],
      staleTime: 60000
    });

    client.invalidateQueries(["users"]);

    const state = client.getQueryState(["users"]);

    expect(state.isInvalidated).toBe(true);
    expect(state.data).toEqual(["Asad", "Ali"]);
  });

  it("should refetch an invalidated query on next fetch", async () => {
    const client = new QueryClient();

    const queryFn = vi
      .fn()
      .mockResolvedValueOnce(["Asad"])
      .mockResolvedValueOnce(["Asad", "Ali"]);

    const options = {
      key: ["users"],
      queryFn,
      staleTime: 60000
    };

    await client.fetchQuery(options);

    client.invalidateQueries(["users"]);

    const result = await client.fetchQuery(options);

    expect(result).toEqual(["Asad", "Ali"]);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(client.getQueryState(["users"]).isInvalidated).toBe(false);
  });

  it("should not invalidate a different query", async () => {
    const client = new QueryClient();

    await client.fetchQuery({
      key: ["users"],
      queryFn: async () => ["Asad"],
      staleTime: 60000
    });

    await client.fetchQuery({
      key: ["posts"],
      queryFn: async () => ["Post 1"],
      staleTime: 60000
    });

    client.invalidateQueries(["users"]);

    expect(
      client.getQueryState(["users"]).isInvalidated
    ).toBe(true);

    expect(
      client.getQueryState(["posts"]).isInvalidated
    ).toBe(false);
  });

  it("should do nothing for an unknown query", () => {
    const client = new QueryClient();

    client.invalidateQueries(["unknown"]);

    expect(
      client.getQueryState(["unknown"]).status
    ).toBe("idle");
  });
});
