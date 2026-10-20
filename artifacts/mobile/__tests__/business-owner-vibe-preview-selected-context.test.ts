import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

function assertManagedSelectionContract(route: string): void {
  expect(route).toContain("useLocalSearchParams");
  expect(route).toContain("businessId: requestedBusinessId");
  expect(route).toContain("/api/businesses/mine/managed");
  expect(route).not.toMatch(/\/api\/businesses\/mine(?!\/managed)/);
  expect(route).toContain("selectManagedBusinessId");
  expect(route).toContain("managedIds.includes(requestedBusinessId)");
  expect(route).toContain("requestedBusinessId !== undefined");
  expect(route).toContain(
    "return managedIds.length === 1 ? managedIds[0] : null;",
  );
  expect(route).toContain("new Set(managedIds).size !== managedIds.length");
  expect(route).not.toContain("businesses[0]");
  expect(route).toMatch(/!\w+\.ok/);
  expect(route).toContain("requestId === requestIdRef.current");
  expect(route).toContain("activeContextRef.current === selectionContextKey");
  expect(route).toContain("resolvedContextRef.current = null");
}

describe("native owner selected-business context", () => {
  it("fails closed before Vibe Tags reads a selected managed profile or writes owner tags", () => {
    const vibeTags = source("../app/business-owner/vibe-tags.tsx");
    assertManagedSelectionContract(vibeTags);
    expect(vibeTags).toContain(
      "/api/businesses/mine/managed/${encodeURIComponent(",
    );
    expect(vibeTags).toContain("candidate.id !== businessId");
    expect(vibeTags).toContain(
      "/api/vibes/businesses/${selectedBusinessId}/owner-tags",
    );
    expect(vibeTags).toContain("resolvedBusinessId");
    expect(vibeTags).toContain("disabled={saving || !resolvedBusinessId}");
  });

  it("redirects Preview only after a current managed-membership selection succeeds", () => {
    const preview = source("../app/business-owner/preview.tsx");
    assertManagedSelectionContract(preview);
    expect(preview).toContain("No managed business listing found");
    expect(preview).toContain("!resolvedBusinessId");
    expect(preview).toContain(
      "resolvedContextRef.current !== selectionContextKey",
    );
    expect(preview).toContain('params: { id: resolvedBusinessId, preview: "1" }');
  });
});
