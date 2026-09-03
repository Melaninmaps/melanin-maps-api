import { createHash } from "node:crypto";
import { type Express, type Request, type Response, type RequestHandler } from "express";
import { classifyResearchDomain, type ResearchDomain } from "./researchPolicy";
import { answerAndArchiveResearchQuestion, LibraryEvidenceInsufficientError, researchTopicSlug } from "./livingLibrary";
import { parseLibrarySearchQuery, searchLivingLibrary } from "./librarySearch";
import { LibraryResearchProviderUnavailableError } from "./researchProviderChain";
import type { ExternalResearchProvider, LibraryRepository, LibrarySynthesisWriter } from "./types";

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
    researchProvider: ExternalResearchProvider | null;
    writer: LibrarySynthesisWriter;
    researchLimiter?: RequestHandler;
  },
): void {
  const { repository, researchProvider, writer } = dependencies;
  const researchHandlers: RequestHandler[] = [];
  if (dependencies.researchLimiter) researchHandlers.push(dependencies.researchLimiter);

  app.post("/api/library/research", ...researchHandlers, async (request: AuthenticatedRequest, response: Response) => {
    if (!request.user?.id) return response.status(401).json({ error: "Authentication required" });
    const question = stringBody(request, "question");
    if (!question || question.length < 3) {
      return response.status(400).json({ error: "Ask a Library question using at least three characters." });
    }
    if (question.length > 500) {
      return response.status(400).json({ error: "Library research questions must be 500 characters or fewer." });
    }
    const internalResultCount = Number.isInteger(request.body?.internalResultCount)
      ? Math.max(0, Math.min(100, Number(request.body.internalResultCount)))
      : 0;
    if (!researchProvider) {
      await repository.recordCoverageSignal({
        queryFingerprint: createHash("sha256").update(question.normalize("NFKC").toLowerCase().trim()).digest("hex"),
        domain: classifyResearchDomain(question),
        topicSlug: researchTopicSlug(question, classifyResearchDomain(question)),
        internalResultCount,
        usedLiveResearch: true,
        outcome: "provider_unavailable",
      }).catch(() => undefined);
      return response.status(503).json({
        code: "LIBRARY_RESEARCH_PROVIDER_UNAVAILABLE",
        error: "Live Library research is temporarily unavailable. Your internal results are unchanged; please retry.",
        retryable: true,
        provider: { name: "none", status: "unavailable" },
      });
    }

    try {
      const result = await answerAndArchiveResearchQuestion({
        question,
        locationLabel: stringBody(request, "locationLabel"),
        repository,
        researchProvider,
        writer,
        internalResultCount,
      });
      response.setHeader("Cache-Control", "private, no-store");
      return response.status(200).json({
        answer: result.entry,
        origin: result.origin,
        reused: result.reused,
        persisted: result.origin === "researched" && result.entry.publicationStatus === "pending",
        published: result.entry.publicationStatus === "published",
        provider: {
          name: result.origin === "internal" ? "internal" : result.entry.provider,
          status: result.providerStatus,
          message: result.origin === "internal"
            ? "Approved Library knowledge was reused; no live provider was called."
            : result.providerStatus === "degraded"
                ? "Primary web research was unavailable; a configured fallback supplied the cited research."
                : "Current web research completed. This answer is live and remains pending Library review.",
        },
      });
    } catch (error) {
      if (error instanceof LibraryEvidenceInsufficientError) {
        return response.status(422).json({
          code: "LIBRARY_RESEARCH_INSUFFICIENT_EVIDENCE",
          error: error.message,
          retryable: false,
          provider: { name: researchProvider.name, status: "degraded" },
        });
      }
      console.error("Living Library research provider failed", error);
      const message = error instanceof LibraryResearchProviderUnavailableError
        ? "Live Library research providers are temporarily unavailable. Please retry."
        : "Live Library research could not be completed. Please retry.";
      return response.status(503).json({
        code: "LIBRARY_RESEARCH_PROVIDER_UNAVAILABLE",
        error: message,
        retryable: true,
        provider: { name: researchProvider.name, status: "unavailable" },
      });
    }
  });

  app.get("/api/library/search", async (request: Request, response: Response) => {
    const parsed = parseLibrarySearchQuery(request.query as Record<string, unknown>);
    if (!parsed.ok) return response.status(400).json({ error: parsed.error });
    try {
      response.setHeader("Cache-Control", "no-store");
      return response.status(200).json(await searchLivingLibrary(repository, parsed.value));
    } catch (error) {
      console.error("Living Library search failed", error);
      return response.status(503).json({ error: "The governed Library index is temporarily unavailable. Please try again." });
    }
  });

  app.get("/api/library/topics", async (request: AuthenticatedRequest, response: Response) => {
    const rawDomain = typeof request.query.domain === "string" ? request.query.domain : null;
    const validDomains: ResearchDomain[] = ["medical", "legal", "financial", "education", "stem", "history", "general"];
    const domain = rawDomain && validDomains.includes(rawDomain as ResearchDomain)
      ? rawDomain as ResearchDomain
      : null;
    const topics = await repository.listTopics({
      search: typeof request.query.q === "string" ? request.query.q : null,
      domain,
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

  app.post("/api/library/classify", (request: Request, response: Response) => {
    const question = stringBody(request, "question") || "";
    return response.json({ domain: classifyResearchDomain(question) });
  });
}
