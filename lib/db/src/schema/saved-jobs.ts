import { pgTable, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";
import { jobListingsTable } from "./job-listings";

export const savedJobsTable = pgTable(
  "saved_jobs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
    jobId: varchar("job_id").references(() => jobListingsTable.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("saved_jobs_user_job_unique").on(t.userId, t.jobId)],
);

export type SavedJob = typeof savedJobsTable.$inferSelect;
