/**
 * User Identity Context Schema
 *
 * Private, voluntary, changeable member context for:
 *   - Age-appropriate content delivery (age range — uses existing user_age_assurance table)
 *   - Medically relevant context (sex assigned at birth — opt-in only)
 *   - Respectful language (gender identity, pronouns — opt-in only)
 *   - Voluntary safety-feedback aggregation (stored on business_safety_experiences, not here)
 *
 * DATA MINIMIZATION RULE:
 *   Store only the member's explicit selections.
 *   Never infer sex, gender, pronouns, pregnancy status, culture, ethnicity,
 *   or minority status from a name, photo, voice, language, location,
 *   searches, behavior, or social graph.
 *
 *   Never expose these fields on public profiles, business pages, community posts,
 *   Circles, creator cards, business-owner dashboards, or any analytics export.
 */

import { relations } from 'drizzle-orm';
import {
  boolean, index, integer, pgTable,
  text, timestamp, varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';

export const userIdentityContext = pgTable('user_identity_context', {
  userId: varchar('user_id', { length: 255 })
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),

  // Explicit member selections only. NULL means not supplied.
  // Allowed values enforced by DB CHECK constraints (see migration SQL).
  sexAssignedAtBirth: varchar('sex_assigned_at_birth', { length: 24 }),
  genderIdentity: varchar('gender_identity', { length: 24 }),
  pronounSet: varchar('pronoun_set', { length: 24 }),

  // Custom pronouns encrypted at rest. Plaintext never stored or logged.
  customPronounsCiphertext: text('custom_pronouns_ciphertext'),
  customPronounsKeyVersion: varchar('custom_pronouns_key_version', { length: 32 }),

  // Separate purpose-limitation toggles. Default false is mandatory.
  // allowMedicallyRelevantContext: sex-at-birth used ONLY for opted-in
  //   medical questions where reproductive anatomy is directly relevant.
  allowMedicallyRelevantContext: boolean('allow_medically_relevant_context')
    .notNull()
    .default(false),
  // allowPronounAwareLanguage: Kinfolk uses the stored pronoun set in responses.
  allowPronounAwareLanguage: boolean('allow_pronoun_aware_language')
    .notNull()
    .default(false),

  // Optimistic concurrency. Client must send current version to prevent lost updates.
  version: integer('version').notNull().default(1),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Append-only audit trail. Privileged privacy staff only.
// Records only field names that changed, never the old or new values.
// Custom pronouns must not appear in changed_fields as a decoded string.
export const userIdentityContextAudit = pgTable('user_identity_context_audit', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  actorUserId: varchar('actor_user_id', { length: 255 })
    .references(() => usersTable.id, { onDelete: 'set null' }),
  // Array of field names that changed: ["sex_assigned_at_birth", "allow_medically_relevant_context"]
  // Never contains plaintext values.
  changedFields: text('changed_fields').array().notNull(),
  // 'member_update' | 'privacy_support' | 'account_deletion'
  reason: varchar('reason', { length: 40 }).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_identity_context_audit_user_idx').on(table.userId, table.occurredAt),
]);

export const userIdentityContextRelations = relations(userIdentityContext, ({ one }) => ({
  user: one(usersTable, { fields: [userIdentityContext.userId], references: [usersTable.id] }),
}));
