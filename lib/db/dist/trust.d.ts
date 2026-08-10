export type TrustLevel = 1 | 2 | 3 | 4;
export interface TrustLevelInfo {
    level: TrustLevel;
    label: string;
    badge: string;
    description: string;
    weight: number;
}
export declare const TRUST_LEVELS: Record<TrustLevel, TrustLevelInfo>;
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
export declare function computeTrustLevel(user: TrustUser): TrustLevel;
export declare const INFLUENCER_WEIGHT = 3;
export declare function getReviewWeight(trustLevel: TrustLevel, verifiedPurchase: boolean, verifiedCheckin: boolean, isInfluencer?: boolean): number;
export declare function computeWeightedRating(reviews: Array<{
    rating: number;
    weight: string | number;
}>): number;
export interface TrustProgress {
    current: TrustLevelInfo;
    next: TrustLevelInfo | null;
    requirements: TrustRequirement[];
}
export interface TrustRequirement {
    label: string;
    met: boolean;
}
export declare function getTrustProgress(user: TrustUser): TrustProgress;
//# sourceMappingURL=trust.d.ts.map