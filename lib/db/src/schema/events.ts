import { boolean, integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: varchar("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  date: varchar("date", { length: 50 }).notNull(),
  dateShort: varchar("date_short", { length: 20 }).notNull(),
  time: varchar("time", { length: 100 }).notNull().default(""),
  location: varchar("location", { length: 255 }).notNull().default(""),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Cultural"),
  attendees: integer("attendees").notNull().default(0),
  organizer: varchar("organizer", { length: 255 }).notNull().default(""),
  price: varchar("price", { length: 50 }).notNull().default("Free"),
  isFree: boolean("is_free").notNull().default(true),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  featured: boolean("featured").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const selectEventSchema = createSelectSchema(eventsTable);

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
