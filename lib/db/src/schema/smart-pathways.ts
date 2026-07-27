import { doublePrecision, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// ─── Intent types ─────────────────────────────────────────────────────────────
export type IntentId =
  | "moving"
  | "visiting"
  | "safety"
  | "trip"
  | "businesses"
  | "community"
  | "comparing"
  | "work";

export const INTENTS: Array<{
  id: IntentId;
  label: string;
  emoji: string;
  color: string;
  description: string;
  nextActions: string[];
  businessCategories: string[]; // empty = all categories
  kinfolkPrompts: string[];
}> = [
  {
    id: "moving",
    label: "I'm moving here",
    emoji: "🏡",
    color: "#16A34A",
    description: "Find realtors, movers, schools, and everything you need to relocate",
    nextActions: [
      "Find a realtor",
      "Compare mortgage lenders",
      "Get moving quotes",
      "Explore schools & childcare",
      "Find your doctor",
      "Get home insurance",
    ],
    businessCategories: [
      "Real Estate", "Financial Services", "Moving Services", "Healthcare",
      "Education", "Insurance", "Grocery", "Salon", "Barber", "Home Services",
    ],
    kinfolkPrompts: [
      "Would this neighborhood be good for a young family?",
      "What Black-owned businesses are in this area?",
      "Who can help me move here?",
      "What should I know about the local community?",
    ],
  },
  {
    id: "visiting",
    label: "I'm visiting",
    emoji: "✈️",
    color: "#2563EB",
    description: "Discover the best local spots, restaurants, and experiences",
    nextActions: [
      "Find a place to stay",
      "Discover restaurants",
      "Check local events",
      "Find a barber / salon",
      "Get safety overview",
    ],
    businessCategories: [
      "Restaurant", "Hotel", "Entertainment", "Coffee", "Culture",
      "Bar & Lounge", "Salon", "Barber",
    ],
    kinfolkPrompts: [
      "What are the best Black-owned restaurants here?",
      "What should I know before visiting?",
      "Is this area welcoming?",
      "What local events are coming up?",
    ],
  },
  {
    id: "safety",
    label: "Looking for safe spaces",
    emoji: "🛡️",
    color: "#7C3AED",
    description: "Community safety ratings, welcoming spaces, and trusted resources",
    nextActions: [
      "View safety survey results",
      "Find community organizations",
      "See recent safety check-ins",
      "Ask KinfolkAI about safety",
    ],
    businessCategories: [
      "Community Organization", "Church", "Healthcare", "Legal Services",
    ],
    kinfolkPrompts: [
      "What do locals say about safety here?",
      "Would I feel welcome in this neighborhood?",
      "Are there community support resources nearby?",
      "What's the night safety like here?",
    ],
  },
  {
    id: "trip",
    label: "Planning a trip",
    emoji: "🗺️",
    color: "#0891B2",
    description: "Plan your itinerary with Black-owned stays, restaurants, and attractions",
    nextActions: [
      "Book a place to stay",
      "Plan your food tour",
      "Find cultural spots",
      "Check events during your visit",
      "Save your itinerary",
    ],
    businessCategories: [
      "Hotel", "Restaurant", "Entertainment", "Culture", "Tours", "Coffee", "Grocery",
    ],
    kinfolkPrompts: [
      "Plan a 3-day itinerary here",
      "What cultural experiences should I not miss?",
      "What are the best Black-owned spots for food?",
      "What's the vibe of this area for a first-time visitor?",
    ],
  },
  {
    id: "businesses",
    label: "Finding Black-owned businesses",
    emoji: "🏪",
    color: "#D97706",
    description: "Discover and support the Black business community here",
    nextActions: [
      "Browse all categories",
      "Find verified businesses",
      "Leave a review",
      "Share with your network",
    ],
    businessCategories: [],
    kinfolkPrompts: [
      "What Black-owned businesses are in this area?",
      "Which businesses are most highly rated?",
      "Are there any hidden gems I should know about?",
      "What categories are well-represented here?",
    ],
  },
  {
    id: "community",
    label: "Looking for community",
    emoji: "👥",
    color: "#DC2626",
    description: "Connect with groups, events, and people who share your values",
    nextActions: [
      "Find local groups",
      "Browse upcoming events",
      "Join community spaces",
      "Ask KinfolkAI about community",
    ],
    businessCategories: [
      "Community Organization", "Church", "Non-Profit", "Entertainment", "Culture",
    ],
    kinfolkPrompts: [
      "How do I connect with the Black community here?",
      "Are there events or groups I can join?",
      "What's the cultural scene like?",
      "Where do people gather and socialize?",
    ],
  },
  {
    id: "comparing",
    label: "Comparing neighborhoods",
    emoji: "⚖️",
    color: "#6B7280",
    description: "Side-by-side safety, amenities, and community data",
    nextActions: [
      "Compare safety scores",
      "Compare business density",
      "Compare community resources",
      "Ask KinfolkAI to compare",
    ],
    businessCategories: [],
    kinfolkPrompts: [
      "Compare these two neighborhoods for a Black family",
      "Which area has more Black-owned businesses?",
      "Which neighborhood feels more welcoming?",
      "What are the pros and cons of each area?",
    ],
  },
  {
    id: "work",
    label: "Looking for work",
    emoji: "💼",
    color: "#059669",
    description: "Career resources, local employers, and professional networks",
    nextActions: [
      "Find Black-owned employers",
      "Connect with mentors",
      "Explore professional services",
      "Find networking events",
    ],
    businessCategories: [
      "Professional Services", "Financial Services", "Technology",
      "Healthcare", "Education", "Legal Services", "Consulting",
    ],
    kinfolkPrompts: [
      "What job opportunities exist in this area?",
      "Are there Black-owned companies hiring here?",
      "How do I connect with Black professionals here?",
      "What industries are growing in this area?",
    ],
  },
];

// ─── Neighborhood pins table ──────────────────────────────────────────────────
export const neighborhoodPinsTable = pgTable("neighborhood_pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  intentId: varchar("intent_id", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NeighborhoodPin = typeof neighborhoodPinsTable.$inferSelect;
