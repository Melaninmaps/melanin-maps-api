import type { Express, NextFunction, Request, Response } from "express";
import { isValidMapCoordinatePair, LocalBusinessSearch } from "./localBusinessSearch";

const DECIMAL_COORDINATE = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function decimalCoordinate(value: unknown): number {
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim();
  return DECIMAL_COORDINATE.test(normalized) ? Number(normalized) : Number.NaN;
}

/**
 * GET /api/map/local-business-search
 *
 * Returns the two nearest pinnable businesses plus every matching unpinned
 * listing in an explicitly supplied city or ZIP. Coordinate-bearing rows are
 * constrained to the requested radius (5 / 10 / 25 miles). There is no
 * national fallback and no independent pin source.
 *
 * Query params:
 *   q       — free-text search (required, min 1 char)
 *   subject — normalized current-turn business subject (preferred over q)
 *   lat     — decimal latitude of the member's location
 *   lng     — decimal longitude of the member's location
 *   radius  — one of 5 | 10 | 25 (default: 5)
 *   expand  — "1" to activate the radius (used for explicit expansion clicks only)
 *   city/stateCode — explicit geography used to retain matching unpinned rows
 *
 * `pins` is the validated-coordinate subset of `results`; total and pinnable
 * counts describe all relevant rows in scope before the two-pin display cap.
 * The response is marked no-store with no query/location retention headers.
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
        const query = typeof request.query["subject"] === "string"
          ? request.query["subject"]
          : typeof request.query["q"] === "string" ? request.query["q"] : "";
        const city = typeof request.query["city"] === "string" ? request.query["city"] : undefined;
        const stateCode = typeof request.query["stateCode"] === "string" ? request.query["stateCode"] : undefined;
        const rawLatitude = request.query["lat"];
        const rawLongitude = request.query["lng"];
        const latitude = decimalCoordinate(rawLatitude);
        const longitude = decimalCoordinate(rawLongitude);
        const radius = Number(request.query["radius"] ?? 5);
        const expansionAccepted = request.query["expand"] === "1";

        if (!isValidMapCoordinatePair(latitude, longitude)) {
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
          city,
          stateCode,
        });

        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Location-Retention", "none");
        response.setHeader("X-Query-Retention", "none");
        return response.json(result);
      } catch (error) {
        return next(error);
      }
    },
  );
}
