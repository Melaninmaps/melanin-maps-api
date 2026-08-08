/**
 * Tester Feedback Routes
 * POST /feedback        — authenticated users submit beta feedback
 * GET  /admin/feedback  — admins review submitted feedback
 */
import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { testerFeedbackTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { isAdmin } from "../lib/adminAuth";

const router = Router();

const VALID_TYPES = new Set([
  "bug",
  "confusing",
  "feature",
  "missing_place",
  "incorrect",
  "love",
  "general",
]);

// ── POST /feedback ────────────────────────────────────────────────────────────
// Authenticated testers submit feedback. User context is auto-attached from
// session. Do NOT expose passwords, tokens, or secrets.
router.post("/feedback", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: "Sign in to submit feedback." });
    return;
  }

  const { type, description, expected, page } = req.body as {
    type?: string;
    description?: string;
    expected?: string;
    page?: string;
  };

  if (!type || !VALID_TYPES.has(type)) {
    res.status(400).json({ error: "A valid feedback type is required." });
    return;
  }
  if (!description?.trim() || description.trim().length < 5) {
    res.status(400).json({ error: "Please describe your feedback (at least 5 characters)." });
    return;
  }
  if (description.trim().length > 5000) {
    res.status(400).json({ error: "Feedback description must be under 5,000 characters." });
    return;
  }

  const buildSha = (process.env.__BUILT_FROM_SHA__ ?? process.env.BUILD_SHA ?? "unknown").slice(0, 12);
  const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 500);

  try {
    const [row] = await db
      .insert(testerFeedbackTable)
      .values({
        userId: user.id,
        type,
        description: description.trim(),
        expected: expected?.trim() || null,
        page: page ? String(page).slice(0, 500) : null,
        userAgent,
        buildSha,
        platform: "web",
        status: "open",
      })
      .returning({ id: testerFeedbackTable.id });

    res.json({ ok: true, id: row.id });
  } catch (err) {
    req.log?.error({ err }, "POST /feedback error");
    res.status(500).json({ error: "Could not save feedback. Please try again." });
  }
});

// ── GET /admin/feedback ───────────────────────────────────────────────────────
// Admins retrieve all tester feedback, newest first.
router.get("/admin/feedback", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user || !isAdmin(req)) {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const typeFilter = req.query.type as string | undefined;

  try {
    const rows = await db
      .select({
        id: testerFeedbackTable.id,
        type: testerFeedbackTable.type,
        description: testerFeedbackTable.description,
        expected: testerFeedbackTable.expected,
        page: testerFeedbackTable.page,
        platform: testerFeedbackTable.platform,
        buildSha: testerFeedbackTable.buildSha,
        status: testerFeedbackTable.status,
        createdAt: testerFeedbackTable.createdAt,
        // User info
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
        userEmail: usersTable.email,
        userMemberType: usersTable.memberType,
      })
      .from(testerFeedbackTable)
      .leftJoin(usersTable, eq(testerFeedbackTable.userId, usersTable.id))
      .orderBy(desc(testerFeedbackTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ feedback: rows, count: rows.length });
  } catch (err) {
    req.log?.error({ err }, "GET /admin/feedback error");
    res.status(500).json({ error: "Could not retrieve feedback." });
  }
});

// ── PATCH /admin/feedback/:id/status ─────────────────────────────────────────
router.patch("/admin/feedback/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !["open", "resolved"].includes(status)) {
    res.status(400).json({ error: "status must be 'open' or 'resolved'." });
    return;
  }

  try {
    const [updated] = await db
      .update(testerFeedbackTable)
      .set({ status } as any)
      .where(eq(testerFeedbackTable.id, id))
      .returning({ id: testerFeedbackTable.id });

    if (!updated) { res.status(404).json({ error: "Feedback not found." }); return; }
    res.json({ ok: true, status });
  } catch (err) {
    req.log?.error({ err }, "PATCH /admin/feedback/:id/status error");
    res.status(500).json({ error: "Could not update feedback status." });
  }
});

export default router;
