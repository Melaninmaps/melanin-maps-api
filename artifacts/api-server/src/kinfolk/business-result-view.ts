import type {
  BusinessDiscoveryPlatformBusiness,
  BusinessDiscoveryWebFinding,
} from "./local-business-discovery";

export type ConversationalBusinessResultView = Readonly<{
  cards: Array<{
    id: string;
    title: string;
    supportingText: string;
    isOnlineOnly: boolean;
    matchReason: string;
    verified: boolean;
    claimed: boolean;
    /** Present only for a one-turn verified public-origin radius search. */
    distanceMiles?: number | null;
    ownershipEvidence?: {
      sourceUrl: string;
      sourceLabel: string | null;
      capturedAt: string | null;
    } | null;
    actions: Array<{ label: "View details" | "Visit website"; url: string }>;
  }>;
  seeAll: { label: "See all matching listings"; count: number } | null;
  followUp: string;
  external: Array<{ title: string; url: string; sourceHost: string; disclaimer: string }>;
}>;

function normalizedPublicIdentity(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/\band\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function hasPublicDetailAction(value: string): boolean {
  return /^\/businesses\/[^/?#]+$/.test(value);
}

/**
 * Removes duplicate display candidates without changing, merging, hiding, or
 * deleting any underlying directory record. A card must keep a public detail
 * page or a validated official-website action.
 */
export function uniqueActionableBusinessResults<
  T extends BusinessDiscoveryPlatformBusiness & { claimed?: boolean },
>(businesses: readonly T[]): T[] {
  const ids = new Set<string>();
  const publicIdentities = new Set<string>();
  return businesses.filter((business) => {
    const hasDetail = hasPublicDetailAction(business.detailUrl);
    const hasWebsite = Boolean(business.website);
    if (!hasDetail && !hasWebsite) return false;
    if (ids.has(business.id)) return false;
    // The public list adapter does not receive a street address. Name/city is
    // intentionally presentation-only de-duplication; it never chooses a
    // canonical database record or alters the Duplicate vault.
    const identity = [
      normalizedPublicIdentity(business.name),
      normalizedPublicIdentity(business.city),
    ].join("|");
    if (publicIdentities.has(identity)) return false;
    ids.add(business.id);
    publicIdentities.add(identity);
    return true;
  });
}

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
  const businesses = uniqueActionableBusinessResults(input.businesses);
  const cards = businesses.slice(0, 5).map((business) => ({
    id: business.id,
    title: business.name,
    supportingText: business.isOnlineOnly
      ? `Online service or shop${business.description ? ` — ${business.description}` : ""}`
      : [
          business.distanceMiles != null
            ? `${business.distanceMiles.toFixed(1)} straight-line mi from your public origin`
            : null,
          business.description || `${business.category} in ${business.city}.`,
        ].filter(Boolean).join(" — "),
    isOnlineOnly: business.isOnlineOnly === true,
    matchReason: business.matchReasons[0]
      ? `Matched by ${business.matchReasons.join(" and ")}.`
      : `Matched as a ${input.subjectLabel} listing.`,
    verified: business.verified,
    claimed: business.claimed === true,
    distanceMiles: business.distanceMiles,
    ownershipEvidence: business.ownershipEvidence,
    actions: [
      ...(hasPublicDetailAction(business.detailUrl)
        ? [{ label: "View details" as const, url: business.detailUrl }]
        : []),
      ...(business.website ? [{ label: "Visit website" as const, url: business.website }] : []),
    ],
  }));
  return {
    cards,
    seeAll: businesses.length > cards.length
      ? { label: "See all matching listings", count: businesses.length }
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
