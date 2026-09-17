import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("in-app resource provider contract", () => {
  const api = source("../routes/resources.ts");
  const hub = source("../../../mobile/app/financial-hub.tsx");
  const providerScreen = source("../../../mobile/app/resource-providers.tsx");
  const resourcesScreen = source("../../../mobile/app/(tabs)/resources.tsx");

  it("has a literal provider route before the parameterized resource route", () => {
    const providerRoute = api.indexOf('router.get("/resources/providers/:serviceKey"');
    const resourceRoute = api.indexOf('router.get("/resources/:id"');
    expect(providerRoute).toBeGreaterThan(-1);
    expect(providerRoute).toBeLessThan(resourceRoute);
    expect(api).toContain('"financial-coaching"');
    expect(api).toContain("eq(resourcesTable.isActive, true)");
    expect(api).toContain("res.json({ serviceKey: req.params.serviceKey, label: need.label, providers, total: providers.length })");
  });

  it("keeps the financial coach journey in the app", () => {
    expect(hub).toContain('router.push("/resource-providers?service=financial-coaching" as never)');
    expect(hub).not.toContain('Linking.openURL("https://www.operationhope.org")');
    expect(providerScreen).toContain("/api/resources/providers/${serviceKey}");
    expect(providerScreen).toContain("No verified coaches are available here yet");
    expect(providerScreen).toContain('router.replace("/(tabs)/resources" as never)');
  });

  it("keeps empty results separate from retryable loading failures", () => {
    expect(resourcesScreen).toContain("resourceLoadError");
    expect(resourcesScreen).toContain("opportunityLoadError");
    expect(resourcesScreen).toContain("Resources could not be loaded");
    expect(resourcesScreen).toContain("No resources found");
    expect(resourcesScreen).toContain("Opportunities could not be loaded");
    expect(resourcesScreen).toContain("No opportunities yet");
  });
});
