export interface Review {
  id: string;
  author: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
  timeAgo: string;
  wouldReturnAlone?: boolean;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  description: string;
  latitude: number;
  longitude: number;
  tags: string[];
  phone?: string;
  website?: string;
  hours?: string;
  priceRange?: string;
  imageUrl?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  confidenceScore: number;
  blackOwned: boolean;
  ownershipDesignations: string[];
  verifiedDesignations: string[];
  safetyRating?: number;
  wouldReturnAlone?: number;
  recommendationRate?: number;
  reviews?: Review[];
  feedbackOptIn?: boolean;
  foundingBusiness?: boolean;
  foundingNumber?: number;
  introVideoUrl?: string;
  topCaptions?: string[];
  businessTagline?: string;
  ownerName?: string;
  ownerBio?: string;
  ownerStory?: string;
  hiddenGemLabel?: string | null;
  hiddenGemCategory?: string | null;
  hiddenGemTagline?: string | null;
  hiddenGemSince?: string | null;
  hiddenGemExpiresAt?: string | null;
  hiddenGemNominations?: number;
  isReferenceOnly?: boolean;
  referenceCategory?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  dateShort: string;
  time: string;
  location: string;
  city: string;
  state: string;
  category: string;
  attendees: number;
  organizer: string;
  price: string;
  isFree: boolean;
  latitude: number;
  longitude: number;
  featured?: boolean;
  relevanceScore?: number;
  audienceRating?: string;
  ratingReason?: string;
}

export type PostCategory = "discussion" | "recommendation" | "alert" | "question";
export type PostType = "community" | "business" | "question" | "safety" | "travel" | "saved_place";

export interface CommunityPost {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  authorId?: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  category: PostCategory;
  postType: PostType;
  liked: boolean;
  businessId?: string;
  businessName?: string;
  businessLink?: string;
  mediaUrls?: string[];
  savedPlaceId?: string;
  locationTag?: string;
  locationVenueName?: string;
  locationCity?: string;
  locationCountry?: string;
  locationType?: string;
  hashtags?: string[];
  topicTag?: string;
  isPrivateTopic?: boolean;
  hasContentWarning?: boolean;
  contentWarningType?: string;
  audienceRating?: string;
  ratingReason?: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkDomain?: string;
  linkFavicon?: string;
  repostId?: string;
  repostAuthorName?: string;
  repostAuthorInitials?: string;
  repostContent?: string;
  mentionedBusinessId?: string;
  mentionedBusinessName?: string;
  mentionedBusinessTag?: string;
  mentionedBusinessRating?: number;
  threadId?: string;
  threadPosition?: number;
  threadTotal?: number;
}

export interface AlertItem {
  id: string;
  type: "safety" | "community" | "business" | "weather" | "travel";
  title: string;
  message: string;
  location: string;
  timeAgo: string;
  severity: "low" | "medium" | "high";
  source?: "nws" | "fema" | "community";
  expires?: string;
}
