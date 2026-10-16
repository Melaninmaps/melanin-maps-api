export type KinfolkGeneratedContentKind =
  | "professional_email"
  | "formal_letter"
  | "formal_complaint"
  | "resume"
  | "business_plan"
  | "academic_essay"
  | "casual_text"
  | "social_caption"
  | "personal_message"
  | "other";

export type KinfolkGeneratedContentStyle =
  | "professional"
  | "formal"
  | "academic"
  | "warm_personal"
  | "casual"
  | "playful"
  | "firm"
  | "diplomatic"
  | "firm_diplomatic"
  | "member_requested";

export type KinfolkGeneratedContentResolution = Readonly<{
  isGeneratedContentRequest: boolean;
  kind: KinfolkGeneratedContentKind | null;
  style: KinfolkGeneratedContentStyle | null;
  explicitlyRequestsArtifactLanguage: boolean;
  directExplanationStyle: "professional" | null;
}>;

const WRITING_ACTION = /\b(?:draft|write|rewrite|revise|edit|reword|compose|create|make)\b/i;
const ARTIFACT_TERMS: ReadonlyArray<readonly [KinfolkGeneratedContentKind, RegExp]> = [
  ["professional_email", /\b(?:workplace|professional|business)?\s*e-?mail\b/i],
  ["formal_complaint", /\b(?:formal\s+)?(?:complaint|appeal|grievance)\b/i],
  ["formal_letter", /\b(?:formal\s+)?letter\b/i],
  ["resume", /\b(?:r[eé]sum[eé]|cv|cover letter)\b/i],
  ["business_plan", /\b(?:business plan|proposal|pitch deck|plan)\b/i],
  ["academic_essay", /\b(?:essay|paper|personal statement)\b/i],
  ["social_caption", /\b(?:social(?: media)?|instagram|tiktok|linkedin|caption|post)\b/i],
  ["personal_message", /\b(?:birthday message|love letter|heartfelt message|personal message|note to my)\b/i],
  ["casual_text", /\b(?:text message|text to|dm|direct message|message)\b/i],
];

const ARTIFACT_LANGUAGE_TARGET = "(?:e-?mail|letter|message|text|r[eé]sum[eé]|cv|cover letter|caption|essay|paper|complaint|appeal|proposal|plan|post)";
const EXPLICIT_ARTIFACT_LANGUAGE = new RegExp(
  `\\b(?:draft|write|rewrite|revise|edit|compose|create|make)[^.?!]{0,100}\\b(?:in|using|with)\\s+(?:aave|african[ -]?american vernacular english|(?:a|the)\\s+[a-z ]+ dialect)\\b|\\b${ARTIFACT_LANGUAGE_TARGET}\\b[^.?!]{0,80}\\b(?:in|using|with)\\s+(?:aave|african[ -]?american vernacular english|(?:a|the)\\s+[a-z ]+ dialect)\\b|\\b(?:aave|regional (?:language|dialect))\\s+(?:version|style|for (?:the )?${ARTIFACT_LANGUAGE_TARGET})\\b`,
  "i",
);
const PROFESSIONAL = /\b(?:professional|workplace|businesslike)\b/i;
const FORMAL = /\b(?:formal|official)\b/i;
const ACADEMIC = /\b(?:academic|scholarly)\b/i;
const WARM_PERSONAL = /\b(?:warm|heartfelt|emotional|sweet|personal|loving)\b/i;
const CASUAL = /\b(?:casual|relaxed|friendly)\b/i;
const PLAYFUL = /\b(?:playful|funny|humorous|witty)\b/i;
const FIRM = /\b(?:firm(?:er|ly)?|direct|assertive)\b/i;
const DIPLOMATIC = /\b(?:diplomatic|less confrontational|softer|gentler)\b/i;
const PROFESSIONAL_DIRECT_EXPLANATION = /\b(?:explain|talk|speak|address)[^.?!]{0,80}\b(?:to\s+me|me)\b[^.?!]{0,80}\bprofessional(?:ly)?\b/i;
const MESSAGE_PURPOSE = /\b(?:about|saying|to say|that says|birthday|congratulat(?:e|ion)|apolog(?:y|ize)|thank(?:s|ing)?|invite|check[ -]?in|condolen(?:ce|ces)|celebrat(?:e|ion)|support|encourag(?:e|ement)|update|remind(?:er)?|ask(?:ing)?|request|confirm|cancel|reschedul(?:e|ing))\b/i;
const GENERIC_PROJECT_CONCERN_EMAIL = /\b(?:write|draft|compose)\s+(?:an?\s+)?e-?mail\s+to\s+my\s+(?:boss|manager)\s+about\s+(?:a\s+)?project concern\b/i;

