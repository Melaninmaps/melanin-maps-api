export const KINFOLK_SPEECH_CHUNK_MAX_CHARACTERS = 3_000;

/**
 * Splits an already-visible Kinfolk reply into provider-safe speech units without
 * normalizing, deleting, or reordering a single character. Concatenating the
 * return value always recreates the input exactly.
 */
export function splitKinfolkSpeechText(
  text: string,
  maxCharacters = KINFOLK_SPEECH_CHUNK_MAX_CHARACTERS,
): string[] {
  if (!Number.isInteger(maxCharacters) || maxCharacters < 80) {
    throw new Error("Speech chunk length must be at least 80 characters.");
  }
  if (!text) return [];

  const chunks: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    const remaining = text.slice(offset);
    if (remaining.length <= maxCharacters) {
      chunks.push(remaining);
      break;
    }

    const candidate = remaining.slice(0, maxCharacters);
    const boundary = preferredSpeechBoundary(candidate, maxCharacters);
    chunks.push(remaining.slice(0, boundary));
    offset += boundary;
  }
  return chunks;
}

function preferredSpeechBoundary(candidate: string, maxCharacters: number): number {
  const minimumNaturalBoundary = Math.floor(maxCharacters * 0.4);
  let sentenceBoundary = 0;
  for (const match of candidate.matchAll(/[.!?…]+["'”’\])}]*(?:\s+|$)/g)) {
    sentenceBoundary = (match.index ?? 0) + match[0].length;
  }
  if (sentenceBoundary >= minimumNaturalBoundary) return sentenceBoundary;

  const paragraphBoundary = candidate.lastIndexOf("\n\n");
  if (paragraphBoundary >= minimumNaturalBoundary) return paragraphBoundary + 2;

  const whitespaceBoundary = Math.max(
    candidate.lastIndexOf(" "),
    candidate.lastIndexOf("\n"),
    candidate.lastIndexOf("\t"),
  );
  if (whitespaceBoundary >= minimumNaturalBoundary) return whitespaceBoundary + 1;

  // A single long token is still represented in full across chunks; this is a
  // provider boundary, never a member-visible truncation boundary.
  return maxCharacters;
}
