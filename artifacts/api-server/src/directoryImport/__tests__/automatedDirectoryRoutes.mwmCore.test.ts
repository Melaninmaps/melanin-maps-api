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
});
