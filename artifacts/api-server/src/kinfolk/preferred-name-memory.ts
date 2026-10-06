export const PREFERRED_NAME_MEMORY_PURPOSE = "preferred_name" as const;

const PREFIX = "Preferred name: ";

/**
 * A preferred name is a member-controlled address choice, never a profile
 * inference. Keep the stored representation deliberately narrow so it can be
 * retrieved, paused, revoked, and deleted without reading any other profile
 * or authentication field.
 */
export function normalizePreferredName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 60) return null;
  if (!/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .’'\-]*$/u.test(name)) {
    return null;
  }
  return name;
}

export function formatPreferredNameMemory(name: string): string {
  return `${PREFIX}${name}`;
}

export function parsePreferredNameMemory(input: {
  purpose: string;
  content: string;
}): string | null {
  if (input.purpose !== PREFERRED_NAME_MEMORY_PURPOSE) return null;
  if (!input.content.startsWith(PREFIX)) return null;
  return normalizePreferredName(input.content.slice(PREFIX.length));
}
