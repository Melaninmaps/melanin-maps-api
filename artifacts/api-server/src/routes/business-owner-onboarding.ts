import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  EMPTY_OWNER_ONBOARDING,
  buildOwnerOnboardingChecklist,
  completionPercent,
  ownerOnboardingInputSchema,
  type OwnerOnboardingInput,
} from "../businesses/owner-onboarding-policy";
import { ensureBusinessOwnerOnboardingSchema } from "../lib/startup-migrations";

const router: IRouter = Router();

type OwnedBusinessRow = { id: string; weekly_schedule: Record<string, unknown> | null };
type OnboardingRow = {
  identity_reviewed: boolean;
  offerings: OwnerOnboardingInput["offerings"] | null;
  pricing: OwnerOnboardingInput["pricing"] | null;
  availability: OwnerOnboardingInput["availability"] | null;
  media: OwnerOnboardingInput["media"] | null;
  communication: OwnerOnboardingInput["communication"] | null;
  updated_at: string | null;
};

async function resolveOwnedBusiness(userId: string): Promise<OwnedBusinessRow | null> {
  const result = await pool.query<OwnedBusinessRow>(
    `SELECT b.id, b.weekly_schedule
       FROM businesses b
       JOIN business_owner_links bol
         ON bol.business_id = b.id
      WHERE bol.user_id = $1
        AND bol.role = 'owner'
        AND bol.status = 'approved'
        AND bol.revoked_at IS NULL
      ORDER BY b.updated_at DESC
      LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

function toInput(row?: OnboardingRow): OwnerOnboardingInput {
  return {
    identityReviewed: row?.identity_reviewed ?? EMPTY_OWNER_ONBOARDING.identityReviewed,
    offerings: row?.offerings ?? EMPTY_OWNER_ONBOARDING.offerings,
    pricing: row?.pricing ?? EMPTY_OWNER_ONBOARDING.pricing,
    availability: row?.availability ?? EMPTY_OWNER_ONBOARDING.availability,
    media: row?.media ?? EMPTY_OWNER_ONBOARDING.media,
    communication: row?.communication ?? EMPTY_OWNER_ONBOARDING.communication,
  };
}

function responsePayload(businessId: string, input: OwnerOnboardingInput, weeklySchedule: Record<string, unknown> | null, updatedAt: string | null) {
  const hasWeeklySchedule = Boolean(weeklySchedule && Object.values(weeklySchedule).some(Boolean));
  const checklist = buildOwnerOnboardingChecklist(input, hasWeeklySchedule);
  return {
    businessId,
    onboarding: input,
    checklist,
    completionPercent: completionPercent(checklist),
    updatedAt,
    privacy: {
      privateOwnerChecklist: true,
      autoPublishesBusinessProfile: false,
      createsMarketingContent: false,
      createsCustomerContact: false,
      changesDirectoryEligibility: false,
    },
  };
}

async function requireOnboardingSchema(req: Request, res: Response): Promise<boolean> {
  try {
    await ensureBusinessOwnerOnboardingSchema();
    return true;
  } catch (error) {
    req.log.error({ error }, "Business owner onboarding schema is unavailable");
    res.status(503).json({ error: "BUSINESS_OWNER_ONBOARDING_SCHEMA_UNAVAILABLE" });
    return false;
  }
}

router.get("/businesses/mine/onboarding", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  if (!(await requireOnboardingSchema(req, res))) return;

  try {
    const business = await resolveOwnedBusiness(req.user.id);
    if (!business) return void res.status(403).json({ error: "Approved business owner access is required" });

    const onboarding = await pool.query<OnboardingRow>(
      `SELECT identity_reviewed, offerings, pricing, availability, media, communication, updated_at
         FROM business_owner_onboarding
        WHERE business_id = $1
        LIMIT 1`,
      [business.id],
    );
    const row = onboarding.rows[0];
    return void res.json(responsePayload(business.id, toInput(row), business.weekly_schedule, row?.updated_at ?? null));
  } catch (error) {
    req.log.error({ error }, "Failed to load owner onboarding checklist");
    return void res.status(500).json({ error: "Could not load owner onboarding checklist" });
  }
});

router.put("/businesses/mine/onboarding", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  if (!(await requireOnboardingSchema(req, res))) return;

  const parsed = ownerOnboardingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(400).json({ error: "Invalid owner onboarding input", details: parsed.error.issues });
  }

  try {
    const business = await resolveOwnedBusiness(req.user.id);
    if (!business) return void res.status(403).json({ error: "Approved business owner access is required" });

    const input = parsed.data;
    const saved = await pool.query<OnboardingRow>(
      `INSERT INTO business_owner_onboarding (
         business_id, last_updated_by_user_id, identity_reviewed, offerings, pricing, availability, media, communication, updated_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, NOW())
       ON CONFLICT (business_id) DO UPDATE SET
         last_updated_by_user_id = EXCLUDED.last_updated_by_user_id,
         identity_reviewed = EXCLUDED.identity_reviewed,
         offerings = EXCLUDED.offerings,
         pricing = EXCLUDED.pricing,
         availability = EXCLUDED.availability,
         media = EXCLUDED.media,
         communication = EXCLUDED.communication,
         updated_at = NOW()
       RETURNING identity_reviewed, offerings, pricing, availability, media, communication, updated_at`,
      [
        business.id,
        req.user.id,
        input.identityReviewed,
        JSON.stringify(input.offerings),
        JSON.stringify(input.pricing),
        JSON.stringify(input.availability),
        JSON.stringify(input.media),
        JSON.stringify(input.communication),
      ],
    );
    const row = saved.rows[0];
    return void res.json(responsePayload(business.id, toInput(row), business.weekly_schedule, row.updated_at));
  } catch (error) {
    req.log.error({ error }, "Failed to save owner onboarding checklist");
    return void res.status(500).json({ error: "Could not save owner onboarding checklist" });
  }
});

export default router;
