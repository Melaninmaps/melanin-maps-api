import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventRsvpsTable = pgTable(
  "event_rsvps",
  {
    userId: varchar("user_id").notNull(),
    eventId: varchar("event_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventId] })],
);

export const insertEventRsvpSchema = createInsertSchema(eventRsvpsTable).omit({
  createdAt: true,
});

export const selectEventRsvpSchema = createSelectSchema(eventRsvpsTable);

export type EventRsvp = typeof eventRsvpsTable.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
