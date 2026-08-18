export type SocialSource = "instagram" | "facebook" | "tiktok" | "linkedin" | "qr" | "other";

export function businessSubmissionLink(source: SocialSource, campaign?: string) {
  const url = new URL("/submit-business", "https://mappingwithmelanin.com");
  url.searchParams.set("source", source);
  if (campaign) url.searchParams.set("campaign", campaign);
  return url.toString();
}

export const SOCIAL_INTAKE_COPY = {
  instagram: "Know a business the community should know? Add it for founder review: ",
  facebook: "Help us put community businesses on the map. Submit a business for founder review: ",
  tiktok: "Put your people on. Share a business for founder review: ",
  qr: "Scan to share a community business for founder review.",
};
