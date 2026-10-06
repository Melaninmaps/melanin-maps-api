import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Private Places deliberately has no address, coordinate, neighborhood, or
 * destination fields in plaintext. The encrypted payload is only unsealed in
 * the owner-scoped server route when the member actively asks for nearby
 * directory results from one of their active places.
 */
export const kinfolkPrivatePlacesTable = pgTable(
  "kinfolk_private_places",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 100 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** A member-selected nickname such as “Mom’s house”; must never be an address. */
    label: varchar("label", { length: 80 }).notNull(),
    encryptedPayload: text("encrypted_payload").notNull(),
    encryptionKeyVersion: varchar("encryption_key_version", { length: 32 }).notNull(),
    geocodeProvider: varchar("geocode_provider", { length: 32 }).notNull().default("google_maps"),
    geocodedAt: timestamp("geocoded_at", { withTimezone: true }).notNull().defaultNow(),
    disclosureVersion: varchar("disclosure_version", { length: 64 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kinfolk_private_places_owner_label_key").on(table.userId, table.label),
    index("kinfolk_private_places_owner_active_idx").on(table.userId, table.isActive, table.updatedAt),
  ],
);

export const kinfolkPrivatePlaceEventsTable = pgTable(
  "kinfolk_private_place_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    privatePlaceId: uuid("private_place_id")
      .notNull()
      .references(() => kinfolkPrivatePlacesTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 100 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 24 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("kinfolk_private_place_events_owner_idx").on(table.userId, table.occurredAt),
    index("kinfolk_private_place_events_place_idx").on(table.privatePlaceId, table.occurredAt),
  ],
);

export type KinfolkPrivatePlace = typeof kinfolkPrivatePlacesTable.$inferSelect;
export type InsertKinfolkPrivatePlace = typeof kinfolkPrivatePlacesTable.$inferInsert;
