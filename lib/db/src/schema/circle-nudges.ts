import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const circleNudges = pgTable("circle_nudges", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  targetMemberId: text("target_member_id"),
  nudgeType: text("nudge_type").notNull().default("check_this_out"),
  businessId: text("business_id"),
  businessName: text("business_name"),
  suggestionId: integer("suggestion_id"),
  message: text("message"),
  readByUserIds: text("read_by_user_ids").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CircleNudge = typeof circleNudges.$inferSelect;
export type NewCircleNudge = typeof circleNudges.$inferInsert;
