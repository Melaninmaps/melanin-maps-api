import { createHash } from "node:crypto";
import {
  type Express,
  type Request,
  type Response,
  type RequestHandler,
} from "express";
import { db, userPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  classifyResearchDomain,
  getLibraryResearchScope,
  type ResearchDomain,
} from "./researchPolicy";
import {
  answerAndArchiveResearchQuestion,
  LibraryEvidenceInsufficientError,
  researchTopicSlug,
} from "./livingLibrary";
import { parseLibrarySearchQuery, searchLivingLibrary } from "./librarySearch";
import { LibraryResearchProviderUnavailableError } from "./researchProviderChain";
import {
  applySavedMemberResearchContext,
  libraryPurposeConsent,
} from "../kinfolk/saved-member-research-context";
import type {
  ExternalResearchProvider,
  LibraryRepository,
  LibrarySynthesisWriter,
} from "./types";

type AuthenticatedRequest = Request & { user?: { id: string } };

function requireMemberId(request: AuthenticatedRequest): string {
  if (!request.user?.id)
    throw new Error("Sign in is required to follow Library topics.");
  return request.user.id;
}

function stringBody(request: Request, key: string): string | null {
  const value = request.body?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizedMemberContext(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.normalize("NFKC").trim())
        .filter((item) => item.length >= 2 && item.length <= 100),
    ),
  ].slice(0, 25);
}

async function applyMemberLibraryDefaultContext(input: {
  memberId: string;
  question: string;
}): Promise<{ question: string; appliedTags: string[]; consentGranted: boolean }> {
  try {
    const [preferences] = await db
      .select({
        communities: userPreferencesTable.communities,
        cultures: userPreferencesTable.cultures,
        useMemberContextByDefault: userPreferencesTable.useMemberContextByDefault,
      })
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, input.memberId))
      .limit(1);
    const applied = applySavedMemberResearchContext({
      question: input.question,
      preferences,
    });
    return {
      ...applied,
      consentGranted: libraryPurposeConsent(preferences ?? null).granted,
    };
  } catch {
    // Context access must never block a general Library answer.
    return { question: input.question, appliedTags: [], consentGranted: false };
  }
}

async function setMemberLibraryPurposeConsent(
  memberId: string,
  granted: boolean,
): Promise<void> {
  await db
    .insert(userPreferencesTable)
    .values({
      userId: memberId,
      useMemberContextByDefault: granted,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferencesTable.userId,
      set: {
        useMemberContextByDefault: granted,
        updatedAt: new Date(),
      },
    });
}

