import type { Express, NextFunction, Request, Response } from "express";
import { FoundationTopicRepository } from "./foundationTopicRepository";
import { LIBRARY_RESEARCH_PATH_MANIFEST } from "./libraryResearchPathManifest";

/**
 * GET /api/library/foundation-topics
 *
 * Returns the 28 durable foundational Library topics with entry counts.
 * Separate from the legacy /api/library/topics endpoint so both can evolve
 * independently without breaking the existing topic-detail pages.
 *
 * Query params:
 *   featured=true   — return only the 8 Start Here topics
 *   q=<text>        — filter by title or summary
 */
export function registerFoundationTopicRoutes(
  app: Express,
  repository: FoundationTopicRepository,
): void {
  app.get(
    "/api/library/research-paths",
    (_request: Request, response: Response) => {
      response.setHeader("Cache-Control", "public, max-age=300");
      return response.json(LIBRARY_RESEARCH_PATH_MANIFEST);
    },
  );

  app.get(
    "/api/library/foundation-topics",
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const featuredOnly = request.query["featured"] === "true";
        const query =
          typeof request.query["q"] === "string" ? request.query["q"] : undefined;
        response.setHeader("Cache-Control", "no-store");
        return response.json({
          topics: await repository.list({ featuredOnly, query }),
        });
      } catch (error) {
        return next(error);
      }
    },
  );
}
