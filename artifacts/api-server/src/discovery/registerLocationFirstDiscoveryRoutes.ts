import { type Express, type Request, type Response } from "express";
import { executeLocationFirstDiscovery, type LocationFirstDiscoveryRepository } from "./locationFirstDiscovery";
import type { LocationFirstQuery } from "../shared/discoveryContracts";

const RECORD_TYPES = new Set(["business", "cultural_site", "event", "community_place", "resource"]);
const LOCATION_MODES = new Set(["exact", "expanded_radius", "nearest_city", "all_locations"]);

function isValidQuery(value: unknown): value is LocationFirstQuery {
  const query = value as Partial<LocationFirstQuery>;
  return Boolean(
    query &&
      typeof query.surface === "string" &&
      query.location &&
      query.filters &&
      Array.isArray(query.filters.recordTypes) &&
      query.filters.recordTypes.every((rt) => RECORD_TYPES.has(rt)) &&
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
      (request as any).log?.error({ err }, "POST /api/discovery/query failed");
      response.status(500).json({ error: "Discovery query failed" });
    }
  });
}
