export const HAIR_SERVICE_TAXONOMY = [
  { key: "loc_maintenance", label: "Loc maintenance" },
  { key: "starter_locs", label: "Starter locs" },
  { key: "retwist", label: "Retwists" },
  { key: "microlocs", label: "Microlocs" },
  { key: "natural_hair_care", label: "Natural-hair care" },
  { key: "protective_styling", label: "Braids and protective styles" },
  { key: "silk_press", label: "Silk presses" },
  { key: "wig_install", label: "Wig and lace installs" },
  { key: "sew_in", label: "Sew-ins" },
  { key: "wash_and_style", label: "Wash and style" },
] as const;

export type HairServiceKey = (typeof HAIR_SERVICE_TAXONOMY)[number]["key"];
export type ServiceEvidenceState = "owner_confirmed" | "official_source_documented" | "unverified";
export type ServiceOfferingStatus = "active" | "held";
export type InclusionState = "included" | "not_included" | "unknown";
export type PreparationRequirement = "required" | "not_required" | "unknown";

export type ServicePolicy = Readonly<{
  shampoo: InclusionState;
  conditioning: InclusionState;
  detangling: InclusionState;
  drying: InclusionState;
  arrivalPreparation: PreparationRequirement;
}>;

export type BusinessServiceOffering = Readonly<{
  id?: string;
  serviceKey: HairServiceKey;
  serviceLabel: string;
  policy: ServicePolicy;
  priceText: string | null;
  durationMinutes: number | null;
  bookingUrl: string | null;
  evidenceState: ServiceEvidenceState;
  status: ServiceOfferingStatus;
  sourceUrl: string | null;
  sourceLabel: string | null;
  observedAt: string | null;
  confidence: "high" | "medium" | "low" | null;
  lastConfirmedAt: string | null;
  note: string | null;
}>;

