import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessIdentityTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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
};

function strArr(val: unknown, max: number): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.filter(v => typeof v === "string").slice(0, max) as string[];
}

function sanitize(body: Record<string, unknown>): IdentityBody {
  const s = (k: string, maxLen = 2000): string | undefined => {
    const v = body[k];
    return typeof v === "string" ? v.slice(0, maxLen) : undefined;
  };
  return {
    businessStory: s("businessStory", 2000),
    missionStatement: s("missionStatement", 500),
    whyStarted: s("whyStarted", 1000),
    whatCustomersShouldKnow: s("whatCustomersShouldKnow", 500),
    ownershipBadges: strArr(body["ownershipBadges"], 10),
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
  };
}

async function getOwnedBusiness(req: Request, res: Response): Promise<typeof businessesTable.$inferSelect | null> {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.submittedById, req.user.id)).limit(1);
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

  res.json({ identity });
});

router.patch("/businesses/mine/identity", async (req: Request, res: Response) => {
  const biz = await getOwnedBusiness(req, res);
  if (!biz) return;

  const data = sanitize(req.body as Record<string, unknown>);

  const [existing] = await db.select({ id: businessIdentityTable.id }).from(businessIdentityTable).where(eq(businessIdentityTable.businessId, biz.id)).limit(1);

  let identity;
  if (existing) {
    [identity] = await db.update(businessIdentityTable).set(data).where(eq(businessIdentityTable.businessId, biz.id)).returning();
  } else {
    [identity] = await db.insert(businessIdentityTable).values({ businessId: biz.id, ...data }).returning();
  }

  req.log.info({ businessId: biz.id }, "Business identity updated");
  res.json({ identity });
});

export default router;
