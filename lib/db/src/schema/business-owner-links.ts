import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessOwnerLinksTable = pgTable("business_owner_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("owner"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessOwnerLinkSchema = createInsertSchema(businessOwnerLinksTable).omit({ id: true, createdAt: true });
export const selectBusinessOwnerLinkSchema = createSelectSchema(businessOwnerLinksTable);

export type BusinessOwnerLink = typeof businessOwnerLinksTable.$inferSelect;
export type InsertBusinessOwnerLink = z.infer<typeof insertBusinessOwnerLinkSchema>;
