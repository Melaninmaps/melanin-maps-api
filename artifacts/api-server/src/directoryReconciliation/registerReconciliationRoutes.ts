import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { authorizeDirectoryOperator } from "../directoryImport/directoryServiceAuth";
import { reconcileExistingDirectory, type ExistingDirectoryRow } from "./reconcileExistingDirectory";

export function registerReconciliationRoutes(app: Express): void {
  app.post("/api/admin/directory-reconciliation", async (req: Request, res: Response) => {
    const authorization = authorizeDirectoryOperator(req);
    if (!authorization.ok) {
      return res.status(authorization.status).json({ error: authorization.error });
    }
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