export type ClusterBusinessResult = {
  id: string;
  name?: string | null;
};

/**
 * A cluster is only a visual grouping of the canonical marker collection. This
 * preserves each underlying record once, so its label and result panel always
 * describe the same eligible businesses.
 */
export function uniqueClusterBusinesses<T extends ClusterBusinessResult>(
  businesses: readonly (T | null | undefined)[],
): T[] {
  const byId = new Map<string, T>();
  for (const business of businesses) {
    if (!business?.id || byId.has(business.id)) continue;
    byId.set(business.id, business);
  }
  return [...byId.values()].sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? "") || left.id.localeCompare(right.id),
  );
}

export function clusterBusinessKey(businesses: readonly ClusterBusinessResult[]): string {
  return businesses.map((business) => business.id).sort().join("|");
}

export function paginateClusterBusinesses<T>(
  businesses: readonly T[],
  requestedPage: number,
  pageSize = 20,
): { items: T[]; page: number; pageCount: number } {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(businesses.length / safePageSize));
  const page = Math.min(Math.max(0, Math.floor(requestedPage)), pageCount - 1);
  const start = page * safePageSize;
  return {
    items: businesses.slice(start, start + safePageSize),
    page,
    pageCount,
  };
}
