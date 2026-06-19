import { useState, useEffect, useCallback } from "react";
import type { Business } from "@/constants/types";
import { BUSINESSES } from "@/constants/data";

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
    rating: typeof b.rating === "string" ? parseFloat(b.rating) : (b.rating as number),
    reviewCount: b.reviewCount as number,
    verified: b.verified as boolean,
    featured: b.featured as boolean,
    blackOwned: b.blackOwned as boolean,
    ownershipDesignations: (b.ownershipDesignations as string[]) ?? [],
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
  };
}

export function useBusinesses(options: UseBusinessesOptions = {}): UseBusinessesResult {
  const { search = "", category = "All" } = options;
  const [businesses, setBusinesses] = useState<Business[]>(BUSINESSES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = getApiBaseUrl();
      const params = new URLSearchParams();
      if (search.length > 0) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      const qs = params.toString();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${apiBase}/api/businesses${qs ? `?${qs}` : ""}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const mapped = (data.businesses as Record<string, unknown>[]).map(mapApiBusinessToLocal);
      setBusinesses(mapped.length > 0 ? mapped : BUSINESSES);
    } catch {
      setBusinesses(BUSINESSES);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return { businesses, isLoading, error, refetch: fetchBusinesses };
}

export function useBusinessById(id: string): { business: Business | undefined; isLoading: boolean } {
  const [business, setBusiness] = useState<Business | undefined>(
    BUSINESSES.find((b) => b.id === id),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      setIsLoading(true);
      try {
        const apiBase = getApiBaseUrl();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${apiBase}/api/businesses/${id}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setBusiness(mapApiBusinessToLocal(data.business as Record<string, unknown>));
      } catch {
        setBusiness(BUSINESSES.find((b) => b.id === id));
      } finally {
        setIsLoading(false);
      }
    }
    fetch_();
  }, [id]);

  return { business, isLoading };
}
