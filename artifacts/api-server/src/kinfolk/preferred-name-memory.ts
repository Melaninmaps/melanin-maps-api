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

/**
 * The member's direct request to recall their chosen address is answered by a
 * narrow server-owned sentence instead of depending on model phrasing. It uses
 * only the validated, owner-scoped preferred name; it never reads profile or
 * broader private-memory content.
 */
export function buildPreferredNameRecallReply(input: {
  name: unknown;
  includeWelcome: boolean;
}): string | null {
  const name = normalizePreferredName(input.name);
  if (!name) return null;
  return input.includeWelcome
    ? `Welcome, ${name}; choose one small next step and give it your full attention.`
    : `I'll call you ${name}.`;
}

/**
 * Ordinary, stable responses should honor an active chosen address even when a
 * model omits it. This is deliberately a final presentation safeguard rather
 * than a memory lookup: callers must already have resolved one active,
 * owner-scoped preferred-name row and decided that the current turn is safe
 * for a casual address.
 */
export function applyPreferredNameAddress(input: {
  name: unknown;
  reply: string;
}): string {
  const name = normalizePreferredName(input.name);
  const reply = input.reply.trim();
  if (!name || !reply) return reply;

  const normalizedName = name.normalize("NFKC").toLocaleLowerCase();
  const normalizedReply = reply.normalize("NFKC").toLocaleLowerCase();
  let index = normalizedReply.indexOf(normalizedName);
  while (index >= 0) {
    const before = normalizedReply[index - 1] ?? "";
    const after = normalizedReply[index + normalizedName.length] ?? "";
    if (
      !/[\p{L}\p{M}\p{N}]/u.test(before) &&
      !/[\p{L}\p{M}\p{N}]/u.test(after)
    ) {
      return reply;
    }
    index = normalizedReply.indexOf(normalizedName, index + 1);
  }

  return `${name} — ${reply}`;
}

export function parsePreferredNameMemory(input: {
  purpose: string;
  content: string;
}): string | null {
  if (input.purpose !== PREFERRED_NAME_MEMORY_PURPOSE) return null;
  if (!input.content.startsWith(PREFIX)) return null;
  return normalizePreferredName(input.content.slice(PREFIX.length));
}
