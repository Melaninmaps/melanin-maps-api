import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Owner-authenticated inputs used only for future business-facing Kinfolk
 * drafting. These fields are never drawn from member chat, reviews, or inferred
 * identity, and are not used for member-facing conversation style.
 */
export const businessKinfolkVoiceProfilesTable = pgTable(
  "business_kinfolk_voice_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: varchar("business_id", { length: 255 }).notNull().unique(),
    ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(),
    tones: jsonb("tones").$type<string[]>().notNull().default([]),
    languagePreference: text("language_preference"),
    audienceGuidance: text("audience_guidance"),
    wordsToUse: jsonb("words_to_use").$type<string[]>().notNull().default([]),
    wordsToAvoid: jsonb("words_to_avoid")
      .$type<string[]>()
      .notNull()
      .default([]),
    signaturePhrases: jsonb("signature_phrases")
      .$type<string[]>()
      .notNull()
      .default([]),
    ownerConfirmedAt: timestamp("owner_confirmed_at", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);
