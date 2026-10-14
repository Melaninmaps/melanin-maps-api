export const KINFOLK_CLIENT_TRACE_HEADER = "X-Kinfolk-Client-Trace";

function opaqueSegment(length: number): string {
  let value = "";
  while (value.length < length) {
    // This is a correlation hint, not a security credential. The fallback keeps
    // it portable across native runtimes without adding account or device data.
    value += Math.random().toString(36).slice(2) || "0";
  }
  return value.slice(0, length);
}

/**
 * Produces an opaque per-attempt correlation code. It contains no account,
 * device, question, location, or session information and is used only to
 * distinguish a request that reached the staging API from a device transport
 * failure in privacy-safe operational logs.
 */
export function createKinfolkClientTrace(): string {
  return `mkm-${opaqueSegment(10)}-${opaqueSegment(10)}`;
}

export function kinfolkTraceReference(trace: string): string {
  return `Support reference: ${trace}.`;
}
