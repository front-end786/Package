
import { describe, it, expect, vi } from "vitest";
import { QueryStore } from "./query-store";

describe("QueryStore", () => {
  it("should return idle state for a new query", () => {
    const store = new QueryStore();

    const state = store.getState(["users"]);

    expect(state).toEqual({
      data: undefined,
      error: null,
      status: "idle",
      isFetching: false,
      updatedAt: null,
      isInvalidated: false
    });
  });

  it("should update query state", () => {
    const store = new QueryStore();

    store.setState(["users"], {
      data: [{ id: 1, name: "Asad" }],
      error: null,
      status: "success",
      isFetching: false,
      updatedAt: Date.now(),
      isInvalidated: false
    });

    const state = store.getState(["users"]);

    expect(state.status).toBe("success");
    expect(state.data).toEqual([
      { id: 1, name: "Asad" }
    ]);
  });

  it("should notify subscribers when state changes", () => {
    const store = new QueryStore();

    const listener = vi.fn();

    store.subscribe(["users"], listener);

    store.setState(["users"], {
      data: [{ id: 1 }],
      error: null,
      status: "success",
      isFetching: false,
      updatedAt: Date.now(),
      isInvalidated: false
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should stop notifying after unsubscribe", () => {
    const store = new QueryStore();

    const listener = vi.fn();

    const unsubscribe = store.subscribe(
      ["users"],
      listener
    );

    unsubscribe();

    store.setState(["users"], {
      data: [{ id: 1 }],
      error: null,
      status: "success",
      isFetching: false,
      updatedAt: Date.now(),
      isInvalidated: false
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should notify only matching query subscribers", () => {
    const store = new QueryStore();

    const usersListener = vi.fn();
    const postsListener = vi.fn();

    store.subscribe(["users"], usersListener);
    store.subscribe(["posts"], postsListener);

    store.setState(["users"], {
      data: [{ id: 1 }],
      error: null,
      status: "success",
      isFetching: false,
      updatedAt: Date.now(),
      isInvalidated: false
    });

    expect(usersListener).toHaveBeenCalledTimes(1);
    expect(postsListener).not.toHaveBeenCalled();
  });
});
