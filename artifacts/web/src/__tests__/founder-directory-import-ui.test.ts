import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("founder directory review UI", () => {
  it("is admin-gated and exposes evidence holds rather than blanket publication", () => {
    const page = source("../pages/founder-directory-imports.tsx");
    expect(page).toContain('user.role !== "admin"');
    expect(page).toContain("Required review holds");
    expect(page).toContain("Regulated profession evidence is required");
    expect(page).toContain("Current regulated-profession evidence");
    expect(page).toContain("Ownership evidence needs review");
    expect(page).toContain("Get validated address suggestion");
    expect(page).toContain("confirmedByReviewer: locationConfirmed");
    expect(page).toContain("I compared this location with the candidate address");
    expect(page).toContain("Reviewed source tier");
    expect(page).toContain("Run live official-source check");
    expect(page).toContain("Run live resource-source check");
    expect(page).toContain("validationToken: licenseValidationToken");
    expect(page).toContain("validationToken: resourceValidationToken");
    expect(page).toContain("expectedRevision");
    expect(page).toContain('"Idempotency-Key"');
  });

  it("labels businesses unclaimed/not verified and resources as a separate destination", () => {
    const page = source("../pages/founder-directory-imports.tsx");
    expect(page).toContain("Community/founder-listed • Unclaimed • Not verified");
    expect(page).toContain("Resources (never Businesses)");
    expect(page).toContain("Publish to Resources");
    expect(page).toContain("Publish unclaimed listing");
  });

  it("is reachable from the admin dashboard and a dedicated founder route", () => {
    const app = source("../App.tsx");
    const admin = source("../pages/admin.tsx");
    expect(app).toContain('path="/founder/directory-imports"');
    expect(admin).toContain('id: "directory-imports"');
    expect(admin).toContain("<FounderDirectoryImports embedded />");
  });
});

describe("canonical Resources web search", () => {
  it("queries canonical resources by keyword/city/state and explains the separate destination", () => {
    const resources = source("../pages/resources.tsx");
    expect(resources).toContain("api/resources?");
    expect(resources).toContain('params.set("q"');
    expect(resources).toContain('params.set("city"');
    expect(resources).toContain('params.set("state"');
    expect(resources).toContain("Community resource");
    expect(resources).toContain("stay separate from business listings");
  });
});
