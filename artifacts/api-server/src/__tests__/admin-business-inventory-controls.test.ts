import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const adminRoute = source("../routes/admin.ts");
const businessRoutes = source("../routes/businesses.ts");
const adminPublisher = source("../businesses/registerAdminPublishAndClaimRoutes.ts");
const migrations = source("../lib/startup-migrations.ts");
const businessSchema = source("../../../../lib/db/src/schema/businesses.ts");
const adminScreen = source("../../../web/src/pages/admin.tsx");
const adminAddBusiness = source("../../../web/src/components/AdminAddBusiness.tsx");
const adminEditBusiness = source("../../../web/src/components/AdminEditBusiness.tsx");
const publicBusinessDetail = source("../../../web/src/pages/business-detail.tsx");
const mobileBusinessHook = source("../../../mobile/hooks/useBusinesses.ts");

describe("administrator full-inventory and reversible duplicate controls", () => {
  it("returns one server-filtered page instead of sending the full inventory to the browser", () => {
    expect(adminRoute).toContain("const DEFAULT_INVENTORY_PAGE_SIZE = 50");
    expect(adminRoute).toContain("const MAX_INVENTORY_PAGE_SIZE = 100");
    expect(adminRoute).toContain("LIMIT $${filterParams.length + 1}");
    expect(adminRoute).toContain("OFFSET $${filterParams.length + 2}");
    expect(adminRoute).toContain("filteredTotal");
    expect(adminRoute).toContain("cityOptions");
    expect(adminRoute).toContain("serviceOptions");
    expect(adminRoute).toContain("inventoryIsTruncated");
    expect(adminRoute).toContain("inventoryLimit");
    expect(adminRoute).toContain("inventoryTotal");
    expect(adminRoute).toContain("SELECT COUNT(*)::text AS total FROM businesses");
    expect(adminRoute).not.toContain("ORDER BY created_at DESC\n       LIMIT 500");
  });

  it("keeps an incomplete additive metadata migration from hiding the full inventory", () => {
    expect(adminRoute).toContain("to_jsonb(businesses)->>'research_source_label'");
    expect(adminRoute).toContain("to_jsonb(businesses)->>'kinfolk_recommendation_reason'");
    expect(adminScreen).toContain("businessInventoryTotal");
    expect(adminScreen).toContain("All businesses ({businessInventoryTotal.toLocaleString()})");
    expect(adminScreen).toContain("businessInventoryTotalPages");
    expect(adminScreen).toContain("changeBusinessInventoryPage");
    expect(adminScreen).toContain("Loading business inventory");
    expect(adminScreen).toContain("Business inventory rows per page");
    expect(adminScreen).toContain("<option value={100}>100</option>");
  });

  it("supports city, service, date-added, and selected-row archive controls in the web dashboard", () => {
    expect(adminScreen).toContain("All cities");
    expect(adminScreen).toContain("All business types and services");
    expect(adminScreen).toContain("businessServiceOptions");
    expect(adminScreen).toContain("applyBusinessInventoryFilters");
    expect(adminScreen).toContain("Added on or after");
    expect(adminScreen).toContain("Added on or before");
    expect(adminScreen).toContain("Archive selected");
    expect(adminScreen).toContain("api/admin/businesses/listing-status");
  });

  it("keeps same-name duplicate review together with a safe server-side A–Z order", () => {
    expect(adminRoute).toContain('sort === "name_asc"');
    expect(adminRoute).toContain("LOWER(name) ASC NULLS LAST, id ASC");
    expect(adminRoute).toContain("created_at DESC, id ASC");
    expect(adminScreen).toContain("Business name A–Z");
    expect(adminScreen).toContain('params.set("sort", sortValue)');
  });

  it("shows administrators website and social links and can isolate missing websites", () => {
    for (const field of ["website", "instagram", "tiktok", "facebook"]) {
      expect(adminRoute).toContain(field);
      expect(adminScreen).toContain(field);
    }
    expect(adminScreen).toContain("Missing a website");
    expect(adminScreen).toContain("No website or social media");
    expect(adminScreen).toContain("Website &amp; social");
    expect(adminScreen).toContain("publicSocialHref");
  });

  it("publishes saved Admin links and profile categories to fresh web and mobile profile reads", () => {
    expect(businessRoutes).toContain('"/admin/businesses/:id/profile"');
    for (const field of ["website", "instagram", "tiktok", "facebook", "category", "subcategory", "updatedAt"]) {
      expect(businessRoutes).toContain(`businessesTable.${field}`);
    }
    expect(businessRoutes).toContain("sendDynamicJson(res, {");
    expect(businessRoutes).toContain("...toPublicBusinessRecord(business)");
    expect(adminEditBusiness).toContain("public profile links are live now");
    expect(publicBusinessDetail).toContain("refetchOnWindowFocus: true");
    expect(mobileBusinessHook).toContain("useFocusEffect");
    expect(mobileBusinessHook).toContain("/api/businesses/${id}");
  });

  it("keeps a bulk removal reversible and auditable rather than deleting businesses", () => {
    expect(adminRoute).toContain("Select between 1 and 500 businesses.");
    expect(adminRoute).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("remove_public_discovery");
    expect(adminScreen).toContain("research, source, or Kinfolk context");
    expect(adminRoute).not.toMatch(/DELETE\s+FROM\s+(?:public\.)?businesses\b/i);
  });

  it("stores intake evidence and a Kinfolk recommendation context through an archive", () => {
    for (const field of [
      "researchSourceLabel",
      "researchSourceUrl",
      "kinfolkRecommendationReason",
      "intakeBatchReference",
    ]) {
      expect(businessSchema).toContain(field);
      expect(adminPublisher).toContain(field);
      expect(adminAddBusiness).toContain(field);
    }
    expect(migrations).toContain("ensureBusinessIntakeMetadataSchema");
    expect(migrations).toContain("kinfolk_recommendation_reason");
  });

  it("creates a map pin only from a successfully geocoded supplied street address", () => {
    expect(adminPublisher).toContain("const coordinates = input.address");
    expect(adminPublisher).toContain("if (coordinates)");
    expect(adminPublisher).not.toContain('return { lat: "0", lng: "0" }');
    expect(adminPublisher).toContain("searchable MWM profile without a map pin");
  });
});
