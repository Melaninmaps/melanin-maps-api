import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const socialInvitesTable = pgTable("social_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: varchar("platform", { length: 30 }).notNull(),
  handleOrUrl: varchar("handle_or_url", { length: 500 }).notNull(),
  name: varchar("name", { length: 200 }),
  type: varchar("type", { length: 20 }).notNull().default("friend"),
  bizName: varchar("biz_name", { length: 300 }),
  referralCode: varchar("referral_code", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SocialInvite = typeof socialInvitesTable.$inferSelect;
