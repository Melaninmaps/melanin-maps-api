import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

/**
 * Additive, provenance-carrying appointment services. Generic tags, community
 * feedback, and ownership data remain outside this table by design.
 */
export const businessServiceOfferingsTable = pgTable(
  "business_service_offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: varchar("business_id", { length: 255 }).notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
    serviceKey: varchar("service_key", { length: 64 }).notNull(),
    serviceLabel: varchar("service_label", { length: 160 }).notNull(),
    policy: jsonb("policy").$type<Record<string, string>>().notNull().default({}),
    priceText: varchar("price_text", { length: 120 }),
    durationMinutes: integer("duration_minutes"),
    bookingUrl: text("booking_url"),
    evidenceState: varchar("evidence_state", { length: 40 }).notNull().default("unverified"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    sourceUrl: text("source_url"),
    sourceLabel: varchar("source_label", { length: 255 }),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    confidence: varchar("confidence", { length: 12 }),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("business_service_offerings_business_service_uq").on(table.businessId, table.serviceKey),
    uniqueIndex("business_service_offerings_match_idx").on(table.serviceKey, table.status, table.evidenceState),
  ],
);

export const businessServiceOfferingAuditEventsTable = pgTable("business_service_offering_audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: varchar("business_id", { length: 255 }).notNull().references(() => businessesTable.id, { onDelete: "restrict" }),
  actorUserId: varchar("actor_user_id", { length: 255 }).references(() => usersTable.id, { onDelete: "set null" }),
  actorRole: varchar("actor_role", { length: 20 }).notNull(),
  changeNote: text("change_note").notNull(),
  beforeState: jsonb("before_state").$type<unknown>().notNull().default([]),
  afterState: jsonb("after_state").$type<unknown>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
