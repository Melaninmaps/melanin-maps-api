/**
 * A Directory-to-Map handoff may carry only the scalar the member typed into
 * the public social-handle field. It is not a profile, contact, result, or
 * location-derived identifier.
 */
const MAX_DIRECTORY_PUBLIC_HANDLE_LENGTH = 64;
const DIRECTORY_PUBLIC_HANDLE_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]|\.(?=[A-Za-z0-9]))*$/;
const URL_LIKE_PREFIX_PATTERN = /^(?:https?:\/\/|www\.)/i;
const DOMAIN_LIKE_SUFFIX_PATTERN = /\.(?:ai|app|au|biz|ca|co|com|dev|edu|gov|info|io|me|net|org|tv|uk|us)$/i;

export function sanitizeDirectoryPublicHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const normalized = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  if (
    normalized.length === 0 ||
    normalized.length > MAX_DIRECTORY_PUBLIC_HANDLE_LENGTH ||
    URL_LIKE_PREFIX_PATTERN.test(normalized) ||
    DOMAIN_LIKE_SUFFIX_PATTERN.test(normalized) ||
    !DIRECTORY_PUBLIC_HANDLE_PATTERN.test(normalized)
  ) {
    return null;
  }

  return normalized;
}
