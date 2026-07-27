export type TrustLevel = 1 | 2 | 3 | 4;

export interface TrustLevelInfo {
  level: TrustLevel;
  label: string;
  badge: string;
  description: string;
  weight: number;
}

export const TRUST_LEVELS: Record<TrustLevel, TrustLevelInfo> = {
  1: {
    level: 1,
    label: "Community Member",
    badge: "○",
    description: "Welcome to the community.",
    weight: 1.0,
  },
  2: {
    level: 2,
    label: "Community Verified",
    badge: "✔",
    description: "Identity confirmed. Your reviews carry greater weight.",
    weight: 1.5,
  },
  3: {
    level: 3,
    label: "Trusted Contributor",
    badge: "🏆",
    description: "Earned through consistent, quality contributions.",
    weight: 2.0,
  },
  4: {
    level: 4,
    label: "Community Ambassador",
    badge: "👑",
    description: "Invite only. Local leaders, creators, and moderators.",
    weight: 2.5,
  },
};

export interface TrustUser {
  trustLevel: number;
  identityVerified: boolean;
  identityVerifiedAt: Date | null;
  policyViolationsCount: number;
  helpfulReviewsCount: number;
  createdAt: Date;
  reputationScore: number;
  isInfluencer?: boolean;
}

export function computeTrustLevel(user: TrustUser): TrustLevel {
  if (user.trustLevel === 4) return 4;

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (
    accountAgeDays >= 90 &&
    user.policyViolationsCount === 0 &&
    user.helpfulReviewsCount >= 10
  ) {
    return 3;
  }

  if (user.identityVerified) return 2;

  return 1;
}

export const INFLUENCER_WEIGHT = 3.0;

export function getReviewWeight(
  trustLevel: TrustLevel,
  verifiedPurchase: boolean,
  verifiedCheckin: boolean,
  isInfluencer = false,
): number {
  const base = isInfluencer ? INFLUENCER_WEIGHT : (TRUST_LEVELS[trustLevel]?.weight ?? 1.0);
  const verifiedBonus = verifiedPurchase || verifiedCheckin ? 0.5 : 0;
  return base + verifiedBonus;
}

export function computeWeightedRating(
  reviews: Array<{ rating: number; weight: string | number }>
): number {
  if (reviews.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const r of reviews) {
    const w = parseFloat(String(r.weight ?? "1"));
    weightedSum += r.rating * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export interface TrustProgress {
  current: TrustLevelInfo;
  next: TrustLevelInfo | null;
  requirements: TrustRequirement[];
}

export interface TrustRequirement {
  label: string;
  met: boolean;
}

export function getTrustProgress(user: TrustUser): TrustProgress {
  const level = computeTrustLevel(user);
  const current = TRUST_LEVELS[level];
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (level === 4) {
    return { current, next: null, requirements: [] };
  }

  if (level === 3) {
    return {
      current,
      next: TRUST_LEVELS[4],
      requirements: [
        { label: "Invitation from the Mapping With Melanin team", met: false },
      ],
    };
  }

  if (level === 2) {
    return {
      current,
      next: TRUST_LEVELS[3],
      requirements: [
        { label: "Account at least 90 days old", met: accountAgeDays >= 90 },
        { label: "No policy violations", met: user.policyViolationsCount === 0 },
        { label: "10 helpful reviews", met: user.helpfulReviewsCount >= 10 },
      ],
    };
  }

  return {
    current,
    next: TRUST_LEVELS[2],
    requirements: [
      { label: "Government-issued ID", met: false },
      { label: "Live selfie / liveness check", met: false },
    ],
  };
}
