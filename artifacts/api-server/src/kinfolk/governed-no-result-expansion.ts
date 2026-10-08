export const GOVERNED_NO_RESULT_ACTIONS = {
  expandRadius: "Expand the distance while keeping my documented ownership preference",
  broadenDocumentedScope: "Broaden the documented ownership scope for this search",
  showOwnershipUndocumented: "Show businesses whose ownership is not yet documented",
  showOtherPublicPlaces: "Show other public places that are not ownership-matched",
  keepStrict: "Keep my ownership preference and try a different service or place",
  openSettings: "Open Kinfolk Settings to change my default preference",
  stop: "Stop this search",
} as const;

export type GovernedNoResultAction = keyof typeof GOVERNED_NO_RESULT_ACTIONS;

export type GovernedNoResultOffer = Readonly<{
  reply: string;
  followUpSuggestions: string[];
  /** The current search remains strict until a member selects one of these actions. */
  keepsOriginalPreference: true;
  /** This flow is scoped to the current conversation; it does not alter saved preferences. */
  persistsPreferenceChange: false;
}>;

export type GovernedNoResultStage =
  | "initial"
  | "after_radius"
  | "after_documented_scope";

const ACTION_VALUES = new Set<string>(Object.values(GOVERNED_NO_RESULT_ACTIONS));

export function decodeGovernedNoResultAction(input: {
  message: string;
  offeredActions: readonly string[] | undefined;
}): GovernedNoResultAction | null {
  const action = input.message.trim();
  if (!ACTION_VALUES.has(action) || !input.offeredActions?.includes(action)) {
    return null;
  }
  return (Object.entries(GOVERNED_NO_RESULT_ACTIONS).find(([, value]) => value === action)?.[0] ?? null) as GovernedNoResultAction | null;
}

export function buildGovernedNoResultOffer(input: {
  city: string;
  subjectLabel: string;
  designationLabel: string;
  canExpandVerifiedRadius: boolean;
  stage: GovernedNoResultStage;
}): GovernedNoResultOffer {
  const scope = input.designationLabel || "documented ownership preference";
  const standardControls = [
    GOVERNED_NO_RESULT_ACTIONS.keepStrict,
    GOVERNED_NO_RESULT_ACTIONS.openSettings,
    GOVERNED_NO_RESULT_ACTIONS.stop,
  ];
  const followUpSuggestions = input.stage === "initial"
    ? [GOVERNED_NO_RESULT_ACTIONS.expandRadius, ...standardControls]
    : input.stage === "after_radius"
      ? [GOVERNED_NO_RESULT_ACTIONS.broadenDocumentedScope, ...standardControls]
      : [
          GOVERNED_NO_RESULT_ACTIONS.showOwnershipUndocumented,
          GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces,
          ...standardControls,
        ];
  const nextStep = input.stage === "initial"
    ? input.canExpandVerifiedRadius
      ? "The next available step is a temporary wider radius using the same verified public origin from this request."
      : "The next available step is a temporary wider radius after you explicitly provide a public starting point and larger radius."
    : input.stage === "after_radius"
      ? "The next available step is a separately chosen broader documented ownership scope; it will still require source-backed ownership evidence."
      : "Only after the documented scope was tried may you separately choose ownership-not-yet-documented businesses or public places that are clearly marked not ownership-matched.";
  return {
    reply: [
      `I couldn’t find a documented ${scope} ${input.subjectLabel} match in ${input.city}.`,
      "I’m keeping your ownership preference exactly as requested; I will not silently broaden it or substitute a non-matching place.",
      nextStep,
      "None of these temporary choices changes your saved preference.",
    ].join(" "),
    followUpSuggestions,
    keepsOriginalPreference: true,
    persistsPreferenceChange: false,
  };
}

export function buildGovernedNoResultActionReply(input: {
  action: GovernedNoResultAction;
  city: string;
  subjectLabel: string;
  designationLabel: string;
}): string | null {
  const scope = input.designationLabel || "documented ownership preference";
  switch (input.action) {
    case "expandRadius":
      return `To expand the distance while keeping ${scope}, share a public starting point and the larger radius for ${input.subjectLabel} in ${input.city}. I will use that location only for this search.`;
    case "keepStrict":
      return `Your ${scope} preference is still in place. Tell me a nearby city, a different ${input.subjectLabel} need, or a public origin and exact radius.`;
    case "openSettings":
      return "Your saved preference has not changed. Open Kinfolk Settings → Support preference if you want to change your default; this search remains temporary.";
    case "stop":
      return "Stopped. I did not broaden the search or change any saved preference.";
    default:
      return null;
  }
}
