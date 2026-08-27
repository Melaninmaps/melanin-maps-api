export const RESPONSE_STYLES = [
  "conversational",
  "concise",
  "detailed",
  "professional",
] as const;

export type ResponseStyle = (typeof RESPONSE_STYLES)[number];

export type DeliveryStyle = {
  detailLevel: "quick" | "standard" | "deep";
  tonePreference: "default" | "warm" | "professional";
};

export function responseStyleToDelivery(style: ResponseStyle): DeliveryStyle {
  switch (style) {
    case "concise":
      return { detailLevel: "quick", tonePreference: "default" };
    case "detailed":
      return { detailLevel: "deep", tonePreference: "default" };
    case "professional":
      return { detailLevel: "standard", tonePreference: "professional" };
    case "conversational":
      return { detailLevel: "standard", tonePreference: "warm" };
  }
}

export function deliveryToResponseStyle(
  detailLevel: string | null | undefined,
  tonePreference: string | null | undefined,
): ResponseStyle {
  if (tonePreference === "professional") return "professional";
  if (detailLevel === "deep") return "detailed";
  if (detailLevel === "quick") return "concise";
  return "conversational";
}