import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(
  resolve(__dirname, "../app/business-dashboard.tsx"),
  "utf8",
);

function section(startMarker: string, endMarker: string): string {
  const start = dashboard.indexOf(startMarker);
  const end = dashboard.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return dashboard.slice(start, end);
}

describe("Dashboard Trust Profile selected identity isolation", () => {
  it("uses only the managed selected-business identity route for Trust Profile reads and saves", () => {
    const trustProfile = section("// Load Trust Profile identity data", "// Refresh growth tools");
    const saveStart = dashboard.indexOf("const handleSave = async () => {");
    const saveEnd = dashboard.indexOf("return (", saveStart);
    const save = dashboard.slice(saveStart, saveEnd);
    const selectedRoute = "/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/identity";

    expect(dashboard).not.toContain("/api/businesses/mine/identity");
    expect(trustProfile).toContain("const selectedBusinessId = business.id;");
    expect(trustProfile).toContain(selectedRoute);
    expect(save).toContain("const selectedBusinessId = business.id;");
    expect(save).toContain(selectedRoute);
  });

  it("does not start a Trust Profile request or report a false result without current selected context and transport prerequisites", () => {
    const trustProfile = section("// Load Trust Profile identity data", "// Refresh growth tools");
    const saveStart = dashboard.indexOf("const handleSave = async () => {");
    const saveEnd = dashboard.indexOf("return (", saveStart);
    const save = dashboard.slice(saveStart, saveEnd);
    const unavailable = "if (!token || !base || activeBusinessIdRef.current !== selectedBusinessId)";

    expect(trustProfile).toContain(unavailable);
    expect(save).toContain("if (activeBusinessIdRef.current !== selectedBusinessId) return;");
    expect(save).toContain(unavailable);
    expect(save).toContain("if (activeBusinessIdRef.current === selectedBusinessId) setTrustProfileResult(\"error\");");
  });

  it("fails closed on non-OK or malformed identity responses before any loaded or successful state", () => {
    const trustProfile = section("// Load Trust Profile identity data", "// Refresh growth tools");
    const saveStart = dashboard.indexOf("const handleSave = async () => {");
    const saveEnd = dashboard.indexOf("return (", saveStart);
    const save = dashboard.slice(saveStart, saveEnd);

    expect(dashboard).toContain("function parseTrustProfileIdentityResponse(value: unknown): TrustProfileIdentity | null");
    expect(dashboard).toContain("Array.isArray(fieldValue) && fieldValue.every((item) => typeof item === \"string\")");
    expect(trustProfile).toContain("if (!res.ok) {");
    expect(trustProfile).toContain("if (!identity) {");
    expect(trustProfile.indexOf("if (!identity) {")).toBeLessThan(trustProfile.indexOf("setTrustProfileLoaded(true);"));
    expect(save).toContain("const identity = res.ok");
    expect(save).toContain("if (!identity) {");
    expect(save.indexOf("if (!identity) {")).toBeLessThan(save.indexOf("setTrustProfileResult(\"success\");"));
  });

  it("fences all async Trust Profile outcomes to the captured selected business", () => {
    const trustProfile = section("// Load Trust Profile identity data", "// Refresh growth tools");
    const saveStart = dashboard.indexOf("const handleSave = async () => {");
    const saveEnd = dashboard.indexOf("return (", saveStart);
    const save = dashboard.slice(saveStart, saveEnd);
    const currentGuard = "activeBusinessIdRef.current === selectedBusinessId";

    expect(trustProfile).toContain("if (activeBusinessIdRef.current !== selectedBusinessId) return;");
    expect(trustProfile).toContain(currentGuard);
    expect(save).toContain("if (activeBusinessIdRef.current !== selectedBusinessId) return;");
    expect(save).toContain("if (activeBusinessIdRef.current === selectedBusinessId) setTrustProfileResult(\"error\");");
    expect(save).toContain("if (activeBusinessIdRef.current === selectedBusinessId) setTrustProfileSaving(false);");
    const responseParse = save.indexOf("parseTrustProfileIdentityResponse(await res.json())");
    const postParseGuard = save.indexOf("if (activeBusinessIdRef.current !== selectedBusinessId) return;", responseParse);
    expect(postParseGuard).toBeGreaterThan(responseParse);
    expect(postParseGuard).toBeLessThan(save.indexOf("if (!identity) {"));
    expect(save.indexOf("setTrustProfileResult(\"success\");")).toBeLessThan(save.indexOf("setTrustProfileExpanded(false);"));
  });

  it("clears Trust Profile state when the validated managed business changes", () => {
    const reset = section("activeBusinessIdRef.current = business?.id ?? null;", "if (requiresManagedBusinessSelection)");

    expect(reset).toContain("setTrustProfileExpanded(false);");
    expect(reset).toContain('setTrustAudienceType("unknown");');
    expect(reset).toContain("setTrustAgeReasons([]);");
    expect(reset).toContain("setTrustEnvironmentTags([]);");
    expect(reset).toContain("setTrustAmenityTags([]);");
    expect(reset).toContain("setTrustProfileSaving(false);");
    expect(reset).toContain("setTrustProfileResult(null);");
    expect(reset).toContain("setTrustProfileLoaded(false);");
  });
});
