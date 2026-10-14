import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

/**
 * A voluntary, owner-authored teaching shown only on its own business detail
 * surface after that owner explicitly confirms it. It is not member memory,
 * cultural classification, recommendation input, or cross-business content.
 */
export const businessCulturalTeachingsTable = pgTable(
  "business_cultural_teachings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: varchar("business_id", { length: 255 })
      .notNull()
      .references(() => businessesTable.id, { onDelete: "restrict" }),
    creatorOwnerUserId: varchar("creator_owner_user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 120 }).notNull(),
    teachingBody: text("teaching_body").notNull(),
    ownerConfirmedAt: timestamp("owner_confirmed_at", {
      withTimezone: true,
    }).notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("business_cultural_teachings_creator_key").on(
      table.businessId,
      table.creatorOwnerUserId,
    ),
    uniqueIndex("business_cultural_teachings_one_active_business_key")
      .on(table.businessId)
      .where(sql`${table.withdrawnAt} IS NULL`),
    index("business_cultural_teachings_active_owner_idx").on(
      table.businessId,
      table.creatorOwnerUserId,
      table.withdrawnAt,
    ),
  ],
);

export type BusinessCulturalTeaching =
  typeof businessCulturalTeachingsTable.$inferSelect;
