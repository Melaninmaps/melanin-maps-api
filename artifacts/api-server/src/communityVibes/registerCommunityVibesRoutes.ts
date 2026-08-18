import type { Express, Request, Response, NextFunction } from "express";
import { CommunityVibesRepository } from "./communityVibesRepository";

type AuthenticatedRequest = Request & { user?: { id: string } };

/**
 * Registers two routes:
 *
 *   GET  /api/businesses/:businessId/community-vibes
 *     Public — returns aggregate approved vibes for a business.
 *     Never reveals contributor identity, email, or raw review text.
 *     Returns { businessId, voices, vibes[], contributionChoices[], updatedAt }.
 *     A business with no approved evidence returns vibes: [] — never fake defaults.
 *
 *   POST /api/businesses/:businessId/community-vibes
 *     Authenticated — submits member tag evidence as 'pending'.
 *     Moderation promotes it to 'approved' before it affects the public view.
 *     Body: { sourceId: string; vibeKeys: string[] } (max 3 keys).
 *     Returns 202 { status: "PENDING_MODERATION" } on success.
 *
 * Register after auth middleware (so req.user is populated for POST) and
 * before the generic 404 handler.
 */
export function registerCommunityVibesRoutes(
  app: Express,
  repository: CommunityVibesRepository,
): void {
  // Public read — no auth required; response is aggregate-only.
  app.get(
    "/api/businesses/:businessId/community-vibes",
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const payload = await repository.getForBusiness(request.params["businessId"] ?? "");
        if (!payload) return response.status(404).json({ code: "BUSINESS_NOT_FOUND" });
        response.setHeader("Cache-Control", "no-store");
        return response.json(payload);
      } catch (error) {
        return next(error);
      }
    },
  );

  // Authenticated write — evidence enters as 'pending', never affects public view until approved.
  app.post(
    "/api/businesses/:businessId/community-vibes",
    async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
      try {
        if (!request.user) {
          return response.status(401).json({ code: "AUTHENTICATION_REQUIRED" });
        }
        const { sourceId, vibeKeys } = (request.body as Record<string, unknown>) ?? {};
        if (
          typeof sourceId !== "string" ||
          !Array.isArray(vibeKeys) ||
          !vibeKeys.every((v) => typeof v === "string")
        ) {
          return response.status(400).json({ code: "INVALID_VIBE_SUBMISSION" });
        }
        await repository.submitMemberTags({
          businessId: request.params["businessId"] ?? "",
          memberId: request.user.id,
          sourceId,
          vibeKeys: vibeKeys as string[],
        });
        return response.status(202).json({ status: "PENDING_MODERATION" });
      } catch (error) {
        return next(error);
      }
    },
  );
}
