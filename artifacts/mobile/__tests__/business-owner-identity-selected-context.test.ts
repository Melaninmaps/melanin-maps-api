import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../app/business-owner/identity.tsx", import.meta.url), "utf8");

function block(start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Unable to locate ${start}`);
  return source.slice(startIndex, endIndex);
}

describe("Business Owner Identity selected managed-business context", () => {
  it("propagates an optional Owner Home or Broadcasts businessId through exact selected-membership validation without auto-selecting", () => {
    expect(source).toContain('const { businessId: selectedBusinessId } = useLocalSearchParams<{ businessId?: string }>();');
    expect(source).toContain('const managedBusinessId = typeof selectedBusinessId === "string" && selectedBusinessId.trim()');
    expect(source).toContain('async function validateManagedBusinessSelection(businessId: string, headers: Record<string, string>): Promise<boolean>');
    expect(source).toContain('/api/businesses/mine/managed/${encodeURIComponent(businessId)}');
    expect(source).toContain('return data.business?.id === businessId;');
    expect(source).not.toContain('managedBusinesses[0]');
    expect(source).not.toContain('businesses[0]');
  });

  it("requires a validated exact selection before selected Identity GET and PATCH, including direct unowned, malformed, and multi-business contexts", () => {
    const load = block("  const load = useCallback", "  useEffect(() => {");
    const save = block("  const handleSave = async () =>", "  const pct = completionScore(form);");

    expect(load).toContain('if (hasInvalidSelectedBusinessId)');
    expect(load).toContain('if (!await validateManagedBusinessSelection(expectedBusinessId, headers) || !await isCurrentContext()) return;');
    expect(load.indexOf('validateManagedBusinessSelection(expectedBusinessId, headers)')).toBeLessThan(load.indexOf('fetch(`${getApiBase()}${identityPath}`, { headers })'));
    expect(load).toContain('data.business?.id === expectedBusinessId');
    expect(load).toContain('identity?.businessId === expectedBusinessId');
    expect(load).toContain('if (identity && selectedIdentityMatches && await isCurrentContext())');
    expect(load).toContain('setValidatedManagedBusinessId(expectedBusinessId);');
    expect(load).toContain('`/api/businesses/mine/managed/${encodeURIComponent(expectedBusinessId)}/identity`');

    expect(save).toContain('validatedManagedBusinessId !== managedBusinessId || ownedBusiness?.id !== managedBusinessId');
    expect(save).toContain('const hasValidatedSelection = await validateManagedBusinessSelection(expectedBusinessId, headers);');
    expect(save.indexOf('validateManagedBusinessSelection(expectedBusinessId, headers)')).toBeLessThan(save.indexOf('fetch(`${getApiBase()}${identityPath}`, {'));
    expect(save).toContain('Alert.alert("Error", "Could not save. Please try again.");');
    expect(save).toContain('const selectedIdentityMatches = !expectedBusinessId || data?.identity?.businessId === expectedBusinessId;');
    expect(save).toContain('if (res.ok && selectedIdentityMatches)');
    expect(save).toContain('`/api/businesses/mine/managed/${encodeURIComponent(expectedBusinessId)}/identity`');
  });

  it("retains legacy no-selected routes while fencing late account or selected-business load/save completions before state or success UI", () => {
    const load = block("  const load = useCallback", "  useEffect(() => {");
    const save = block("  const handleSave = async () =>", "  const pct = completionScore(form);");

    expect(load).toContain(': "/api/businesses/mine/identity";');
    expect(save).toContain(': "/api/businesses/mine/identity";');
    expect(load).toContain('managedBusinessIdRef.current === expectedBusinessId');
    expect(load).toContain('await getToken() === token');
    expect(source).toContain('return () => { contextRequestRef.current += 1; };');
    expect(save.indexOf('if (!await isCurrentContext()) return;')).toBeLessThan(save.indexOf('Alert.alert("Saved!"'));
    expect(save).toContain('await getToken() === token');
    expect(source).toContain('disabled={saving || loading || hasInvalidSelectedBusinessId}');
  });
});
