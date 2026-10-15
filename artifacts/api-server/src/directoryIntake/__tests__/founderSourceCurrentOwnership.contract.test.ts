import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(__dirname, "../../../../..");
const route = readFileSync(
  resolve(repositoryRoot, "artifacts/api-server/src/directoryIntake/registerFounderSourcePublicationRoutes.ts"),
  "utf8",
);

function currentOwnershipHelper(): string {
  const start = route.indexOf("async function recordCurrentProfileSourceOwnership");
  const end = route.indexOf("async function queueDuplicate", start);
  return route.slice(start, end);
}

describe("founder-source ownership for current public profiles", () => {
  it("adds source-documented ownership without changing public presence or lifecycle fields", () => {
    const helper = currentOwnershipHelper();
    expect(helper).toContain("business_source_directory_receipts");
    expect(helper).toContain('upsertEvidence(client, businessId, "ownership"');
    expect(helper).toContain("ownership_designations = (");
    expect(helper).toContain("black_owned = COALESCE(black_owned, false) OR $3");
    expect(helper).not.toMatch(/\bwebsite\s*=/);
    expect(helper).not.toMatch(/\blisting_status\s*=/);
    expect(helper).not.toMatch(/\bstatus\s*=/);
    expect(helper).not.toMatch(/\bpromotion_eligible\s*=/);
  });

  it("excludes Kinfolk Current profiles in planning and immediately before mutation when requested", () => {
    expect(route).toContain("excludeKinfolkCurrent: req.body?.excludeKinfolkCurrent === true");
    const manifest = route.slice(
      route.indexOf("function publicManifest"),
      route.indexOf("export function registerFounderSourcePublicationRoutes"),
    );
    expect(manifest).toMatch(/request\.excludeKinfolkCurrent\s*&&\s*match\.existingBusinessId\s*&&\s*kinfolkCurrentIds\.has\(match\.existingBusinessId\)/);
    expect(manifest).toContain("kinfolkCurrentExcluded:");

    const publication = route.slice(route.indexOf('app.post("/api/admin/founder-source-publication"'));
    const liveGuardStart = publication.indexOf('if (state === "kinfolk_current" && request.excludeKinfolkCurrent)');
    const liveGuardEnd = publication.indexOf('if (state === "kinfolk_current")', liveGuardStart + 1);
    const liveGuard = publication.slice(liveGuardStart, liveGuardEnd);
    expect(liveGuard).toContain("liveKinfolkExcluded += 1");
    expect(liveGuard).toContain("continue;");
    expect(liveGuard).not.toContain("recordCurrentProfileSourceOwnership");
    expect(publication).toContain("liveKinfolkExcluded,");
  });

  it("can run only the current-profile ownership pass without creating or enriching other profiles", () => {
    expect(route).toContain("currentOnly: req.body?.currentOnly === true");
    expect(route).toContain("const plannedCreates = request.currentOnly ? []");
    expect(route).toContain("const canonicalProfileHolds = request.currentOnly ? []");
    expect(route).toContain("const newCandidates = (request.currentOnly || request.existingOnly ? [] : plannedCreates)");
    expect(route).toContain("!request.currentOnly || Boolean(match.existingBusinessId && kinfolkCurrentIds.has(match.existingBusinessId))");
  });

  it("scopes the read-only receipt audit to the requested ownership source", () => {
    expect(route).toContain('app.get("/api/admin/founder-source-publication/receipts"');
    expect(route).toContain('ownershipScope must be black or latino.');
    expect(route).toContain(".filter((candidate) => matchesRequestedOwnershipScope(candidate, ownershipScope))");
    expect(route).toContain("requestedOwnershipScope: ownershipScope");
  });

  it("returns profile website and social fields only through the read-only receipt audit", () => {
    const receiptRoute = route.slice(
      route.indexOf('app.get("/api/admin/founder-source-publication/receipts"'),
      route.indexOf('app.post("/api/admin/founder-source-publication/repair-identity-mismatches"'),
    );
    expect(receiptRoute).toContain("b.website, b.instagram, b.tiktok, b.facebook");
    expect(receiptRoute).not.toContain("UPDATE businesses");
  });
});
