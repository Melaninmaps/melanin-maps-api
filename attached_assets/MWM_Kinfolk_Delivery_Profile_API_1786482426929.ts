/*
 * Mapping With Melanin — Kinfolk Delivery Profile Repository & API Routes
 *
 * Suggested placement:
 *   server/routes/kinfolk-delivery-profile.ts
 *
 * This augments the existing /api/kinfolk/preferences endpoint. It does not
 * replace the existing Taste Profile schema or UI. The new `deliveryProfile`
 * field is added alongside legacy taste/profile fields.
 *
 * Security model:
 * - request-scoped Supabase client uses the authenticated member JWT;
 * - RLS enforces user_id = auth.uid();
 * - service role is NOT used for member profile reads/writes;
 * - age band is read-only from account safety data, not freely editable here.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '../auth/require-authenticated-user';

export type DetailLevel = 'quick' | 'standard' | 'deep';
export type TonePreference = 'default' | 'warm' | 'professional' | 'plain_language' | 'regional_opt_in';
export type LearningMode = 'guided' | 'self_directed';
export type NotificationCadence = 'none' | 'essential_only' | 'weekly_digest' | 'opt_in_updates';
export type AgeBand = 'under_13' | '13_17' | '18_24' | '25_plus' | 'unknown';

export interface DeliveryProfile {
  detailLevel: DetailLevel;
  tonePreference: TonePreference;
  learningMode: LearningMode;
  notificationCadence: NotificationCadence;
  ageBand: AgeBand;
  regionalLanguageOptIn: boolean;
  regionalReference: string | null;
  allowRelatedBranches: boolean;
  allowNonSensitiveRecommendations: boolean;
  allowCivicSafetyUpdates: boolean;
}

const deliveryProfileSchema = z.object({
  detailLevel: z.enum(['quick', 'standard', 'deep']),
  tonePreference: z.enum(['default', 'warm', 'professional', 'plain_language', 'regional_opt_in']),
  learningMode: z.enum(['guided', 'self_directed']),
  notificationCadence: z.enum(['none', 'essential_only', 'weekly_digest', 'opt_in_updates']),
  regionalLanguageOptIn: z.boolean(),
  regionalReference: z.string().trim().min(2).max(80).nullable(),
  allowRelatedBranches: z.boolean(),
  allowNonSensitiveRecommendations: z.boolean(),
  allowCivicSafetyUpdates: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.tonePreference === 'regional_opt_in' && !value.regionalLanguageOptIn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['regionalLanguageOptIn'],
      message: 'Regional language requires explicit opt-in.',
    });
  }
  if (value.regionalLanguageOptIn && !value.regionalReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['regionalReference'],
      message: 'A regional reference is required when regional language is enabled.',
    });
  }
});

// Compatibility adapter for the existing UI buttons. The new table stores the
// actual delivery dimensions instead of treating “Detailed” as an identity.
export type ExistingResponseStyle = 'conversational' | 'concise' | 'detailed' | 'professional';

export function responseStyleToDeliveryPatch(style: ExistingResponseStyle): Pick<DeliveryProfile, 'detailLevel' | 'tonePreference'> {
  switch (style) {
    case 'concise':
      return { detailLevel: 'quick', tonePreference: 'default' };
    case 'detailed':
      return { detailLevel: 'deep', tonePreference: 'default' };
    case 'professional':
      return { detailLevel: 'standard', tonePreference: 'professional' };
    case 'conversational':
    default:
      return { detailLevel: 'standard', tonePreference: 'warm' };
  }
}

export function deliveryToResponseStyle(profile: DeliveryProfile): ExistingResponseStyle {
  if (profile.tonePreference === 'professional') return 'professional';
  if (profile.detailLevel === 'deep') return 'detailed';
  if (profile.detailLevel === 'quick') return 'concise';
  return 'conversational';
}

function toDeliveryProfile(row: Record<string, unknown> | null, ageBand: AgeBand): DeliveryProfile {
  return {
    detailLevel: (row?.detail_level as DetailLevel | undefined) ?? 'standard',
    tonePreference: (row?.tone_preference as TonePreference | undefined) ?? 'default',
    learningMode: (row?.learning_mode as LearningMode | undefined) ?? 'guided',
    notificationCadence: (row?.notification_cadence as NotificationCadence | undefined) ?? 'essential_only',
    ageBand: (row?.age_band as AgeBand | undefined) ?? ageBand,
    regionalLanguageOptIn: Boolean(row?.regional_language_opt_in),
    regionalReference: (row?.regional_reference as string | null | undefined) ?? null,
    allowRelatedBranches: Boolean(row?.allow_related_branches),
    allowNonSensitiveRecommendations: Boolean(row?.allow_non_sensitive_recommendations),
    allowCivicSafetyUpdates: Boolean(row?.allow_civic_safety_updates),
  };
}

/**
 * Direct Supabase query used by /api/kinfolk/preferences and the chat handler.
 *
 * Equivalent SQL, executed under the authenticated member role:
 *
 * SELECT detail_level, tone_preference, learning_mode, notification_cadence,
 *        age_band, regional_language_opt_in, regional_reference,
 *        allow_related_branches, allow_non_sensitive_recommendations,
 *        allow_civic_safety_updates
 * FROM public.kinfolk_delivery_profiles
 * WHERE user_id = auth.uid();
 */
