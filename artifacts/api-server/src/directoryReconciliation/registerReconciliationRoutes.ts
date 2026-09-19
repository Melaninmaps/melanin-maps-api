import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { reconcileExistingDirectory, type ExistingDirectoryRow } from "./reconcileExistingDirectory";

export function registerReconciliationRoutes(app: Express): void {
  app.post("/api/admin/directory-reconciliation", async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!isAdmin(req)) return res.status(403).json({ error: "Admin access required" });
    const mode = req.body?.mode === "apply" ? "apply" : "dry-run";
    const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : undefined;
    try {
      const result = await pool.query<ExistingDirectoryRow>(`
        SELECT id, name, city, state, country, address, website, source_url AS "sourceUrl",
               phone, latitude, longitude, verified, owner_claim_status AS "ownerClaimStatus",
               created_at AS "createdAt"
          FROM businesses
         WHERE COALESCE(status, 'active') = 'active'
      `);
      return res.json(await reconcileExistingDirectory(pool, result.rows, mode, jobId));
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Reconciliation failed" });
    }
  });
}