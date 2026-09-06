import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessIdentityTable } from "@workspace/db";
import { isBlackOwned, OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import { and, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const VALID_AUDIENCE_TYPES = ["all_ages", "family_friendly", "teens", "adults_18plus", "adults_21plus", "unknown"] as const;
const VALID_AGE_RESTRICTION_REASONS = ["alcohol", "cannabis", "tobacco", "adult_entertainment", "gambling", "late_night", "explicit_performances", "safety_liability", "legal_requirement", "other"] as const;
const VALID_ENVIRONMENT_TAGS = ["quiet", "casual", "family_oriented", "professional", "romantic", "nightlife", "educational", "cultural", "outdoor", "high_energy", "luxury", "budget_friendly"] as const;
const VALID_AMENITY_TAGS = ["wifi", "outdoor_seating", "parking", "kid_friendly_menu", "vegan_options", "pet_friendly", "live_music", "gender_neutral_restrooms", "wheelchair_accessible", "service_animals", "sensory_friendly"] as const;

const LEGACY_OWNERSHIP_LABELS: Record<string, string> = {
  "Black-Owned": "Black / African American-Owned",
  "Minority-Owned": "Minority-Owned (general / legacy)",
  "LGBTQ+-Owned": "LGBTQIA+-Owned",
  "Melanated Diaspora-Owned": "Multicultural / Multiethnic-Owned",
};

type IdentityBody = {
  businessStory?: string;
  missionStatement?: string;
  whyStarted?: string;
  whatCustomersShouldKnow?: string;
  ownershipBadges?: string[];
  communityValues?: string[];
  audiencesServed?: string[];
  accessibilityFeatures?: string[];
  vibes?: string[];
  employeeCount?: number | null;
  isHiring?: boolean;
  hasInternships?: boolean;
  hasVolunteerOpportunities?: boolean;
  currentHighlights?: string[];
  communityInitiatives?: string[];
  growthGoals?: string[];
  audienceType?: string;
  ageRestrictionReasons?: string[];
  environmentTags?: string[];
  amenityTags?: string[];
};

function strArr(val: unknown, max: number): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.filter(v => typeof v === "string").slice(0, max) as string[];
}

function allowedStrArr(val: unknown, allowed: readonly string[]): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.filter(v => typeof v === "string" && (allowed as string[]).includes(v)) as string[];
}

function ownershipDesignations(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const allowed = new Set<string>(OWNERSHIP_DESIGNATIONS);
  return [...new Set(val
    .filter((value): value is string => typeof value === "string")
    .map((value) => LEGACY_OWNERSHIP_LABELS[value] ?? value)
    .filter((value) => allowed.has(value)))]
    .slice(0, 10);
}

function sanitize(body: Record<string, unknown>): IdentityBody {
  const s = (k: string, maxLen = 2000): string | undefined => {
    const v = body[k];
    return typeof v === "string" ? v.slice(0, maxLen) : undefined;
  };
  const rawAudienceType = body["audienceType"];
  const audienceType = typeof rawAudienceType === "string" && (VALID_AUDIENCE_TYPES as readonly string[]).includes(rawAudienceType)
    ? rawAudienceType : undefined;
  return {
    businessStory: s("businessStory", 2000),
    missionStatement: s("missionStatement", 500),
    whyStarted: s("whyStarted", 1000),
    whatCustomersShouldKnow: s("whatCustomersShouldKnow", 500),
    ownershipBadges: ownershipDesignations(body["ownershipBadges"]),
    communityValues: strArr(body["communityValues"], 5),
    audiencesServed: strArr(body["audiencesServed"], 20),
    accessibilityFeatures: strArr(body["accessibilityFeatures"], 20),
    vibes: strArr(body["vibes"], 6),
    employeeCount: typeof body["employeeCount"] === "number" ? Math.max(0, Math.floor(body["employeeCount"])) : (body["employeeCount"] === null ? null : undefined),
    isHiring: typeof body["isHiring"] === "boolean" ? body["isHiring"] : undefined,
    hasInternships: typeof body["hasInternships"] === "boolean" ? body["hasInternships"] : undefined,
    hasVolunteerOpportunities: typeof body["hasVolunteerOpportunities"] === "boolean" ? body["hasVolunteerOpportunities"] : undefined,
    currentHighlights: strArr(body["currentHighlights"], 5),
    communityInitiatives: strArr(body["communityInitiatives"], 10),
    growthGoals: strArr(body["growthGoals"], 10),
    audienceType,
    ageRestrictionReasons: allowedStrArr(body["ageRestrictionReasons"], VALID_AGE_RESTRICTION_REASONS),
    environmentTags: allowedStrArr(body["environmentTags"], VALID_ENVIRONMENT_TAGS),
    amenityTags: allowedStrArr(body["amenityTags"], VALID_AMENITY_TAGS),
  };
}

async function getOwnedBusiness(req: Request, res: Response): Promise<typeof businessesTable.$inferSelect | null> {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  const requestedId = typeof req.query.businessId === "string" ? req.query.businessId.trim() : "";
  const hasApprovedOwnerLink = sql<boolean>`EXISTS (
    SELECT 1 FROM business_owner_links bol
    WHERE bol.business_id = ${businessesTable.id}
      AND bol.user_id = ${req.user.id}
      AND bol.role = 'owner'
      AND bol.status = 'approved'
      AND bol.revoked_at IS NULL
  )`;
  const ownershipFilter = requestedId
    ? and(eq(businessesTable.id, requestedId), hasApprovedOwnerLink)
    : hasApprovedOwnerLink;
  const [biz] = await db.select().from(businessesTable).where(ownershipFilter).limit(1);
  if (!biz) { res.status(404).json({ error: "No business found for this account" }); return null; }
  return biz;
}

router.get("/businesses/mine/identity", async (req: Request, res: Response) => {
  const biz = await getOwnedBusiness(req, res);
  if (!biz) return;

  let [identity] = await db.select().from(businessIdentityTable).where(eq(businessIdentityTable.businessId, biz.id)).limit(1);

  if (!identity) {
    [identity] = await db.insert(businessIdentityTable).values({ businessId: biz.id }).returning();
  }

  const normalizedBadges = ownershipDesignations(identity.ownershipBadges) ?? [];
  res.json({
    identity: {
      ...identity,
      ownershipBadges: normalizedBadges.length > 0 ? normalizedBadges : biz.ownershipDesignations,
    },
  });
});

router.patch("/businesses/mine/identity", async (req: Request, res: Response) => {
  const biz = await getOwnedBusiness(req, res);
  if (!biz) return;

  const data = sanitize(req.body as Record<string, unknown>);

  const [existing] = await db.select({ id: businessIdentityTable.id }).from(businessIdentityTable).where(eq(businessIdentityTable.businessId, biz.id)).limit(1);

  const identity = await db.transaction(async (tx) => {
    let saved;
    if (existing) {
      [saved] = await tx.update(businessIdentityTable).set(data).where(eq(businessIdentityTable.businessId, biz.id)).returning();
    } else {
      [saved] = await tx.insert(businessIdentityTable).values({ businessId: biz.id, ...data }).returning();
    }

    if (data.ownershipBadges !== undefined) {
      await tx
        .update(businessesTable)
        .set({
          ownershipDesignations: data.ownershipBadges,
          blackOwned: isBlackOwned(data.ownershipBadges),
          updatedAt: new Date(),
        })
        .where(eq(businessesTable.id, biz.id));
    }
    return saved;
  });

  req.log.info({ businessId: biz.id }, "Business identity updated");
  res.json({ identity });
});

export default router;
