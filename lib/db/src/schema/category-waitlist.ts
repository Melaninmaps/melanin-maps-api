import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const categoryWaitlist = pgTable("category_waitlist", {
  id: serial("id").primaryKey(),
  parentCategory: text("parent_category").notNull(),
  subcategory: text("subcategory"),
  businessName: text("business_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CategoryWaitlistEntry = typeof categoryWaitlist.$inferSelect;
export type NewCategoryWaitlistEntry = typeof categoryWaitlist.$inferInsert;
