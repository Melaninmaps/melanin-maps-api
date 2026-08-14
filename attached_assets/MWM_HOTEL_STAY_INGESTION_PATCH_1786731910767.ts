import { z } from "zod";
import { db } from "../db";
import { businesses, businessSources, businessReviewItems } from "../schema";
import { and, eq, or, sql } from "drizzle-orm";

const HotelInput = z.object({
  name: z.string().trim().min(2).max(240),
  address: z.string().trim().min(5).max(400),
  sourceInput: z.enum(["hotel_stay", "user_address", "url", "screenshot"]).default("hotel_stay"),
});

type ProviderPlace = {
  providerPlaceId: string | null;
  name: string;
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  types: string[];
  providerUrl: string | null;
};

type Resolution = {
  input: z.infer<typeof HotelInput>;
  place: ProviderPlace | null;
  status: "VERIFIED_ADD" | "EXISTING_UPDATE" | "MANUAL_REVIEW";
  reason: string | null;
  confidence: number;
};

function normalize(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function phoneKey(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function domain(value: string | null | undefined): string | null {
  if (!value) return null;
  try { return new URL(value).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
}

function distanceMeters(a: ProviderPlace, b: any): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  const rad = (x: number) => x * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

function isHotelLike(place: ProviderPlace): boolean {
  const text = `${place.name} ${(place.types ?? []).join(" ")}`.toLowerCase();
  return /hotel|lodging|motel|resort|inn|hostel|extended stay|bed and breakfast/.test(text);
}

function strongNameMatch(inputName: string, providerName: string): boolean {
  const a = normalize(inputName), b = normalize(providerName);
  return a === b || a.includes(b) || b.includes(a);
}

function addressEvidence(place: ProviderPlace): boolean {
  return Boolean(place.formattedAddress && place.city && place.state && place.country);
}

function evidenceFor(input: z.infer<typeof HotelInput>, place: ProviderPlace) {
  const now = new Date().toISOString();
  return [
    { url: place.providerUrl, sourceType: "google_places", field: "identity", supports: true, excerpt: place.name, extractedAt: now },
    { url: place.providerUrl, sourceType: "google_places", field: "address", supports: addressEvidence(place), excerpt: place.formattedAddress, extractedAt: now },
    { url: place.providerUrl, sourceType: "google_places", field: "category", supports: isHotelLike(place), excerpt: (place.types ?? []).join(", "), extractedAt: now },
    { url: null, sourceType: "user_supplied", field: "user_input", supports: true, excerpt: `${input.name} — ${input.address}`, extractedAt: now },
  ];
}

/**
 * Resolve name + address through the configured provider. The provider must
 * return one best candidate plus its score; Replit must not synthesize fields.
 */
export async function resolveHotelStay(raw: unknown, geocodeHotel: (query: string) => Promise<{ place: ProviderPlace | null; score: number }>): Promise<Resolution> {
  const input = HotelInput.parse(raw);
  const resolved = await geocodeHotel(`${input.name}, ${input.address}`);
  const place = resolved.place;

  if (!place) return { input, place: null, status: "MANUAL_REVIEW", reason: "provider_no_match", confidence: 0 };
  if (!strongNameMatch(input.name, place.name)) return { input, place, status: "MANUAL_REVIEW", reason: "provider_name_mismatch", confidence: resolved.score };
  if (!addressEvidence(place)) return { input, place, status: "MANUAL_REVIEW", reason: "provider_address_incomplete", confidence: resolved.score };
  if (!isHotelLike(place)) return { input, place, status: "MANUAL_REVIEW", reason: "resolved_place_not_hotel", confidence: resolved.score };
  if (resolved.score < 0.85) return { input, place, status: "MANUAL_REVIEW", reason: "provider_confidence_below_threshold", confidence: resolved.score };

  const existing = await findCanonicalHotel(place);
  if (existing) return { input, place, status: "EXISTING_UPDATE", reason: null, confidence: resolved.score };
  return { input, place, status: "VERIFIED_ADD", reason: null, confidence: resolved.score };
}

async function findCanonicalHotel(place: ProviderPlace) {
  const providerId = place.providerPlaceId;
  const name = normalize(place.name);
  const phone = phoneKey(place.phone);
  const webDomain = domain(place.website);
  const candidates = await db.select().from(businesses).where(or(
    providerId ? eq(businesses.providerPlaceId, providerId) : sql`false`,
    phone ? eq(businesses.phone, phone) : sql`false`,
    webDomain ? eq(businesses.websiteDomain, webDomain) : sql`false`,
    and(eq(businesses.normalizedName, name), eq(businesses.category, "hotel")),
  ));
  return candidates.find((row: any) => {
    const meters = distanceMeters(place, row);
    return meters != null && meters <= 150;
  }) ?? candidates[0] ?? null;
}

export async function ingestHotelStay(raw: unknown, geocodeHotel: (query: string) => Promise<{ place: ProviderPlace | null; score: number }>) {
  const resolution = await resolveHotelStay(raw, geocodeHotel);
  const now = new Date();

  if (resolution.status === "MANUAL_REVIEW" || !resolution.place) {
    await db.insert(businessReviewItems).values({
      itemType: "business_candidate",
      status: "pending",
      reason: resolution.reason,
      payload: { input: resolution.input, resolvedPlace: resolution.place, confidence: resolution.confidence },
      createdAt: now,
    });
    return { status: "MANUAL_REVIEW" as const, reason: resolution.reason, canonicalId: null };
  }

  const place = resolution.place;
  const evidence = evidenceFor(resolution.input, place);
  const key = ["hotel", place.providerPlaceId ?? "", normalize(place.name), normalize(place.formattedAddress), place.latitude ?? "", place.longitude ?? ""].join("|");

  return db.transaction(async (tx) => {
    const existing = await findCanonicalHotel(place);
    if (existing) {
      await tx.update(businesses).set({
        providerPlaceId: existing.providerPlaceId ?? place.providerPlaceId,
        address: existing.address ?? place.formattedAddress,
        city: existing.city ?? place.city,
        state: existing.state ?? place.state,
        postalCode: existing.postalCode ?? place.postalCode,
        country: existing.country ?? place.country,
        latitude: existing.latitude ?? place.latitude,
        longitude: existing.longitude ?? place.longitude,
        phone: existing.phone ?? phoneKey(place.phone),
        website: existing.website ?? place.website,
        websiteDomain: existing.websiteDomain ?? domain(place.website),
        sourceEvidence: mergeEvidence(existing.sourceEvidence ?? [], evidence),
        updatedAt: now,
      }).where(eq(businesses.id, existing.id));
      return { status: "EXISTING_UPDATE" as const, canonicalId: existing.id };
    }

    const inserted = await tx.insert(businesses).values({
      name: place.name,
      normalizedName: normalize(place.name),
      category: "hotel",
      address: place.formattedAddress,
      city: place.city,
      state: place.state,
      postalCode: place.postalCode,
      country: place.country,
      latitude: place.latitude,
      longitude: place.longitude,
      phone: phoneKey(place.phone),
      website: place.website,
      websiteDomain: domain(place.website),
      providerPlaceId: place.providerPlaceId,
      sourceEvidence: evidence,
      dedupeKey: key,
      status: "active",
      isDuplicate: false,
      permanentlyHidden: false,
    }).onConflictDoNothing({ target: businesses.dedupeKey }).returning({ id: businesses.id });

    if (!inserted[0]) {
      const canonical = await tx.select({ id: businesses.id }).from(businesses).where(eq(businesses.dedupeKey, key)).limit(1);
      return canonical[0] ? { status: "EXISTING_UPDATE" as const, canonicalId: canonical[0].id } : { status: "MANUAL_REVIEW" as const, canonicalId: null };
    }
    return { status: "VERIFIED_ADD" as const, canonicalId: inserted[0].id };
  });
}

function mergeEvidence(existing: any[], incoming: any[]) {
  const byKey = new Map<string, any>();
  for (const e of [...existing, ...incoming]) byKey.set(`${e.field}|${e.url}|${e.sourceType}`, e);
  return [...byKey.values()];
}
