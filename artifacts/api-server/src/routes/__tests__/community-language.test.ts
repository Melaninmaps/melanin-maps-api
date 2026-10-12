import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

import communityLanguageRouter from "../community-language";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.user = { id: "member-1" } as any;
    next();
  });
  app.use("/api", communityLanguageRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/community-language/proposals", () => {
  it("writes only one pending proposal, never Kinfolk memory, and returns the review disposition", async () => {
    poolQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: "proposal-1",
          term: "jawn",
          meaning: "A flexible word for a person, place, or thing.",
          city: "Philadelphia",
          usage_example: null,
          status: "pending",
          created_at: "2026-10-10T00:00:00.000Z",
        }],
      });

    const response = await supertest(createApp())
      .post("/api/community-language/proposals")
      .send({
        term: "jawn",
        meaning: "A flexible word for a person, place, or thing.",
        city: "Philadelphia",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      proposal: { id: "proposal-1", status: "pending" },
      reviewRequired: true,
      savesToKinfolkMemory: false,
      changesKinfolkAutomatically: false,
    });

    const writeQueries = poolQuery.mock.calls
      .map(([sql]) => sql as string)
      .filter((sql) => /\b(INSERT|UPDATE|DELETE)\b/i.test(sql));
    expect(writeQueries).toHaveLength(1);
    expect(writeQueries[0]).toContain("INSERT INTO community_language_proposals");
    expect(writeQueries[0]).toContain("'pending'");
    expect(writeQueries.join("\n")).not.toMatch(/kinfolk.*memor|memor.*kinfolk/i);
  });
});
