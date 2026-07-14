import { pgTable, serial, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

export const businessVibeTagsTable = pgTable(
  "business_vibe_tags",
  {
    id: serial("id").primaryKey(),
    businessId: varchar("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    vibe: varchar("vibe", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uniq_biz_user_vibe").on(t.businessId, t.userId, t.vibe)],
);

export type BusinessVibeTag = typeof businessVibeTagsTable.$inferSelect;
export type InsertBusinessVibeTag = typeof businessVibeTagsTable.$inferInsert;
