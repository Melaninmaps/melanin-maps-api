import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const submitBusinessSource = source("../pages/submit-business.tsx");
const discoverSource = source("../pages/discover.tsx");
const businessesSource = source("../pages/businesses.tsx");
const locationFirstDirectorySource = source("../features/businesses/LocationFirstBusinessDirectory.tsx");
const addPlaceSource = source("../components/AddPlaceModal.tsx");
const adminEditSource = source("../components/AdminEditBusiness.tsx");
const communityVibesSource = source("../features/businesses/CommunityVibes.tsx");
const clientParamsSource = source("../../../../lib/api-zod/src/generated/types/listBusinessesParams.ts");

describe("web VIBESNOW taxonomy boundaries", () => {
  it("uses the shared category and dependent-subcategory contract for new submissions", () => {
    expect(submitBusinessSource).toContain("BUSINESS_CATEGORY_TAXONOMY");
    expect(submitBusinessSource).toContain("selectedCategory?.subcategories.map");
    expect(submitBusinessSource).not.toContain('const CATEGORIES = [');
    expect(discoverSource).toContain("BUSINESS_CATEGORY_TAXONOMY");
    expect(discoverSource).toContain("selectedCategory?.subcategories.map");
    expect(businessesSource).toContain("[\"All\", ...BUSINESS_CATEGORY_TAXONOMY.map");
    expect(businessesSource).toContain("business.category === activeCategory");
    expect(locationFirstDirectorySource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
    expect(addPlaceSource).toContain("BUSINESS_CATEGORY_TAXONOMY.map");
  });

  it("passes only canonical VIBE keys through the typed directory filter", () => {
    expect(discoverSource).toContain("normalizeOwnerExperienceKey(label)");
    expect(discoverSource).toContain("vibes: activeVibe ?? undefined");
    expect(clientParamsSource).toContain("vibes?: string;");
  });

  it("keeps web owner VIBES bounded and member feedback distinct", () => {
    expect(adminEditSource).toContain("return previous.length < 2 ? [...previous, key] : previous;");
    expect(adminEditSource).toContain("founder-approved VIBES");
    expect(adminEditSource).toContain("Member quick-review endorsements remain separate");
    expect(communityVibesSource).toContain("{choice.helperText ? (");
    expect(communityVibesSource).toContain("They are not ratings, owner claims, or verified facts.");
  });
});
