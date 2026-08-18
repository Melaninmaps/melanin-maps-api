import { type Express, type Request, type Response } from "express";
import type { Pool } from "pg";

/**
 * Deployment verification endpoints.
 *
 * GET /api/version — public; returns APP_RELEASE_SHA + APP_DEPLOYED_AT with no-store.
 * GET /api/system/schema-status — protected by SCHEMA_STATUS_TOKEN header; returns
 *   applied migration ledger. Returns 404 when token is absent/wrong so the
 *   endpoint is not enumerable.
 *
 * Set APP_RELEASE_SHA, APP_DEPLOYED_AT, and SCHEMA_STATUS_TOKEN in Replit Secrets /
 * Railway environment variables.
 */
export function registerReleaseStatusRoutes(app: Express, db: Pick<Pool, "query">): void {
  app.get("/api/version", (_request: Request, response: Response) => {
    response.setHeader("Cache-Control", "no-store");
    return response.json({
      release: process.env.APP_RELEASE_SHA ?? "unconfigured",
      deployedAt: process.env.APP_DEPLOYED_AT ?? "unconfigured",
    });
  });

  app.get("/api/system/schema-status", async (request: Request, response: Response) => {
    const token = process.env.SCHEMA_STATUS_TOKEN;
    if (!token || request.header("x-schema-status-token") !== token) {
      return response.status(404).end();
    }
    try {
      const { rows } = await db.query<{ filename: string; applied_at: Date }>(
        `SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 20`,
      );
      response.setHeader("Cache-Control", "no-store");
      return response.json({
        release: process.env.APP_RELEASE_SHA ?? "unconfigured",
        migrations: rows,
        expectedDynamicTagMigration: rows.some(
          (row) => row.filename === "20260818_01_schema_compatibility_and_dynamic_tags.sql",
        ),
      });
    } catch {
      // schema_migrations table not yet created — still useful to return version
      response.setHeader("Cache-Control", "no-store");
      return response.json({
        release: process.env.APP_RELEASE_SHA ?? "unconfigured",
        migrations: [],
        expectedDynamicTagMigration: false,
        note: "schema_migrations ledger not yet initialised",
      });
    }
  });
}
