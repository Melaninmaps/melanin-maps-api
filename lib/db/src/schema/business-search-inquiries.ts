import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const businessSearchInquiriesTable = pgTable("business_search_inquiries", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  handle: varchar("handle", { length: 255 }),
  category: varchar("category", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactHandle: varchar("contact_handle", { length: 255 }),
  searcherUserId: varchar("searcher_user_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessSearchInquiry = typeof businessSearchInquiriesTable.$inferSelect;
export type InsertBusinessSearchInquiry = typeof businessSearchInquiriesTable.$inferInsert;
