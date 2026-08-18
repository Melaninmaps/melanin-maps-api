export type Coordinates = {
  lat: number;
  lng: number;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  tags?: string[] | null;
  latitude: number | null;
  longitude: number | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  websiteUrl?: string | null;
  isActive: boolean;
};

export type CulturalSite = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  state?: string | null;
  summary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  isPublished: boolean;
};

export type OnlineBookstore = {
  id: string;
  name: string;
  url: string;
  description: string;
  priority: number;
  isVerified: boolean;
};

export type BookstoreResult = Business & {
  distanceMiles: number;
  detailUrl: string;
};

export type OnlineBookstoreRecommendation = {
  name: string;
  url: string;
  description: string;
  reason: string;
};

export type DirectorySearchSignal = {
  intent: "bookstore";
  normalizedQuery: string;
  outcome: "nearby_match" | "online_fallback" | "location_required";
  locationCell: string | null;
  nearestDistanceMiles: number | null;
  nearbyResultCount: number;
  radiusMiles: number;
  occurredAt: Date;
};

export type BookstoreDiscoveryResponse = {
  query: string;
  normalizedQuery: string;
  intent: "bookstore";
  radiusMiles: number;
  locationRequired: boolean;
  closestBookstore: BookstoreResult | null;
  nearbyResultCount: number;
  onlineRecommendation: OnlineBookstoreRecommendation | null;
  message: string;
};

/**
 * This is the only persistence boundary the discovery service needs.
 * Adapt this interface in one file to the app's existing ORM/database layer.
 */
export interface DirectoryRepository {
  findActiveBookstores(): Promise<Business[]>;
  findVerifiedOnlineBookstores(): Promise<OnlineBookstore[]>;
  recordDirectorySearchSignal(signal: DirectorySearchSignal): Promise<void>;

  findPublishedCulturalSiteById(id: string): Promise<CulturalSite | null>;
}
