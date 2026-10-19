import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sanitizeDirectoryPublicHandle } from "../lib/mapDirectoryHandoff";

function source(relativePath: string): string {
  return readFileSync(
    decodeURIComponent(new URL(relativePath, import.meta.url).pathname),
    "utf8",
  );
}

function between(sourceText: string, start: string, end: string): string {
  const startIndex = sourceText.indexOf(start);
  const endIndex = sourceText.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return sourceText.slice(startIndex, endIndex);
}

const handoffSource = source("../lib/mapDirectoryHandoff.ts");
const directorySource = source("../app/business-search.tsx");
const nativeMapRouteSource = source("../app/(tabs)/map.tsx");
const nativeMapSource = source("../components/FullMapView.tsx");
const webMapSource = source("../app/(tabs)/map.web.tsx");
const businessHookSource = source("../hooks/useBusinesses.ts");
const requestBuilderSource = source("../hooks/support-lens-request.ts");

describe("native Directory-to-Map public-handle handoff", () => {
  it("accepts only one normalized member-entered public handle scalar", () => {
    expect(sanitizeDirectoryPublicHandle(" @MapWithMelanin_2026 ")).toBe(
      "MapWithMelanin_2026",
    );
    expect(sanitizeDirectoryPublicHandle("melanin.maps")).toBe("melanin.maps");

    expect(sanitizeDirectoryPublicHandle(["MapWithMelanin"])).toBeNull();
    expect(sanitizeDirectoryPublicHandle({ handle: "MapWithMelanin" })).toBeNull();
    expect(sanitizeDirectoryPublicHandle(null)).toBeNull();
    expect(sanitizeDirectoryPublicHandle("   ")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("@")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("@@MapWithMelanin")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("map with spaces")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("map/with/path")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("https://example.test")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("www.example.com")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("@www.example.com")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("melanin-maps.co")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("map..with.dot")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("map.")).toBeNull();
    expect(sanitizeDirectoryPublicHandle("a".repeat(65))).toBeNull();
  });

  it("uses the sanitizer as the sole public-handle request boundary", () => {
    const executableHandoffSource = handoffSource.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(handoffSource).not.toMatch(/^import\s/m);
    expect(executableHandoffSource).not.toMatch(/fetch|SecureStore|location|contact|saved place|memory|preference/i);

    expect(requestBuilderSource).toContain('import { sanitizeDirectoryPublicHandle } from "../lib/mapDirectoryHandoff";');
    expect(requestBuilderSource).toContain("handle?: string | null;");
    expect(requestBuilderSource).toContain("const publicHandle = sanitizeDirectoryPublicHandle(options.handle);");
    expect(requestBuilderSource).toContain('if (publicHandle) params.set("handle", publicHandle);');

    expect(businessHookSource).toContain("const publicHandle = sanitizeDirectoryPublicHandle(handle);");
    expect(businessHookSource).toContain("handle: publicHandle,");
    expect(businessHookSource).toContain("city: directName || publicHandle ? \"\" : city,");
    expect(businessHookSource).toContain("const requestedDesignations = publicHandle ? [] : designations;");
    expect(businessHookSource).toContain("supportScope: directName ? undefined : supportScope,");
    expect(businessHookSource).toContain("const urlWithGeo = !directName && !publicHandle");
  });

  it("propagates only a sanitized handle through Directory, native Map, Expo Web, active criteria, and member clear actions", () => {
    expect(directorySource).toContain("const publicDirectoryHandle = sanitizeDirectoryPublicHandle(handle);");
    expect(directorySource).toContain('{/* Member-entered public-handle Map handoff. */}');
    expect(directorySource).toContain('pathname: "/(tabs)/map",');
    expect(directorySource).toContain("params: { directoryHandle: publicDirectoryHandle },");
    expect(directorySource).toContain("Open this public handle on Map / Abrir este usuario público en el mapa");

    expect(nativeMapRouteSource).toContain("directoryHandle?: string | string[];");
    expect(nativeMapRouteSource).toContain("directoryHandle={sanitizeDirectoryPublicHandle(params.directoryHandle)}");
    expect(nativeMapSource).toContain("const incomingDirectoryHandle = sanitizeDirectoryPublicHandle(directoryHandle);");
    expect(nativeMapSource).toContain("handle: activeDirectoryHandle,");
    expect(nativeMapSource).toContain("const businessRequestScopeKey = `${localityScopeKey}:${activeDirectoryHandle ?? \"\"}`;");
    expect(nativeMapSource).toContain("latitude: deliberateMapNameSearch || activeDirectoryHandle ? null");
    expect(nativeMapSource).toContain("if (activeDirectoryHandle) return focusedMappedBusinesses;");
    expect(nativeMapSource).toContain("const hasActiveBusinessCriterion = hasSubmittedBusinessSearch || activeDirectoryHandle !== null;");
    expect(nativeMapSource).toContain("setActiveDirectoryHandle(null);");
    expect(nativeMapSource).toContain("Finding public listings for @${activeDirectoryHandle} / Buscando resultados públicos para @${activeDirectoryHandle}");

    expect(webMapSource).toContain("const incomingDirectoryHandle = sanitizeDirectoryPublicHandle(params.directoryHandle);");
    expect(webMapSource).toContain("handle: activeDirectoryHandle,");
    expect(webMapSource).toContain("setActiveDirectoryHandle(null)");
    expect(webMapSource).toContain("Showing public listings for @{activeDirectoryHandle} / Mostrando resultados públicos para @{activeDirectoryHandle}");
    expect(webMapSource).toContain("Clear public handle filter / Borrar filtro de usuario público");
  });

  it("does not derive the Directory Map handoff from returned business social fields or private member sources", () => {
    const directoryAction = between(
      directorySource,
      "{/* Member-entered public-handle Map handoff. */}",
      "{results.map((item) =>",
    );

    expect(directoryAction).toContain("publicDirectoryHandle");
    expect(directoryAction).not.toMatch(/item\.|instagram|tiktok|twitter|facebook|profile|contact|saved|location|memory|preference|SecureStore|getApiBase/i);
    expect(directoryAction).not.toContain("results[");
    expect(directoryAction).not.toContain("results.map");
  });
});
