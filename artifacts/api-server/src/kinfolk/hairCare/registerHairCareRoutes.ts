import { type Express, type Request, type Response } from "express";
import { buildHairLossCarePlan, getOptionalHairLossRecommendations } from "./hairLossRecommendation";
import type { HairCareRepository } from "./types";

type AuthenticatedRequest = Request & { user?: { id: string } };
type MemberLocationRepository = {
  getLocation(memberId: string): Promise<{ city: string | null; stateCode: string | null }>;
};

export function registerHairCareRoutes(
  app: Express,
  dependencies: { hairCareRepository: HairCareRepository; memberLocationRepository: MemberLocationRepository },
): void {
  app.get("/api/kinfolk/hair-loss/care-paths", (request: Request, response: Response) => {
    return response.json(buildHairLossCarePlan());
  });

  app.post("/api/kinfolk/hair-loss/care-paths/:action", async (request: AuthenticatedRequest, response: Response) => {
    if (!request.user?.id) return response.status(401).json({ error: "Sign in is required to show local care options." });
    const action = request.params.action;
    if (action !== "show_dermatologists" && action !== "show_hair_loss_stylists") {
      return response.status(400).json({ error: "Choose a supported Kinfolk care path." });
    }

    const location = await dependencies.memberLocationRepository.getLocation(request.user.id);
    if (!location.city || !location.stateCode) {
      return response.status(200).json({
        recommendations: [],
        locationPrompt: "If you want local care options, share a city or area in your profile. You can keep reading the information without doing that.",
      });
    }

    const recommendations = await getOptionalHairLossRecommendations({
      action,
      location,
      repository: dependencies.hairCareRepository,
    });
    return response.status(200).json({ recommendations, locationPrompt: null });
  });
}