const SERVICE_KEYS = new Set<string>(HAIR_SERVICE_TAXONOMY.map((item) => item.key));
const EVIDENCE = new Set<ServiceEvidenceState>(["owner_confirmed", "official_source_documented", "unverified"]);
const STATUS = new Set<ServiceOfferingStatus>(["active", "held"]);
const INCLUSION = new Set<InclusionState>(["included", "not_included", "unknown"]);
const PREPARATION = new Set<PreparationRequirement>(["required", "not_required", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const NON_OFFICIAL_HOSTS = /(^|\.)(?:yelp\.|google\.|facebook\.com\/pages|yellowpages\.|mapquest\.|tripadvisor\.|foursquare\.|thumbtack\.|booksy\.|style?seat\.)/i;

export const UNKNOWN_SERVICE_POLICY: ServicePolicy = Object.freeze({
  shampoo: "unknown",
  conditioning: "unknown",
  detangling: "unknown",
  drying: "unknown",
  arrivalPreparation: "unknown",
});

export function serviceLabel(serviceKey: HairServiceKey): string {
  return HAIR_SERVICE_TAXONOMY.find((item) => item.key === serviceKey)!.label;
}

function cleanText(value: unknown, field: string, max: number, required = false): string | null {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error(`${field} is required`);
    return null;
  }
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const result = value.trim().replace(/\s+/g, " ");
  if (!result && required) throw new Error(`${field} is required`);
  if (result.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return result || null;
}

function cleanDate(value: unknown, field: string, required = false): string | null {
  const text = cleanText(value, field, 32, required);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new Error(`${field} must be an ISO calendar date`);
  }
  return text;
}

function cleanOfficialUrl(value: unknown, field: string, required = false): string | null {
  const text = cleanText(value, field, 2048, required);
  if (!text) return null;
  let parsed: URL;
  try { parsed = new URL(text); } catch { throw new Error(`${field} must be a valid https URL`); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error(`${field} must be a valid https URL`);
  }
  if (NON_OFFICIAL_HOSTS.test(parsed.hostname)) {
    throw new Error(`${field} cannot use a directory, marketplace, or search-listing domain`);
  }
  return parsed.toString();
}

function policy(value: unknown): ServicePolicy {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const inclusion = (key: keyof Omit<ServicePolicy, "arrivalPreparation">): InclusionState => {
    const item = source[key] ?? "unknown";
    if (typeof item !== "string" || !INCLUSION.has(item as InclusionState)) throw new Error(`${key} must be included, not_included, or unknown`);
    return item as InclusionState;
  };
  const arrival = source.arrivalPreparation ?? "unknown";
  if (typeof arrival !== "string" || !PREPARATION.has(arrival as PreparationRequirement)) {
    throw new Error("arrivalPreparation must be required, not_required, or unknown");
  }
  return { shampoo: inclusion("shampoo"), conditioning: inclusion("conditioning"), detangling: inclusion("detangling"), drying: inclusion("drying"), arrivalPreparation: arrival as PreparationRequirement };
}

export function validateServiceOffering(value: unknown): BusinessServiceOffering {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Each service offering must be an object");
  const input = value as Record<string, unknown>;
  const serviceKey = cleanText(input.serviceKey, "serviceKey", 64, true)!;
  if (!SERVICE_KEYS.has(serviceKey)) throw new Error("serviceKey is not in the controlled hair-service taxonomy");
  const evidenceState = cleanText(input.evidenceState, "evidenceState", 64, true) as ServiceEvidenceState;
  const status = (cleanText(input.status, "status", 24) ?? "active") as ServiceOfferingStatus;
  if (!EVIDENCE.has(evidenceState)) throw new Error("evidenceState must be owner_confirmed, official_source_documented, or unverified");
  if (!STATUS.has(status)) throw new Error("status must be active or held");
  const sourceUrl = cleanOfficialUrl(input.sourceUrl, "sourceUrl");
  const sourceLabel = cleanText(input.sourceLabel, "sourceLabel", 255);
  const observedAt = cleanDate(input.observedAt, "observedAt");
  const confidence = input.confidence == null || input.confidence === "" ? null : cleanText(input.confidence, "confidence", 16) as "high" | "medium" | "low";
  if (confidence && !CONFIDENCE.has(confidence)) throw new Error("confidence must be high, medium, or low");
  if (evidenceState !== "unverified" && (!sourceUrl || !sourceLabel || !observedAt || !confidence)) {
    throw new Error("Confirmed or officially documented services require a source URL, label, observation date, and confidence");
  }
  const durationValue = input.durationMinutes;
  const durationMinutes = durationValue == null || durationValue === "" ? null : Number(durationValue);
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440)) {
    throw new Error("durationMinutes must be a whole number between 5 and 1440");
  }
  return {
    serviceKey: serviceKey as HairServiceKey,
    serviceLabel: serviceLabel(serviceKey as HairServiceKey),
    policy: policy(input.policy),
    priceText: cleanText(input.priceText, "priceText", 120),
    durationMinutes,
    bookingUrl: cleanOfficialUrl(input.bookingUrl, "bookingUrl"),
    evidenceState,
    status,
    sourceUrl,
    sourceLabel,
    observedAt,
    confidence,
    lastConfirmedAt: cleanDate(input.lastConfirmedAt, "lastConfirmedAt") ?? observedAt,
    note: cleanText(input.note, "note", 1000),
  };
}

export function validateServiceOfferingSet(value: unknown): BusinessServiceOffering[] {
  if (!Array.isArray(value) || value.length > HAIR_SERVICE_TAXONOMY.length) throw new Error("offerings must be a bounded array");
  const offerings = value.map(validateServiceOffering);
  if (new Set(offerings.map((offering) => offering.serviceKey)).size !== offerings.length) throw new Error("Each controlled service may be listed only once");
  return offerings;
}

export function isConfirmedServiceOffering(offering: BusinessServiceOffering): boolean {
  return offering.status === "active" && offering.evidenceState !== "unverified";
}
