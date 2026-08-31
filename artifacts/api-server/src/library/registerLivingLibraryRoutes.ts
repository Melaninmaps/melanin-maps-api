import { type Express, type Request, type Response } from "express";
import { classifyResearchDomain, type ResearchDomain } from "./researchPolicy";
import {
  parseLibrarySearchQuery,
  searchLivingLibrary,
} from "./librarySearch";
import type { LibraryRepository } from "./types";

type AuthenticatedRequest = Request & { user?: { id: string } };

function requireMemberId(request: AuthenticatedRequest): string {
  if (!request.user?.id) throw new Error("Sign in is required to follow Library topics.");
  return request.user.id;
}

function stringBody(request: Request, key: string): string | null {
  const value = request.body?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function registerLivingLibraryRoutes(
  app: Express,
  dependencies: {
    repository: LibraryRepository;
  },
): void {
  const { repository } = dependencies;

  app.post("/api/library/research", (request: AuthenticatedRequest, response: Response) => {
    if (!request.user?.id) {
      return response.status(401).json({ error: "Authentication required" });
    }
    const question = stringBody(request, "question");
    if (!question || question.length < 3) {
      return response.status(400).json({ error: "Ask a Library question using at least three characters." });
    }
    // Until a review and publication lifecycle exists, acknowledge the member request
    // without invoking a provider or storing the raw question anywhere.
    return response.status(202).json({
      code: "LIBRARY_RESEARCH_REVIEW_REQUIRED",
      message:
        "New Library research is temporarily unavailable while a governed review lifecycle is completed. Nothing was published.",
      persisted: false,
      published: false,
    });
  });

  app.get("/api/library/search", async (request: Request, response: Response) => {
    const parsed = parseLibrarySearchQuery(request.query as Record<string, unknown>);
    if (!parsed.ok) return response.status(400).json({ error: parsed.error });
    try {
      response.setHeader("Cache-Control", "no-store");
      return response.status(200).json(await searchLivingLibrary(repository, parsed.value));
    } catch (error) {
      console.error("Living Library search failed", error);
      return response.status(503).json({
        error: "The governed Library index is temporarily unavailable. Please try again.",
      });
    }
  });

  app.get("/api/library/topics", async (request: AuthenticatedRequest, response: Response) => {
    const domain = stringBody(request, "domain") as ResearchDomain | null;
    const validDomains: ResearchDomain[] = [
      "medical",
      "legal",
      "financial",
      "education",
      "stem",
      "history",
      "general",
    ];
    const topics = await repository.listTopics({
      search: typeof request.query.q === "string" ? request.query.q : null,
      domain: domain && validDomains.includes(domain) ? domain : null,
      memberId: request.user?.id ?? null,
    });
    return response.json({ topics });
  });

  app.get("/api/library/topics/:slug", async (request: Request, response: Response) => {
    const rawSlug = request.params.slug;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] ?? "" : rawSlug;
    const topic = await repository.findTopicBySlug(slug);
    if (!topic) return response.status(404).json({ error: "Library topic not found." });
    const entries = await repository.listTopicEntries({
      topicId: topic.id,
      limit: 20,
      cursor: typeof request.query.cursor === "string" ? request.query.cursor : null,
    });
    return response.json({ topic, entries });
  });

  app.post("/api/library/topics/:topicId/follow", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const memberId = requireMemberId(request);
      const following = Boolean(request.body?.following);
      const rawTopicId = request.params.topicId;
      const topicId = Array.isArray(rawTopicId) ? rawTopicId[0] ?? "" : rawTopicId;
      await repository.setTopicFollow({ topicId, memberId, following });
      return response.status(200).json({ following });
    } catch (error) {
      return response.status(401).json({ error: error instanceof Error ? error.message : "Unable to update follow." });
    }
  });

  // Optional helper for Kinfolk: classify an in-progress question before the
  // client decides whether to show a Library-read-more link.
  app.post("/api/library/classify", (request: Request, response: Response) => {
    const question = stringBody(request, "question") || "";
    return response.json({ domain: classifyResearchDomain(question) });
  });
}
