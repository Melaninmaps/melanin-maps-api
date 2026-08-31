import type { Express, NextFunction, Request, Response } from "express";
import type { Pool } from "pg";
import { resolveLocationText } from "./locationResolver";

/**
 * Two public endpoints that back the LocationSearchBar resolver.
 *
 *   GET /api/locations/resolve?q=<text>
 *     Resolves exact canonical/approved community locations and the controlled
 *     Philadelphia fallback. Duplicate city names return HTTP 409 candidates until
 *     the state disambiguates them; unsupported areas return HTTP 404.
 *     Returns { id, label, cityName, stateCode, neighborhoodName, latitude, longitude }.
 *
 *   GET /api/locations/reverse?lat=<lat>&lng=<lng>
 *     Finds the nearest community_locations row within 80 km of the supplied coordinates.
 *     Returns the same shape as /resolve.
 *     Returns HTTP 404 when no supported area is nearby.
 *
 * Both routes set Cache-Control: no-store so location choices are never stale.
 * No authentication required — both routes are public.
 */
export function registerLocationResolutionRoutes(app: Express, pool: Pool): void {
  app.get(
    "/api/locations/resolve",
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const rawQ = typeof request.query["q"] === "string" ? request.query["q"].trim() : "";
        if (rawQ.length < 2) {
          return response.status(400).json({ code: "AREA_QUERY_REQUIRED" });
        }
        const result = await resolveLocationText(pool, rawQ);
        response.setHeader("Cache-Control", "no-store");
        if (result.kind === "not_found") {
          return response.status(404).json({ code: "AREA_NOT_FOUND" });
        }
        if (result.kind === "ambiguous") {
          return response.status(409).json({
            code: "AREA_AMBIGUOUS",
            candidates: result.candidates,
          });
        }
        return response.json(result.area);
      } catch (error) {
        return next(error);
      }
    },
  );

  app.get(
    "/api/locations/reverse",
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const latitude = Number(request.query["lat"]);
        const longitude = Number(request.query["lng"]);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return response.status(400).json({ code: "COORDINATES_REQUIRED" });
        }

        const { rows } = await pool.query<{
          id: string;
          label: string;
          cityName: string;
          stateCode: string | null;
          neighborhoodName: string | null;
          latitude: number;
          longitude: number;
          distance_km: number;
        }>(
          `SELECT
             id,
             city_name AS "cityName",
             state_code AS "stateCode",
             neighborhood_name AS "neighborhoodName",
             latitude::float AS latitude,
             longitude::float AS longitude,
             CASE
               WHEN neighborhood_name IS NOT NULL
               THEN neighborhood_name || ', ' || city_name
                    || COALESCE(', ' || state_code, '')
               ELSE city_name || COALESCE(', ' || state_code, '')
             END AS label,
             (6371 * acos(least(1.0, greatest(-1.0,
               cos(radians($1)) * cos(radians(latitude))
               * cos(radians(longitude) - radians($2))
               + sin(radians($1)) * sin(radians(latitude))
             ))) ) AS distance_km
           FROM community_locations
           WHERE latitude IS NOT NULL AND longitude IS NOT NULL
           ORDER BY distance_km ASC
           LIMIT 1`,
          [latitude, longitude],
        );

        if (!rows[0] || Number(rows[0].distance_km) > 80) {
          return response.status(404).json({ code: "NO_SUPPORTED_AREA_NEARBY" });
        }

        const { distance_km: _drop, ...result } = rows[0];
        response.setHeader("Cache-Control", "no-store");
        return response.json(result);
      } catch (error) {
        return next(error);
      }
    },
  );
}
