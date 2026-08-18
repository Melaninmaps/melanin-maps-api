import { type Express, type Request, type Response } from "express";
import { resolveKinfolkIntent } from "./intentResolver";
import { getConsentBasedProfessionalResults } from "./optionalProfessionalResults";
import { composeKinfolkCapabilityResponse } from "./responseComposer";
import type {
  IntentResolution,
  LocalContextRepository,
  ProfessionalDirectoryRepository,
  ToneStyle,
} from "./types";

type AuthenticatedRequest = Request & { user?: { id: string } };

type KinfolkCapabilityTurnStore = {
  create(input: { memberId: string; intent: IntentResolution; expiresAt: Date }): Promise<{ id: string }>;
  find(input: { id: string; memberId: string }): Promise<{ intent: IntentResolution } | null>;
};

type MemberContextRepository = {
  getContext(memberId: string): Promise<{
    preferredTone: ToneStyle | null;
    city: string | null;
    stateCode: string | null;
  }>;
};

function requireMemberId(request: AuthenticatedRequest): string {
  if (!request.user?.id) throw new Error("Sign in is required for Kinfolk’s personalized local context.");
  return request.user.id;
}

export function registerKinfolkCapabilityRoutes(
  app: Express,
  dependencies: {
    memberContextRepository: MemberContextRepository;
    localContextRepository: LocalContextRepository;
    professionalDirectoryRepository: ProfessionalDirectoryRepository;
    turnStore: KinfolkCapabilityTurnStore;
  },
): void {
  app.post("/api/kinfolk/capability-turns", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const memberId = requireMemberId(request);
      const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
      if (message.length < 2) return response.status(400).json({ error: "Please enter a question for Kinfolk." });

      const member = await dependencies.memberContextRepository.getContext(memberId);
      const intent = await resolveKinfolkIntent({
        message,
        preferredTone: member.preferredTone,
        memberLocation: { city: member.city, stateCode: member.stateCode },
        localContextRepository: dependencies.localContextRepository,
      });
      const capabilityResponse = composeKinfolkCapabilityResponse(intent);
      const turn = await dependencies.turnStore.create({
        memberId,
        intent,
        expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
      });

      return response.json({ ...capabilityResponse, turnId: turn.id });
    } catch (error) {
      return response.status(401).json({
        error: error instanceof Error ? error.message : "Unable to prepare Kinfolk’s next step.",
      });
    }
  });

  app.post(
    "/api/kinfolk/capability-turns/:turnId/actions/:actionId",
    async (request: AuthenticatedRequest, response: Response) => {
      try {
        const memberId = requireMemberId(request);
        const turn = await dependencies.turnStore.find({ id: request.params.turnId, memberId });
        if (!turn) return response.status(404).json({ error: "This optional action has expired. Ask Kinfolk again when you are ready." });

        const result = await getConsentBasedProfessionalResults({
          intent: turn.intent,
          directoryRepository: dependencies.professionalDirectoryRepository,
        });
        if (result.optionalAction && request.params.actionId !== result.optionalAction.id) {
          return response.status(400).json({ error: "That local-results action does not match this Kinfolk response." });
        }

        return response.json(result);
      } catch (error) {
        return response.status(401).json({
          error: error instanceof Error ? error.message : "Unable to retrieve local options.",
        });
      }
    },
  );
}
