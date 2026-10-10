import { type Express, type Request, type Response } from "express";
import { BUSINESS_SEARCH_NORMALIZATION_VERSION } from "@workspace/constants";
import { executeLocationFirstDiscovery, type LocationFirstDiscoveryRepository } from "./locationFirstDiscovery";
import type { LocationFirstQuery } from "../shared/discoveryContracts";

const RECORD_TYPES = new Set(["business", "cultural_site", "event", "community_place", "resource"]);
const LOCATION_MODES = new Set(["exact", "expanded_radius", "nearest_city", "all_locations"]);

function missingLocationInventoryRelation(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown };
  const message = typeof candidate?.message === "string" ? candidate.message : "";
  return candidate?.code === "42P01"
    && /canonical_record_locations|tour_cultural_sites|recurring_events|community_organizations|cultural_sites/i.test(message);
}

function isValidQuery(value: unknown): value is LocationFirstQuery {
  const query = value as Partial<LocationFirstQuery>;
  return Boolean(
    query &&
      typeof query.surface === "string" &&
      query.location &&
      query.filters &&
      Array.isArray(query.filters.recordTypes) &&
      query.filters.recordTypes.every((rt) => RECORD_TYPES.has(rt)) &&
      (query.filters.categoryNormalizationVersion === undefined
        || query.filters.categoryNormalizationVersion === BUSINESS_SEARCH_NORMALIZATION_VERSION) &&
      typeof query.locationMode === "string" &&
      LOCATION_MODES.has(query.locationMode),
  );
}

export function registerLocationFirstDiscoveryRoutes(
  app: Express,
  repository: LocationFirstDiscoveryRepository,
): void {
  // POST /api/discovery/query — the single location-scoped discovery endpoint.
  // All surfaces (Map, Businesses, Explore, Events) call this instead of
  // independent category-global endpoints. Returns exact local records or a
  // coverage gap with suggested next actions — never a silent national fallback.
  app.post("/api/discovery/query", async (request: Request, response: Response) => {
    if (!isValidQuery(request.body)) {
      response.status(400).json({ error: "Invalid location-first discovery query." });
      return;
    }

    const query = request.body as LocationFirstQuery;

    // Prevent silent all_locations bypass: member must explicitly confirm
    // they want to expand beyond their selected location.
    if (
      query.locationMode === "all_locations" &&
      request.header("x-mwm-confirm-expansion") !== "true"
    ) {
      response.status(400).json({
        error: "All-location browsing requires explicit member confirmation via x-mwm-confirm-expansion: true",
      });
      return;
    }

    try {
      const result = await executeLocationFirstDiscovery(query, repository);
      response.setHeader("Cache-Control", "private, no-store, max-age=0");
      response.setHeader("Vary", "Authorization, Cookie, X-Community-Location");
      response.json(result);
    } catch (err: unknown) {
      // A partially provisioned catalogue must not produce a member 500 or
      // silently fall back beyond the requested public area.
      if (missingLocationInventoryRelation(err)) {
        response.setHeader("Cache-Control", "private, no-store, max-age=0");
        response.setHeader("Vary", "Authorization, Cookie, X-Community-Location");
        response.json({
          query,
          requiresLocation: false,
          records: [],
          coverageGap: {
            city: query.location.city,
            stateCode: query.location.stateCode,
            recordType: query.filters.recordTypes.length === 1
              ? query.filters.recordTypes[0]
              : "business",
            category: query.filters.category,
            specialty: query.filters.specialty,
            observedAt: new Date().toISOString(),
          },
          suggestedActions: query.filters.recordTypes.includes("event")
            ? ["expand_radius", "show_nearest_city", "submit_event"]
            : ["expand_radius", "show_nearest_city", "submit_listing"],
          nearestAvailableLocation: null,
        });
        return;
      }
      (request as any).log?.error({ err }, "POST /api/discovery/query failed");
      response.status(500).json({ error: "Discovery query failed" });
    }
  });
}
