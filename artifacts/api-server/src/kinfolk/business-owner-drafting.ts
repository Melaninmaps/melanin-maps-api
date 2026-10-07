import {
  buildAuthorizedBusinessVoicePrompt,
  type SanitizedBusinessVoiceProfile,
} from "./business-voice-profile";

export const BUSINESS_DRAFT_KINDS = [
  "caption",
  "flyer_copy",
  "review_reply",
  "customer_message",
] as const;

export type BusinessDraftKind = (typeof BUSINESS_DRAFT_KINDS)[number];

export type SanitizedBusinessDraftRequest = Readonly<{
  kind: BusinessDraftKind;
  request: string;
}>;

const MAX_REQUEST_LENGTH = 1_200;
const PROMPT_CONTROL_RE =
  /\b(?:ignore\s+(?:all\s+)?(?:previous|prior)|system\s+prompt|developer\s+message|act\s+as)\b/i;

export function sanitizeBusinessDraftRequest(
  body: Record<string, unknown>,
):
  | { ok: true; request: SanitizedBusinessDraftRequest }
  | { ok: false; error: string } {
  if (body.ownerRequested !== true) {
    return {
      ok: false,
      error: "Confirm that you are requesting this editable business draft.",
    };
  }
  const kind = body.kind;
  if (
    typeof kind !== "string" ||
    !(BUSINESS_DRAFT_KINDS as readonly string[]).includes(kind)
  ) {
    return { ok: false, error: "Choose a supported editable draft type." };
  }
  if (typeof body.request !== "string") {
    return { ok: false, error: "Describe the draft you want to review." };
  }
  const request = body.request.replace(/\s+/g, " ").trim().slice(0, MAX_REQUEST_LENGTH);
  if (!request || PROMPT_CONTROL_RE.test(request)) {
    return {
      ok: false,
      error: "Provide a clear owner request without instruction overrides.",
    };
  }
  return { ok: true, request: { kind: kind as BusinessDraftKind, request } };
}

export function buildOwnerRequestedDraftPrompt(
  profile: SanitizedBusinessVoiceProfile,
  request: SanitizedBusinessDraftRequest,
): string {
  return [
    "You create one editable, owner-review-only business draft.",
    "Return only the draft text. Do not add analysis, publishing instructions, or claims not supplied by the owner.",
    "This is not an autonomous business agent: never post, publish, send, reply to a customer, contact anyone, or modify a business record.",
    "Use only the confirmed Business Voice Profile and the owner request below. Do not use or mention member conversations, reviews, community posts, scraped information, private memory, directory information, inferred identity, race, ethnicity, dialect, personality, or cultural language.",
    "Do not invent facts, availability, prices, offers, results, endorsements, promises, or a business identity.",
    buildAuthorizedBusinessVoicePrompt(profile),
    `DRAFT TYPE: ${request.kind}`,
    `OWNER REQUEST: ${request.request}`,
  ].join("\n\n");
}

export function normalizeEditableBusinessDraft(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+\n/g, "\n").trim().slice(0, 3_000);
  return normalized || null;
}
