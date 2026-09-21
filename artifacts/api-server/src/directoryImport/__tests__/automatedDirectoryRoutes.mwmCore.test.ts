import { createHash } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerAutomatedDirectoryRoutes } from "../automatedDirectoryRoutes";
import { signDirectoryIngress } from "../reviewPipeline";

const ROOT_HASH = "c2105d31ab2a9d71f9aefae58441d2cd6a6ac6d1c28c6581c5bbcb821e73ef01";
const SIGNING_SECRET = "mwm-core-directory-ingress-test-secret-0001";

afterEach(() => {
  delete process.env.MWM_CORE_PUBLICATION_MODE;
  delete process.env.MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH;
  delete process.env.DIRECTORY_REVIEW_SIGNING_SECRET;
});

function routeApp(pool: { connect: ReturnType<typeof vi.fn> }) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "founder", role: "admin", email: "founder@example.test" } as any;
    req.log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;
    next();
  });
  registerAutomatedDirectoryRoutes(app, pool as any);
  return app;
}

function signedRequestBody(row: Record<string, unknown>) {
  const jsonl = `${JSON.stringify(row)}\n`;
  const checksum = createHash("sha256").update(jsonl).digest("hex");
  const timestamp = String(Date.now());
  const nonce = "mwm-core-route-test-nonce-0001";
  const signature = signDirectoryIngress(jsonl, { timestamp, nonce, checksum }, SIGNING_SECRET);
  return {
    body: { jsonl, manifest: { sourceName: "mwm-core-test", sha256: checksum, rowCount: 1 } },
    headers: {
      "x-directory-timestamp": timestamp,
      "x-directory-nonce": nonce,
      "x-directory-checksum": checksum,
      "x-directory-signature": signature,
    },
  };
}

describe("automated directory MWM Core ingress admission", () => {
  it("rejects an unsigned-cohort row before opening a review database connection", async () => {
    process.env.MWM_CORE_PUBLICATION_MODE = "source_backed";
    process.env.MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH = ROOT_HASH;
    process.env.DIRECTORY_REVIEW_SIGNING_SECRET = SIGNING_SECRET;
    const pool = { connect: vi.fn() };
    const requestPayload = signedRequestBody({
      source_row_id: "unqualified-1",
      name: "Cuisine Is Not Identity Cafe",
      city: "Philadelphia",
      target_kind: "business",
      ownership_designations: ["BIPOC-owned"],
    });

    const response = await request(routeApp(pool))
      .post("/api/founder/directory-import/ingress")
      .set(requestPayload.headers)
      .send(requestPayload.body);

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("MWM_CORE_POLICY_VERSION_REQUIRED");
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it("queues a complete source-reported business without upgrading it to owner verification", async () => {
    process.env.MWM_CORE_PUBLICATION_MODE = "source_backed";
    process.env.MWM_CORE_EXPECTED_RECEIPT_ROOT_HASH = ROOT_HASH;
    process.env.DIRECTORY_REVIEW_SIGNING_SECRET = SIGNING_SECRET;
    const clientQuery = vi.fn(async (sql: string) => {
      if (sql.includes("FROM directory_import_batches")) return { rows: [] };
      if (sql.includes("INSERT INTO directory_import_batches")) return { rows: [{ id: "batch-1" }] };
      if (sql.includes("INSERT INTO directory_import_candidates")) return { rows: [{ id: "candidate-1" }] };
      return { rows: [] };
    });
    const release = vi.fn();
    const pool = {
      connect: vi.fn().mockResolvedValue({ query: clientQuery, release }),
    };
    const requestPayload = signedRequestBody({
      source_row: 1,
      source_row_id: "proven-1",
      name: "Proven Neighborhood Business",
      city: "Philadelphia",
      state: "PA",
      country: "United States",
      target_kind: "business",
      address: "100 Main Street",
      website: "https://proven.example/",
      source_url: "https://approved-directory.example/proven",
      ownership_designations: ["Black-owned"],
      mwm_core_policy_version: "source-receipted-directory-publication-v1",
      mwm_core_cohort: "mwm_chamber_backed_candidate",
      mwm_core_evidence_lane: "chamber",
      mwm_publication_classification: "source_reported_mwm_designation",
      mwm_core_receipt_root_hash: ROOT_HASH,
      mwm_core_receipt_hash: "a".repeat(64),
      mwm_core_source_manifest: "data/founder-imports/proven-review-only-candidates.jsonl",
      mwm_core_source_manifest_sha256: "b".repeat(64),
      mwm_core_source_row: 1,
      mwm_core_source_row_id: "proven-1",
    });

    const response = await request(routeApp(pool))
      .post("/api/founder/directory-import/ingress")
      .set(requestPayload.headers)
      .send(requestPayload.body);

    expect(response.status).toBe(202);
    expect(response.body.counts).toEqual({ auto_ready: 1 });
    const sql = clientQuery.mock.calls.map(([statement]) => String(statement));
    expect(sql.some((statement) => statement.includes("INSERT INTO directory_review_outbox"))).toBe(true);
    expect(sql).toContain("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });
});
