/**
 * A capacity-test account may exercise the public profile transport without
 * contributing a synthetic view to a real business's analytics. This is narrow:
 * anonymous and ordinary member visits continue to record views unchanged.
 */
export function shouldRecordBusinessProfileView(actor: unknown): boolean {
  return !(
    typeof actor === "object"
    && actor !== null
    && "isLoadTest" in actor
    && (actor as { isLoadTest?: unknown }).isLoadTest === true
  );
}
