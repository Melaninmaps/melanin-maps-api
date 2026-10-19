import express, { type Express, type Request } from "express";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerLivingLibraryRoutes } from "../registerLivingLibraryRoutes";
import type { ExternalResearchProvider, LibraryEntry, LibraryRepository, LibrarySynthesisWriter } from "../types";

function approvedEntry(overrides: Partial<LibraryEntry> = {}): LibraryEntry {
  return {
    id: "entry-1",
    topicId: "topic-1",
    question: "How do I start HVAC training?",
    normalizedQuestion: "how do i start hvac training",
    title: "Starting an HVAC apprenticeship",
    summary: "A reviewed path into the trade.",
    body: "Approved internal Library body.",
    domain: "education",
    communityLens: "African diaspora and historically marginalized communities (editorial perspective; no member identity inferred)",
    locationLabel: null,
    disclaimer: null,
    sourceCount: 2,
    sources: [
      { id: "1", url: "https://www.dol.gov/source", title: "Department of Labor", publisher: "dol.gov", excerpt: "A".repeat(200), sourceTier: "primary", publishedAt: null, retrievedAt: new Date("2026-09-01") },
      { id: "2", url: "https://www.ed.gov/source", title: "Department of Education", publisher: "ed.gov", excerpt: "B".repeat(200), sourceTier: "primary", publishedAt: null, retrievedAt: new Date("2026-09-01") },
    ],
    relatedQuestions: ["Which certifications are useful?"],
    publicationStatus: "published",
    provider: "internal",
    createdAt: new Date("2026-08-20"),
    refreshedAt: new Date("2026-09-01"),
    ...overrides,
  };
}

function createRepository(): LibraryRepository {
  return {
    findReusableEntry: vi.fn().mockResolvedValue(null),
    saveEntry: vi.fn(async (input) => approvedEntry({ ...input, id: "candidate-1", publicationStatus: "pending", createdAt: new Date(), refreshedAt: new Date() })),
    recordCoverageSignal: vi.fn().mockResolvedValue(undefined),
    listTopics: vi.fn().mockResolvedValue([]),
    searchPublishedContent: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    findTopicBySlug: vi.fn(),
    listTopicEntries: vi.fn(),
    setTopicFollow: vi.fn(),
  };
}

function provider(documents = [
  { url: "https://www.dol.gov/source", title: "DOL", content: "A".repeat(220), publisher: "dol.gov", publishedAt: null },
  { url: "https://www.ed.gov/source", title: "Education", content: "B".repeat(220), publisher: "ed.gov", publishedAt: null },
]): ExternalResearchProvider {
  return { name: "openai", search: vi.fn().mockResolvedValue({ documents, provider: "openai", status: "available" }) };
}

function writer(): LibrarySynthesisWriter {
  return { writeStructured: vi.fn().mockResolvedValue({ title: "Current HVAC paths", summary: "A concise cited overview.", body: "A longer source-grounded explanation.", citedSourceIndexes: [0, 1], sourceNotes: [{ sourceIndex: 0, whyItMatters: "It explains federal apprenticeship resources." }, { sourceIndex: 1, whyItMatters: "It explains education requirements." }], relatedQuestions: ["Which certifications matter?"] }) };
}

function createApp(repository: LibraryRepository, options: { userId?: string; researchProvider?: ExternalResearchProvider | null; synthesisWriter?: LibrarySynthesisWriter } = {}): Express {
  const app = express(); app.use(express.json());
  if (options.userId) app.use((request: Request, _response, next) => { request.user = { id: options.userId! } as Request["user"]; next(); });
  registerLivingLibraryRoutes(app, { repository, researchProvider: options.researchProvider === undefined ? provider() : options.researchProvider, writer: options.synthesisWriter ?? writer() });
  return app;
}

