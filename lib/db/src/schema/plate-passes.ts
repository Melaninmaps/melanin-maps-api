import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const platePasses = pgTable("plate_passes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  shareType: varchar("share_type", { length: 20 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlatePass = typeof platePasses.$inferSelect;
export type NewPlatePass = typeof platePasses.$inferInsert;
