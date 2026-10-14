import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { GetTravelRecommendationsBody } from "@workspace/api-zod";
import { getCachedPrefs } from "../kinfolk/preference-cache";
import { getMemberAgeBand } from "../lib/audience-policy";
import {
  createGovernedKinfolkBusinessRepository,
  type GovernedKinfolkBusiness,
} from "../kinfolk/governedBusinessRepository";
import { rankTravelCatalogForMember } from "../kinfolk/itinerary-response";
import {
  buildGovernedTravelRecommendations,
  parseTravelPlannerCityScope,
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

// ─── POST /api/travel/recommendations ─────────────────────────────────────────
//
// This endpoint is retained for the existing Web and native Travel presentation.
// It deliberately shares Kinfolk's governed directory policy: model prose, broad
// text matching, fabricated venues, current safety claims, and non-catalog event
// claims are not permitted through this compatibility route.
router.post("/travel/recommendations", async (req: Request, res: Response) => {
  const memberId = requireMemberId(req, res);
  if (!memberId) return;

  const parsed = GetTravelRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { destination, vibes = [] } = parsed.data;
  const cityScope = parseTravelPlannerCityScope(destination);

  try {
    const [prefs, ageBand] = await Promise.all([
      getCachedPrefs(memberId),
      getMemberAgeBand(memberId),
    ]);

    let catalog: GovernedKinfolkBusiness[] = [];
    if (cityScope) {
      try {
        catalog = await governedBusinessRepository.findDestinationCatalog(cityScope, 30);
      } catch (error) {
        // Fail closed to a no-listing response. Do not fall back to legacy
        // directory reads, a broad nearby search, or a provider-generated list.
        req.log.warn({ error }, "governed travel recommendations catalog unavailable");
      }
    }

    const rankedCatalog = rankTravelCatalogForMember({
      catalog,
      message: [destination, ...vibes].join(" "),
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

    res.status(200).json({
      ...buildGovernedTravelRecommendations({ destination, catalog: rankedCatalog }),
      directoryCoverage: cityScope && rankedCatalog.length > 0
        ? "governed_catalog"
        : "no_eligible_catalog",
    });
  } catch (error) {
    req.log.error({ error }, "governed travel recommendations error");
    res.status(500).json({ error: "Unable to prepare travel recommendations right now." });
  }
});

export default router;
