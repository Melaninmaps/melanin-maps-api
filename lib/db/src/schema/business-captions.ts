import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const businessCaptionsTable = pgTable("business_captions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  caption: varchar("caption", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
