import type { KinfolkAnswerStrategy } from "./general-answer-routing";
import { canonicalizeContextualUrl } from "./contextual-url";

/**
 * Server-owned contract for optional public visual evidence. A member never
 * receives a provider URL: only an approved first-party asset path that was
 * created after source, rights, and subject checks passed.
 */
export type KinfolkVisualEvidence = Readonly<{
  id: string;
  assetPath: string;
  altText: string;
  sourceName: string;
  sourcePageUrl: string;
  sourceTitle: string;
  caption: string;
  subject: string;
  category: "general" | "education" | "cultural" | "clinical";
  sourcePublishedAt: string | null;
  sourceReviewedAt: string;
  rights: "public_domain" | "licensed" | "publisher_permission" | "internal_approved";
  rightsNotice: string;
  whyThisImageFits: string;
}>;

export type KinfolkVisualEvidenceState =
  | "not_requested"
  | "unavailable_no_verified_evidence"
  | "verified_evidence";

export type KinfolkVisualEvidenceResponse = Readonly<{
  state: KinfolkVisualEvidenceState;
  evidence: KinfolkVisualEvidence[];
  notice: string | null;
}>;

/**
 * This candidate does not treat a URL, an ordinary web-search result, or a
 * model-generated suggestion as an image provider. A future retrieval adapter
 * must be independently approved, rights-aware, and actively probed before it
 * can supply candidates to `resolveKinfolkVisualEvidence`.
 */
export type KinfolkVisualEvidenceProviderReadiness = Readonly<{
  ready: false;
  reason: "not_configured" | "provider_not_integrated";
}>;

type VisualIntent = Readonly<{
  requested: boolean;
  requestedClinicalEvidence: boolean;
}>;

const VISUAL_REQUEST_RE = /\b(?:show(?:\s+me)?|see|picture|photo|image|visual|what\s+does\b[\s\S]{0,80}\blook\s+like|what\s+do(?:es)?\b[\s\S]{0,80}\blook\s+like)\b/i;
const PRIVATE_MEDIA_RE = /\b(?:upload|attach|my\s+(?:photo|picture|image)|this\s+(?:photo|picture|image)|sent\s+(?:you\s+)?(?:a\s+)?(?:photo|picture|image))\b/i;
const IMAGE_CREATION_RE = /\b(?:generate|create|make|design|draw)\b[\s\S]{0,40}\b(?:image|photo|picture|graphic|illustration)\b/i;
const HIGH_CONSEQUENCE_VISUAL_RE = /\b(?:medical|health|rash|lesion|symptom|injury|wound|medication|diagnos(?:e|is)|treatment|emergency|legal|financial)\b/i;
const ASSET_PATH_RE = /^\/api\/kinfolk\/visual-evidence\/assets\/[A-Za-z0-9_-]{8,128}$/;
const ISO_INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const RIGHTS = new Set<KinfolkVisualEvidence["rights"]>([
  "public_domain",
  "licensed",
  "publisher_permission",
  "internal_approved",
]);
const CATEGORIES = new Set<KinfolkVisualEvidence["category"]>([
  "general",
  "education",
  "cultural",
  "clinical",
]);

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
const isoInstant = (value: unknown): string | null => {
  const candidate = text(value, 40);
  return ISO_INSTANT_RE.test(candidate) && !Number.isNaN(Date.parse(candidate))
    ? candidate
    : null;
};

export function getKinfolkVisualEvidenceProviderReadiness(
  environment: NodeJS.ProcessEnv = process.env,
): KinfolkVisualEvidenceProviderReadiness {
  const configuredProvider = environment.KINFOLK_VISUAL_EVIDENCE_PROVIDER?.trim();
  return configuredProvider
    ? { ready: false, reason: "provider_not_integrated" }
    : { ready: false, reason: "not_configured" };
}

/**
 * Detects only a request for a public explanatory visual in the current turn.
 * It deliberately excludes private uploads and image generation, which have
 * separate consent and safety contracts.
 */
export function resolveCurrentTurnVisualIntent(message: string): VisualIntent {
  const currentTurn = message.trim();
  if (!currentTurn || PRIVATE_MEDIA_RE.test(currentTurn) || IMAGE_CREATION_RE.test(currentTurn)) {
    return { requested: false, requestedClinicalEvidence: false };
  }
  const requested = VISUAL_REQUEST_RE.test(currentTurn);
  return {
    requested,
    requestedClinicalEvidence: requested && HIGH_CONSEQUENCE_VISUAL_RE.test(currentTurn),
  };
}

