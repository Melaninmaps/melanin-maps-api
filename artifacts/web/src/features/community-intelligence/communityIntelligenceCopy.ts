/**
 * Community Intelligence copy constants.
 *
 * Product rule: The product term is "Community Intelligence" — never "Community Safety".
 * Use these constants wherever user-facing copy refers to community context features.
 */

export const communityIntelligenceCopy = {
  /** Navigation label */
  nav: "Community Intelligence",

  /** Short eyebrow / kicker text */
  eyebrow: "Community Intelligence",

  /** Page/section title */
  title: "Know What to Expect",

  /** Hero subtitle */
  subtitle: "Community-sourced context for informed choices.",

  /** Hero body */
  body: "Real observations from members who've actually been there — arrival experiences, practical conditions, and what the community has shared. Not a safety score. Not a neighborhood judgment.",

  /** Section label inside cards / tab headers */
  sectionLabel: "Community Intelligence",

  /** Survey eyebrow label */
  surveyLabel: "Community Intelligence Survey",

  /** Empty state */
  empty: "No community context yet for this area. Be the first to share what you've experienced.",

  /** Form footnote */
  formFootnote:
    "All survey responses are anonymous and contribute to Community Intelligence — shared context for the community. They are not safety scores or neighborhood judgments.",

  /** Legal disclaimer (used in privacy policy, terms) */
  disclaimer:
    "Community Intelligence is not a judgment about a neighborhood or its residents. These are shared member observations — context, not ratings.",

  /** Emergency separation note */
  emergencyNote:
    "In a life-threatening emergency, always call 911. Emergency resources are separate from Community Intelligence.",
} as const;

export type CommunityIntelligenceCopy = typeof communityIntelligenceCopy;
