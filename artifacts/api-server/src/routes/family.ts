import { Router, type IRouter, type Request, type Response } from "express";
import { db, familyLinksTable, contentFilterRulesTable, contentFilterViolationsTable, usersTable } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";
import crypto from "node:crypto";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

router.get("/family/links", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const links = await db
      .select({
        id: familyLinksTable.id,
        parentUserId: familyLinksTable.parentUserId,
        childUserId: familyLinksTable.childUserId,
        childEmail: familyLinksTable.childEmail,
        status: familyLinksTable.status,
        createdAt: familyLinksTable.createdAt,
        acceptedAt: familyLinksTable.acceptedAt,
        childFirstName: usersTable.firstName,
        childLastName: usersTable.lastName,
      })
      .from(familyLinksTable)
      .leftJoin(usersTable, eq(usersTable.id, familyLinksTable.childUserId))
      .where(or(eq(familyLinksTable.parentUserId, userId), eq(familyLinksTable.childUserId, userId)));
    res.json({ links });
  } catch (err) {
    req.log.error({ err }, "GET /family/links error");
    res.status(500).json({ error: "Failed to load family links" });
  }
});

router.post("/family/link-request", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { childEmail } = req.body as { childEmail?: string };
    if (!childEmail?.includes("@")) { res.status(400).json({ error: "Valid child email is required" }); return; }
    const token = crypto.randomBytes(32).toString("hex");
    const [child] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.email, childEmail.toLowerCase().trim())).limit(1);
    const [link] = await db.insert(familyLinksTable).values({
      parentUserId: userId,
      childUserId: child?.id ?? null,
      childEmail: childEmail.toLowerCase().trim(),
      inviteToken: token,
      status: child ? "pending" : "pending",
    }).returning();
    res.status(201).json({ link, childFound: !!child });
  } catch (err) {
    req.log.error({ err }, "POST /family/link-request error");
    res.status(500).json({ error: "Failed to create link request" });
  }
});

router.post("/family/link-respond", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { linkId, accept } = req.body as { linkId?: number; accept?: boolean };
    if (!linkId) { res.status(400).json({ error: "linkId is required" }); return; }
    const [link] = await db.select().from(familyLinksTable)
      .where(and(eq(familyLinksTable.id, linkId), eq(familyLinksTable.childUserId, userId))).limit(1);
    if (!link) { res.status(404).json({ error: "Link not found" }); return; }
    if (link.status !== "pending") { res.status(409).json({ error: "Link is not pending" }); return; }
    const [updated] = await db.update(familyLinksTable)
      .set({ status: accept ? "active" : "declined", acceptedAt: accept ? new Date() : null })
      .where(eq(familyLinksTable.id, linkId))
      .returning();
    res.json({ link: updated });
  } catch (err) {
    req.log.error({ err }, "POST /family/link-respond error");
    res.status(500).json({ error: "Failed to respond to link" });
  }
});

router.delete("/family/links/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid link ID" }); return; }
    await db.delete(familyLinksTable).where(
      and(eq(familyLinksTable.id, id),
        or(eq(familyLinksTable.parentUserId, userId), eq(familyLinksTable.childUserId, userId)))
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /family/links/:id error");
    res.status(500).json({ error: "Failed to remove link" });
  }
});

router.get("/family/links/:id/keywords", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const linkId = parseInt(req.params["id"] as string, 10);
    const [link] = await db.select().from(familyLinksTable)
      .where(and(eq(familyLinksTable.id, linkId), eq(familyLinksTable.parentUserId, userId))).limit(1);
    if (!link) { res.status(404).json({ error: "Link not found" }); return; }
    const [rule] = await db.select().from(contentFilterRulesTable)
      .where(eq(contentFilterRulesTable.familyLinkId, linkId)).limit(1);
    res.json({ keywords: rule?.keywords ?? [], blockContent: rule?.blockContent ?? true });
  } catch (err) {
    req.log.error({ err }, "GET /family/links/:id/keywords error");
    res.status(500).json({ error: "Failed to load keywords" });
  }
});

router.put("/family/links/:id/keywords", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const linkId = parseInt(req.params["id"] as string, 10);
    const { keywords, blockContent = true } = req.body as { keywords?: string[]; blockContent?: boolean };
    if (!Array.isArray(keywords)) { res.status(400).json({ error: "keywords must be an array" }); return; }
    const [link] = await db.select().from(familyLinksTable)
      .where(and(eq(familyLinksTable.id, linkId), eq(familyLinksTable.parentUserId, userId))).limit(1);
    if (!link) { res.status(404).json({ error: "Link not found" }); return; }
    const clean = keywords.map((k: string) => k.trim().toLowerCase()).filter(Boolean);
    const [existing] = await db.select({ id: contentFilterRulesTable.id })
      .from(contentFilterRulesTable).where(eq(contentFilterRulesTable.familyLinkId, linkId)).limit(1);
    if (existing) {
      await db.update(contentFilterRulesTable)
        .set({ keywords: clean, blockContent, updatedAt: new Date() })
        .where(eq(contentFilterRulesTable.id, existing.id));
    } else {
      await db.insert(contentFilterRulesTable).values({ familyLinkId: linkId, keywords: clean, blockContent });
    }
    res.json({ keywords: clean, blockContent });
  } catch (err) {
    req.log.error({ err }, "PUT /family/links/:id/keywords error");
    res.status(500).json({ error: "Failed to save keywords" });
  }
});

router.get("/family/violations", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const violations = await db.select().from(contentFilterViolationsTable)
      .where(eq(contentFilterViolationsTable.parentUserId, userId))
      .orderBy(desc(contentFilterViolationsTable.createdAt))
      .limit(100);
    res.json({ violations });
  } catch (err) {
    req.log.error({ err }, "GET /family/violations error");
    res.status(500).json({ error: "Failed to load violations" });
  }
});

export default router;
