import type { Express, NextFunction, Request, Response } from "express";
import { LocalBusinessSearch } from "./localBusinessSearch";

/**
 * GET /api/map/local-business-search
 *
 * Returns at most 2 businesses nearest to the supplied coordinates that match
 * the text query, constrained to the requested radius (5 / 10 / 25 miles).
 * No national fallback, no cross-city results.
 *
 * Query params:
 *   q       — free-text search (required, min 1 char)
 *   lat     — decimal latitude of the member's location
 *   lng     — decimal longitude of the member's location
 *   radius  — one of 5 | 10 | 25 (default: 5)
 *   expand  — "1" to activate the radius (used for explicit expansion clicks only)
 *
 * The `pins` field in the response is an intentional reference to the same two
 * results as `results`. The map must not render any pin not present in `results`.
 * Register after location resolution routes and before the generic API 404 handler.
 */
export function registerLocalBusinessSearchRoute(
  app: Express,
  service: LocalBusinessSearch,
): void {
  app.get(
    "/api/map/local-business-search",
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const query = typeof request.query["q"] === "string" ? request.query["q"] : "";
        const latitude = Number(request.query["lat"]);
        const longitude = Number(request.query["lng"]);
        const radius = Number(request.query["radius"] ?? 5);
        const expansionAccepted = request.query["expand"] === "1";

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return response.status(400).json({ code: "LOCATION_REQUIRED" });
        }
        if (![5, 10, 25].includes(radius)) {
          return response.status(400).json({ code: "INVALID_RADIUS" });
        }

        const result = await service.search({
          query,
          latitude,
          longitude,
          radiusMi: radius as 5 | 10 | 25,
          expansionAccepted,
        });

        response.setHeader("Cache-Control", "no-store");
        return response.json(result);
      } catch (error) {
        return next(error);
      }
    },
  );
}
