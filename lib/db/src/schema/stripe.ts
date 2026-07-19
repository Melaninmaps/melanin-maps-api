import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const stripeProcessedEventsTable = pgTable("stripe_processed_events", {
  stripeEventId: varchar("stripe_event_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});
