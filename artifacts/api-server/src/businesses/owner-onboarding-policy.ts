import { z } from "zod/v4";

const trimmedText = (max: number) =>
  z.string().trim().max(max).transform((value) => value.replace(/\s+/g, " "));

export const OWNER_ONBOARDING_CHANNELS = ["email", "phone", "website", "social"] as const;
export const OWNER_ONBOARDING_PRICING_MODELS = [
  "not_listed",
  "starting_at",
  "range",
  "contact_for_quote",
] as const;

export const ownerOnboardingInputSchema = z.object({
  identityReviewed: z.boolean(),
  offerings: z.array(z.object({
    name: z.string().trim().min(2).max(80).transform((value) => value.replace(/\s+/g, " ")),
    detail: trimmedText(240),
  })).max(12),
  pricing: z.object({
    model: z.enum(OWNER_ONBOARDING_PRICING_MODELS),
    detail: trimmedText(180),
  }),
  availability: z.object({
    useWeeklySchedule: z.boolean(),
    note: trimmedText(280),
  }),
  media: z.object({
    confirmedRights: z.boolean(),
    confirmedReview: z.boolean(),
  }),
  communication: z.object({
    channels: z.array(z.enum(OWNER_ONBOARDING_CHANNELS)).max(4).transform((channels) =>
      [...new Set(channels)],
    ),
    responseWindow: trimmedText(120),
  }),
}).strict();

export type OwnerOnboardingInput = z.infer<typeof ownerOnboardingInputSchema>;

export const EMPTY_OWNER_ONBOARDING: OwnerOnboardingInput = {
  identityReviewed: false,
  offerings: [],
  pricing: { model: "not_listed", detail: "" },
  availability: { useWeeklySchedule: false, note: "" },
  media: { confirmedRights: false, confirmedReview: false },
  communication: { channels: [], responseWindow: "" },
};

export type OwnerOnboardingChecklistItem = {
  key: "identity" | "offerings" | "availability" | "pricing" | "media" | "communication";
  label: string;
  complete: boolean;
  helper: string;
};

export function buildOwnerOnboardingChecklist(
  input: OwnerOnboardingInput,
  hasWeeklySchedule: boolean,
): OwnerOnboardingChecklistItem[] {
  return [
    {
      key: "identity",
      label: "Review business identity",
      complete: input.identityReviewed,
      helper: "Confirm your existing public story and contact details are accurate.",
    },
    {
      key: "offerings",
      label: "Add offerings",
      complete: input.offerings.length > 0,
      helper: "Describe up to 12 services or products. Nothing is generated for you.",
    },
    {
      key: "availability",
      label: "Set availability",
      complete: Boolean(input.availability.note.trim()) || (input.availability.useWeeklySchedule && hasWeeklySchedule),
      helper: "Use your existing weekly schedule or add a short owner-written availability note.",
    },
    {
      key: "pricing",
      label: "Choose pricing guidance",
      complete: input.pricing.model !== "not_listed" && Boolean(input.pricing.detail.trim()),
      helper: "Share only pricing guidance you choose; no payments, claims, or offers are created.",
    },
    {
      key: "media",
      label: "Review media rights",
      complete: input.media.confirmedRights && input.media.confirmedReview,
      helper: "Existing media remains under its current approval policy; this records only your review.",
    },
    {
      key: "communication",
      label: "Set communication preference",
      complete: input.communication.channels.length > 0 && Boolean(input.communication.responseWindow.trim()),
      helper: "Choose existing public contact channels and an owner-written response expectation.",
    },
  ];
}

export function completionPercent(checklist: OwnerOnboardingChecklistItem[]): number {
  return Math.round((checklist.filter((item) => item.complete).length / checklist.length) * 100);
}
