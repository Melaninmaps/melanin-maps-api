import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

/**
 * Narrow audit history for the one canonical Mapping With Melanin owner
 * attachment. A database trigger makes committed events append-only.
 */
export const canonicalMwmOwnerAttachmentAuditTable = pgTable(
  "canonical_mwm_owner_attachment_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: varchar("business_id", { length: 255 })
      .notNull()
      .references(() => businessesTable.id, { onDelete: "restrict" }),
    targetUserId: varchar("target_user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    actorUserId: varchar("actor_user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 48 }).notNull(),
    priorOwnerLinkId: varchar("prior_owner_link_id", { length: 255 }),
    priorOwnerUserId: varchar("prior_owner_user_id", { length: 255 }),
    newOwnerLinkId: varchar("new_owner_link_id", { length: 255 }),
    priorState: jsonb("prior_state").notNull(),
    nextState: jsonb("next_state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export type CanonicalMwmOwnerAttachmentAudit = typeof canonicalMwmOwnerAttachmentAuditTable.$inferSelect;
