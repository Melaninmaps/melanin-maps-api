/**
 * Canonical Cultural-Site Routes.
 *
 * These GET endpoints replace the legacy list/detail handlers in
 * cultural-sites.ts while remaining behind the global member wall. The legacy
 * router still handles stories, moderation, and contribution POST/PATCH routes.
 *
 * Registered BEFORE culturalSitesRouter in routes/index.ts so Express matches
 * these stable handlers first for GET /cultural-sites and GET /cultural-sites/:id.
 *
 * Every response includes a server-built `detailUrl` of the form
 * /cultural-sites/:id/:slug. Clients MUST use this URL for all deep links —
 * never reconstruct it from a display name or a client-generated slug.
 */

import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  CanonicalCulturalSiteRepository,
  canonicalCulturalSitePath,
} from "./directory/canonicalCulturalSiteRepository";

const router = Router();
const repository = new CanonicalCulturalSiteRepository(pool);

// ── GET /cultural-sites ───────────────────────────────────────────────────────
// Returns all geocoded cultural sites with slug + detailUrl for map pins and
// result cards. Clients must use detailUrl for navigation — never build the
// URL from name or slug client-side.

router.get("/cultural-sites", async (req: Request, res: Response, next) => {
  try {
    const cityId = typeof req.query.cityId === "string" ? req.query.cityId : undefined;
    res.setHeader("Cache-Control", "no-store");
    const items = (await repository.listMapCards(cityId)).map((site) => ({
      ...site,
      state: site.stateCode,
      externalUrl: site.learnMoreUrl,
    }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// ── GET /cultural-sites/:id ───────────────────────────────────────────────────
// Canonical single-site resolver. The web client uses this to:
//   1. Load detail data by UUID (the stable authoritative identifier).
//   2. Correct a stale or missing slug by replacing the current URL with detailUrl.

router.get("/cultural-sites/:id", async (req: Request, res: Response, next) => {
  try {
    const rawId = req.params["id"];
    const site = await repository.findById(typeof rawId === "string" ? rawId : "");
    if (!site) {
      res.status(404).json({ code: "CULTURAL_SITE_NOT_FOUND", error: "Cultural site not found." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    const detail = {
      ...site,
      state: site.stateCode,
      externalUrl: site.learnMoreUrl,
      detailUrl: canonicalCulturalSitePath(site),
    };
    res.json({ ...detail, site: detail });
  } catch (error) {
    next(error);
  }
});

export default router;
