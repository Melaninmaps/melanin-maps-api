import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("member-business owner completion UI", () => {
  const app = source("../App.tsx");
  const profile = source("../pages/profile.tsx");
  const claim = source("../pages/business-claim.tsx");
  const dashboard = source("../pages/business-dashboard.tsx");
  const founderClaims = source("../pages/founder-business-claims.tsx");

  it("keeps personal login and private business claim contact distinct", () => {
    expect(claim).toContain("can differ from your member-login email");
    expect(claim).not.toContain('setForm((current) => ({ ...current, businessEmail: user.email');
    expect(claim).toContain('value="authorized_representative"');
    expect(claim).toContain("Managers are invited by an approved owner");
  });

  it("provides signed-in status, code, manager invitation, and team routes", () => {
    expect(app).toContain('path="/business-claims"');
    expect(app).toContain('path="/business-manager-invitations/accept"');
    expect(app).toContain('path="/business-team"');
    expect(app).toContain('path="/admin/business-claims"');
    expect(profile).toContain('href="/business-claims"');
    expect(profile).toContain('href="/business-manager-invitations/accept"');
  });

  it("keeps owner-only dashboard controls unavailable to managers", () => {
    expect(dashboard).toContain('const selectedIsOwner = selected?.managementRole === "owner"');
    expect(dashboard).toContain('Manage Team');
    expect(dashboard).toContain('activeTab === "promote" && selectedIsOwner');
    expect(dashboard).toContain('activeTab === "global" && selectedIsOwner');
  });

  it("uses the reviewed private verification endpoints", () => {
    expect(claim).toContain('/verification-code`');
    expect(claim).toContain('/verification-code/confirm`');
    expect(claim).toContain("does not approve the claim or alter the public listing");
  });

  it("keeps founder decisions behind private review and explicit server actions", () => {
    expect(founderClaims).toContain("api/admin/business-claims?status=");
    expect(founderClaims).toContain('"/approve"');
    expect(founderClaims).toContain('"/revoke"');
    expect(founderClaims).toContain("This private audit reason is required");
    expect(founderClaims).toContain("never verifies a business or ownership designation");
  });
});
