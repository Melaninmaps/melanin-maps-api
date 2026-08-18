import { type Express, type Request, type Response } from "express";
import { answerAndArchiveResearchQuestion } from "./livingLibrary";
import { classifyResearchDomain, type ResearchDomain } from "./researchPolicy";
import type {
  ExternalResearchProvider,
  LibraryRepository,
  LibrarySynthesisWriter,
} from "./types";

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
    researchProvider: ExternalResearchProvider;
    writer: LibrarySynthesisWriter;
  },
): void {
  const { repository, researchProvider, writer } = dependencies;

  app.post("/api/library/research", async (request: Request, response: Response) => {
    try {
      const question = stringBody(request, "question");
      if (!question || question.length < 3) {
        return response.status(400).json({ error: "Ask a Library question using at least three characters." });
      }

      const { entry, reused } = await answerAndArchiveResearchQuestion({
        question,
        locationLabel: stringBody(request, "locationLabel"),
        repository,
        researchProvider,
        writer,
      });

      return response.status(200).json({
        entry,
        reused,
        libraryUrl: `/library/topics/${encodeURIComponent(entry.domain)}#entry-${entry.id}`,
      });
    } catch (error) {
      console.error("Living Library research failed", error);
      return response.status(502).json({
        error: "Kinfolk could not complete a source-verified research entry right now. Please try again.",
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
    const topic = await repository.findTopicBySlug(request.params.slug);
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
      await repository.setTopicFollow({ topicId: request.params.topicId, memberId, following });
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
