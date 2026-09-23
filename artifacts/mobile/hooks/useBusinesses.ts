import { useState, useEffect, useCallback, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import type { Business } from "@/constants/types";
import {
  normalizeOwnershipDesignationFilterIds,
  ownershipDesignationFilterId,
} from "@workspace/constants";
import { buildBusinessesRequestUrl } from "./support-lens-request";
export { buildBusinessesRequestUrl } from "./support-lens-request";

const AUTH_TOKEN_KEY = "auth_session_token";
const BUSINESS_LOAD_ERROR =
  "Unable to load businesses. Check your connection and try again.";

interface UseBusinessesOptions {
  search?: string;
  category?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMiles?: number;
  designations?: readonly string[];
  supportScope?: "all_businesses" | "strict_documented_designations";
  /** A server-validated explicit public business-name lookup. */
  directName?: boolean;
  /** Prevent an unscoped request while a map surface awaits a locality. */
  enabled?: boolean;
}

interface UseBusinessesResult {
  businesses: Business[];
  isLoading: boolean;
  error: string | null;
  searchScope: "diaspora_promotion_catalog" | "all_public_places" | "explicit_public_listing" | null;
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
  const socialProfiles =
    b.socialProfiles &&
    typeof b.socialProfiles === "object" &&
    !Array.isArray(b.socialProfiles)
      ? (b.socialProfiles as Record<string, unknown>)
      : {};
  const ownershipDesignations = Array.isArray(b.ownershipDesignations)
    ? b.ownershipDesignations.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const ownershipFilterIds = ownershipDesignations.map(
    ownershipDesignationFilterId,
  );
  if (b.blackOwned === true) ownershipFilterIds.push("black-african-american");
  return {
    id: b.id as string,
    name: b.name as string,
    category: b.category as string,
    subcategory: b.subcategory as string,
    address: b.address as string,
    city: b.city as string,
    state: b.state as string,
    country: b.country as string | undefined,
    rating:
      typeof b.rating === "string"
        ? parseFloat(b.rating)
        : (b.rating as number),
    reviewCount: b.reviewCount as number,
    verified: b.verified as boolean,
    featured: b.featured as boolean,
    blackOwned: b.blackOwned as boolean,
    ownershipDesignations,
    ownershipFilterIds: [...new Set(ownershipFilterIds)],
    verifiedDesignations: (b.verifiedDesignations as string[]) ?? [],
    confidenceScore: b.confidenceScore as number,
    safetyRating:
      b.safetyRating != null
        ? typeof b.safetyRating === "string"
          ? parseFloat(b.safetyRating)
          : (b.safetyRating as number)
        : undefined,
    wouldReturnAlone: b.wouldReturnAlone as number | undefined,
    recommendationRate: b.recommendationRate as number | undefined,
    description: b.description as string,
    latitude:
      typeof b.latitude === "string"
        ? parseFloat(b.latitude)
        : (b.latitude as number),
    longitude:
      typeof b.longitude === "string"
        ? parseFloat(b.longitude)
        : (b.longitude as number),
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

export function useBusinesses(
  options: UseBusinessesOptions = {},
): UseBusinessesResult {
  const {
    search = "",
    category = "All",
    city = "",
    state = "",
    latitude = null,
    longitude = null,
    radiusMiles = 25,
    designations = [],
    supportScope,
    directName = false,
    enabled = true,
  } = options;
  const designationKey =
    normalizeOwnershipDesignationFilterIds(designations).join(",");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<UseBusinessesResult["searchScope"]>(null);
  const requestIdRef = useRef(0);
  const lastSuccessfulBusinessesRef = useRef<Business[]>([]);

  const fetchBusinesses = useCallback(async () => {
    // Advance first so disabling a map scope also invalidates an in-flight
    // unscoped response before it can paint stale pins.
    const requestId = ++requestIdRef.current;
    if (!enabled) {
      // Location permission, a brief AppState transition, or an in-progress
      // map scope calculation must not blank already-visible, valid pins. A
      // deliberate business search still replaces its result when it resolves.
      setBusinesses(lastSuccessfulBusinessesRef.current);
      setError(null);
      setSearchScope(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = getApiBaseUrl();
      const url = buildBusinessesRequestUrl(apiBase, {
        search,
        category,
        city: directName ? "" : city,
        state: directName ? "" : state,
        designations: directName ? [] : designations,
        supportScope: directName ? undefined : supportScope,
        directName,
      });
      const urlWithGeo = !directName && Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `${url}${url.includes("?") ? "&" : "?"}lat=${latitude}&lng=${longitude}&radius=${Math.min(100, Math.max(1, radiusMiles))}`
        : url;
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(urlWithGeo, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { businesses?: unknown; searchScope?: unknown };
        if (!Array.isArray(data.businesses)) {
          throw new Error("Invalid businesses response");
        }
        if (requestId === requestIdRef.current) {
          const mappedBusinesses =
            data.businesses.map((business) =>
              mapApiBusinessToLocal(business as Record<string, unknown>),
            );
          // An empty successful response is meaningful and must be shown. Only
          // failed/aborted refreshes retain visible pins so a temporary network
          // or origin problem cannot make previously loaded businesses vanish.
          lastSuccessfulBusinessesRef.current = mappedBusinesses;
          setBusinesses(mappedBusinesses);
          setSearchScope(
            data.searchScope === "explicit_public_listing" ||
            data.searchScope === "all_public_places" ||
            data.searchScope === "diaspora_promotion_catalog"
              ? data.searchScope
              : null,
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setBusinesses(lastSuccessfulBusinessesRef.current);
        setError(BUSINESS_LOAD_ERROR);
        setSearchScope(null);
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [enabled, search, category, city, state, latitude, longitude, radiusMiles, designationKey, supportScope, directName]);

  useEffect(() => {
    void Promise.resolve().then(fetchBusinesses);
  }, [fetchBusinesses]);

  return { businesses, isLoading, error, searchScope, refetch: fetchBusinesses };
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
          if (isCurrent)
            setBusiness(
              mapApiBusinessToLocal(data.business as Record<string, unknown>),
            );
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
