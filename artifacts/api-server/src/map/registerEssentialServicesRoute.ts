import type { Express, NextFunction, Request, Response } from "express";
import { essentialServicesLimiter } from "../middleware/rateLimiter";
import {
  EssentialServicesInputError,
  EssentialServicesUnavailableError,
  type GoogleEssentialServicesSearch,
} from "./essentialServices";

const DECIMAL_COORDINATE = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function decimalQueryValue(value: unknown): number {
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim();
  return DECIMAL_COORDINATE.test(normalized) ? Number(normalized) : Number.NaN;
}

/**
 * GET /api/map/essential-services
 *
 * Returns a short-lived, on-demand public-facility view centered on a location
 * the signed-in member explicitly supplied. No place result is persisted,
 * imported into the MWM directory, or treated as a MWM recommendation.
 */
export function registerEssentialServicesRoute(
  app: Express,
  service: GoogleEssentialServicesSearch,
): void {
  app.get(
    "/api/map/essential-services",
    essentialServicesLimiter,
    async (request: Request, response: Response, next: NextFunction) => {
      if (!request.isAuthenticated()) {
        response.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
        return;
      }

      const category = typeof request.query.category === "string" ? request.query.category : "";
      const latitude = decimalQueryValue(request.query.lat);
      const longitude = decimalQueryValue(request.query.lng);
      const radius = request.query.radius === undefined
        ? undefined
        : decimalQueryValue(request.query.radius);

      try {
        const result = await service.search({
          category,
          latitude,
          longitude,
          radiusMiles: radius,
        });
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Location-Retention", "none");
        response.setHeader("X-Query-Retention", "none");
        response.setHeader("X-Source-Attribution", "Google Maps");
        response.json(result);
      } catch (error) {
        if (error instanceof EssentialServicesInputError) {
          response.status(400).json({ error: "Invalid essential-services request", code: error.code });
          return;
        }
        if (error instanceof EssentialServicesUnavailableError) {
          response.status(503).json({
            error: "Essential services are temporarily unavailable. Please try again or use another map provider.",
            code: "ESSENTIAL_SERVICES_UNAVAILABLE",
          });
          return;
        }
        next(error);
      }
    },
  );
}