function normalize(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
    : "";
}

function artifactKind(message: string): KinfolkGeneratedContentKind | null {
  return ARTIFACT_TERMS.find(([, expression]) => expression.test(message))?.[0] ?? null;
}

function explicitStyle(message: string): KinfolkGeneratedContentStyle | null {
  if (FIRM.test(message) && DIPLOMATIC.test(message)) return "firm_diplomatic";
  if (FIRM.test(message)) return "firm";
  if (DIPLOMATIC.test(message)) return "diplomatic";
  if (PROFESSIONAL.test(message)) return "professional";
  if (FORMAL.test(message)) return "formal";
  if (ACADEMIC.test(message)) return "academic";
  if (WARM_PERSONAL.test(message)) return "warm_personal";
  if (PLAYFUL.test(message)) return "playful";
  if (CASUAL.test(message)) return "casual";
  return null;
}

function defaultStyle(kind: KinfolkGeneratedContentKind): KinfolkGeneratedContentStyle {
  switch (kind) {
    case "professional_email":
    case "resume":
    case "business_plan":
      return "professional";
    case "formal_letter":
    case "formal_complaint":
      return "formal";
    case "academic_essay":
      return "academic";
    case "casual_text":
    case "social_caption":
      return "casual";
    case "personal_message":
      return "warm_personal";
    default:
      return "member_requested";
  }
}

/**
 * Distinguishes Kinfolk's relationship-facing persona from an artifact written
 * for someone else. This parser is deterministic and intentionally does not
 * infer a recipient, dialect, or tone that the member did not state.
 */
export function resolveKinfolkGeneratedContentStyle(
  value: unknown,
): KinfolkGeneratedContentResolution {
  const message = normalize(value);
  const kind = artifactKind(message);
  if (!message || !kind || !WRITING_ACTION.test(message)) {
    return {
      isGeneratedContentRequest: false,
      kind: null,
      style: null,
      explicitlyRequestsArtifactLanguage: false,
      directExplanationStyle: null,
    };
  }
  return {
    isGeneratedContentRequest: true,
    kind,
    style: explicitStyle(message) ?? defaultStyle(kind),
    explicitlyRequestsArtifactLanguage: EXPLICIT_ARTIFACT_LANGUAGE.test(message),
    directExplanationStyle: PROFESSIONAL_DIRECT_EXPLANATION.test(message)
      ? "professional"
      : null,
  };
}

/**
 * A bare request for a text or message can still receive a useful neutral
 * scaffold. Placeholders preserve the member's control without inventing a
 * check-in, invitation, relationship event, or other hidden circumstance.
 */
export function buildKinfolkGeneratedMessageClarification(value: unknown): string | null {
  const message = normalize(value);
  const resolution = resolveKinfolkGeneratedContentStyle(message);
  if (
    !resolution.isGeneratedContentRequest ||
    resolution.kind !== "casual_text" ||
    MESSAGE_PURPOSE.test(message)
  ) {
    return null;
  }
  return "Hi [Name],\n\n[Start with why you are writing.] [Add your main point, request, or update.]\n\nTake care,\n[Your Name]";
}

/**
 * A generic workplace concern already supplies enough purpose to provide a safe
 * starting point. Use neutral placeholders instead of interrogating the member
 * for a name, date, tone, and every project fact before offering useful text.
 */
export function buildKinfolkGenericProjectConcernEmail(value: unknown): string | null {
  const message = normalize(value);
  if (!GENERIC_PROJECT_CONCERN_EMAIL.test(message)) return null;
  return `Subject: [Project] — [brief concern]\n\nHi [Manager Name],\n\nI want to flag a concern about [Project]. [Briefly describe the concern and its impact.] Could we discuss [the decision, support, or next step you need] when you have a moment?\n\nI’m happy to share the details and help identify a workable path forward.\n\nThanks,\n[Your Name]`;
}

