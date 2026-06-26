import { integer, jsonb, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export type CircleItineraryStop = {
  time: string;
  title: string;
  address?: string;
  type: string;
  note?: string;
  businessId?: string;
};

export type CircleItinerary = {
  date?: string;
  vibe: string;
  summary: string;
  stops: CircleItineraryStop[];
  kinfolkNote?: string;
};

export const kinfolkCircles = pgTable("kinfolk_circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("private"),
  privacy: text("privacy").notNull().default("invite_only"),
  hostUserId: text("host_user_id").notNull(),
  description: text("description"),
  emoji: text("emoji").default("✨"),
  maxMembers: integer("max_members").notNull().default(8),
  city: text("city"),
  state: text("state"),
  planningMode: text("planning_mode").notNull().default("open"),
  currentCuratorId: text("current_curator_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const circleMembers = pgTable(
  "circle_members",
  {
    id: serial("id").primaryKey(),
    circleId: integer("circle_id")
      .notNull()
      .references(() => kinfolkCircles.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [unique("circle_member_unique").on(t.circleId, t.userId)],
);

export const circleSuggestions = pgTable("circle_suggestions", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id")
    .notNull()
    .references(() => kinfolkCircles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  businessId: text("business_id"),
  placeName: text("place_name").notNull(),
  placeType: text("place_type").notNull().default("activity"),
  note: text("note"),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const circlePlans = pgTable("circle_plans", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id")
    .notNull()
    .references(() => kinfolkCircles.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull(),
  title: text("title").notNull(),
  planDate: text("plan_date"),
  vibe: text("vibe"),
  budget: text("budget"),
  availabilityWindows: jsonb("availability_windows").$type<string[]>(),
  itinerary: jsonb("itinerary").$type<CircleItinerary>(),
  status: text("status").notNull().default("draft"),
  inCount: integer("in_count").notNull().default(0),
  maybeCount: integer("maybe_count").notNull().default(0),
  outCount: integer("out_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const circleVotes = pgTable(
  "circle_votes",
  {
    id: serial("id").primaryKey(),
    planId: integer("plan_id")
      .notNull()
      .references(() => circlePlans.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    vote: text("vote").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("circle_vote_unique").on(t.planId, t.userId)],
);

export const circleAdventures = pgTable("circle_adventures", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id")
    .notNull()
    .references(() => kinfolkCircles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  adventureDate: text("adventure_date").notNull(),
  places: jsonb("places").$type<{ name: string; type: string; note?: string }[]>(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
