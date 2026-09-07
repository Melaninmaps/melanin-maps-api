import React from "react";

export type UniversalSearchItem = {
  id?: string | number | null;
  name?: string | null;
  title?: string | null;
  category?: string | null;
  subcategory?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  description?: string | null;
  date?: string | null;
  website?: string | null;
  verified?: boolean | null;
  listingStatus?: string | null;
  listing_status?: string | null;
  ownershipClaim?: string | null;
  ownership_claim?: string | null;
  heritageCategory?: string | null;
  heritage_category?: string | null;
  result_type?: string | null;
};

export type UniversalSearchResult = {
  query: string;
  intentType?: string;
  totalResults: number;
  fallbackMessage?: string | null;
  results: {
    businesses: UniversalSearchItem[];
    events: UniversalSearchItem[];
    heritage: UniversalSearchItem[];
    libraryTopics: UniversalSearchItem[];
    communityOrgs?: UniversalSearchItem[];
  };
};

type ResultKind = "Business" | "Event" | "Heritage / cultural site" | "Library topic / resource" | "Community organization";

type Props = {
  result: UniversalSearchResult;
  surface: "Discover" | "Map";
  compact?: boolean;
  includeKinds?: readonly ResultKind[];
  hideWhenEmpty?: boolean;
};

/** Only permit public HTTPS destinations. Private, local, credentialed, and malformed URLs are rejected. */
export function safePublicHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return null;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const parts = host.split(".").map(Number);
      if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
      const [a, b] = parts;
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254)
        || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
        || (a === 100 && b >= 64 && b <= 127)) return null;
    }

    if (host.includes(":")) {
      const normalized = host.toLowerCase();
      if (normalized === "::" || normalized === "::1" || normalized.startsWith("fc")
        || normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)
        || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.")
        || normalized.startsWith("::ffff:192.168.")) return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function nameOf(item: UniversalSearchItem): string {
  return String(item.name ?? item.title ?? "Untitled result");
}

function locationOf(item: UniversalSearchItem): string {
  return [item.city, item.state ?? item.country].filter(Boolean).join(", ");
}

function businessStatus(item: UniversalSearchItem): string {
  const listingStatus = item.listingStatus ?? item.listing_status;
  if (listingStatus === "live_unclaimed") return "Community/founder-listed · Unclaimed · Not verified";
  if (item.verified) return "Verified business listing";
  return "Business listing · Not verified";
}

function ownershipStatus(item: UniversalSearchItem): string | null {
  const ownership = item.ownershipClaim ?? item.ownership_claim;
  if (ownership === "community_reported_minority_owned") return "Community-reported minority-owned · Not verified";
  if (ownership === "community_reported_non_minority_owned") return "Community-reported non-minority-owned · Not verified";
  return null;
}

function internalHref(kind: ResultKind, item: UniversalSearchItem): string {
  const id = item.id == null ? "" : encodeURIComponent(String(item.id));
  const name = encodeURIComponent(nameOf(item));
  if (kind === "Business" && id) return `/businesses/${id}`;
  if (kind === "Heritage / cultural site" && id) return `/cultural-sites/${id}`;
  if (kind === "Event") return `/events?q=${name}`;
  if (kind === "Library topic / resource") return `/library/search?q=${name}`;
  return `/community?q=${name}`;
}

function statusFor(kind: ResultKind, item: UniversalSearchItem): string {
  if (kind === "Business") return businessStatus(item);
  if (kind === "Event") return "Published community event";
  if (kind === "Heritage / cultural site") return item.heritageCategory ?? item.heritage_category ?? "Heritage / cultural site";
  if (kind === "Library topic / resource") return "Library topic / resource";
  return "Community organization";
}

function ResultCard({ item, kind, compact }: { item: UniversalSearchItem; kind: ResultKind; compact: boolean }) {
  const safeWebsite = kind === "Community organization" ? safePublicHttpsUrl(item.website) : null;
  const href = safeWebsite ?? internalHref(kind, item);
  const external = Boolean(safeWebsite);
  const ownership = kind === "Business" ? ownershipStatus(item) : null;
  return (
    <article className={`rounded-2xl border border-[#3A1F0E]/10 bg-white ${compact ? "p-3" : "p-5"}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8D5C17]">{kind}</p>
      <h3 className={`${compact ? "mt-1 text-sm" : "mt-2 text-lg"} font-bold text-[#2B1507]`}>{nameOf(item)}</h3>
      {locationOf(item) && <p className="mt-1 text-xs text-[#3A1F0E]/60">{locationOf(item)}</p>}
      <p className="mt-2 text-xs font-semibold text-[#6B4A2F]">{statusFor(kind, item)}</p>
      {ownership && <p className="mt-1 text-xs font-semibold text-[#6B4A2F]">{ownership}</p>}
      {item.description && <p className={`mt-2 text-sm leading-6 text-[#3A1F0E]/65 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{item.description}</p>}
      <a
        className="mt-3 inline-flex text-xs font-bold text-[#CA922B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B]"
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {external ? "Visit public website →" : "View on MWM →"}
      </a>
    </article>
  );
}

function ResultSection({ title, kind, items, compact }: { title: string; kind: ResultKind; items: UniversalSearchItem[]; compact: boolean }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`universal-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="space-y-3">
      <h2 id={`universal-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="text-xs font-bold uppercase tracking-[0.14em] text-[#3A1F0E]/65">
        {title} ({items.length})
      </h2>
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((item, index) => <ResultCard key={`${kind}-${String(item.id ?? nameOf(item))}-${index}`} item={item} kind={kind} compact={compact} />)}
      </div>
    </section>
  );
}

export function UniversalSearchResults({
  result,
  surface,
  compact = false,
  includeKinds,
  hideWhenEmpty = false,
}: Props) {
  const allowedKinds = includeKinds ? new Set<ResultKind>(includeKinds) : null;
  const groups = [
    { title: "Businesses", kind: "Business" as const, items: result.results.businesses ?? [] },
    { title: "Events", kind: "Event" as const, items: result.results.events ?? [] },
    { title: "Heritage & cultural sites", kind: "Heritage / cultural site" as const, items: result.results.heritage ?? [] },
    { title: "Library topics & resources", kind: "Library topic / resource" as const, items: result.results.libraryTopics ?? [] },
    { title: "Community organizations", kind: "Community organization" as const, items: result.results.communityOrgs ?? [] },
  ].filter((group) => !allowedKinds || allowedKinds.has(group.kind));
  const visibleCount = groups.reduce((count, group) => count + group.items.length, 0);

  if (hideWhenEmpty && visibleCount === 0) return null;

  return (
    <div data-testid={`universal-results-${surface.toLowerCase()}`} data-surface={surface} className={compact ? "space-y-5 p-4" : "space-y-8"}>
      <div aria-live="polite">
        <p className="font-bold text-[#2B1507]">{visibleCount} {visibleCount === 1 ? "result" : "results"} across the community</p>
        <p className="mt-1 text-xs text-[#3A1F0E]/60">Results are grouped by truthful record type. Travel destinations appear only when returned as a supported API type.</p>
      </div>
      {visibleCount === 0 ? (
        <section className="rounded-2xl border border-[#CA922B]/30 bg-white p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">No published matches yet</h2>
          <p className="mt-2 text-sm text-[#3A1F0E]/65">Try a broader phrase or another place. No outside or demo records were added.</p>
        </section>
      ) : groups.map((group) => <ResultSection key={group.title} {...group} compact={compact} />)}
    </div>
  );
}

export default UniversalSearchResults;
