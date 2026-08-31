/**
 * Admin Audit Routes
 *
 * Two endpoints that enable Manus (or any authorized auditor) to run a
 * controlled 30-user load test against production without touching real
 * member data:
 *
 *   POST /api/admin/provision-audit-user
 *     Creates a disposable email+password account tagged as a test user.
 *     Returns credentials once — they are not stored in plaintext.
 *     The account has role="member", no community data, no payment methods.
 *
 *   POST /api/admin/audit-logs-export
 *     Queries Railway deployment logs for lines that contain a given
 *     X-Audit-Session marker string. Returns structured JSON log entries
 *     so the auditor can verify queue saturation, KINFOLK_BUSY events,
 *     retry-after behavior, pool health, and any route errors.
 *
 * Both endpoints require an authenticated admin session.
 */

import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";

const router = Router();

// ── Provision disposable audit user ─────────────────────────────────────────

router.post("/admin/provision-audit-user", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const ts = Date.now();
    const email = `manus-audit-${ts}@melaninmaps.com`;
    const rawPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const userId = `audit_${crypto.randomBytes(12).toString("hex")}`;
    const username = `audit_tester_${ts}`;
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Insert directly via pool.query (Drizzle can silently fail for inserts in
    // esbuild bundles — see pool-query-pattern memory note).
    await pool.query(
      `INSERT INTO users (
        id, email, "firstName", "lastName", username,
        "passwordHash", "emailVerified", "agreeToTerms",
        role, "memberType", approved,
        "referralCode", "isPrivate",
        "profileSetupComplete", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, true, true,
        'member', 'basic', true,
        $7, false,
        false, NOW(), NOW()
      )`,
      [userId, email, "Audit", "Tester", username, passwordHash, referralCode],
    );

    // Return credentials once — caller must store them securely.
    // The plaintext password is never persisted.
    res.json({
      ok: true,
      userId,
      email,
      password: rawPassword,
      username,
      note: [
        "Disposable account — role=member, no community data, no payment methods.",
        "Password returned exactly once. Store it before this response is lost.",
        "Delete with DELETE /api/admin/audit-user/:userId when the audit is complete.",
        "Include 'X-Audit-Session: <your-session-id>' on every audit request to tag logs.",
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to provision audit user", detail: msg });
  }
});

// ── Delete disposable audit user ─────────────────────────────────────────────

router.delete("/admin/audit-user/:userId", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rawUserId = req.params.userId;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] ?? "" : rawUserId;

  // Safety: only allow deletion of accounts with the audit_ prefix.
  if (!userId.startsWith("audit_")) {
    res.status(400).json({ error: "Only audit_ accounts can be deleted via this endpoint." });
    return;
  }

  try {
    // Remove sessions first, then the user row.
    await pool.query(`DELETE FROM sessions WHERE sess->>'userId' = $1`, [userId]);
    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id, email`, [userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Audit user not found." });
      return;
    }

    res.json({ ok: true, deleted: result.rows[0] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to delete audit user", detail: msg });
  }
});

// ── Audit log export ─────────────────────────────────────────────────────────

const RAILWAY_GRAPHQL = "https://backboard.railway.app/graphql/v2";
const SERVICE_ID = "a77b49bb-e448-4be8-9d02-de7a3b43136b";
const ENVIRONMENT_ID = "2292b38f-3d0d-4cad-92a4-ad36cabda629";

/**
 * POST /api/admin/audit-logs-export
 * Body: { auditSession: string, maxLines?: number }
 *
 * Fetches the most-recent Railway deployment's logs, then filters to lines
 * that contain the provided auditSession marker string. Returns structured
 * JSON so the auditor can verify queue saturation, KINFOLK_BUSY events,
 * retry-after, pool health, and any route errors.
 */
router.post("/admin/audit-logs-export", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { auditSession, maxLines = 2000 } = req.body as {
    auditSession?: string;
    maxLines?: number;
  };

  if (!auditSession || typeof auditSession !== "string") {
    res.status(400).json({ error: "'auditSession' string is required." });
    return;
  }

  const token = process.env.RAILWAY_ACCOUNT_TOKEN;
  if (!token) {
    res.status(503).json({ error: "RAILWAY_ACCOUNT_TOKEN not configured on this server." });
    return;
  }

  try {
    // Step 1: find the most recently successful deployment ID.
    const deplResult = await fetch(RAILWAY_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        query: `{
          deployments(input: { serviceId: "${SERVICE_ID}", environmentId: "${ENVIRONMENT_ID}" }, first: 1) {
            edges { node { id status createdAt } }
          }
        }`,
      }),
    });
    const deplJson = (await deplResult.json()) as {
      data?: { deployments?: { edges: Array<{ node: { id: string; status: string } }> } };
    };
    const deploymentId = deplJson.data?.deployments?.edges?.[0]?.node?.id;
    if (!deploymentId) {
      res.status(502).json({ error: "Could not resolve current Railway deployment ID." });
      return;
    }

    // Step 2: fetch deployment logs (Railway streams NDJSON; we collect up to maxLines).
    // The Railway REST log endpoint returns newline-delimited JSON objects.
    const logsResult = await fetch(
      `https://backboard.railway.app/graphql/v2`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: `{
            deploymentLogs(deploymentId: "${deploymentId}", filter: "${auditSession.replace(/"/g, "\\\"")}", limit: ${Math.min(Number(maxLines), 5000)}) {
              timestamp
              message
              severity
            }
          }`,
        }),
      },
    );

    const logsJson = (await logsResult.json()) as {
      data?: { deploymentLogs?: Array<{ timestamp: string; message: string; severity: string }> };
      errors?: Array<{ message: string }>;
    };

    if (logsJson.errors?.length) {
      res.status(502).json({ error: "Railway log query failed", detail: logsJson.errors });
      return;
    }

    const rawLines = logsJson.data?.deploymentLogs ?? [];

    // Step 3: parse each log line as JSON where possible, keep raw string otherwise.
    const parsed = rawLines.map((entry) => {
      try {
        return { ...entry, parsed: JSON.parse(entry.message) };
      } catch {
        return { ...entry, parsed: null };
      }
    });

    // Step 4: compute a lightweight audit summary.
    const summary = {
      totalLines: parsed.length,
      kinfolkBusyCount: parsed.filter((l) =>
        l.message.includes("KINFOLK_BUSY"),
      ).length,
      retryAfterCount: parsed.filter((l) =>
        l.message.includes("retry-after") || l.message.includes("retryAfter"),
      ).length,
      poolWarningCount: parsed.filter((l) =>
        l.message.includes("pool") && l.severity === "ERROR",
      ).length,
      routeErrorCount: parsed.filter((l) => {
        const p = l.parsed as Record<string, unknown> | null;
        return p && typeof p.statusCode === "number" && p.statusCode >= 500;
      }).length,
      queueSaturationLines: parsed
        .filter((l) => l.message.includes("queue") || l.message.includes("MAX_ACTIVE"))
        .map((l) => ({ timestamp: l.timestamp, message: l.message })),
    };

    res.json({
      ok: true,
      deploymentId,
      auditSession,
      summary,
      logs: parsed,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Audit log export failed", detail: msg });
  }
});

export default router;
