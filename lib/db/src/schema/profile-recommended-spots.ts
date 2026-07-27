import { integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const profileRecommendedSpotsTable = pgTable(
  "profile_recommended_spots",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    businessId: varchar("business_id").notNull(),
    businessName: varchar("business_name", { length: 200 }),
    businessCategory: varchar("business_category", { length: 100 }),
    stance: varchar("stance", { length: 50 }), // community_favorite | hidden_gem | supporting_local | visited_loved
    blurb: text("blurb"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("profile_recommended_spots_user_biz_idx").on(table.userId, table.businessId)],
);

export type ProfileRecommendedSpot = typeof profileRecommendedSpotsTable.$inferSelect;
export type InsertProfileRecommendedSpot = typeof profileRecommendedSpotsTable.$inferInsert;
