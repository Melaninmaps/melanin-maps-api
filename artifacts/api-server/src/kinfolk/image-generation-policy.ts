export const KINFOLK_IMAGE_CREATION_LABEL = "AI-generated visual";
export const KINFOLK_IMAGE_CREATION_MODEL = "gpt-image-1";

export type KinfolkImageCreationRequest = Readonly<{
  brief: unknown;
  providerDisclosureAccepted: unknown;
  noRealPersonOrPrivateInfoConfirmed: unknown;
}>;

export type KinfolkImageCreationDecision =
  | Readonly<{ ok: true; brief: string; providerDisclosure: string; prompt: string }>
  | Readonly<{ ok: false; code: string; error: string }>;

const DISALLOWED_IMAGE_CREATION_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:person|people|portrait|selfie|face|body|child|children|minor|adult|model|celebrity|public figure|look[- ]?alike|likeness|impersonat(?:e|ion)|face[- ]?swap)\b/i,
  /\b(?:photo|photoreal(?:istic)?|realistic|evidence|document|passport|driver'?s license|screenshot|medical record)\b/i,
  /\b(?:nud(?:e|ity)|sexual|intimate|violent|weapon|crime|arrest|humiliat(?:e|ing)|harass(?:ment|ing))\b/i,
  /\b(?:logo|watermark|brand name|price|date|phone number|website|social handle|text|lettering|typography)\b/i,
];

const LIKELY_NAMED_SUBJECT = /\b(?:portrait|photo|image|drawing|picture|illustration)\s+of\s+@?[\p{L}][\p{L}'-]*(?:\s+@?[\p{L}][\p{L}'-]*){0,3}\b/iu;

/**
 * Image creation is deliberately narrower than Kinfolk chat: it creates only
 * ephemeral, non-personal decorative visuals. It never edits an upload, stores
 * an output, creates a memory, or claims a generated visual is evidence.
 */
export function decideKinfolkImageCreation(
  request: KinfolkImageCreationRequest,
): KinfolkImageCreationDecision {
  const brief = typeof request.brief === "string" ? request.brief.trim().replace(/\s+/g, " ") : "";
  if (brief.length < 12 || brief.length > 600) {
    return {
      ok: false,
      code: "KINFOLK_IMAGE_BRIEF_INVALID",
      error: "Describe a non-personal visual in 12 to 600 characters.",
    };
  }
  if (request.providerDisclosureAccepted !== true || request.noRealPersonOrPrivateInfoConfirmed !== true) {
    return {
      ok: false,
      code: "KINFOLK_IMAGE_CONSENT_REQUIRED",
      error: "Confirm the provider disclosure and that your request contains no real person or private information.",
    };
  }
  if (LIKELY_NAMED_SUBJECT.test(brief) || DISALLOWED_IMAGE_CREATION_PATTERNS.some((pattern) => pattern.test(brief))) {
    return {
      ok: false,
      code: "KINFOLK_IMAGE_REQUEST_UNSUPPORTED",
      error: "Kinfolk can create an original, non-personal decorative visual—not a person, realistic scene, document, logo, or text-bearing asset.",
    };
  }

  const providerDisclosure = "Your brief is sent once to the configured image provider to create this visual. The resulting image is returned only in this session, is not saved to Kinfolk memory, and is not posted or shared by MWM.";
  const prompt = [
    "Create one original square decorative illustration for a Mapping With Melanin member.",
    "Subject brief: " + brief,
    "Style: warm, editorial, culturally respectful, polished, inclusive, and suitable as a generic decorative visual.",
    "Required constraints: no people, faces, bodies, children, real-person likenesses, public figures, logos, brand names, letters, words, numbers, dates, prices, watermarks, documents, screenshots, or claims of real-world evidence.",
    "Do not imitate an existing artist, publication, or protected character. Return a single image only.",
  ].join("\n");

  return { ok: true, brief, providerDisclosure, prompt };
}

export function createKinfolkImageGenerationRateLimiter(
  now: () => number = () => Date.now(),
  cooldownMs = 30_000,
) {
  const lastGenerationByMember = new Map<string, number>();
  return {
    claim(memberId: string): number | null {
      const current = now();
      const previous = lastGenerationByMember.get(memberId);
      if (previous !== undefined && current - previous < cooldownMs) {
        return Math.ceil((cooldownMs - (current - previous)) / 1000);
      }
      lastGenerationByMember.set(memberId, current);
      return null;
    },
  };
}
