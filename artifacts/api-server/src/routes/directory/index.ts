/**
 * Directory router — location-first bookstore discovery and canonical
 * cultural-site URL resolution. Must be registered BEFORE the universal
 * search route so bookstore queries are never forwarded to the AI path.
 *
 * Usage in routes/index.ts:
 *   import directoryRouter from "./directory";
 *   router.use(directoryRouter);
 */
import { Router } from "express";
import { pool } from "@workspace/db";
import { createPostgresDirectoryRepository } from "./postgresDirectoryRepository";
import {
  DEFAULT_BOOKSTORE_RADIUS_MILES,
  discoverClosestBookstore,
  isBookstoreIntent,
} from "./bookstoreDiscovery";
import type { Coordinates } from "./types";

const directoryRouter = Router();
const repository = createPostgresDirectoryRepository(pool);

function optionalFiniteNumber(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLocation(query: Record<string, unknown>): Coordinates | null {
  const lat = optionalFiniteNumber(query["lat"]);
  const lng = optionalFiniteNumber(query["lng"]);
  if (lat === null && lng === null) return null;
  if (lat === null || lng === null) {
    throw new Error("Send both lat and lng, or omit both to request location permission.");
  }
  return { lat, lng };
}

function parseRadius(query: Record<string, unknown>): number {
  const requested = optionalFiniteNumber(query["radiusMiles"]);
  if (requested === null) return DEFAULT_BOOKSTORE_RADIUS_MILES;
  return Math.min(Math.max(Math.round(requested), 5), 100);
}

/**
 * GET /api/directory/bookstores/closest
 * Location-first bookstore discovery. Returns the single closest verified
 * community bookstore, or a controlled online fallback when none exists within
 * the radius. Responds with locationRequired:true when no coordinates are sent.
 */
directoryRouter.get("/directory/bookstores/closest", async (req, res) => {
  try {
    const q = req.query["q"];
    if (typeof q !== "string" || q.trim().length < 2) {
      return void res.status(400).json({
        error: "A q query parameter with at least two characters is required.",
        code: "INVALID_DIRECTORY_SEARCH",
      });
    }

    if (!isBookstoreIntent(q)) {
      return void res.status(422).json({
        error: "This endpoint is only for bookstore searches.",
        code: "UNSUPPORTED_DIRECTORY_INTENT",
      });
    }

    const result = await discoverClosestBookstore(repository, {
      query: q,
      location: parseLocation(req.query as Record<string, unknown>),
      radiusMiles: parseRadius(req.query as Record<string, unknown>),
    });

    return void res.status(200).json(result);
  } catch (error) {
    return void res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid bookstore search request.",
      code: "INVALID_DIRECTORY_SEARCH",
    });
  }
});

/**
 * GET /api/directory/cultural-sites/:id
 * Canonical cultural-site resolver. Returns the site record with a detailUrl
 * the client must use for all deep links. Clients should prefer this URL over
 * any slug or display-name–derived path.
 */
directoryRouter.get("/directory/cultural-sites/:id", async (req, res) => {
  try {
    const site = await repository.findPublishedCulturalSiteById(req.params["id"] ?? "");

    if (!site) {
      return void res.status(404).json({
        error: "Cultural site not found.",
        code: "CULTURAL_SITE_NOT_FOUND",
      });
    }

    return void res.status(200).json({
      ...site,
      detailUrl: `/cultural-sites/${encodeURIComponent(site.id)}/${encodeURIComponent(
        site.slug,
      )}`,
    });
  } catch (error) {
    return void res.status(500).json({
      error: "Unable to load this cultural site.",
      code: "CULTURAL_SITE_ERROR",
    });
  }
});

export default directoryRouter;
