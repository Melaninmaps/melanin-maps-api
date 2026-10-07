import { Router, type IRouter, type Request, type Response } from "express";
import {
  openai,
  resolveOpenAIConfiguration,
} from "@workspace/integrations-openai-ai-server";
import { pool } from "@workspace/db";
import {
  sanitizeBusinessVoiceProfile,
  type SanitizedBusinessVoiceProfile,
} from "../kinfolk/business-voice-profile";
import {
  buildOwnerRequestedDraftPrompt,
  normalizeEditableBusinessDraft,
  sanitizeBusinessDraftRequest,
} from "../kinfolk/business-owner-drafting";

const router: IRouter = Router();

type OwnedBusiness = { id: string; name: string };

/**
 * Business Voice Profiles are available only to an authenticated, approved
 * owner link. Member chat, reviews, staff guesses, and submitted-by shortcuts
 * cannot write or supply these profile inputs.
 */
async function requireApprovedBusinessOwner(
  req: Request,
  res: Response,
): Promise<OwnedBusiness | null> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  const businessId = String(req.params.businessId ?? "").trim();
  if (!businessId) {
    res.status(400).json({ error: "A business ID is required" });
    return null;
  }
  const result = await pool.query<OwnedBusiness>(
    `SELECT b.id, b.name
       FROM businesses b
      WHERE b.id = $1
        AND EXISTS (
          SELECT 1
            FROM business_owner_links bol
           WHERE bol.business_id = b.id
             AND bol.user_id = $2
             AND bol.role = 'owner'
             AND bol.status = 'approved'
        )
      LIMIT 1`,
    [businessId, req.user.id],
  );
  const business = result.rows[0] ?? null;
  if (!business) {
    res
      .status(403)
      .json({ error: "An approved business owner link is required" });
    return null;
  }
  return business;
}

router.get(
  "/businesses/:businessId/kinfolk-voice-profile",
  async (req: Request, res: Response) => {
    const business = await requireApprovedBusinessOwner(req, res);
    if (!business) return;
    const result = await pool.query(
      `SELECT tones, language_preference AS "languagePreference",
              audience_guidance AS "audienceGuidance",
              words_to_use AS "wordsToUse", words_to_avoid AS "wordsToAvoid",
              signature_phrases AS "signaturePhrases",
              owner_confirmed_at AS "ownerConfirmedAt", updated_at AS "updatedAt"
         FROM business_kinfolk_voice_profiles
        WHERE business_id = $1
        LIMIT 1`,
      [business.id],
    );
    res.json({ business, profile: result.rows[0] ?? null });
  },
);

router.put(
  "/businesses/:businessId/kinfolk-voice-profile",
  async (req: Request, res: Response) => {
    const business = await requireApprovedBusinessOwner(req, res);
    if (!business || !req.user?.id) return;
    const sanitized = sanitizeBusinessVoiceProfile(
      req.body as Record<string, unknown>,
    );
    if (!sanitized.ok) {
      res.status(400).json({ error: sanitized.error });
      return;
    }

    const profile = sanitized.profile;
    const result = await pool.query(
      `INSERT INTO business_kinfolk_voice_profiles (
         business_id, owner_user_id, tones, language_preference, audience_guidance,
         words_to_use, words_to_avoid, signature_phrases, owner_confirmed_at
       ) VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, NOW())
       ON CONFLICT (business_id) DO UPDATE SET
         owner_user_id = EXCLUDED.owner_user_id,
         tones = EXCLUDED.tones,
         language_preference = EXCLUDED.language_preference,
         audience_guidance = EXCLUDED.audience_guidance,
         words_to_use = EXCLUDED.words_to_use,
         words_to_avoid = EXCLUDED.words_to_avoid,
         signature_phrases = EXCLUDED.signature_phrases,
         owner_confirmed_at = NOW(),
         updated_at = NOW()
       RETURNING tones, language_preference AS "languagePreference",
                 audience_guidance AS "audienceGuidance",
                 words_to_use AS "wordsToUse", words_to_avoid AS "wordsToAvoid",
                 signature_phrases AS "signaturePhrases",
                 owner_confirmed_at AS "ownerConfirmedAt", updated_at AS "updatedAt"`,
      [
        business.id,
        req.user.id,
        JSON.stringify(profile.tones),
        profile.languagePreference,
        profile.audienceGuidance,
        JSON.stringify(profile.wordsToUse),
        JSON.stringify(profile.wordsToAvoid),
        JSON.stringify(profile.signaturePhrases),
      ],
    );
    req.log.info({ businessId: business.id }, "Business Voice Profile saved");
    res.json({ business, profile: result.rows[0] });
  },
);

router.post(
  "/businesses/:businessId/kinfolk-drafts",
  async (req: Request, res: Response) => {
    const business = await requireApprovedBusinessOwner(req, res);
    if (!business) return;

    const draftRequest = sanitizeBusinessDraftRequest(
      req.body as Record<string, unknown>,
    );
    if (!draftRequest.ok) {
      res.status(400).json({ error: draftRequest.error });
      return;
    }

    const result = await pool.query<SanitizedBusinessVoiceProfile>(
      `SELECT tones, language_preference AS "languagePreference",
              audience_guidance AS "audienceGuidance",
              words_to_use AS "wordsToUse", words_to_avoid AS "wordsToAvoid",
              signature_phrases AS "signaturePhrases"
         FROM business_kinfolk_voice_profiles
        WHERE business_id = $1
          AND owner_confirmed_at IS NOT NULL
        LIMIT 1`,
      [business.id],
    );
    const profile = result.rows[0] ?? null;
    if (!profile) {
      res.status(409).json({
        error:
          "Save and confirm a Business Voice Profile before requesting a draft.",
      });
      return;
    }
    if (!resolveOpenAIConfiguration()) {
      res.status(503).json({ error: "Business drafting is unavailable right now." });
      return;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: buildOwnerRequestedDraftPrompt(profile, draftRequest.request),
          },
        ],
        temperature: 0.4,
        max_tokens: 700,
      });
      const draft = normalizeEditableBusinessDraft(
        completion.choices[0]?.message?.content,
      );
      if (!draft) {
        res.status(502).json({ error: "Business drafting returned no editable text." });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({
        kind: draftRequest.request.kind,
        label: "Editable draft — owner review required",
        draft,
      });
    } catch {
      req.log.warn({ businessId: business.id }, "Business voice drafting unavailable");
      res.status(503).json({ error: "Business drafting is unavailable right now." });
    }
  },
);

export default router;
