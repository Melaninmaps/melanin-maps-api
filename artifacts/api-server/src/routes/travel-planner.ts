import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { getCachedPrefs } from "../kinfolk/preference-cache";
import { getMemberAgeBand } from "../lib/audience-policy";
import {
  createGovernedKinfolkBusinessRepository,
  type GovernedKinfolkBusiness,
} from "../kinfolk/governedBusinessRepository";
import { rankTravelCatalogForMember } from "../kinfolk/itinerary-response";
import {
  buildGovernedTravelPlannerResponse,
  parseGovernedTravelPlannerRequest,
} from "../kinfolk/travel-planner-governance";

const router: IRouter = Router();
const governedBusinessRepository = createGovernedKinfolkBusinessRepository(pool);

function requireMemberId(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  return req.user.id;
}

// ─── POST /api/travel-planner/generate ────────────────────────────────────────
//
// This legacy mobile endpoint intentionally delegates to the same deterministic,
// governed itinerary policy as primary Kinfolk. It never invokes a model, reads
// the legacy ungoverned businesses table, invents a venue, or claims current
// safety information.
router.post("/travel-planner/generate", async (req: Request, res: Response) => {
  const memberId = requireMemberId(req, res);
  if (!memberId) return;

  const request = parseGovernedTravelPlannerRequest(
    req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {},
  );
  if (!request) {
    res.status(400).json({ error: "A valid destination is required." });
    return;
  }

  try {
    const [prefs, ageBand] = await Promise.all([
      getCachedPrefs(memberId),
      getMemberAgeBand(memberId),
    ]);

    let catalog: GovernedKinfolkBusiness[] = [];
    if (request.cityScope) {
      try {
        catalog = await governedBusinessRepository.findDestinationCatalog(
          request.cityScope,
          30,
        );
      } catch (error) {
        // A catalog outage must degrade to a no-listing plan rather than fall
        // back to broad search, an ungoverned table, or an invented venue.
        req.log.warn({ error }, "governed travel planner catalog unavailable");
      }
    }

    const rankedCatalog = rankTravelCatalogForMember({
      catalog,
      message: [request.destination, request.style, ...request.interests].join(" "),
      profile: {
        ageBand,
        favoriteCategories: prefs?.favoriteCategories,
        tripStyle: prefs?.tripStyle,
        culturalInterests: prefs?.culturalInterests,
        lifestyleServices: prefs?.lifestyleServices,
        avoidCategories: prefs?.avoidCategories,
        budgetRange: prefs?.budgetRange,
        travelCompanion: prefs?.travelCompanion,
        dietaryNotes: prefs?.dietaryNotes,
      },
    });

    const itinerary = buildGovernedTravelPlannerResponse({
      request,
      catalog: rankedCatalog,
    });
    res.status(200).json({
      itinerary,
      localBusinessCount: rankedCatalog.length,
      directoryCoverage: request.cityScope && rankedCatalog.length > 0
        ? "governed_catalog"
        : "no_eligible_catalog",
    });
  } catch (error) {
    req.log.error({ error }, "governed travel planner generation error");
    res.status(500).json({ error: "Unable to prepare a travel plan right now." });
  }
});

export default router;
