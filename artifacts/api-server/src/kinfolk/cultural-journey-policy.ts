import {
  encryptOrdinaryMemoryContent,
  readOrdinaryMemoryContent,
  PrivateMemoryEncryptionIntegrityError,
} from "./private-memory-encryption";

export const CULTURAL_JOURNEY_DISCLOSURE =
  "My Cultural Journey is private to you. Kinfolk saves a public cultural-site reference only when you choose it, and a reflection only when you confirm it. Viewing or revisiting does not send a message to Kinfolk, create private memory, infer identity, trigger a nudge, or share anything. Nothing here is a score, streak, or completion goal.";

export interface CulturalJourneyReflectionDraft {
  memberConfirmed?: unknown;
  reflection?: unknown;
}

export type CulturalJourneyReflectionValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/**
 * Reflections are member-authored and require a fresh affirmative action. They
 * are not copied into Kinfolk memory or Library research context by this route.
 */
export function validateCulturalJourneyReflection(
  draft: CulturalJourneyReflectionDraft,
): CulturalJourneyReflectionValidation {
  if (draft.memberConfirmed !== true) {
    return { ok: false, error: "Explicit confirmation is required before Kinfolk saves a Journey reflection." };
  }
  if (typeof draft.reflection !== "string") {
    return { ok: false, error: "Reflection must be text." };
  }
  const reflection = draft.reflection.trim();
  if (reflection.length > 1_200) return { ok: false, error: "Reflection must be 1200 characters or fewer." };
  // An empty, explicitly confirmed draft deliberately clears the member's
  // existing reflection. It is not a visit signal or an inferred update.
  return { ok: true, value: reflection || null };
}

export interface StoredCulturalJourneyEntry {
  id: string;
  userId: string;
  culturalSiteId: string;
  siteName: string;
  sourceLabel: string;
  libraryQuestion: string;
  reflection: string | null;
  encryptedReflection?: string | null;
  reflectionEncryptionKeyId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Owner + immutable Journey entry ID are authenticated by the private-memory helper. */
export function culturalJourneyReflectionPurpose(entry: Pick<StoredCulturalJourneyEntry, "id">): string {
  return JSON.stringify(["cultural-journey-reflection-v1", entry.id]);
}

/** New or explicitly refreshed reflections never store member prose in the plaintext column. */
export function sealCulturalJourneyReflection(
  reflection: string,
  entry: Pick<StoredCulturalJourneyEntry, "id" | "userId">,
) {
  const { content, encryptedContent, encryptionKeyId } = encryptOrdinaryMemoryContent(
    reflection,
    entry.userId,
    culturalJourneyReflectionPurpose(entry),
  );
  // Reflections deliberately have no equality token or plaintext fingerprint.
  return {
    reflection: content,
    encryptedReflection: encryptedContent,
    reflectionEncryptionKeyId: encryptionKeyId,
  };
}

/** Only call after selecting the active record with the authenticated owner. Never rewrites legacy rows. */
export function openCulturalJourneyReflection(
  entry: StoredCulturalJourneyEntry,
  ownerId: string,
): string | null {
  if (entry.userId !== ownerId) throw new PrivateMemoryEncryptionIntegrityError();
  const hasEncryptedRepresentation = entry.encryptedReflection != null || entry.reflectionEncryptionKeyId != null;
  if (entry.reflection === null && !hasEncryptedRepresentation) return null;
  if (entry.reflection === null) throw new PrivateMemoryEncryptionIntegrityError();
  return readOrdinaryMemoryContent({
    content: entry.reflection,
    purpose: culturalJourneyReflectionPurpose(entry),
    encryptedContent: entry.encryptedReflection,
    encryptionKeyId: entry.reflectionEncryptionKeyId,
  }, ownerId);
}

/** Owner-scoped, client-safe view. Deliberately excludes owner and crypto implementation state. */
export function culturalJourneyEntryView(entry: StoredCulturalJourneyEntry, ownerId: string) {
  return {
    id: entry.id,
    culturalSiteId: entry.culturalSiteId,
    siteName: entry.siteName,
    sourceLabel: entry.sourceLabel,
    libraryQuestion: entry.libraryQuestion,
    reflection: openCulturalJourneyReflection(entry, ownerId),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
