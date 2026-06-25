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
}

export type PostCategory = "discussion" | "recommendation" | "alert" | "question";

export interface CommunityPost {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  category: PostCategory;
  liked: boolean;
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
