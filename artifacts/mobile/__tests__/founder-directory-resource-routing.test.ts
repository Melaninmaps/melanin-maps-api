import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

const resources = source("../app/(tabs)/resources.tsx");

function block(start: string, end: string): string {
  const from = resources.indexOf(start);
  const to = resources.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return resources.slice(from, to);
}

describe("native founder directory resource routing", () => {
  it("keeps canonical Resources and opportunities requests authenticated and query-forwarded", () => {
    const canonicalRead = block("const fetchResources", "const handleReport");

    expect(canonicalRead).toContain('SecureStore.getItemAsync("auth_session_token")');
    expect(canonicalRead).toContain('if (activeCategory !== "all") params.set("category", activeCategory);');
    expect(canonicalRead).toContain('if (searchQuery.trim()) params.set("q", searchQuery.trim());');
    expect(canonicalRead).toContain("/api/resources?");
    expect(canonicalRead).toContain("/api/resources/opportunities?");
    expect(canonicalRead).toContain("Authorization: `Bearer ${token}`");
  });

  it("routes only the existing ResourceCard Visit Resource action through the fail-closed safe web handoff", () => {
    const resourceCard = block("function ResourceCard", "function OpportunityCard");
    const opportunityCard = block("function OpportunityCard", "// ── Submit Opportunity Modal");

    expect(resources).toContain('import { openExternalUrl } from "@/lib/safeLinking";');
    expect(resourceCard).toContain("<TrustBadge tier={item.sourceTier} />");
    expect(resourceCard).toContain("{item.url && (");
    expect(resourceCard).toContain("void openExternalUrl(item.url, {");
    expect(resourceCard).toContain("Resource link unavailable / Enlace de recurso no disponible");
    expect(resourceCard).toContain("This resource link is invalid or cannot be opened on this device.");
    expect(resourceCard).not.toContain("Linking.openURL(item.url!)");
    expect(resourceCard).toContain("{item.phone && (");
    expect(resourceCard).toContain("Linking.openURL(`tel:${item.phone}`).catch(() => {})");
    expect(resourceCard).toContain("Report outdated info");
    expect(opportunityCard).toContain("Linking.openURL(item.applicationLink!).catch(() => {})");
  });
});