export async function loadDeliveryProfile(
  userSupabase: SupabaseClient,
  userId: string,
  accountAgeBand: AgeBand,
): Promise<DeliveryProfile> {
  const { data, error } = await userSupabase
    .from('kinfolk_delivery_profiles')
    .select(`
      detail_level,tone_preference,learning_mode,notification_cadence,age_band,
      regional_language_opt_in,regional_reference,allow_related_branches,
      allow_non_sensitive_recommendations,allow_civic_safety_updates
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`DELIVERY_PROFILE_LOAD_FAILED:${error.code}`);
  return toDeliveryProfile(data, accountAgeBand);
}

/**
 * Upsert through the authenticated client. RLS must restrict INSERT/UPDATE to
 * user_id = auth.uid(). `age_band` is preserved from trusted account data.
 *
 * Equivalent SQL:
 * INSERT INTO public.kinfolk_delivery_profiles (...)
 * VALUES (...)
 * ON CONFLICT (user_id) DO UPDATE SET ...
 * RETURNING ...;
 */
export async function saveDeliveryProfile(
  userSupabase: SupabaseClient,
  userId: string,
  accountAgeBand: AgeBand,
  payload: z.infer<typeof deliveryProfileSchema>,
): Promise<DeliveryProfile> {
  const row = {
    user_id: userId,
    detail_level: payload.detailLevel,
    tone_preference: payload.tonePreference,
    learning_mode: payload.learningMode,
    notification_cadence: payload.notificationCadence,
    // Do NOT accept age band from the browser. The account safety service owns it.
    age_band: accountAgeBand,
    regional_language_opt_in: payload.regionalLanguageOptIn,
    regional_reference: payload.regionalLanguageOptIn ? payload.regionalReference : null,
    allow_related_branches: payload.allowRelatedBranches,
    allow_non_sensitive_recommendations: payload.allowNonSensitiveRecommendations,
    allow_civic_safety_updates: payload.allowCivicSafetyUpdates,
  };

  const { data, error } = await userSupabase
    .from('kinfolk_delivery_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select(`
      detail_level,tone_preference,learning_mode,notification_cadence,age_band,
      regional_language_opt_in,regional_reference,allow_related_branches,
      allow_non_sensitive_recommendations,allow_civic_safety_updates
    `)
    .single();

  if (error) throw new Error(`DELIVERY_PROFILE_SAVE_FAILED:${error.code}`);
  return toDeliveryProfile(data, accountAgeBand);
}

interface RequestWithUserSupabase {
  user?: { id: string; ageBand?: AgeBand };
  supabase: SupabaseClient;
  body: unknown;
}

function trustedAgeBand(req: RequestWithUserSupabase): AgeBand {
  // Replace with a lookup from the account safety service when age bands are not
  // present on the session object. Never default a known minor to adult.
  return req.user?.ageBand ?? 'unknown';
}

export function createKinfolkPreferenceRouter(): Router {
  const router = Router();

  // IMPORTANT: retain the existing endpoint path so current web/mobile clients
  // continue to work. Extend the response; do not create an incompatible route.
  router.get('/api/kinfolk/preferences', requireAuthenticatedUser, async (req, res) => {
    try {
      const typedReq = req as unknown as RequestWithUserSupabase;
      const userId = typedReq.user!.id;
      const deliveryProfile = await loadDeliveryProfile(typedReq.supabase, userId, trustedAgeBand(typedReq));

      // Preserve existing payload keys from the legacy taste-profile controller.
      const legacyPreferences = await loadExistingTasteProfile(typedReq.supabase, userId);

      res.status(200).json({
        ...legacyPreferences,
        deliveryProfile,
        // Compatibility value for the existing response-style control group.
        responseStyle: deliveryToResponseStyle(deliveryProfile),
      });
    } catch (error) {
      res.status(500).json({ error: 'KINFOLK_PREFERENCES_UNAVAILABLE' });
    }
  });

  router.put('/api/kinfolk/preferences/delivery', requireAuthenticatedUser, async (req, res) => {
    try {
      const typedReq = req as unknown as RequestWithUserSupabase;
      const parsed = deliveryProfileSchema.safeParse(typedReq.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'INVALID_DELIVERY_PROFILE',
          fields: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const profile = await saveDeliveryProfile(
        typedReq.supabase,
        typedReq.user!.id,
        trustedAgeBand(typedReq),
        parsed.data,
      );

      res.status(200).json({
        deliveryProfile: profile,
        responseStyle: deliveryToResponseStyle(profile),
      });
    } catch (error) {
      res.status(500).json({ error: 'KINFOLK_DELIVERY_PROFILE_SAVE_FAILED' });
    }
  });

  // Transitional endpoint: allows the existing Taste Profile Save button to save
  // a selected response-style button without duplicating profile UI immediately.
  router.put('/api/kinfolk/preferences/response-style', requireAuthenticatedUser, async (req, res) => {
    try {
      const typedReq = req as unknown as RequestWithUserSupabase;
      const style = z.enum(['conversational', 'concise', 'detailed', 'professional']).safeParse(
        (typedReq.body as { responseStyle?: unknown })?.responseStyle,
      );
      if (!style.success) {
        res.status(400).json({ error: 'INVALID_RESPONSE_STYLE' });
        return;
      }

      const current = await loadDeliveryProfile(
        typedReq.supabase,
        typedReq.user!.id,
        trustedAgeBand(typedReq),
      );
      const profile = await saveDeliveryProfile(
        typedReq.supabase,
        typedReq.user!.id,
        trustedAgeBand(typedReq),
        {
          ...current,
          ...responseStyleToDeliveryPatch(style.data),
        },
      );

      res.status(200).json({
        deliveryProfile: profile,
        responseStyle: deliveryToResponseStyle(profile),
      });
    } catch (error) {
      res.status(500).json({ error: 'KINFOLK_RESPONSE_STYLE_SAVE_FAILED' });
    }
  });

  return router;
}

// Replace this adapter with the existing repository implementation. Keeping it
// separate prevents the delivery-profile work from breaking current Taste Profile
// fields, travel preferences, favorites, or voice settings.
async function loadExistingTasteProfile(_supabase: SupabaseClient, _userId: string): Promise<Record<string, unknown>> {
  return {};
}

/*
 * FRONT-END SAVE/LOAD WIRING (web and mobile)
 *
 * Load on initial preferences fetch:
 *   const data = await api.get('/api/kinfolk/preferences');
 *   setResponseStyle(data.responseStyle);
 *   setDeliveryProfile(data.deliveryProfile);
 *
 * Existing “Save Taste Profile” button:
 *   await api.put('/api/kinfolk/preferences/response-style', {
 *     responseStyle: selectedResponseStyle,
 *   });
 *
 * New privacy/detail settings screen:
 *   await api.put('/api/kinfolk/preferences/delivery', deliveryProfileForm);
 *
 * REFRESH ACCEPTANCE TEST:
 *   1. Select Detailed.
 *   2. Save Taste Profile.
 *   3. Hard-refresh or relaunch mobile app.
 *   4. GET /api/kinfolk/preferences must return responseStyle: "detailed".
 *   5. Detailed button must render selected.
 */
