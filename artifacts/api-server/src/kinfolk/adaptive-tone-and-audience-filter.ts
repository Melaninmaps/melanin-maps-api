/*
 * Mapping With Melanin — Kinfolk Adaptive Tone & Audience Filter
 *
 * Placement: artifacts/api-server/src/kinfolk/adaptive-tone-and-audience-filter.ts
 *
 * PURPOSE
 * - Adjust HOW Kinfolk delivers an answer using explicit member preferences.
 * - Apply age-appropriate handling to proactive content and traumatic/civic topics.
 * - Never infer culture, education, intelligence, politics, health, relationship
 *   status, or tone preference from age, location, or language.
 *
 * IMPORTANT PRODUCT RULE
 * A 13-year-old and a PhD are not separate identity classes. Both should have
 * access to the same search engine within applicable safety policy. The difference
 * in depth comes from explicit detail/learning preferences, not presumed ability.
 *
 * Stack note: This module uses pool.query (Railway PostgreSQL) instead of Supabase.
 * The pure functions (buildDeliveryInstructions, buildAdaptiveAnswerSystemPrompt,
 * evaluateAudienceEligibility) have no external dependencies and are unit-testable.
 */

import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { pool } from "@workspace/db";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type AgeBand = "under_13" | "13_17" | "18_24" | "25_plus" | "unknown";
export type DetailLevel = "quick" | "standard" | "deep";
export type TonePreference =
  | "default"
  | "warm"
  | "professional"
  | "plain_language"
  | "regional_opt_in";
export type NotificationCadence =
  | "none"
  | "essential_only"
  | "weekly_digest"
  | "opt_in_updates";
export type Consequence = "low" | "medium" | "high";
export type SourceConfidence =
  | "authoritative_current"
  | "verified"
  | "credible"
  | "community"
  | "unknown";

export interface AdaptiveDeliveryProfile {
  detailLevel: DetailLevel;
  tonePreference: TonePreference;
  learningMode: "guided" | "self_directed";
  notificationCadence: NotificationCadence;
  ageBand: AgeBand;
  regionalLanguageOptIn: boolean;
  regionalReference: string | null;
  allowRelatedBranches: boolean;
  allowNonSensitiveRecommendations: boolean;
  allowCivicSafetyUpdates: boolean;
}

export interface RouterContentPlan {
  intent: string;
  domainTags: string[];
  consequence: Consequence;
  citationMode: "none" | "recommended" | "required";
  privacyBoundary: {
    mayUseLocation: boolean;
    mayProactivelyNotify: boolean;
  };
}

export interface CandidateContent {
  id: string;
  kind: "answer" | "branch" | "notification" | "city_digest" | "safety_alert";
  title: string;
  domainTags: string[];
  consequence: Consequence;
  sourceConfidence: SourceConfidence;
  isCurrent: boolean;
  isOfficialAlert: boolean;
  containsGraphicDetail: boolean;
  containsTraumaticContent: boolean;
  containsCivicOrPoliticalContent: boolean;
  requiresLocationRelevance: boolean;
  cityId?: string;
  audienceReason?: string;
}

export interface DeliveryInstructions {
  maxSections: number;
  maxBullets: number;
  includeCitationDetails: boolean;
  includeOptionalDeepDive: boolean;
  permitRegionalLanguage: boolean;
  toneInstruction: string;
  ageAppropriateInstruction: string;
  prohibitedBehaviors: string[];
}

export interface AudienceDecision {
  eligible: boolean;
  reason:
    | "eligible"
    | "notification_disabled"
    | "not_explicitly_opted_in"
    | "frequency_cap"
    | "source_not_strong_enough"
    | "location_not_permitted"
    | "minor_policy_block"
    | "sensitive_or_high_consequence"
    | "not_proactive_safe";
  allowedPresentation?: "direct" | "age_appropriate" | "essential_alert_only";
}