async function memberLibraryRankingContext(
  memberId: string | undefined,
): Promise<{ consentGranted: boolean; values: string[] }> {
  if (!memberId) return { consentGranted: false, values: [] };
  try {
    const [preferences] = await db
      .select({
        communities: userPreferencesTable.communities,
        cultures: userPreferencesTable.cultures,
        preferredLanguages: userPreferencesTable.preferredLanguages,
        useMemberContextByDefault: userPreferencesTable.useMemberContextByDefault,
      })
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, memberId))
      .limit(1);
    const consent = libraryPurposeConsent(preferences ?? null);
    if (!consent.granted) return { consentGranted: false, values: [] };
    return { consentGranted: true, values: normalizedMemberContext([
      ...(preferences?.communities ?? []),
      ...(preferences?.cultures ?? []),
      ...(preferences?.preferredLanguages ?? []),
    ]) };
  } catch {
    // A missing or unavailable preference row must never block Library access.
    return { consentGranted: false, values: [] };
  }
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
  if (dependencies.researchLimiter)
    researchHandlers.push(dependencies.researchLimiter);

  app.get(
    "/api/library/context-consent",
    async (request: AuthenticatedRequest, response: Response) => {
      if (!request.user?.id) {
        return response.status(401).json({ error: "Authentication required" });
      }
      const rankingContext = await memberLibraryRankingContext(request.user.id);
      response.setHeader("Cache-Control", "private, no-store");
      return response.status(200).json({
        granted: rankingContext.consentGranted,
        purpose: "library_saved_context",
        controlsSavedContextAugmentation: true,
        controlsRankingPersonalization: true,
      });
    },
  );

  app.put(
    "/api/library/context-consent",
    async (request: AuthenticatedRequest, response: Response) => {
      if (!request.user?.id) {
        return response.status(401).json({ error: "Authentication required" });
      }
      if (typeof request.body?.granted !== "boolean") {
        return response.status(400).json({ error: "Consent must be true or false." });
      }
      try {
        await setMemberLibraryPurposeConsent(request.user.id, request.body.granted);
        response.setHeader("Cache-Control", "private, no-store");
        return response.status(200).json({
          granted: request.body.granted,
          purpose: "library_saved_context",
          controlsSavedContextAugmentation: true,
          controlsRankingPersonalization: true,
        });
      } catch (error) {
        console.error("Unable to update Library-purpose context consent", error);
        return response.status(503).json({
          error: "Library context consent could not be updated. Please retry.",
        });
      }
    },
  );

  app.post(
    "/api/library/research",
    ...researchHandlers,
    async (request: AuthenticatedRequest, response: Response) => {
      if (!request.user?.id)
        return response.status(401).json({ error: "Authentication required" });
      const question = stringBody(request, "question");
      if (!question || question.length < 3) {
        return response
          .status(400)
          .json({
            error: "Ask a Library question using at least three characters.",
          });
      }
      if (question.length > 500) {
        return response
          .status(400)
          .json({
            error:
              "Library research questions must be 500 characters or fewer.",
          });
      }
      const internalResultCount = Number.isInteger(
        request.body?.internalResultCount,
      )
        ? Math.max(0, Math.min(100, Number(request.body.internalResultCount)))
        : 0;
      const memberContext = await applyMemberLibraryDefaultContext({
        memberId: request.user.id,
        question,
      });
      const libraryPurposeConsentStatus = {
        granted: memberContext.consentGranted,
        purpose: "library_saved_context" as const,
        controlsSavedContextAugmentation: true,
        controlsRankingPersonalization: true,
      };
      const effectiveQuestion = memberContext.question;
      const researchScope = getLibraryResearchScope(effectiveQuestion);
      if (!researchProvider) {
        await repository
          .recordCoverageSignal({
            queryFingerprint: createHash("sha256")
              .update(effectiveQuestion.normalize("NFKC").toLowerCase().trim())
              .digest("hex"),
            domain: classifyResearchDomain(effectiveQuestion),
            topicSlug: researchTopicSlug(
              effectiveQuestion,
              classifyResearchDomain(effectiveQuestion),
            ),
            internalResultCount,
            usedLiveResearch: true,
            outcome: "provider_unavailable",
          })
          .catch(() => undefined);
        return response.status(503).json({
          code: "LIBRARY_RESEARCH_PROVIDER_UNAVAILABLE",
          error:
            "Live Library research is temporarily unavailable. Your internal results are unchanged; please retry.",
          retryable: true,
          provider: { name: "none", status: "unavailable" },
          researchScope,
          memberContextApplied: memberContext.appliedTags,
          libraryPurposeConsent: libraryPurposeConsentStatus,
        });
      }

      try {
        const result = await answerAndArchiveResearchQuestion({
          question: effectiveQuestion,
          locationLabel: stringBody(request, "locationLabel"),
          repository,
          researchProvider,
          writer,
          internalResultCount,
        });
        response.setHeader("Cache-Control", "private, no-store");
        return response.status(200).json({
          // `answer` remains the compatibility field and is always the general
          // authoritative foundation. A direct-evidence community packet is
          // additive and never relabels the foundation's citations.
          answer: result.entry,
          foundation: result.foundation,
          communityContext: result.communityContext,
          origin: result.origin,
          reused: result.reused,
          persisted:
            result.origin === "researched" &&
            result.entry.publicationStatus === "pending",
          published: result.entry.publicationStatus === "published",
          provider: {
            name:
              result.origin === "internal" ? "internal" : result.entry.provider,
            status: result.providerStatus,
            message:
              result.origin === "internal"
                ? "Approved Library knowledge was reused; no live provider was called."
                : result.entry.publicationStatus === "published"
                  ? "Current source-governed research completed and is now available for the next reader."
                  : result.providerStatus === "degraded"
                  ? "Primary web research was unavailable; a configured fallback supplied the cited research."
                  : "Current research completed for this response. It remains private until it clears the reusable Library gate.",
          },
          researchScope,
          memberContextApplied: memberContext.appliedTags,
          libraryPurposeConsent: libraryPurposeConsentStatus,
        });
      } catch (error) {
        if (error instanceof LibraryEvidenceInsufficientError) {
          return response.status(422).json({
            code: "LIBRARY_RESEARCH_INSUFFICIENT_EVIDENCE",
            error: error.message,
            retryable: false,
            provider: { name: researchProvider.name, status: "degraded" },
            researchScope,
            memberContextApplied: memberContext.appliedTags,
            libraryPurposeConsent: libraryPurposeConsentStatus,
          });
        }
        console.error("Living Library research provider failed", error);
        const message =
          error instanceof LibraryResearchProviderUnavailableError
            ? "Live Library research providers are temporarily unavailable. Please retry."
            : "Live Library research could not be completed. Please retry.";
        return response.status(503).json({
          code: "LIBRARY_RESEARCH_PROVIDER_UNAVAILABLE",
          error: message,
          retryable: true,
          provider: { name: researchProvider.name, status: "unavailable" },
          researchScope,
          memberContextApplied: memberContext.appliedTags,
          libraryPurposeConsent: libraryPurposeConsentStatus,
        });
      }
    },
  );

  app.get(
    "/api/library/search",
    async (request: AuthenticatedRequest, response: Response) => {
      const parsed = parseLibrarySearchQuery(
        request.query as Record<string, unknown>,
      );
      if (!parsed.ok) return response.status(400).json({ error: parsed.error });
      try {
        response.setHeader("Cache-Control", "no-store");
        const rankingContext = await memberLibraryRankingContext(
          request.user?.id,
        );
        const result = await searchLivingLibrary(
          repository,
          parsed.value,
          rankingContext.values,
        );
        return response.status(200).json({
          ...result,
          libraryPurposeConsent: {
            granted: rankingContext.consentGranted,
            purpose: "library_saved_context",
            controlsSavedContextAugmentation: true,
            controlsRankingPersonalization: true,
          },
        });
      } catch (error) {
        console.error("Living Library search failed", error);
        return response
          .status(503)
          .json({
            error:
              "The governed Library index is temporarily unavailable. Please try again.",
          });
      }
    },
  );

  app.get(
    "/api/library/topics",
    async (request: AuthenticatedRequest, response: Response) => {
      const rawDomain =
        typeof request.query.domain === "string" ? request.query.domain : null;
      const validDomains: ResearchDomain[] = [
        "medical",
        "legal",
        "financial",
        "education",
        "stem",
        "history",
        "general",
      ];
      const domain =
        rawDomain && validDomains.includes(rawDomain as ResearchDomain)
          ? (rawDomain as ResearchDomain)
          : null;
      const topics = await repository.listTopics({
        search: typeof request.query.q === "string" ? request.query.q : null,
        domain,
        memberId: request.user?.id ?? null,
      });
      return response.json({ topics });
    },
  );

  app.get(
    "/api/library/topics/:slug",
    async (request: Request, response: Response) => {
      const rawSlug = request.params.slug;
      const slug = Array.isArray(rawSlug) ? (rawSlug[0] ?? "") : rawSlug;
      const topic = await repository.findTopicBySlug(slug);
      if (!topic)
        return response.status(404).json({ error: "Library topic not found." });
      const entries = await repository.listTopicEntries({
        topicId: topic.id,
        limit: 20,
        cursor:
          typeof request.query.cursor === "string"
            ? request.query.cursor
            : null,
      });
      return response.json({ topic, entries });
    },
  );

  app.post(
    "/api/library/topics/:topicId/follow",
    async (request: AuthenticatedRequest, response: Response) => {
      try {
        const memberId = requireMemberId(request);
        const following = Boolean(request.body?.following);
        const rawTopicId = request.params.topicId;
        const topicId = Array.isArray(rawTopicId)
          ? (rawTopicId[0] ?? "")
          : rawTopicId;
        await repository.setTopicFollow({ topicId, memberId, following });
        return response.status(200).json({ following });
      } catch (error) {
        return response
          .status(401)
          .json({
            error:
              error instanceof Error
                ? error.message
                : "Unable to update follow.",
          });
      }
    },
  );

  app.post("/api/library/classify", (request: Request, response: Response) => {
    const question = stringBody(request, "question") || "";
    return response.json({ domain: classifyResearchDomain(question) });
  });
}
