export type TransportAccountContext =
  | { kind: "personal" }
  | { kind: "admin" }
  | { kind: "business"; businessId: string };

let activeContext: TransportAccountContext = { kind: "personal" };

/**
 * Keeps the current browser workspace in memory only. The provider resets it
 * to Personal on auth changes and refreshes, so no stale business/admin choice
 * survives a role or relationship change.
 */
export function setAccountContextForTransport(context: TransportAccountContext): void {
  activeContext = context;
}

export function accountContextHeaderValue(): string {
  if (activeContext.kind === "business") {
    return `business:${activeContext.businessId}`;
  }
  return activeContext.kind;
}
