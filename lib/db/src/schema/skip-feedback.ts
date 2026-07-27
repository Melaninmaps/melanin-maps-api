import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

export const businessSkipFeedbackTable = pgTable("business_skip_feedback", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  submittedById: varchar("submitted_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  wasFiltered: boolean("was_filtered").notNull().default(false),
  filteredReason: text("filtered_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessSkipFeedback = typeof businessSkipFeedbackTable.$inferSelect;
