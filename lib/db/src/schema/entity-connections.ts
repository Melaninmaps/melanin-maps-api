import { sql } from "drizzle-orm";
import { integer, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const entityConnectionsTable = pgTable(
  "entity_connections",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fromId: varchar("from_id").notNull(),
    fromType: varchar("from_type", {
      enum: ["business", "event", "creator", "neighborhood", "community_group", "user"],
    }).notNull(),
    toId: varchar("to_id").notNull(),
    toType: varchar("to_type", {
      enum: ["business", "event", "creator", "neighborhood", "community_group", "user"],
    }).notNull(),
    connectionType: varchar("connection_type", {
      enum: ["hosts", "recommends", "located_in", "affiliated_with", "created_by", "attended_by", "similar_to", "part_of"],
    }).notNull(),
    strength: integer("strength").notNull().default(1),
    label: varchar("label", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("entity_connections_unique").on(table.fromId, table.toId, table.connectionType),
  ],
);

export type EntityConnection = typeof entityConnectionsTable.$inferSelect;
export type InsertEntityConnection = typeof entityConnectionsTable.$inferInsert;
