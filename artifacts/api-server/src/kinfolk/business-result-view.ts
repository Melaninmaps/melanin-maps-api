import type {
  BusinessDiscoveryPlatformBusiness,
  BusinessDiscoveryWebFinding,
} from "./local-business-discovery";

export type ConversationalBusinessResultView = Readonly<{
  cards: Array<{
    id: string;
    title: string;
    supportingText: string;
    matchReason: string;
    verified: boolean;
    claimed: boolean;
    actions: Array<{ label: "View details" | "Visit website"; url: string }>;
  }>;
  seeAll: { label: "See all matching listings"; count: number } | null;
  followUp: string;
  external: Array<{ title: string; url: string; sourceHost: string; disclaimer: string }>;
}>;

/**
 * A compact, presentation-ready view of governed results. It deliberately
 * keeps external research outside MWM cards, and only exposes actions backed
 * by canonical internal routes or approved canonical URLs.
 */
export function buildConversationalBusinessResultView(input: {
  businesses: readonly (BusinessDiscoveryPlatformBusiness & { claimed?: boolean })[];
  external?: readonly BusinessDiscoveryWebFinding[];
  subjectLabel: string;
}): ConversationalBusinessResultView {
  const cards = input.businesses.slice(0, 5).map((business) => ({
    id: business.id,
    title: business.name,
    supportingText: business.description || `${business.category} in ${business.city}.`,
    matchReason: business.matchReasons[0]
      ? `Matched by ${business.matchReasons.join(" and ")}.`
      : `Matched as a ${input.subjectLabel} listing.`,
    verified: business.verified,
    claimed: business.claimed === true,
    actions: [
      { label: "View details" as const, url: business.detailUrl },
      ...(business.website ? [{ label: "Visit website" as const, url: business.website }] : []),
    ],
  }));
  return {
    cards,
    seeAll: input.businesses.length > cards.length
      ? { label: "See all matching listings", count: input.businesses.length }
      : null,
    followUp: cards.length
      ? "Want me to narrow these by neighborhood, hours, or another preference?"
      : `Want to try a nearby city or a different kind of ${input.subjectLabel}?`,
    external: (input.external ?? []).slice(0, 5).map((finding) => ({
      title: finding.title,
      url: finding.url,
      sourceHost: finding.sourceHost,
      disclaimer: "External finding — not an MWM-verified business listing.",
    })),
  };
}