import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);
const start = source.indexOf('router.post("/kinfolk/relocation"');
const relocation = source.slice(start, source.indexOf("\nrouter.", start + 1));

describe("governed relocation concierge recommendations", () => {
  it("reads named relocation listings only from the governed public repository", () => {
    expect(relocation).toContain("validateKinfolkCityScope");
    expect(relocation).toContain("governedBusinessRepository.findDestinationCatalog");
    expect(relocation).toContain("Relocation is a Kinfolk recommendation surface");
    expect(relocation).not.toMatch(/\.from\(businessesTable\)|businessesTable\.blackOwned|businessesTable\.status/);
  });

  it("fails closed to a truthful no-listing state for missing or invalid city scope", () => {
    expect(relocation).toContain("if (toCity && toState)");
    expect(relocation).toContain("relocationScope = null");
    expect(relocation).toContain("There are no eligible governed Mapping With Melanin listings");
    expect(relocation).toContain("Do not name a business");
  });

  it("forbids general-knowledge business names and category broadening in the provider prompt", () => {
    expect(relocation).toContain("these are the only businesses that may be named in this relocation answer");
    expect(relocation).toContain("only when its supplied category, subcategory, or tags actually fit the current relocation need");
    expect(relocation).toContain("Never name, link, promote, label as minority-owned, or call verified an external/general-knowledge business");
    expect(relocation).toContain("Do not use general knowledge for named businesses");
    expect(relocation).not.toContain("from the platform or your knowledge");
    expect(relocation).not.toContain("If none match, use general knowledge");
  });

  it("replaces provider business card facts with exact catalog facts and discards unknown names", () => {
    expect(relocation).toContain("const governedByNormalizedName = new Map");
    expect(relocation).toContain("normalizeExactBusinessName");
    expect(relocation).toContain("if (!business || selectedBusinessIds.has(String(business.id))) return []");
    expect(relocation).toContain("name: business.name");
    expect(relocation).toContain("description: business.description");
    expect(relocation).toContain("phone: business.phone");
    expect(relocation).toContain("website: business.website");
    expect(relocation).toContain("businesses: relocationBusinesses");
  });

  it("allows a neighborhood suggestion to expose a business name only when it is an exact governed listing", () => {
    expect(relocation).toContain("minorityBiz: governedBusiness?.name ?? null");
    expect(relocation).toContain("Exact supplied governed listing name, or null");
    expect(relocation).toContain("A location suggestion must not invent or imply a business recommendation");
  });
});
