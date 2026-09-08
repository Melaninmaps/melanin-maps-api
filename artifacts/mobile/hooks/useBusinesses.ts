import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import type { Business } from "@/constants/types";
import { getApiBase } from "@/lib/api";
import { ownershipDesignationFilterId } from "@workspace/constants";

const AUTH_TOKEN_KEY = "auth_session_token";
const BUSINESS_LOAD_ERROR = "Unable to load businesses. Check your connection and try again.";

interface UseBusinessesOptions {
  search?: string;
  category?: string;
  mapPins?: boolean;
  enabled?: boolean;
}

interface UseBusinessesResult {
  businesses: Business[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseBusinessByIdResult {
  business: Business | undefined;
  isLoading: boolean;
  error: string | null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown, fallback = 0): number {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
}

export function mapApiBusinessToLocal(b: Record<string, unknown>): Business {
  const socialProfiles = b.socialProfiles && typeof b.socialProfiles === "object" && !Array.isArray(b.socialProfiles)
    ? b.socialProfiles as Record<string, unknown>
    : {};
  const ownershipDesignations = Array.isArray(b.ownershipDesignations)
    ? b.ownershipDesignations.filter((value): value is string => typeof value === "string")
    : [];
  const ownershipFilterIds = ownershipDesignations.map(ownershipDesignationFilterId);
  if (b.blackOwned === true) ownershipFilterIds.push("black-african-american");
  return {
    id: text(b.id),
    name: text(b.name),
    category: text(b.category) || "Other",
    subcategory: text(b.subcategory) || text(b.category) || "Business",
    address: text(b.address),
    city: text(b.city),
    state: text(b.state),
    country: b.country as string | undefined,
    rating: number(b.rating),
    reviewCount: number(b.reviewCount),
    verified: b.verified === true,
    featured: b.featured === true,
    blackOwned: b.blackOwned === true,
    ownershipDesignations,
    ownershipFilterIds: [...new Set(ownershipFilterIds)],
    verifiedDesignations: (b.verifiedDesignations as string[]) ?? [],
    confidenceScore: number(b.confidenceScore),
    safetyRating: b.safetyRating != null
      ? (typeof b.safetyRating === "string" ? parseFloat(b.safetyRating) : (b.safetyRating as number))
      : undefined,
    wouldReturnAlone: b.wouldReturnAlone as number | undefined,
    recommendationRate: b.recommendationRate as number | undefined,
    description: text(b.description),
    latitude: number(b.latitude, Number.NaN),
    longitude: number(b.longitude, Number.NaN),
    tags: (b.tags as string[]) ?? [],
    reviews: (b.reviews as Business["reviews"]) ?? [],
    phone: b.phone as string | undefined,
    website: b.website as string | undefined,
    sourceUrl: b.sourceUrl as string | undefined,
    hours: b.hours as string | undefined,
    priceRange: b.priceRange as string | undefined,
    imageUrl: b.imageUrl as string | undefined,
    profileStatus: b.profileStatus as string | null | undefined,
    listingStatus: b.listingStatus as string | null | undefined,
    ownershipClaim: b.ownershipClaim as string | null | undefined,
    instagram: (b.instagram ?? socialProfiles.instagram) as string | undefined,
    tiktok: (b.tiktok ?? socialProfiles.tiktok) as string | undefined,
    twitter: b.twitter as string | undefined,
    facebook: (b.facebook ?? socialProfiles.facebook) as string | undefined,
    youtube: (b.youtube ?? socialProfiles.youtube) as string | undefined,
    twitch: socialProfiles.twitch as string | undefined,
    snapchat: socialProfiles.snapchat as string | undefined,
    foundingBusiness: b.foundingBusiness as boolean | undefined,
    foundingNumber: b.foundingNumber as number | undefined,
    introVideoUrl: b.introVideoUrl as string | undefined,
  };
}

export function useBusinesses(options: UseBusinessesOptions = {}): UseBusinessesResult {
  const { search = "", category = "All", mapPins = false, enabled = true } = options;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchBusinesses = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    if (!enabled) {
      abortRef.current = null;
      setBusinesses([]);
      setTotal(0);
      setIsLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    let timedOut = false;
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = getApiBase();
      const params = new URLSearchParams();
      if (!mapPins) {
        if (search.length > 0) params.set("search", search);
        if (category && category !== "All") params.set("category", category);
        params.set("limit", "200");
      }
      const qs = params.toString();
      const endpoint = mapPins ? "/api/businesses/map-pins" : "/api/businesses";
      const url = `${apiBase}${endpoint}${qs ? `?${qs}` : ""}`;
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, mapPins ? 12_000 : 6_000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { businesses?: unknown; pins?: unknown; total?: unknown };
        if (!mapPins) {
          if (!Array.isArray(data.businesses)) {
            throw new Error("Invalid businesses response");
          }
        }
        if (mapPins && !Array.isArray(data.pins)) {
          throw new Error("Invalid map pins response");
        }
        const rows = (mapPins ? data.pins : data.businesses) as unknown[];
        if (requestId === requestIdRef.current) {
          setBusinesses(rows.map((business) =>
            mapApiBusinessToLocal(business as Record<string, unknown>),
          ));
          setTotal(number(data.total, rows.length));
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      if (controller.signal.aborted && !timedOut) return;
      if (requestId === requestIdRef.current) {
        setBusinesses([]);
        setTotal(0);
        setError(BUSINESS_LOAD_ERROR);
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [search, category, mapPins, enabled]);

  useEffect(() => {
    void Promise.resolve().then(fetchBusinesses);
    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [fetchBusinesses]);

  return { businesses, total, isLoading, error, refetch: fetchBusinesses };
}

export function useBusinessById(id: string): UseBusinessByIdResult {
  const [business, setBusiness] = useState<Business | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    let timedOut = false;

    async function fetch_() {
      if (!id) {
        setBusiness(undefined);
        setError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setBusiness(undefined);
      try {
        const apiBase = getApiBase();
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 5_000);
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
        if (controller.signal.aborted && !timedOut) return;
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
      controller.abort();
    };
  }, [id]);

  return { business, isLoading, error };
}
