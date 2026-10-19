import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(
  new URL("../pages/business-dashboard.tsx", import.meta.url),
  "utf8",
);

function managedProfileTransport(): string {
  const start = dashboard.indexOf("async function fetchManagedBusinessProfile");
  const end = dashboard.indexOf("async function handleCheckout", start);
  return dashboard.slice(start, end);
}

function managedProfileEditor(): string {
  const start = dashboard.indexOf("{/* The selected managed profile is the only ordinary-profile mutation surface here. */}");
  const end = dashboard.indexOf("<BusinessOwnershipEditor", start);
  return dashboard.slice(start, end);
}

describe("Business Dashboard multi-business access", () => {
  it("uses the explicit managed-business list rather than the legacy ambiguous endpoint", () => {
    expect(dashboard).toContain('fetch(`${BASE}api/businesses/mine/managed`, { credentials: "include" })');
    expect(dashboard).toContain("Array.isArray(d.businesses) ? d.businesses : []");
    expect(dashboard).toContain("The dashboard is explicitly multi-business.");
    expect(dashboard).not.toContain('fetch(`${BASE}api/businesses/mine`, { credentials: "include" })');
  });

  it("does not mistake a revalidated auth response for a signed-out owner", () => {
    expect(dashboard).toContain('cache: "no-store"');
    expect(dashboard).toContain("const [authLoading, setAuthLoading] = useState(true);");
    expect(dashboard).toContain("if (authLoading) {");
    expect(dashboard).toContain(".then((r) => (r.ok ? r.json() : null))");
  });

  it("loads the selected approved managed profile revision and submits it with the narrow credentialed payload", () => {
    const transport = managedProfileTransport();
    const payloadStart = transport.indexOf("const profilePayload = {");
    const payloadEnd = transport.indexOf("    };", payloadStart);
    const payload = transport.slice(payloadStart, payloadEnd);

    expect(transport).toContain('fetch(`${BASE}api/businesses/mine/managed/${businessId}`, { credentials: "include", cache: "no-store" })');
    expect(transport).toContain('fetch(`${BASE}api/businesses/mine/managed/${businessId}/profile`, {');
    expect(transport).toContain('method: "PATCH"');
    expect(transport).toContain('credentials: "include"');
    expect(payload).toContain("description: profile.description");
    expect(payload).toContain("phone: profile.phone");
    expect(payload).toContain("website: profile.website");
    expect(payload).toContain("hours: profile.hours");
    expect(payload).toContain("expectedUpdatedAt: profile.updatedAt");
    expect(payload).not.toMatch(/\b(name|category|address|city|state|latitude|longitude|listingStatus|verified)\s*:/);
    expect(dashboard).toContain("const updatedAt = text(record.updatedAt);");
    expect(dashboard).toContain("if (!updatedAt) return null;");
    expect(dashboard).toContain("updatedAt,");
  });

  it("shows Saved only after the selected canonical record is re-read and preserves draft values on failure", () => {
    const transport = managedProfileTransport();
    const patch = transport.indexOf('fetch(`${BASE}api/businesses/mine/managed/${businessId}/profile`, {');
    const responseCheck = transport.indexOf("if (!response.ok)", patch);
    const reread = transport.indexOf("await fetchManagedBusinessProfile(businessId)", responseCheck);
    const saved = transport.indexOf('setManagedProfileSaveState("saved")', reread);
    const failure = transport.slice(transport.indexOf("} catch {", reread), transport.indexOf("  async function handleCheckout", reread));

    expect(patch).toBeGreaterThanOrEqual(0);
    expect(responseCheck).toBeGreaterThan(patch);
    expect(reread).toBeGreaterThan(responseCheck);
    expect(saved).toBeGreaterThan(reread);
    expect(failure).toContain('setManagedProfileSaveState("failed")');
    expect(failure).not.toContain("setManagedProfile(");
  });

  it("retains the owner draft and never reports Saved after the stable stale-write response", () => {
    const transport = managedProfileTransport();
    const stale = transport.indexOf('failure?.code === "BUSINESS_PROFILE_STALE_WRITE"');
    const reread = transport.indexOf("await fetchManagedBusinessProfile(businessId)");
    const saved = transport.indexOf('setManagedProfileSaveState("saved")');

    expect(dashboard).toContain('"idle" | "saving" | "saved" | "failed" | "stale"');
    expect(stale).toBeGreaterThanOrEqual(0);
    expect(transport).toContain('setManagedProfileSaveState("stale")');
    expect(reread).toBeGreaterThan(stale);
    expect(saved).toBeGreaterThan(reread);
    expect(managedProfileEditor()).toContain("This profile changed before your save. Your edits are still here; reload and review the latest profile before saving again.");
    expect(managedProfileEditor()).toContain("Este perfil cambió antes de guardar.");
  });

  it("replaces the misleading claim-page handoff with a bilingual selected-profile editor without publication controls", () => {
    const editor = managedProfileEditor();

    expect(dashboard).not.toContain("/for-business-owners?claim=");
    expect(dashboard).toContain("Edit Profile / Editar perfil");
    expect(editor).toContain('data-testid="managed-profile-editor"');
    expect(editor).toContain("Description / Descripción");
    expect(editor).toContain("Phone / Teléfono");
    expect(editor).toContain("Website / Sitio web");
    expect(editor).toContain("Hours / Horario");
    expect(editor).toContain("Saving… / Guardando…");
    expect(editor).toContain("Saved after a refreshed profile read.");
    expect(editor).toContain("Failed to save. Your changes are still here");
    expect(editor).toContain("Public visibility and discovery eligibility are governed separately.");
    expect(editor).not.toMatch(/id="managed-profile-(listing-status|verification|address|city|state|latitude|longitude)"/);
    expect(editor).not.toContain('name="listingStatus"');
  });
});
