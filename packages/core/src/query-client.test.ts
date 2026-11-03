
import { describe, it, expect } from "vitest";
import { QueryClient } from "./query-client";

describe("QueryClient", () => {
  it("should store and retrieve cached data", () => {
    const client = new QueryClient();

    client.setQueryData(["users"], [
      { id: 1, name: "Asad" }
    ]);

    expect(client.getQueryData(["users"])).toEqual([
      { id: 1, name: "Asad" }
    ]);
  });

  it("should clear the cache", () => {
    const client = new QueryClient();

    client.setQueryData(["users"], [{ id: 1 }]);
    client.clear();

    expect(client.getQueryData(["users"])).toBeUndefined();
  });

  it("should fetch and cache API data", async () => {
    const client = new QueryClient();

    const result = await client.fetchQuery({
      key: ["users"],
      queryFn: async () => [
        { id: 1, name: "Asad" }
      ]
    });

    expect(result).toEqual([
      { id: 1, name: "Asad" }
    ]);

    expect(client.getQueryData(["users"])).toEqual(result);
  });

  it("should deduplicate simultaneous requests", async () => {
    const client = new QueryClient();

    let requestCount = 0;

    const queryFn = async () => {
      requestCount++;

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      return [
        { id: 1, name: "Asad" }
      ];
    };

    const [first, second, third] = await Promise.all([
      client.fetchQuery({
        key: ["users"],
        queryFn
      }),

      client.fetchQuery({
        key: ["users"],
        queryFn
      }),

      client.fetchQuery({
        key: ["users"],
        queryFn
      })
    ]);

    expect(requestCount).toBe(1);
    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });
});
