import { pgTable, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const businessContributions = pgTable(
  "business_contributions",
  {
    id:            varchar("id", { length: 128 }).primaryKey(),
    businessId:    varchar("business_id", { length: 128 }).notNull(),
    userId:        varchar("user_id", { length: 128 }).notNull(),
    mediaType:     varchar("media_type", { length: 32 }).notNull(), // "social_url" | "photo_upload" | "video_upload"
    sourceType:    varchar("source_type", { length: 32 }),          // "instagram" | "tiktok" | "youtube" | "vimeo" | "direct" | "other"
    sourceUrl:     text("source_url"),                              // the pasted social / direct URL
    caption:       text("caption"),
    attribution:   varchar("attribution", { length: 256 }),         // display credit (e.g. "@mea on Instagram")
    status:        varchar("status", { length: 32 }).notNull().default("pending"), // pending | approved | rejected
    rejectedReason:text("rejected_reason"),
    isPublic:      boolean("is_public").notNull().default(true),
    createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt:    timestamp("approved_at", { withTimezone: true }),
    moderatedBy:   varchar("moderated_by", { length: 128 }),
  },
  (t) => [
    index("business_contributions_business_idx").on(t.businessId),
    index("business_contributions_user_idx").on(t.userId),
    index("business_contributions_status_idx").on(t.status),
  ],
);
