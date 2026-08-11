/**
 * Tester Issue Report Routes
 * POST /tester-report — authenticated testers send a direct report to the founder.
 * Auto-captures: user ID, email, name, timestamp, build SHA.
 * Also stores to tester_feedback table for admin review.
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { sendTesterReportEmail } from "../lib/email";

const router = Router();

// ── POST /tester-report ───────────────────────────────────────────────────────
// Requires auth (req.user set by requireAuth middleware in routes/index.ts).
// Body: { message: string, page: string, action?: string }
router.post("/tester-report", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: "Sign in to submit a report." });
    return;
  }

  const { message, page, action } = req.body as {
    message?: string;
    page?: string;
    action?: string;
  };

  if (!message?.trim() || message.trim().length < 3) {
    res.status(400).json({ error: "Please describe the issue (at least 3 characters)." });
    return;
  }
  if (message.trim().length > 3000) {
    res.status(400).json({ error: "Report must be under 3,000 characters." });
    return;
  }

  const timestamp = new Date().toISOString();
  const buildSha = (process.env.__BUILT_FROM_SHA__ ?? process.env.BUILD_SHA ?? "unknown").slice(0, 12);
  const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 500);

  try {
    // Look up user email + name for the founder alert
    const userRow = await pool.query(
      "SELECT email, first_name FROM users WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const userEmail: string = userRow.rows[0]?.email ?? user.id;
    const firstName: string | null = userRow.rows[0]?.first_name ?? null;

    // Store in tester_feedback table for admin review
    await pool.query(
      `INSERT INTO tester_feedback
         (user_id, type, description, expected, page, user_agent, build_sha, platform, status)
       VALUES ($1, 'bug', $2, $3, $4, $5, $6, 'mobile', 'open')`,
      [
        user.id,
        message.trim(),
        action?.trim() || null,
        page ? String(page).slice(0, 500) : null,
        userAgent,
        buildSha,
      ]
    );

    // Email the founder directly — fire and forget, never block the response
    void sendTesterReportEmail({
      userId: user.id,
      userEmail,
      firstName,
      page: page ? String(page).slice(0, 500) : "unknown",
      action: action?.trim() || "",
      message: message.trim(),
      timestamp,
    }).catch((err: unknown) => {
      console.error("[tester-report] founder email failed:", err);
    });

    res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, "POST /tester-report error");
    res.status(500).json({ error: "Could not submit report. Please try again." });
  }
});

export default router;
