import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { businessesTable } from "@workspace/db";
import { describe, expect, it } from "vitest";
import { isPublicBusinessDiscoveryRead } from "../businesses/publicBusinessDiscoveryPolicy";

const root = resolve(import.meta.dirname, "../../../..");
const read = (relative: string) => readFileSync(resolve(root, relative), "utf8");

describe("founder business discoverability correction", () => {
  const routesIndex = read("artifacts/api-server/src/routes/index.ts");
  const businesses = read("artifacts/api-server/src/routes/businesses.ts");
  const schema = read("lib/db/src/schema/businesses.ts");
  const webCards = read("artifacts/web/src/features/businesses/LocationFirstBusinessDirectory.tsx");
  const webDetail = read("artifacts/web/src/pages/business-detail.tsx");
  const mobileDetail = read("artifacts/mobile/app/business/[id].tsx");
  const geocoder = read("artifacts/api-server/src/scripts/geocodeFounderBusinessInventory.ts");

  it("mounts only the canonical business router before the private platform member wall", () => {
    const businessMount = routesIndex.indexOf("router.use(businessesRouter)");
    const memberWall = routesIndex.indexOf("router.use(requireAuth)");
    expect(businessMount).toBeGreaterThan(-1);
    expect(memberWall).toBeGreaterThan(businessMount);
    expect(routesIndex.match(/router\.use\(businessesRouter\)/g)).toHaveLength(1);
  });

  it("whitelists only GET list, categories, map pins, mention search, and safe single-record detail", () => {
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses" })).toBe(true);
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/42" })).toBe(true);
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/mine" })).toBe(false);
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/duplicate-check" })).toBe(false);
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/42/contributions" })).toBe(false);
    expect(isPublicBusinessDiscoveryRead({ method: "POST", path: "/businesses" })).toBe(false);
    expect(businesses).toContain("return requireAuth(req, res, next)");
  });

  it("removes owner, billing, targeting, moderation, and pending-media fields from public records", () => {
    for (const field of [
      "submittedById", "stripeConnectAccountId", "sellerAgreementAcceptedAt",
      "marketplaceFeeLocked", "lockedFee", "membershipRenewalDate", "referredByCode",
      "targetAudience", "pendingPhotos", "flagCount", "flagStatus",
    ]) {
      expect(businesses).toContain(`${field}: _${field}`);
    }
    expect(businesses).toContain("withDistance.map((business) => toPublicBusinessRecord(business))");
    expect(businesses).toContain("...toPublicBusinessRecord(business)");
  });

  it("uses the canonical visibility function for normal and fuzzy searches without raw b-star rows", () => {
    expect(businesses.match(/publicBusinessVisibilityCondition\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(businesses).toContain("FROM public.public_businesses visible_business");
    expect(businesses).toContain("visible_business.id = ${businessesTable.id}");
    expect(businesses).not.toContain("SELECT b.*");
    expect(businesses).toContain("fuzzyRows = await db.select().from(businessesTable)");
  });

  it("compiles the canonical visibility predicate to public-view membership by business ID", () => {
    const predicate = sql`EXISTS (
      SELECT 1 FROM public.public_businesses visible_business
      WHERE visible_business.id = ${businessesTable.id}
    )`;
    const compiled = new PgDialect().sqlToQuery(predicate).sql.replace(/\s+/g, " ");
    expect(compiled).toContain('FROM public.public_businesses visible_business');
    expect(compiled).toContain('visible_business.id = "businesses"."id"');
    expect(compiled).not.toContain('business_record_is_public("businesses")');
  });

  it("returns source provenance through canonical typed business responses", () => {
    expect(schema).toContain('sourceUrl: text("source_url")');
    expect(webDetail).toContain("View supplied listing source");
    expect(mobileDetail).toContain('business.website ?? business.sourceUrl');
  });

  it("labels unpinned founder listings as searchable without fabricating coordinates", () => {
    expect(webCards).toContain("Searchable by city · Precise map pin pending");
    expect(webCards).toContain("record.latitude != null");
    expect(webCards).toContain("record.longitude != null");
  });

  it("geocodes only supplied street addresses under the local-staging guard and never marks a listing verified", () => {
    expect(geocoder).toContain("assertDirectoryReviewLocalStaging(process.env)");
    expect(geocoder).toContain("resolvePreciseBusinessLocation");
    expect(geocoder.match(/[0-9a-f]{64}/g)).toHaveLength(3);
    expect(geocoder).toContain("p.publication_action = 'create'");
    expect(geocoder).toContain("p.actor_id = $3");
    expect(geocoder).toContain("s.source_name = batch.source_name");
    expect(geocoder).toContain("b.listing_status = 'live_unclaimed'");
    expect(geocoder).toContain("address IS NOT DISTINCT FROM $7");
    expect(geocoder).toContain("c.id = ANY($4::uuid[])");
    expect(geocoder).toContain("UUID_PATTERN.test(business.id)");
    expect(geocoder).toContain("address ~ '[0-9]'");
    expect(geocoder).toContain("verified_at, created_at, updated_at");
    expect(geocoder).toContain("true, NULL, NOW(), NOW()");
    expect(geocoder).not.toContain("latitude = 0");
    expect(geocoder).not.toContain("longitude = 0");
  });
});
