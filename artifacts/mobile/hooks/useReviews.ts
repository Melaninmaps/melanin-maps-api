import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export interface ApiReview {
  id: string;
  userId: string | null;
  businessId: string;
  authorName: string;
  rating: number;
  text: string | null;
  wouldReturnAlone: boolean | null;
  socialHandle: string | null;
  socialPlatform: string | null;
  videoUrl: string | null;
  photos: string[] | null;
  nowHiringUrl: string | null;
  createdAt: string;
  ownerResponse: string | null;
  ownerRespondedAt: string | null;
  status: string | null;
  authorTrustLevel?: number;
  authorIsInfluencer?: boolean;
  weight?: string;
}

export interface ReviewStats {
  total: number;
  verified: number;
  influencer: number;
  local: number;
  traveler: number;
  weightedAverage: number;
}

export function useReviews(businessId: string) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [weightedRating, setWeightedRating] = useState<number | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const apiBase = getApiBase();
    if (!businessId) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/reviews?businessId=${encodeURIComponent(businessId)}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as { reviews: ApiReview[]; weightedRating?: number; stats?: ReviewStats };
        setReviews(data.reviews);
        if (typeof data.weightedRating === "number") setWeightedRating(data.weightedRating);
        if (data.stats) setReviewStats(data.stats);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [businessId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const submitReview = useCallback(
    async (
      rating: number,
      text: string,
      wouldReturnAlone: boolean | null,
      socialHandle?: string,
      socialPlatform?: string,
      businessName?: string,
      videoUrl?: string,
      nonMinorityOwned?: boolean,
      communitySupport?: number,
      website?: string,
      location?: string,
      isAnonymous?: boolean,
      volunteerAsMentor?: boolean,
      nowHiringUrl?: string,
      photos?: string[],
    ): Promise<number | null> => {
      const token = await getToken();
      const apiBase = getApiBase();
      if (!token || !apiBase) return null;
      try {
        const res = await fetch(`${apiBase}/api/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessId,
            rating,
            text,
            wouldReturnAlone,
            socialHandle: socialHandle || null,
            socialPlatform: socialPlatform || null,
            businessName: businessName || null,
            videoUrl: videoUrl || null,
            nonMinorityOwned: nonMinorityOwned ?? false,
            communitySupport: communitySupport ?? null,
            website: website || null,
            location: location || null,
            isAnonymous: isAnonymous ?? false,
            volunteerAsMentor: volunteerAsMentor ?? false,
            nowHiringUrl: nowHiringUrl || null,
            photos: photos?.length ? photos : null,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { review: ApiReview; pointsEarned: number };
          setReviews((prev) => [data.review, ...prev]);
          return data.pointsEarned;
        }
        if (res.status === 403) {
          const err = new Error("Membership required to leave reviews");
          (err as any).code = "MEMBERSHIP_REQUIRED";
          throw err;
        }
      } catch (e) { throw e; }
      return null;
    },
    [businessId],
  );

  return { reviews, weightedRating, reviewStats, isLoading, submitReview, refresh: load };
}
