import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { databaseSelect, databaseInsert, openaiCreate } = vi.hoisted(() => ({
  databaseSelect: vi.fn(),
  databaseInsert: vi.fn(),
  openaiCreate: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: {
    select: databaseSelect,
    insert: databaseInsert,
  },
  pool: { query: vi.fn() },
  lifeJourneysTable: {
    userId: "user_id",
    status: "status",
    updatedAt: "updated_at",
  },
  businessesTable: {
    name: "name",
    category: "category",
    verified: "verified",
    phone: "phone",
    website: "website",
    status: "status",
    blackOwned: "black_owned",
  },
}));

vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: { chat: { completions: { create: openaiCreate } } },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conditions: unknown[]) => ({ kind: "and", conditions })),
  desc: vi.fn((column: unknown) => ({ kind: "desc", column })),
  eq: vi.fn((column: unknown, value: unknown) => ({ kind: "eq", column, value })),
}));

import journeysRouter from "../journeys";

function createApp(userId: string | null) {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (userId) request.user = { id: userId } as Request["user"];
    request.log = { error: vi.fn() } as never;
    next();
  });
  app.use("/api", journeysRouter);
  return app;
}

function expectNoJourneyWork() {
  expect(databaseSelect).not.toHaveBeenCalled();
  expect(databaseInsert).not.toHaveBeenCalled();
  expect(openaiCreate).not.toHaveBeenCalled();
}

describe("legacy Life Journey free-text boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps direct Journey creation unauthenticated without database or provider activity", async () => {
    const response = await supertest(createApp(null))
      .post("/api/journeys")
      .send({ journeyType: "moving", description: "Synthetic private relocation detail" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expectNoJourneyWork();
  });

  it("rejects every supplied legacy description before catalog, provider, or Journey persistence", async () => {
    for (const description of ["Synthetic private relocation detail", ""]) {
      const response = await supertest(createApp("member-a"))
        .post("/api/journeys")
        .send({
          journeyType: "not-a-template",
          city: "Synthetic City",
          description,
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: "Journey descriptions require an explicit private-storage consent flow that is not available yet.",
        errorEs: "Las descripciones de Journey requieren un flujo de consentimiento explícito para almacenamiento privado que aún no está disponible.",
        code: "JOURNEY_LEGACY_DESCRIPTION_CONSENT_REQUIRED",
      });
      expect(JSON.stringify(response.body)).not.toContain("Synthetic private relocation detail");
      expectNoJourneyWork();
    }
  });

  it("rejects arbitrary selected-needs text before catalog, provider, or Journey persistence", async () => {
    const response = await supertest(createApp("member-a"))
      .post("/api/journeys")
      .send({
        journeyType: "moving",
        selectedNeeds: "Synthetic private relocation narrative",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Choose only the listed help areas for this Journey.",
      errorEs: "Elige solo las áreas de ayuda indicadas para este Journey.",
      code: "JOURNEY_SELECTED_NEEDS_INVALID",
    });
    expect(JSON.stringify(response.body)).not.toContain("Synthetic private relocation narrative");
    expectNoJourneyWork();
  });
});
