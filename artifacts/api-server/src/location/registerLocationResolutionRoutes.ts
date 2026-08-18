import type { Express, NextFunction, Request, Response } from "express";
import type { Pool } from "pg";

/**
 * Two public endpoints that back the LocationSearchBar resolver.
 *
 *   GET /api/locations/resolve?q=<text>
 *     Queries community_locations by city_name, state_code, and neighborhood_name.
 *     Handles "Charlotte, NC" format (city + state) and plain city or neighborhood names.
 *     Returns { id, label, cityName, stateCode, neighborhoodName, latitude, longitude }.
 *     Returns HTTP 404 when no match is found so the client can show "area not found".
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
        const q = rawQ.toLowerCase();
        const like = `%${q}%`;

        const { rows } = await pool.query<{
          id: string;
          label: string;
          cityName: string;
          stateCode: string | null;
          neighborhoodName: string | null;
          latitude: number;
          longitude: number;
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
             END AS label
           FROM community_locations
           WHERE lower(city_name || ', ' || COALESCE(state_code, '')) = $1
              OR lower(city_name) = $1
              OR (neighborhood_name IS NOT NULL AND lower(neighborhood_name) = $1)
              OR lower(city_name) LIKE $2
              OR (neighborhood_name IS NOT NULL AND lower(neighborhood_name) LIKE $2)
           ORDER BY
             CASE
               WHEN lower(city_name || ', ' || COALESCE(state_code, '')) = $1 THEN 0
               WHEN lower(city_name) = $1 THEN 1
               WHEN neighborhood_name IS NOT NULL
                    AND lower(neighborhood_name) = $1 THEN 2
               ELSE 3
             END,
             city_name
           LIMIT 1`,
          [q, like],
        );

        if (!rows[0]) {
          return response.status(404).json({ code: "AREA_NOT_FOUND" });
        }

        response.setHeader("Cache-Control", "no-store");
        return response.json(rows[0]);
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
