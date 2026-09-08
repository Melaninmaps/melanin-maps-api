import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

import ageAssuranceRouter from "../age-assurance";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.user = { id: "member-1" } as any;
    next();
  });
  app.use("/api", ageAssuranceRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PUT /api/age-assurance", () => {
  it("stores a first adult self-attestation without accepting or returning DOB", async () => {
    poolQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ age_band: "18_plus" }] });

    const response = await supertest(createApp())
      .put("/api/age-assurance")
      .send({ ageBand: "18_plus", attested: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ageBand: "18_plus" });
    expect(JSON.stringify(response.body)).not.toMatch(/birth|dob/i);
    const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("WHERE user_age_assurance.age_band = EXCLUDED.age_band");
    expect(sql).toContain("RETURNING age_band");
    expect(params).toEqual(["member-1", "18_plus"]);
  });

  it.each(["13_15", "16_17", "under_13"])(
    "rejects self-promotion from stored youth band %s to 18_plus",
    async () => {
      // PostgreSQL returns zero rows because the conflict-row WHERE clause does
      // not permit any existing different band to be overwritten.
      poolQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const response = await supertest(createApp())
        .put("/api/age-assurance")
        .send({ ageBand: "18_plus", attested: true });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: "AGE_ASSURANCE_CHANGE_REQUIRES_SUPPORT",
        message: "A saved age-safety range cannot be changed in this self-service flow.",
      });
      expect(poolQuery).toHaveBeenCalledTimes(1);
    },
  );

  it("permits an idempotent repeat of the same saved band", async () => {
    poolQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ age_band: "13_15" }] });

    const response = await supertest(createApp())
      .put("/api/age-assurance")
      .send({ ageBand: "13_15", attested: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, ageBand: "13_15" });
  });

  it("rejects missing attestation before any database call", async () => {
    const response = await supertest(createApp())
      .put("/api/age-assurance")
      .send({ ageBand: "18_plus", attested: false });

    expect(response.status).toBe(400);
    expect(poolQuery).not.toHaveBeenCalled();
  });
});
