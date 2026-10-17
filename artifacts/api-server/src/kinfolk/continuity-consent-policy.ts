export type KinfolkContinuityDecision = "accepted" | "declined";

export type KinfolkContinuitySettings = {
  enabled?: boolean | null;
  decision?: string | null;
  updatedAt?: Date | null;
  disclosedAt?: Date | null;
  disclosureVersion?: string | null;
};

export function normalizeKinfolkContinuityDecision(
  value: unknown,
): KinfolkContinuityDecision | null {
  return value === "accepted" || value === "declined" ? value : null;
}

/**
 * The disclosure decision—not a legacy enabled flag, settings row, or chat
 * history—is the only authority for whether continuity can be active.
 */
export function kinfolkContinuityStatus(settings?: KinfolkContinuitySettings) {
  const decision = normalizeKinfolkContinuityDecision(settings?.decision);
  return {
    enabled: decision === "accepted" && settings?.enabled === true,
    disclosureRequired: decision === null,
    decision,
    updatedAt: settings?.updatedAt ?? null,
    disclosedAt: settings?.disclosedAt ?? null,
    disclosureVersion: settings?.disclosureVersion ?? null,
  };
}

export type ContinuityUpdateResolution =
  | { ok: true; decision: KinfolkContinuityDecision }
  | {
      ok: false;
      code:
        | "KINFOLK_CONTINUITY_DECISION_REQUIRED"
        | "KINFOLK_CONTINUITY_ACCEPTANCE_REQUIRED";
      error: string;
    };

/**
 * Prevents any client, including an older mobile release, from converting an
 * undecided or declined member into accepted continuity by changing only a
 * boolean toggle. A recorded acceptance may be paused and resumed; a declined
 * member must explicitly choose acceptance before continuity can turn on.
 */
export function resolveKinfolkContinuityUpdate(input: {
  currentDecision: KinfolkContinuityDecision | null;
  requestedDecision: KinfolkContinuityDecision | null;
  enabled: boolean;
}): ContinuityUpdateResolution {
  const decision = input.requestedDecision ?? input.currentDecision;
  if (decision === null) {
    return {
      ok: false,
      code: "KINFOLK_CONTINUITY_DECISION_REQUIRED",
      error: "Choose whether Kinfolk may remember before changing continuity.",
    };
  }
  if (input.enabled && decision !== "accepted") {
    return {
      ok: false,
      code: "KINFOLK_CONTINUITY_ACCEPTANCE_REQUIRED",
      error: "Choose ‘Let Kinfolk remember’ before turning continuity on.",
    };
  }
  return { ok: true, decision };
}
