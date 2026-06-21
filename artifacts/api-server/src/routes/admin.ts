import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessInvitesTable, businessesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendBusinessOutreach } from "../lib/email";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

const router: IRouter = Router();

router.get("/admin/invites", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const invites = await db
      .select()
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt))
      .limit(200);
    res.json({ invites });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch invites");
    res.status(500).json({ error: "Failed to fetch invites" });
  }
});

router.patch("/admin/invites/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const id = String(req.params.id);
  const { status, notes } = req.body as { status?: string; notes?: string };
  const allowed = ["pending", "contacted", "accepted", "declined", "expired"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    const [updated] = await db
      .update(businessInvitesTable)
      .set(updates)
      .where(eq(businessInvitesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }
    res.json({ invite: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update invite");
    res.status(500).json({ error: "Failed to update invite" });
  }
});

router.get("/admin/businesses", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const businesses = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        verified: businessesTable.verified,
        blackOwned: businessesTable.blackOwned,
        status: businessesTable.status,
        phone: businessesTable.phone,
        website: businessesTable.website,
        createdAt: businessesTable.createdAt,
      })
      .from(businessesTable)
      .orderBy(desc(businessesTable.createdAt))
      .limit(500);

    const invites = await db
      .select({
        businessId: businessInvitesTable.businessId,
        status: businessInvitesTable.status,
        socialHandle: businessInvitesTable.socialHandle,
        createdAt: businessInvitesTable.createdAt,
      })
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt));

    const outreachByBusiness = new Map<string, typeof invites[0]>();
    for (const inv of invites) {
      if (inv.businessId && !outreachByBusiness.has(inv.businessId)) {
        outreachByBusiness.set(inv.businessId, inv);
      }
    }

    const result = businesses.map((b) => ({
      ...b,
      outreach: outreachByBusiness.get(b.id) ?? null,
    }));

    res.json({ businesses: result });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.post("/admin/businesses/:id/outreach", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const businessId = String(req.params.id);
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email address required" });
    return;
  }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const claimLink = `https://mappingwithmelanin.com/for-business-owners?claim=${businessId}`;

    await sendBusinessOutreach(email, business.name, claimLink);

    const adminUser = (req as any).user;
    await db.insert(businessInvitesTable).values({
      businessId: business.id,
      businessName: business.name,
      socialHandle: email,
      socialPlatform: "email",
      status: "contacted",
      invitedByUserId: adminUser?.id ?? null,
    });

    req.log.info({ businessId, email }, "Business outreach email sent");
    res.json({ sent: true, to: email, businessName: business.name });
  } catch (err) {
    req.log.error({ err }, "Failed to send business outreach");
    res.status(500).json({ error: "Failed to send outreach email" });
  }
});

export default router;
