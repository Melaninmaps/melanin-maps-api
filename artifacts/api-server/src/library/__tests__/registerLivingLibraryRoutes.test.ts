import express, { type Express, type Request } from "express";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerLivingLibraryRoutes } from "../registerLivingLibraryRoutes";
import type { LibraryRepository } from "../types";

function createRepository(): LibraryRepository {
  return {
    findReusableEntry: vi.fn(),
    saveEntry: vi.fn(),
    listTopics: vi.fn().mockResolvedValue([]),
    searchPublishedContent: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    findTopicBySlug: vi.fn(),
    listTopicEntries: vi.fn(),
    setTopicFollow: vi.fn(),
  };
}

function createApp(repository: LibraryRepository, userId?: string): Express {
  const app = express();
  app.use(express.json());
  if (userId) {
    app.use((request: Request, _response, next) => {
      (request as Request & { user?: { id: string } }).user = { id: userId };
      next();
    });
  }
  registerLivingLibraryRoutes(app, { repository });
  return app;
}

describe("GET /api/library/search", () => {
  it("returns typed internal results and forwards decoded pagination", async () => {
    const repository = createRepository();
    vi.mocked(repository.searchPublishedContent).mockResolvedValue({
      results: [
        {
          kind: "entry",
          id: "entry-1",
          title: "Starting an HVAC apprenticeship",
          summary: "A reviewed path into the trade.",
          body: "Approved internal Library body.",
          topicSlug: "trades-skills-certifications",
          topicTitle: "Trades, Skills & Certifications",
          sourceCount: 2,
          refreshedAt: new Date("2026-08-20T12:00:00.000Z"),
        },
      ],
      total: 1,
    });

    const response = await supertest(createApp(repository))
      .get("/api/library/search")
      .query({ q: "HVAC", limit: "5" });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.results[0]).toMatchObject({
      kind: "entry",
      id: "entry-1",
      topicSlug: "trades-skills-certifications",
    });
    expect(response.body.clarification.choices).toHaveLength(5);
    expect(repository.searchPublishedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredTopicSlugs: ["trades-skills-certifications"],
        limit: 5,
        offset: 0,
      }),
    );
  });

  it("returns 400 and does not search for malformed query or cursor input", async () => {
    const repository = createRepository();

    const response = await supertest(createApp(repository))
      .get("/api/library/search")
      .query({ q: "hvac", cursor: "bad/cursor" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/cursor is invalid/i);
    expect(repository.searchPublishedContent).not.toHaveBeenCalled();
  });
});

describe("POST /api/library/research", () => {
  it("denies unauthenticated research before any repository write", async () => {
    const repository = createRepository();

    const response = await supertest(createApp(repository))
      .post("/api/library/research")
      .send({ question: "How do I start HVAC training?" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(repository.findReusableEntry).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
  });

  it("acknowledges authenticated research ephemerally without providers or persistence", async () => {
    const repository = createRepository();

    const response = await supertest(createApp(repository, "member-1"))
      .post("/api/library/research")
      .send({ question: "How do I start HVAC training?" });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      code: "LIBRARY_RESEARCH_REVIEW_REQUIRED",
      persisted: false,
      published: false,
    });
    expect(repository.findReusableEntry).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
  });
});
