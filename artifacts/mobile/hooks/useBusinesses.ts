import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import type { Business } from "@/constants/types";

const AUTH_TOKEN_KEY = "auth_session_token";
const BUSINESS_LOAD_ERROR = "Unable to load businesses. Check your connection and try again.";

interface UseBusinessesOptions {
  search?: string;
  category?: string;
}

interface UseBusinessesResult {
  businesses: Business[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseBusinessByIdResult {
  business: Business | undefined;
  isLoading: boolean;
  error: string | null;
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

function mapApiBusinessToLocal(b: Record<string, unknown>): Business {
  return {
    id: b.id as string,
    name: b.name as string,
    category: b.category as string,
    subcategory: b.subcategory as string,
    address: b.address as string,
    city: b.city as string,
    state: b.state as string,
    country: b.country as string | undefined,
    rating: typeof b.rating === "string" ? parseFloat(b.rating) : (b.rating as number),
    reviewCount: b.reviewCount as number,
    verified: b.verified as boolean,
    featured: b.featured as boolean,
    blackOwned: b.blackOwned as boolean,
    ownershipDesignations: b.blackOwned
      ? ["black-owned", ...((b.ownershipDesignations as string[]) ?? []).filter((d) => d !== "black-owned")]
      : ((b.ownershipDesignations as string[]) ?? []),
    verifiedDesignations: (b.verifiedDesignations as string[]) ?? [],
    confidenceScore: b.confidenceScore as number,
    safetyRating: b.safetyRating != null
      ? (typeof b.safetyRating === "string" ? parseFloat(b.safetyRating) : (b.safetyRating as number))
      : undefined,
    wouldReturnAlone: b.wouldReturnAlone as number | undefined,
    recommendationRate: b.recommendationRate as number | undefined,
    description: b.description as string,
    latitude: typeof b.latitude === "string" ? parseFloat(b.latitude) : (b.latitude as number),
    longitude: typeof b.longitude === "string" ? parseFloat(b.longitude) : (b.longitude as number),
    tags: (b.tags as string[]) ?? [],
    reviews: (b.reviews as Business["reviews"]) ?? [],
    phone: b.phone as string | undefined,
    website: b.website as string | undefined,
    hours: b.hours as string | undefined,
    priceRange: b.priceRange as string | undefined,
    imageUrl: b.imageUrl as string | undefined,
    profileStatus: b.profileStatus as string | null | undefined,
    listingStatus: b.listingStatus as string | null | undefined,
    instagram: b.instagram as string | undefined,
    tiktok: b.tiktok as string | undefined,
    twitter: b.twitter as string | undefined,
    facebook: b.facebook as string | undefined,
    youtube: b.youtube as string | undefined,
    foundingBusiness: b.foundingBusiness as boolean | undefined,
    foundingNumber: b.foundingNumber as number | undefined,
    introVideoUrl: b.introVideoUrl as string | undefined,
  };
}

export function useBusinesses(options: UseBusinessesOptions = {}): UseBusinessesResult {
  const { search = "", category = "All" } = options;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchBusinesses = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = getApiBaseUrl();
      const params = new URLSearchParams();
      if (search.length > 0) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      const qs = params.toString();
      const url = `${apiBase}/api/businesses${qs ? `?${qs}` : ""}`;
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { businesses?: unknown };
        if (!Array.isArray(data.businesses)) {
          throw new Error("Invalid businesses response");
        }
        if (requestId === requestIdRef.current) {
          setBusinesses(data.businesses.map((business) =>
            mapApiBusinessToLocal(business as Record<string, unknown>),
          ));
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setBusinesses([]);
        setError(BUSINESS_LOAD_ERROR);
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    void Promise.resolve().then(fetchBusinesses);
  }, [fetchBusinesses]);

  return { businesses, isLoading, error, refetch: fetchBusinesses };
}

export function useBusinessById(id: string): UseBusinessByIdResult {
  const [business, setBusiness] = useState<Business | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function fetch_() {
      setIsLoading(true);
      setError(null);
      setBusiness(undefined);
      try {
        const apiBase = getApiBaseUrl();
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(`${apiBase}/api/businesses/${id}`, {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { business?: unknown };
          if (!data.business || typeof data.business !== "object") {
            throw new Error("Invalid business response");
          }
          if (isCurrent) setBusiness(mapApiBusinessToLocal(data.business as Record<string, unknown>));
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        if (isCurrent) {
          setBusiness(undefined);
          setError(BUSINESS_LOAD_ERROR);
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }
    void fetch_();
    return () => {
      isCurrent = false;
    };
  }, [id]);

  return { business, isLoading, error };
}
