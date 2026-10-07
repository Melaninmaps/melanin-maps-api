import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/** Separate from directory businesses and ordinary Kinfolk memory. */
export const kinfolkTemporaryStaysTable = pgTable(
  "kinfolk_temporary_stays",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
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
    uniqueIndex("kinfolk_temporary_stays_owner_label_key").on(table.userId, table.label),
    index("kinfolk_temporary_stays_owner_active_idx").on(table.userId, table.isActive, table.updatedAt),
  ],
);