function parseVerifiedVisualEvidence(value: unknown): KinfolkVisualEvidence | null {
  const item = record(value);
  if (!item) return null;
  const id = text(item.id, 128);
  const assetPath = text(item.assetPath, 256);
  const sourcePageUrl = typeof item.sourcePageUrl === "string"
    ? canonicalizeContextualUrl(item.sourcePageUrl)
    : null;
  const sourceName = text(item.sourceName, 140);
  const sourceTitle = text(item.sourceTitle, 220);
  const caption = text(item.caption, 420);
  const altText = text(item.altText, 320);
  const subject = text(item.subject, 160);
  const category = item.category;
  const sourceReviewedAt = isoInstant(item.sourceReviewedAt);
  const sourcePublishedAt = item.sourcePublishedAt === null
    ? null
    : isoInstant(item.sourcePublishedAt);
  const rights = item.rights;
  const rightsNotice = text(item.rightsNotice, 240);
  const whyThisImageFits = text(item.whyThisImageFits, 300);
  const verification = record(item.verification);

  if (
    !id ||
    !ASSET_PATH_RE.test(assetPath) ||
    !sourcePageUrl ||
    !sourceName ||
    !sourceTitle ||
    !caption ||
    !altText ||
    !subject ||
    !sourceReviewedAt ||
    !rightsNotice ||
    !whyThisImageFits ||
    !CATEGORIES.has(category as KinfolkVisualEvidence["category"]) ||
    !RIGHTS.has(rights as KinfolkVisualEvidence["rights"]) ||
    verification?.exactSubject !== true ||
    verification?.correctCategory !== true ||
    verification?.sourceIdentityConfirmed !== true ||
    verification?.visualReviewCompleted !== true
  ) {
    return null;
  }

  return {
    id,
    assetPath,
    altText,
    sourceName,
    sourcePageUrl,
    sourceTitle,
    caption,
    subject,
    category: category as KinfolkVisualEvidence["category"],
    sourcePublishedAt,
    sourceReviewedAt,
    rights: rights as KinfolkVisualEvidence["rights"],
    rightsNotice,
    whyThisImageFits,
  };
}

/** Strict response-boundary parser. Missing verification, rights, or asset provenance means no image. */
export function parseKinfolkVisualEvidence(value: unknown): KinfolkVisualEvidence[] {
  if (!Array.isArray(value)) return [];
  const distinct = new Set<string>();
  return value.slice(0, 4).flatMap((candidate) => {
    const evidence = parseVerifiedVisualEvidence(candidate);
    if (!evidence || distinct.has(evidence.id)) return [];
    distinct.add(evidence.id);
    return [evidence];
  });
}

/**
 * Binds optional candidates to the current turn after ordinary answer routing
 * has already established evidence and safety needs. It accepts no history,
 * profile, memory, location, or member image data.
 */
export function resolveKinfolkVisualEvidence(input: Readonly<{
  currentMessage: string;
  answerStrategy: KinfolkAnswerStrategy;
  highConsequence: boolean;
  isPrivateImageTurn?: boolean;
  candidates?: unknown;
}>): KinfolkVisualEvidenceResponse {
  if (input.isPrivateImageTurn || input.answerStrategy === "honest_decline") {
    return { state: "not_requested", evidence: [], notice: null };
  }

  const visualIntent = resolveCurrentTurnVisualIntent(input.currentMessage);
  if (!visualIntent.requested) return { state: "not_requested", evidence: [], notice: null };

  const requiresClinicalEvidence = input.highConsequence || visualIntent.requestedClinicalEvidence;
  const evidence = parseKinfolkVisualEvidence(input.candidates).filter((candidate) =>
    !requiresClinicalEvidence || candidate.category === "clinical",
  );

  if (evidence.length > 0) {
    return { state: "verified_evidence", evidence, notice: null };
  }

  return {
    state: "unavailable_no_verified_evidence",
    evidence: [],
    notice: requiresClinicalEvidence
      ? "I don’t have a verified clinical image source for this request, so I won’t show an unverified image."
      : "I don’t have a verified image source for this request, so I won’t show an unverified image.",
  };
}
