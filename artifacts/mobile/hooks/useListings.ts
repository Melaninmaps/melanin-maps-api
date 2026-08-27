import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const AUTH_TOKEN_KEY = "auth_session_token";

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); } catch { return null; }
}

export const LISTING_TYPES = [
  { value: "physical",     label: "Physical Product", icon: "package" },
  { value: "digital",      label: "Digital Product",  icon: "download" },
  { value: "event_ticket", label: "Event Ticket",     icon: "calendar" },
  { value: "gift_card",    label: "Gift Card",        icon: "gift" },
  { value: "service",      label: "Service",          icon: "tool" },
] as const;

export type ListingType = typeof LISTING_TYPES[number]["value"];

export interface Listing {
  id: string;
  businessId: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  name: string;
  description: string | null;
  priceInCents: number;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  listingType: ListingType | null;
  active: boolean;
  createdAt: string;
}

export interface ConnectStatus {
  connected: boolean;
  onboarded: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export function useListings(businessId: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/businesses/${businessId}/listings`);
      if (res.ok) {
        const data = await res.json() as { listings: Listing[] };
        setListings(data.listings ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { void Promise.resolve().then(fetchListings); }, [fetchListings]);

  const openCheckout = async (listing: Listing) => {
    if (!listing.stripePriceId) return null;
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      const res = await fetch(`${base}/api/connect/listings/${listing.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ quantity: 1 }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { url: string | null };
      return data.url;
    } catch {
      return null;
    }
  };

  return { listings, loading, refetch: fetchListings, openCheckout };
}

export function useOwnerListings(businessId: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [listRes, statusRes] = await Promise.all([
        fetch(`${base}/api/connect/listings?businessId=${businessId}`, { headers }),
        fetch(`${base}/api/connect/status/${businessId}`, { headers }),
      ]);

      if (listRes.ok) {
        const data = await listRes.json() as { listings: Listing[] };
        setListings(data.listings ?? []);
      }
      if (statusRes.ok) {
        const data = await statusRes.json() as ConnectStatus;
        setConnectStatus(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { void Promise.resolve().then(fetchAll); }, [fetchAll]);

  const startOnboarding = async (): Promise<string | null> => {
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      const res = await fetch(`${base}/api/connect/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { url: string };
      return data.url;
    } catch {
      return null;
    }
  };

  const createListing = async (params: {
    name: string;
    description?: string;
    priceInCents: number;
    imageUrl?: string;
    category?: string;
    listingType?: ListingType;
  }): Promise<Listing | null> => {
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      const res = await fetch(`${base}/api/connect/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ businessId, ...params }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { listing: Listing };
      setListings((prev) => [data.listing, ...prev]);
      return data.listing;
    } catch {
      return null;
    }
  };

  const toggleActive = async (listingId: string, active: boolean): Promise<void> => {
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      await fetch(`${base}/api/connect/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ active }),
      });
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, active } : l)));
    } catch {}
  };

  const deleteListing = async (listingId: string): Promise<void> => {
    try {
      const base = getApiBaseUrl();
      const token = await getToken();
      await fetch(`${base}/api/connect/listings/${listingId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch {}
  };

  return { listings, connectStatus, loading, refetch: fetchAll, startOnboarding, createListing, toggleActive, deleteListing };
}
