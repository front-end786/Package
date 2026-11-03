
export type QueryKey = readonly unknown[];

export function hashQueryKey(key: QueryKey): string {
  return JSON.stringify(key);
}
