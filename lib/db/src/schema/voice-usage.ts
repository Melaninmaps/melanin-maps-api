import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const voiceUsageTable = pgTable(
  "voice_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    yearMonth: text("year_month").notNull(),
    charsUsed: integer("chars_used").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("voice_usage_user_month_unique").on(table.userId, table.yearMonth)]
);