function styleInstruction(style: KinfolkGeneratedContentStyle): string {
  switch (style) {
    case "professional":
      return "Use professional, workplace-appropriate language: clear, courteous, specific, and free of slang, emojis, regional vocabulary, or conversational filler.";
    case "formal":
      return "Use formal, audience-appropriate language: precise, respectful, and conventionally structured, without slang, emojis, or conversational filler.";
    case "academic":
      return "Use an academically appropriate register: clear thesis or purpose, accurate reasoning, and an organized formal structure without conversational filler or unsupported claims.";
    case "warm_personal":
      return "Use heartfelt, personal language appropriate to the recipient and occasion. It should be emotionally genuine, not a business memo or a performance of Kinfolk's persona.";
    case "casual":
      return "Use a natural, audience-appropriate casual voice. It should fit the intended recipient, not automatically mirror Kinfolk's active persona.";
    case "playful":
      return "Use a playful, audience-appropriate voice while remaining kind, clear, and suitable for the stated recipient or platform.";
    case "firm":
      return "Use direct, firm, respectful language. State the request or boundary clearly without hostility, insults, or unnecessary escalation.";
    case "diplomatic":
      return "Use constructive, diplomatic language that preserves the member's core point without sounding confrontational or evasive.";
    case "firm_diplomatic":
      return "Use firm, direct, respectful, and diplomatic language: preserve the member's boundary and core point without hostility, unnecessary escalation, or an evasive tone.";
    case "member_requested":
      return "Follow the member's explicit instructions, intended audience, purpose, and requested format. When no tone is stated, use the ordinary convention for that artifact.";
  }
}

/**
 * The artifact receives its own audience/purpose style. Kinfolk's persona and
 * saved language preferences still control only its brief direct commentary to
 * the member before and after the artifact.
 */
export function buildKinfolkGeneratedContentContract(value: unknown): string {
  const resolution = resolveKinfolkGeneratedContentStyle(value);
  if (!resolution.isGeneratedContentRequest || !resolution.kind || !resolution.style) {
    return "";
  }

  const artifactLanguage = resolution.explicitlyRequestsArtifactLanguage
    ? "The member explicitly requested a language or dialect for the artifact; honor that request only inside the artifact when appropriate, while preserving clarity, accuracy, and the requested audience fit."
    : "Do not automatically carry Kinfolk's persona, AAVE setting, regional language setting, or direct-to-member conversational style into the artifact. Use standard audience-appropriate language unless the member explicitly requests another artifact style.";
  const directExplanation = resolution.directExplanationStyle === "professional"
    ? "The member explicitly requested a professional direct explanation. Keep any Kinfolk commentary to the member professional and concise; this does not change the requested artifact style."
    : "If the member explicitly asks for an explanation, keep it separate from the artifact and use the selected Kinfolk persona and any member language preference for that explanation. Otherwise return only the requested artifact.";

  return `GENERATED CONTENT BOUNDARY — NON-NEGOTIABLE:
The member asked Kinfolk to create a ${resolution.kind.replaceAll("_", " ")} for another audience or a distinct writing purpose.
- ${directExplanation}
- Inside the artifact, style precedence is: the member's explicit artifact instruction; intended recipient or audience; purpose and context; requested format; relevant consented writing preference; then ordinary convention.
- ${styleInstruction(resolution.style)}
- ${artifactLanguage}
- Match the artifact's length to the member's actual request and usable substance. Do not turn a short message, email, caption, or note into a long essay, and do not add coaching around the artifact unless the member asked for it.
- Return copy-ready artifact content directly, with no forced “Draft:” label, title, coaching, persona response, explanation of choices, or invitation to personalize it. A surface may present an optional label outside the copyable artifact. Do not lead with a request for optional names, dates, or background when clear placeholders already preserve the member's control.
- Do not invent a meeting time, date, deadline, address, recipient name, employer, project, relationship history, incident, purpose, or other circumstance that the member did not provide. Use a clearly labeled placeholder or neutral conditional language instead. If a generic email or message can be drafted, keep its subject, facts, purpose, and proposed next step in placeholders. Ask one concise purpose question only when a placeholder scaffold would not be meaningful; never assume a check-in, support, meeting, food, relationship history, or other scenario.
- When explaining an explicitly requested AAVE or regional-language artifact, describe only the requested audience, purpose, and high-level tone choices. Do not make unsupported claims about linguistic grammar, authenticity, or why a particular expression is supposedly used.
- Do not make the member switch personas to create this artifact. Do not let the artifact change the persona used for commentary, revisions, or the next turn.
- For a standalone artifact request, return the artifact itself with no forced label. When the member explicitly asks for both an explanation and an artifact, keep the explanation separate and return the artifact as clean copy-ready content. Keep the artifact itself free of coaching, commentary, persona labels, or explanation.
- If the member asks for both an explanation and an artifact, complete both in the same reply. Do not replace the requested artifact with commentary, and use clearly marked compact sections or placeholders rather than omitting a deliverable.
- A revision request such as “make it firmer,” “less confrontational,” or “rewrite the message in AAVE” changes the artifact only unless the member separately changes how Kinfolk should address them. When the active conversation contains the earlier draft, revise it directly instead of asking the member to paste it again. Do not save a one-time writing instruction as memory without the existing explicit consent flow.`;
}