describe("GET /api/library/search", () => {
  it("returns approved internal entries first with safe source metadata", async () => {
    const repository = createRepository();
    vi.mocked(repository.searchPublishedContent).mockResolvedValue({ results: [{ kind: "entry", id: "entry-1", title: "Starting HVAC", summary: "A reviewed path.", body: "Approved body.", topicSlug: "trades-skills-certifications", topicTitle: "Trades", sourceCount: 2, sources: [{ url: "https://www.dol.gov/source", title: "DOL", publisher: "dol.gov" }], refreshedAt: new Date("2026-08-20T12:00:00.000Z") }], total: 1 });
    const response = await supertest(createApp(repository)).get("/api/library/search").query({ q: "HVAC", limit: "5" });
    expect(response.status).toBe(200);
    expect(response.body.results[0]).toMatchObject({ kind: "entry", id: "entry-1", sourceCount: 2 });
    expect(response.body.webResearch.status).toBe("not_needed");
    expect(response.body.clarification.choices).toHaveLength(5);
    expect(response.body.libraryPurposeConsent).toMatchObject({
      purpose: "library_saved_context",
      controlsSavedContextAugmentation: true,
      controlsRankingPersonalization: true,
    });
  });

  it("marks a zero-entry HVAC foundation as sparse and researchable", async () => {
    const repository = createRepository();
    vi.mocked(repository.searchPublishedContent).mockResolvedValue({ results: [{ kind: "topic", id: "topic-1", slug: "trades-skills-certifications", title: "Trades", summary: "Skills", iconKey: "home-services", entryCount: 0 }], total: 1 });
    const response = await supertest(createApp(repository)).get("/api/library/search").query({ q: "HVAC" });
    expect(response.body.results[0].entryCount).toBe(0);
    expect(response.body.webResearch.status).toBe("available");
  });
});

describe("Library fresh-research allowance boundary", () => {
  it("denies unauthenticated preflight before provider or persistence", async () => {
    const repository = createRepository(); const researchProvider = provider();
    const response = await supertest(createApp(repository, { researchProvider }))
      .post("/api/library/research/preflight")
      .send({ question: "How do I start HVAC training?" });
    expect(response.status).toBe(401);
    expect(researchProvider.search).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
  });

  it("reuses approved internal knowledge during preflight or direct retrieval without an allowance or provider", async () => {
    const repository = createRepository(); const researchProvider = provider();
    vi.mocked(repository.findReusableEntry).mockResolvedValue(approvedEntry());
    const app = createApp(repository, { userId: "member-1", researchProvider });
    const preflight = await supertest(app)
      .post("/api/library/research/preflight")
      .send({ question: "How do I start HVAC training?" });
    expect(preflight.status).toBe(200);
    expect(preflight.body).toMatchObject({
      status: "approved_content",
      allowance: { used: 0, charged: false },
      result: { origin: "internal", reused: true, provider: { name: "internal" } },
    });
    const response = await supertest(app)
      .post("/api/library/research")
      .send({ question: "How do I start HVAC training?" });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ origin: "internal", reused: true, published: true, persisted: false, provider: { name: "internal" } });
    expect(researchProvider.search).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
    expect(repository.recordCoverageSignal).not.toHaveBeenCalled();
  });

  it("requires an explicit confirmation for a fresh request but never invokes a provider without the ledger", async () => {
    const repository = createRepository(); const researchProvider = provider();
    const app = createApp(repository, { userId: "member-1", researchProvider });
    const unconfirmed = await supertest(app)
      .post("/api/library/research")
      .send({ question: "How do I start HVAC training?" });
    expect(unconfirmed.status).toBe(409);
    expect(unconfirmed.body).toMatchObject({ code: "LIBRARY_RESEARCH_CONFIRMATION_REQUIRED", confirmationRequired: true });
    const confirmed = await supertest(app)
      .post("/api/library/research")
      .send({ question: "How do I start HVAC training?", confirmFreshResearch: true });
    expect(confirmed.status).toBe(503);
    expect(confirmed.body).toMatchObject({
      code: "LIBRARY_RESEARCH_LEDGER_UNAVAILABLE",
      usesKinfolkAiAllowance: true,
      confirmationRequired: true,
    });
    expect(researchProvider.search).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
    expect(repository.recordCoverageSignal).not.toHaveBeenCalled();
  });

  it("returns the same fail-closed result from preflight when approved content is absent", async () => {
    const repository = createRepository(); const researchProvider = provider();
    const response = await supertest(createApp(repository, { userId: "member-1", researchProvider }))
      .post("/api/library/research/preflight")
      .send({ question: "What treatment helps high blood pressure?" });
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ code: "LIBRARY_RESEARCH_LEDGER_UNAVAILABLE", retryable: false });
    expect(researchProvider.search).not.toHaveBeenCalled();
    expect(repository.saveEntry).not.toHaveBeenCalled();
  });
});
