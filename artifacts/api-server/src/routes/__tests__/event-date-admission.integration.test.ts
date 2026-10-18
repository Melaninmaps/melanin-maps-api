import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  dbInsert: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: { insert: harness.dbInsert },
  eventsTable: {},
  savedCommunityLocationsTable: {},
  notificationsTable: {},
  userPreferencesTable: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  ilike: vi.fn(),
  isNotNull: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
}));

vi.mock("../../middleware/requireMembership", () => ({
  getUserTier: vi.fn(async () => "trailblazer"),
}));

import eventsRouter from "../events";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    (request as any).user = { id: "ordinary-event-host" };
    (request as any).log = { error: vi.fn() };
    next();
  });
  app.use("/api", eventsRouter);
  return app;
}

function eventPayload(date: unknown) {
  return {
    title: "Community Dinner",
    city: "Philadelphia",
    state: "PA",
    date,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("event date admission", () => {
  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["non-string", false],
    ["malformed", "February 30, 2027"],
    ["past", "1900-01-01"],
  ])("rejects %s event dates before persistence", async (_label, date) => {
    const response = await supertest(createApp())
      .post("/api/events")
      .send(eventPayload(date));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "A valid upcoming event date is required",
      code: "INVALID_EVENT_DATE",
    });
    expect(harness.dbInsert).not.toHaveBeenCalled();
  });
});
