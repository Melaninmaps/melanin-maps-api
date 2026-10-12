const KINFOLK_CLIENT_TRACE_PATTERN = /^mkm-[a-z0-9]{6,16}-[a-z0-9]{6,16}$/;

/**
 * Accepts only a client-generated opaque correlation code. It deliberately
 * excludes member IDs, tokens, question text, device identifiers, and contact
 * details so operational logs can distinguish a received request from a client
 * transport failure without recording private conversation content.
 */
export function parseKinfolkClientTrace(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return KINFOLK_CLIENT_TRACE_PATTERN.test(normalized) ? normalized : null;
}
