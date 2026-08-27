import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

import { getApiBase } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}
const apiBase = getApiBase();

export interface FamilyMember {
  id: string;
  userId: string | null;
  role: string;
  status: string;
  inviteEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface AiUsage {
  used: number;
  limit: number;
  available: number;
  percentUsed: number;
  yearMonth: string;
  circleId: string;
}

export interface FamilyInfo {
  circleId: string | null;
  circleName: string | null;
  totalCapacity: number;
  seatsUsed: number;
  seatsAvailable: number;
  addOnSeats: number;
  members: FamilyMember[];
}

export interface TierLimitsDisplay {
  aiPoolMonthly: number;
  aiPoolDisplay: string;
  savedPlaces: number;
  savedPlacesDisplay: string;
  savedTopicsMax: number;
  savedTopicsDisplay: string;
  familySeatsIncluded: number;
  addOnSeatPriceCents: number;
  addOnSeatPriceDisplay: string;
  circlesCreateDisplay: string;
  lifeJourneysDisplay: string;
  showLoveDisplay: string;
  digestFrequencies: string[];
  familyMemberAccess: string;
}

export interface MembershipPlan {
  tier: string;
  tierDisplay: string;
  monthlyPrice: number;
  annualPrice: number;
  color: string;
  limits: TierLimitsDisplay;
  aiUsage: AiUsage;
  family: FamilyInfo;
}

export function useFamilyPlan() {
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;
      const res = await fetch(`${apiBase}/api/membership/plan`, { headers });
      if (!res.ok) throw new Error("Failed to load plan");
      const data = (await res.json()) as MembershipPlan;
      setPlan(data);
    } catch (e) {
      setError((e as Error).message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPlan);
  }, [fetchPlan]);

  const addFamilySeat = useCallback(async (): Promise<string | null> => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return null;
      const res = await fetch(`${apiBase}/api/membership/family/add-seat`, {
        method: "POST",
        headers,
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string; upgradeUrl?: string };
      if (!res.ok) {
        return data.upgradeUrl ?? null;
      }
      return data.checkoutUrl ?? null;
    } catch {
      return null;
    }
  }, []);

  return { plan, isLoading, error, refetch: fetchPlan, addFamilySeat };
}
