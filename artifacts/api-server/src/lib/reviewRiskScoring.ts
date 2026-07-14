// ─── Review Risk Scoring ────────────────────────────────────────────────────
// Risk-based content analysis for reviews submitted to minority-owned businesses.
// Returns a score (0–100+), a level, and reasons for transparency in moderation.
//
// Levels:
//   low    (0–14)   → publish immediately
//   medium (15–39)  → publish + background moderator review
//   high   (40+)    → hold for verification before publication

export type RiskLevel = "low" | "medium" | "high";

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  verificationBadge: "safety_report_verified" | null;
}

// ── Keyword banks ────────────────────────────────────────────────────────────

const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; label: string; points: number }> = [
  // Physical safety
  { pattern: /\b(assault(ed)?|attack(ed)?|hit me|punch(ed)?|kick(ed)?|shov(ed)?|chok(ed)?)\b/i, label: "Physical assault allegation", points: 35 },
  { pattern: /\b(weapon|gun|knife|firearm|shot at|shooting|stabbed?)\b/i, label: "Weapons/violence allegation", points: 40 },
  { pattern: /\b(threaten(ed)?|death threat|told me to leave or else)\b/i, label: "Threats allegation", points: 35 },
  { pattern: /\b(follow(ed)? me|stalk(ed)?|follow(ed)? out)\b/i, label: "Stalking/following allegation", points: 30 },
  // Crime
  { pattern: /\b(rob(bed)?|robber(y)?|mugg(ed)?|stole? (from me|my)|theft|stolen)\b/i, label: "Theft/robbery allegation", points: 35 },
  { pattern: /\b(fraud|scam(med)?|counterfeit|fake (product|bill|money)|credit card (stolen|skimmed|skimmer))\b/i, label: "Fraud/scam allegation", points: 35 },
  { pattern: /\b(illegal(ly)?|criminal(ly)?|against the law)\b/i, label: "Illegal activity allegation", points: 20 },
  // Discrimination
  { pattern: /\b(racist|racism|racial|racial slur|n-?word|hate crime)\b/i, label: "Racism/hate allegation", points: 40 },
  { pattern: /\b(discriminat(ed|ion|ing)|profil(ed|ing)|prejudice)\b/i, label: "Discrimination allegation", points: 30 },
  { pattern: /\b(slur|hate speech|bigot(ry)?)\b/i, label: "Hate speech allegation", points: 35 },
  // Sexual misconduct
  { pattern: /\b(harass(ed|ment|ing)?|sexual harassment|inappropriately touched|groped?|sexually)\b/i, label: "Harassment/sexual misconduct allegation", points: 40 },
  { pattern: /\b(rape|raped|sexual assault)\b/i, label: "Sexual assault allegation", points: 50 },
  // Child safety
  { pattern: /\b(child(ren)?|minor(s)?|kid(s)?) (unsafe|danger|inappropriate|involved)\b/i, label: "Child safety concern", points: 45 },
  { pattern: /\b(trafficking|trafficked)\b/i, label: "Trafficking allegation", points: 50 },
  // Health & safety
  { pattern: /\b(food poison(ing)?|poisoned?|contaminate(d)?|mold|rodent|rat(s)?|roach(es)?|infestation|health department|health code)\b/i, label: "Health/safety concern", points: 30 },
  // Law enforcement
  { pattern: /\b(called the police|police misconduct|cops (were called|came)|911)\b/i, label: "Law enforcement involved", points: 20 },
  // Defamation risk
  { pattern: /\b(doxx(ed|ing)?|personal information (shared|posted|leaked))\b/i, label: "Doxxing allegation", points: 40 },
];

const MEDIUM_RISK_PATTERNS: Array<{ pattern: RegExp; points: number }> = [
  { pattern: /\b(unsafe|dangerous|danger(ous)?)\b/i, points: 12 },
  { pattern: /\b(hostile|aggressive|intimidat(ed|ing)?)\b/i, points: 10 },
  { pattern: /\b(scream(ed)?|yell(ed)?|curse(d)? at me)\b/i, points: 8 },
  { pattern: /\b(refused service|wouldn'?t serve|turned away)\b/i, points: 10 },
  { pattern: /\b(hostile work(place)?|retaliat(ed|ion))\b/i, points: 12 },
  { pattern: /\b(reported (to|them)|filed a complaint)\b/i, points: 8 },
  { pattern: /\b(never again|worst experience|completely unacceptable)\b/i, points: 5 },
  { pattern: /\b(mold|infestation|dirty|filthy|disgusting)\b/i, points: 7 },
];

// ── Main scoring function ────────────────────────────────────────────────────

export function scoreReview(opts: {
  text: string;
  rating: number;
  accountAgeDays: number;
  priorReviewCount: number;
}): RiskResult {
  const { text, rating, accountAgeDays, priorReviewCount } = opts;
  let score = 0;
  const reasons: string[] = [];

  // ── High-risk pattern matching ───────────────────────────────────────────
  for (const { pattern, label, points } of HIGH_RISK_PATTERNS) {
    if (pattern.test(text)) {
      score += points;
      if (!reasons.includes(label)) reasons.push(label);
    }
  }

  // ── Medium-risk pattern matching (only add points, no reasons logged) ────
  for (const { pattern, points } of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(text)) {
      score += points;
    }
  }

  // ── Rating + accusatory language amplifier ───────────────────────────────
  // Low rating alone doesn't trigger — only when combined with concerning language
  if (rating <= 2 && score > 10) {
    score += 15;
    reasons.push("Low rating combined with safety or conduct language");
  }

  // ── New account signals ───────────────────────────────────────────────────
  if (accountAgeDays < 1) {
    score += 20;
    reasons.push("Account created today");
  } else if (accountAgeDays < 7) {
    score += 12;
    reasons.push("Account less than 7 days old");
  } else if (accountAgeDays < 30) {
    score += 6;
  }

  if (priorReviewCount === 0 && score > 0) {
    score += 10;
    reasons.push("First review submitted by this account");
  }

  // ── Determine level ───────────────────────────────────────────────────────
  let level: RiskLevel;
  if (score >= 40) level = "high";
  else if (score >= 15) level = "medium";
  else level = "low";

  // Safety report badge for approved high/medium safety content
  const isSafetyContent = HIGH_RISK_PATTERNS.some(({ pattern }) => pattern.test(text));
  const verificationBadge = isSafetyContent ? "safety_report_verified" as const : null;

  return { score: Math.min(score, 100), level, reasons, verificationBadge };
}