export interface AuthenticatedRequest extends Request {
  kinfolk?: {
    route?: RouterContentPlan;
    deliveryProfile?: AdaptiveDeliveryProfile;
    deliveryInstructions?: DeliveryInstructions;
    requestId?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isMinor(ageBand: AgeBand): boolean {
  return ageBand === "under_13" || ageBand === "13_17";
}

function isHighStakes(plan: RouterContentPlan): boolean {
  return (
    plan.consequence === "high" ||
    ["medical_health", "legal_regulated", "financial_regulated", "safety_emergency"].includes(
      plan.intent,
    )
  );
}

function hasSensitiveTopic(tags: string[]): boolean {
  const blocked = new Set([
    "medical",
    "mental_health",
    "fertility",
    "hiv",
    "sexual_health",
    "divorce",
    "relationship",
    "immigration",
    "financial_distress",
    "trauma",
    "domestic_violence",
  ]);
  return tags.some((tag) => blocked.has(tag.toLowerCase()));
}

// ─── Profile loader (Railway PostgreSQL) ──────────────────────────────────────

/**
 * Load a member's explicit delivery preferences from the database.
 * Returns safe defaults when no row exists — no permission is inferred from absence.
 */
export async function loadAdaptiveDeliveryProfile(
  userId: string,
): Promise<AdaptiveDeliveryProfile> {
  try {
    const r = await pool.query(
      `SELECT detail_level, tone_preference, learning_mode, notification_cadence,
              age_band, regional_language_opt_in, regional_reference,
              allow_related_branches, allow_non_sensitive_recommendations,
              allow_civic_safety_updates
       FROM kinfolk_delivery_profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const data = r.rows[0] ?? null;
    return {
      detailLevel: data?.detail_level ?? "standard",
      tonePreference: data?.tone_preference ?? "default",
      learningMode: data?.learning_mode ?? "guided",
      notificationCadence: data?.notification_cadence ?? "essential_only",
      ageBand: data?.age_band ?? "unknown",
      regionalLanguageOptIn: Boolean(data?.regional_language_opt_in),
      regionalReference: data?.regional_reference ?? null,
      allowRelatedBranches: Boolean(data?.allow_related_branches),
      allowNonSensitiveRecommendations: Boolean(data?.allow_non_sensitive_recommendations),
      allowCivicSafetyUpdates: Boolean(data?.allow_civic_safety_updates),
    };
  } catch {
    // Fall back to safe defaults — the member can still use Kinfolk, just without
    // personalised delivery. Surface the error to ops monitoring separately.
    return {
      detailLevel: "standard",
      tonePreference: "default",
      learningMode: "guided",
      notificationCadence: "essential_only",
      ageBand: "unknown",
      regionalLanguageOptIn: false,
      regionalReference: null,
      allowRelatedBranches: false,
      allowNonSensitiveRecommendations: false,
      allowCivicSafetyUpdates: false,
    };
  }
}

// ─── Answer delivery ───────────────────────────────────────────────────────────

/**
 * Build delivery instructions from an explicit member profile and a content plan.
 *
 * Governing rule: "quick" vs "deep" is ALWAYS an explicit member choice — never
 * inferred from location, education, or message style.
 */
export function buildDeliveryInstructions(
  profile: AdaptiveDeliveryProfile,
  plan: RouterContentPlan,
): DeliveryInstructions {
  const highStakes = isHighStakes(plan);
  const minor = isMinor(profile.ageBand);

  const depth = {
    quick: { maxSections: 2, maxBullets: 3, includeCitationDetails: false },
    standard: {
      maxSections: 4,
      maxBullets: 5,
      includeCitationDetails: plan.citationMode === "required",
    },
    deep: { maxSections: 7, maxBullets: 8, includeCitationDetails: true },
  }[profile.detailLevel];

  // Medical, legal, financial, emergency, or traumatic context always wins over
  // regional/slang preferences. Cultural fluency must never reduce clarity.
  const permitRegionalLanguage =
    !highStakes &&
    profile.tonePreference === "regional_opt_in" &&
    profile.regionalLanguageOptIn;

  const toneInstruction = highStakes
    ? "Use calm, precise, plain language. Avoid slang, character voice, or cultural performance. State limits clearly."
    : permitRegionalLanguage
      ? `Use a warm, conversational tone. The member explicitly opted into light regional language for ${profile.regionalReference ?? "their region"}. Use it sparingly; never imitate an accent, force slang, or use it in a way that reduces clarity.`
      : profile.tonePreference === "professional"
        ? "Use a professional, structured tone with concise headings and practical next steps."
        : profile.tonePreference === "plain_language"
          ? "Use clear, plain language. Explain jargon in one short phrase and prioritize actionable understanding."
          : profile.tonePreference === "warm"
            ? "Use a warm, respectful conversational tone without assuming cultural identity or background."
            : "Use a clear, respectful, conversational tone.";

  const ageAppropriateInstruction =
    profile.ageBand === "under_13"
      ? "Use age-appropriate, non-graphic language. Do not provide proactive civic, traumatic, adult, or relationship content. Encourage a trusted adult for safety or health topics when appropriate."
      : profile.ageBand === "13_17"
        ? "Use age-appropriate, non-graphic language. When a sensitive or traumatic topic is directly asked, provide factual context, practical safety guidance, and optional trusted-adult or official-resource pathways. Do not make political or traumatic content proactive."
        : "Use the member-selected detail level. Do not infer competence, education, or maturity from age or writing style.";

  void minor; // minor is used implicitly via ageBand checks above

  return {
    ...depth,
    // Citations remain mandatory for high-stakes routes regardless of member's
    // desired brevity. Brevity changes presentation, not evidence standards.
    includeCitationDetails: highStakes ? true : depth.includeCitationDetails,
    includeOptionalDeepDive:
      !highStakes && profile.allowRelatedBranches && profile.learningMode === "guided",
    permitRegionalLanguage,
    toneInstruction,
    ageAppropriateInstruction,
    prohibitedBehaviors: [
      "Do not infer user culture, education, politics, health, relationship status, or financial situation.",
      "Do not make a single search into a life-change assumption.",
      "Do not expose private searches, Circle data, or other members' data.",
      "Do not use community experience as proof for medical, legal, financial, or emergency claims.",
      "Do not add unrelated branches merely because the user once searched a topic.",
    ],
  };
}

export function buildAdaptiveAnswerSystemPrompt(
  delivery: DeliveryInstructions,
  plan: RouterContentPlan,
): string {
  return `
You are Kinfolk. Adapt delivery to the member's explicit preferences while maintaining source and safety policy.

DELIVERY
- ${delivery.toneInstruction}
- ${delivery.ageAppropriateInstruction}
- Maximum answer sections: ${delivery.maxSections}
- Maximum bullets: ${delivery.maxBullets}
- ${delivery.includeCitationDetails ? "Show citations/provenance required by the route." : "Offer source detail as an optional next step when appropriate."}
- ${delivery.includeOptionalDeepDive ? 'You may include ONE clearly optional "Explore deeper" branch if directly relevant.' : "Do not proactively branch into adjacent topics."}

ROUTE
- Intent: ${plan.intent}
- Consequence: ${plan.consequence}
- Citation mode: ${plan.citationMode}

NON-NEGOTIABLE
${delivery.prohibitedBehaviors.map((item) => `- ${item}`).join("\n")}
`.trim();
}

// ─── Audience eligibility ─────────────────────────────────────────────────────

/**
 * Determine whether a member may receive a specific piece of proactive content.
 * This does NOT decide what someone can ask. It only limits what the platform
 * may push without an explicit member request.
 */
export function evaluateAudienceEligibility(
  profile: AdaptiveDeliveryProfile,
  content: CandidateContent,
  opts: {
    hasPermittedLocation: boolean;
    frequencyCapReached: boolean;
  },
): AudienceDecision {
  const minor = isMinor(profile.ageBand);
  const sensitive = hasSensitiveTopic(content.domainTags) || content.consequence === "high";
  const civicOrTraumatic =
    content.containsCivicOrPoliticalContent || content.containsTraumaticContent;

  // Emergency alert exception: only official/current alerts can bypass normal
  // cadence — and still requires the member's separately enabled emergency setting
  // in the notification service. This filter returns presentation guidance only.
  if (content.kind === "safety_alert" && content.isOfficialAlert && content.isCurrent) {
    if (minor && (content.containsGraphicDetail || content.containsTraumaticContent)) {
      return { eligible: false, reason: "minor_policy_block" };
    }
    return {
      eligible: true,
      reason: "eligible",
      allowedPresentation: minor ? "age_appropriate" : "essential_alert_only",
    };
  }

  if (profile.notificationCadence === "none") {
    return { eligible: false, reason: "notification_disabled" };
  }
  if (!content.isCurrent && (content.kind === "notification" || content.kind === "city_digest")) {
    return { eligible: false, reason: "source_not_strong_enough" };
  }
  if (content.requiresLocationRelevance && !opts.hasPermittedLocation) {
    return { eligible: false, reason: "location_not_permitted" };
  }
  if (opts.frequencyCapReached) {
    return { eligible: false, reason: "frequency_cap" };
  }
  if (sensitive) {
    return { eligible: false, reason: "sensitive_or_high_consequence" };
  }
  if (minor && (civicOrTraumatic || content.containsGraphicDetail)) {
    return { eligible: false, reason: "minor_policy_block" };
  }
  if (content.containsCivicOrPoliticalContent && !profile.allowCivicSafetyUpdates) {
    return { eligible: false, reason: "not_explicitly_opted_in" };
  }
  if (content.kind === "branch" && !profile.allowRelatedBranches) {
    return { eligible: false, reason: "not_explicitly_opted_in" };
  }
  if (
    (content.kind === "notification" || content.kind === "city_digest") &&
    !profile.allowNonSensitiveRecommendations
  ) {
    return { eligible: false, reason: "not_explicitly_opted_in" };
  }
  if (content.sourceConfidence === "unknown" || content.sourceConfidence === "community") {
    return { eligible: false, reason: "source_not_strong_enough" };
  }

  return {
    eligible: true,
    reason: "eligible",
    allowedPresentation: minor ? "age_appropriate" : "direct",
  };
}

// ─── Express middleware ────────────────────────────────────────────────────────

/**
 * Attach the adaptive delivery plan to req.kinfolk after router/auth middleware.
 * Must run after: requireAuthenticatedUser, universal search router middleware.
 */
export function createAdaptiveDeliveryMiddleware() {
  return async function adaptiveDeliveryMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
        return;
      }
      if (!req.kinfolk?.route) {
        res.status(500).json({ error: "KIN_FOLK_ROUTE_REQUIRED" });
        return;
      }

      const profile = await loadAdaptiveDeliveryProfile(req.user.id);
      const deliveryInstructions = buildDeliveryInstructions(profile, req.kinfolk.route);

      req.kinfolk = {
        ...req.kinfolk,
        deliveryProfile: profile,
        deliveryInstructions,
        requestId: req.kinfolk.requestId ?? crypto.randomUUID(),
      };

      next();
    } catch {
      // Do not include profile fields, raw messages, or user identity in the response.
      res.status(500).json({ error: "ADAPTIVE_DELIVERY_UNAVAILABLE" });
    }
  };
}
