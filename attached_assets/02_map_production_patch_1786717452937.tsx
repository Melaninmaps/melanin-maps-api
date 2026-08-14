/* SURGICAL PATCH 02 — map/web/map.tsx */

// A. Add these helpers near the existing city/search helpers.
function parseMapSearchPhrase(input: string): {
  search: string;
  city?: string;
  ownership?: "black-owned";
  category?: string;
} {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const cityMatch = lower.match(/\bin\s+([a-z][a-z .'-]+?)(?:\s*$|\s+(?:near|around)\b)/i);
  const city = cityMatch?.[1]?.trim().replace(/[.,]+$/, "");
  const ownership = /\bblack[- ]owned\b/i.test(raw) ? "black-owned" as const : undefined;
  const category = /\bgrocery\s+stores?\b/i.test(raw) ? "Food" :
    /\brestaurants?\b|\bdining\b|\bfood\b/i.test(raw) ? "Food" : undefined;
  const search = raw
    .replace(/\bblack[- ]owned\b/ig, "")
    .replace(/\bgrocery\s+stores?\b/ig, "")
    .replace(/\brestaurants?\b|\bdining\b|\bfood\b/ig, "")
    .replace(/\bin\s+[a-z][a-z .'-]+?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return { search, city, ownership, category };
}

function publicBusinessVisibilitySql(alias = "b"): string {
  return `${alias}.status = 'active'
    AND COALESCE(${alias}.is_duplicate, false) = false
    AND COALESCE(${alias}.permanently_hidden, false) = false
    AND COALESCE(${alias}.listing_status, 'live_unclaimed') IN ('live_unclaimed','live_claimed')`;
}

// B. Replace the public map-pins SQL in routes/businesses.ts.
// This is required in addition to the frontend change.
/*
SELECT ...
FROM businesses b
WHERE b.status = 'active'
  AND COALESCE(b.is_duplicate, false) = false
  AND COALESCE(b.permanently_hidden, false) = false
  AND COALESCE(b.listing_status, 'live_unclaimed') IN ('live_unclaimed','live_claimed')
  AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
  AND b.latitude != 0 AND b.longitude != 0
*/

// C. In map.tsx, when submitting search, use the real search endpoint with parsed params.
// Replace the existing universal-search-only submit branch with this request first:
const parsedPhrase = parseMapSearchPhrase(search);
const params = new URLSearchParams({ limit: "200" });
if (parsedPhrase.search) params.set("search", parsedPhrase.search);
if (parsedPhrase.city) params.set("city", parsedPhrase.city);
if (parsedPhrase.ownership) params.set("ownership", parsedPhrase.ownership);
if (parsedPhrase.category) params.set("category", parsedPhrase.category);
const businessResponse = await fetch(`${BASE}api/businesses?${params.toString()}`, {
  credentials: "include",
});
const businessPayload = await businessResponse.json();
const businesses = Array.isArray(businessPayload.businesses) ? businessPayload.businesses : [];
setUniversalResults({
  results: { businesses },
  total: Number(businessPayload.total ?? businesses.length),
  fallbackMessage: businesses.length === 0
    ? `No verified MWM listings matched “${search}”. Try a shorter phrase or ask KinfolkAI to research it.`
    : undefined,
});

// D. Replace the placeholder branch at map.tsx lines 1639–1659.
// Do not hide the entire list when the Google Maps key is absent.
if (apiKeyError) {
  return (
    <>
      {showAddPlace && <AddPlaceModal initialSearch={search} onClose={() => setShowAddPlace(false)} />}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#FAF6EF]">
        {renderSidebar()}
        <div className="hidden sm:flex flex-1 min-w-0 flex-col items-center justify-center bg-[#F5EBD8] text-center px-8 overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-[#CA922B]/15 flex items-center justify-center mb-5">
            <MapPin className="w-9 h-9 text-[#CA922B]" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-2">Map view unavailable</h2>
          <p className="text-sm text-[#3A1F0E]/60 max-w-sm leading-relaxed">
            Search and business results remain available. The map provider key is not configured in this deployment.
          </p>
          <p className="text-xs text-[#3A1F0E]/45 max-w-sm mt-2">
            Replit: set the browser-safe Google Maps key in the Railway environment and rebuild the frontend.
          </p>
        </div>
      </div>
    </>
  );
}

// E. The real map branch must use the pins returned by the filtered query.
// Never render pins from an unfiltered all-business response.
const visiblePins = pins.filter((p: any) =>
  p.status === "active" && p.isDuplicate !== true && p.permanentlyHidden !== true
);

// F. Required environment/deployment check.
// Railway must expose the browser key using the actual Vite/React build prefix used by this project.
// Do not put a server-only Google secret in client code.
// If this project uses Vite, set VITE_GOOGLE_MAPS_API_KEY in Railway and rebuild.
