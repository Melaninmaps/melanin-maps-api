export interface BadgeInfo {
  id: string;
  emoji: string;
  label: string;
  description: string;
  howEarned: string;
  color: string;
  category: "location" | "age" | "trust" | "community";
}

function monthsAgo(dateStr: string): number {
  const d = new Date(dateStr + "-01");
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function getLocationAgeBadge(currentLocationSince: string | null | undefined): BadgeInfo | null {
  if (!currentLocationSince) return null;
  const months = monthsAgo(currentLocationSince);
  if (months < 6) return { id: "loc_new", emoji: "🆕", label: "New Location", description: "Less than 6 months at this address", howEarned: "Business has been at this location for under 6 months.", color: "#0891B2", category: "location" };
  if (months < 24) return { id: "loc_established", emoji: "📍", label: "Established", description: "6 months – 2 years at this address", howEarned: "Business has been at this location for 6 months to 2 years.", color: "#2D7A4F", category: "location" };
  if (months < 60) return { id: "loc_staple", emoji: "🏠", label: "Neighborhood Staple", description: "2 – 5 years at this address", howEarned: "Business has been at this location for 2 to 5 years.", color: "#7C3AED", category: "location" };
  if (months < 120) return { id: "loc_landmark", emoji: "🏆", label: "Community Landmark", description: "5 – 10 years at this address", howEarned: "Business has been at this location for 5 to 10 years.", color: "#C9922B", category: "location" };
  if (months < 300) return { id: "loc_legacy", emoji: "👑", label: "Legacy Location", description: "10 – 25 years at this address", howEarned: "Business has been at this location for 10 to 25 years.", color: "#DC2626", category: "location" };
  return { id: "loc_generational", emoji: "🌳", label: "Generational Location", description: "25+ years at this address", howEarned: "Business has been at this address for 25 or more years — a true pillar of the community.", color: "#059669", category: "location" };
}

export function getBusinessAgeBadge(businessFoundedDate: string | null | undefined): BadgeInfo | null {
  if (!businessFoundedDate) return null;
  const months = monthsAgo(businessFoundedDate);
  const years = months / 12;
  if (years < 1) return { id: "age_new", emoji: "🌱", label: "New Business", description: "Under 1 year old", howEarned: "This business opened less than a year ago.", color: "#0891B2", category: "age" };
  if (years < 3) return { id: "age_growing", emoji: "🚀", label: "Growing Business", description: "1 – 3 years old", howEarned: "This business has been operating for 1 to 3 years.", color: "#2D7A4F", category: "age" };
  if (years < 5) return { id: "age_established", emoji: "⭐", label: "Established Business", description: "3 – 5 years old", howEarned: "This business has been thriving for 3 to 5 years.", color: "#0EA5E9", category: "age" };
  if (years < 10) return { id: "age_trusted", emoji: "💼", label: "Trusted Business", description: "5 – 10 years old", howEarned: "This business has earned community trust over 5 to 10 years.", color: "#7C3AED", category: "age" };
  if (years < 20) return { id: "age_pillar", emoji: "🏅", label: "Community Pillar", description: "10 – 20 years old", howEarned: "A decade or more of serving the community.", color: "#C9922B", category: "age" };
  if (years < 50) return { id: "age_legacy", emoji: "👑", label: "Legacy Business", description: "20 – 50 years old", howEarned: "This business has stood strong for 20 to 50 years.", color: "#DC2626", category: "age" };
  return { id: "age_generational", emoji: "🖤", label: "Generational Legacy", description: "50+ years in business", howEarned: "50 or more years of Black excellence — a true generational institution.", color: "#1A1A1A", category: "age" };
}

export const OPTIONAL_TRUST_BADGES: Record<string, BadgeInfo> = {
  verified_business:      { id: "verified_business",      emoji: "✅", label: "Verified Business",      description: "Identity verified by the platform",                color: "#2D7A4F", category: "trust", howEarned: "Submitted and approved business documentation.", },
  verified_black_owned:   { id: "verified_black_owned",   emoji: "🏛", label: "Verified Black-Owned",   description: "Verified Black ownership on file",                 color: "#1A1A2E", category: "trust", howEarned: "Ownership documentation verified by Mapping With Melanin.", },
  verified_woman_owned:   { id: "verified_woman_owned",   emoji: "👩🏾‍💼", label: "Verified Woman-Owned",   description: "Verified women-majority ownership",                color: "#DB2777", category: "trust", howEarned: "Women-majority ownership verified by the platform.", },
  family_owned:           { id: "family_owned",           emoji: "👨🏾‍👩🏾‍👧🏾", label: "Family-Owned",           description: "Family-operated business",                         color: "#EA580C", category: "trust", howEarned: "Self-identified and confirmed as a family-operated business.", },
  community_favorite:     { id: "community_favorite",     emoji: "❤️", label: "Community Favorite",     description: "Recognized as a community favorite",              color: "#DC2626", category: "trust", howEarned: "Consistently recognized by the community as a go-to spot.", },
  highly_recommended:     { id: "highly_recommended",     emoji: "🌟", label: "Highly Recommended",     description: "Highly recommended by the community",             color: "#C9922B", category: "trust", howEarned: "High recommendation rate from verified community members.", },
  community_partner:      { id: "community_partner",      emoji: "🤝", label: "Community Partner",      description: "Active partner of Mapping With Melanin",          color: "#2D7A4F", category: "trust", howEarned: "Formally partnered with the Mapping With Melanin platform.", },
  event_host:             { id: "event_host",             emoji: "🎉", label: "Event Host",             description: "Regularly hosts community events",                color: "#7C3AED", category: "trust", howEarned: "Hosts or sponsors community events through the platform.", },
  exceptional_service:    { id: "exceptional_service",    emoji: "😊", label: "Exceptional Service",    description: "Exceptional customer service ratings",             color: "#0EA5E9", category: "trust", howEarned: "Consistently high marks for customer service from reviewers.", },
  family_friendly:        { id: "family_friendly",        emoji: "👨‍👩‍👧", label: "Family Friendly",        description: "Great experience for families with kids",          color: "#059669", category: "trust", howEarned: "Community-confirmed as welcoming to families.", },
  accessibility_friendly: { id: "accessibility_friendly", emoji: "♿", label: "Accessibility Friendly", description: "Accessible for people with disabilities",          color: "#0891B2", category: "trust", howEarned: "Confirmed accessible facilities and accommodations.", },
  inclusive_environment:  { id: "inclusive_environment",  emoji: "🌈", label: "Inclusive Environment",  description: "Welcoming to all backgrounds and identities",      color: "#9333EA", category: "trust", howEarned: "Consistently praised for creating an inclusive space.", },
  pet_friendly:           { id: "pet_friendly",           emoji: "🐶", label: "Pet Friendly",           description: "Pets welcome",                                     color: "#EA580C", category: "trust", howEarned: "Confirmed as pet-friendly by the business or community.", },
  eco_conscious:          { id: "eco_conscious",          emoji: "🌱", label: "Eco Conscious",          description: "Environmentally friendly practices",               color: "#16A34A", category: "trust", howEarned: "Uses sustainable or eco-friendly practices.", },
  community_trusted:      { id: "community_trusted",      emoji: "🛡️", label: "Community Trusted",      description: "Consistent positive safety feedback",             color: "#1D4ED8", category: "trust", howEarned: "Consistently positive safety reports from the community.", },
  solo_traveler_friendly: { id: "solo_traveler_friendly", emoji: "🧭", label: "Solo Traveler Friendly", description: "Highly rated by solo visitors",                    color: "#0D9488", category: "trust", howEarned: "Highly rated by solo travelers and explorers.", },
  late_night_friendly:    { id: "late_night_friendly",    emoji: "🌙", label: "Late-Night Friendly",    description: "Open late and welcoming at night",                 color: "#4F46E5", category: "trust", howEarned: "Open late with positive safety ratings during evening hours.", },
  kid_friendly:           { id: "kid_friendly",           emoji: "👶", label: "Kid Friendly",           description: "Great for children",                               color: "#0891B2", category: "trust", howEarned: "Community-confirmed as great for children.", },
  easy_parking:           { id: "easy_parking",           emoji: "🚗", label: "Easy Parking",           description: "Convenient parking nearby",                        color: "#64748B", category: "trust", howEarned: "Confirmed by visitors to have easy or free parking.", },
  transit_accessible:     { id: "transit_accessible",     emoji: "🚇", label: "Transit Accessible",     description: "Easy to reach by public transit",                  color: "#2563EB", category: "trust", howEarned: "Located near public transit and easy to reach without a car.", },
};

export function getEarnedCommunityBadges(stats: {
  safetyRating?: number | string | null;
  wouldReturnAlone?: number | null;
  recommendationRate?: number | null;
  rating?: number | string | null;
  reviewCount?: number | null;
}): BadgeInfo[] {
  const earned: BadgeInfo[] = [];
  const safety = typeof stats.safetyRating === "string" ? parseFloat(stats.safetyRating) : stats.safetyRating;
  const rating = typeof stats.rating === "string" ? parseFloat(stats.rating) : stats.rating;

  if (safety != null && safety >= 4.0) {
    earned.push({ id: "earned_community_trusted", emoji: "🛡️", label: "Community Trusted", description: "Consistently positive safety feedback", howEarned: "Earned automatically when average safety rating reaches 4.0 or above.", color: "#1D4ED8", category: "community" });
  }
  if (stats.recommendationRate != null && stats.recommendationRate >= 80) {
    earned.push({ id: "earned_welcoming", emoji: "💚", label: "Welcoming Environment", description: "High community recommendation rate", howEarned: "Earned when 80%+ of reviewers say they'd recommend this business.", color: "#059669", category: "community" });
  }
  if (stats.wouldReturnAlone != null && stats.wouldReturnAlone >= 80) {
    earned.push({ id: "earned_solo_approved", emoji: "🧭", label: "Solo Traveler Approved", description: "Highly rated by solo visitors", howEarned: "Earned when 80%+ of reviewers say they'd return here alone.", color: "#0D9488", category: "community" });
  }
  if (rating != null && rating >= 4.5 && (stats.reviewCount ?? 0) >= 20) {
    earned.push({ id: "earned_local_favorite", emoji: "🏡", label: "Local Favorite", description: "Frequently visited and highly rated", howEarned: "Earned with 20+ reviews and an average rating of 4.5 stars or higher.", color: "#C9922B", category: "community" });
  }
  if ((stats.reviewCount ?? 0) >= 50) {
    earned.push({ id: "earned_consistently_recommended", emoji: "⭐", label: "Consistently Recommended", description: "High volume of positive reviews", howEarned: "Earned when a business reaches 50 or more community reviews.", color: "#DC2626", category: "community" });
  }
  return earned;
}
