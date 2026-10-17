import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildReducedSupportLensUpdate, persistReducedSupportLensRemoval } from "@/lib/supportLensActions";

const directorySource = readFileSync(
  new URL("../pages/businesses.tsx", import.meta.url),
  "utf8",
);
const mapSource = readFileSync(new URL("../pages/map.tsx", import.meta.url), "utf8");

function exactFocusStatusOpeningTag(source: string): string {
  const marker = 'data-testid="support-lens-exact-focus-status"';
  const markerIndex = source.indexOf(marker);
  expect(markerIndex).toBeGreaterThan(-1);
  const openingTagStart = source.lastIndexOf("<", markerIndex);
  const openingTagEnd = source.indexOf(">", markerIndex);
  return source.slice(openingTagStart, openingTagEnd + 1);
}

describe("web Support Lens removal actions", () => {
  it("removes one designation while preserving strict mode and canonical aliases", () => {
    expect(buildReducedSupportLensUpdate(["black-african-american", "woman"], "woman")).toEqual({
      preferredOwnershipTypes: ["black-african-american"],
      ownershipTypes: ["black-african-american"],
      supportLensMode: "strict_documented_designations",
    });
  });

  it("transitions the last removal to all businesses", () => {
    expect(buildReducedSupportLensUpdate(["woman"], "woman")).toEqual({
      preferredOwnershipTypes: [],
      ownershipTypes: [],
      supportLensMode: "all_businesses",
    });
  });

  it("preserves the old lens on failure and succeeds on retry", async () => {
    const requests: RequestInit[] = [];
    const responses = [new Response(null, { status: 503 }), new Response("{}", { status: 200 })];
    const fetchImpl = async (_url: string | URL, init?: RequestInit) => {
      requests.push(init ?? {});
      return responses.shift()!;
    };
    const failed = await persistReducedSupportLensRemoval({
      baseUrl: "/",
      savedDesignations: ["black-african-american", "woman"],
      removeDesignation: "woman",
      fetchImpl,
    });
    expect(failed.error).toBeTruthy();
    expect(failed.update.preferredOwnershipTypes).toEqual(["black-african-american"]);
    const retried = await persistReducedSupportLensRemoval({
      baseUrl: "/",
      savedDesignations: ["black-african-american", "woman"],
      removeDesignation: "woman",
      fetchImpl,
    });
    expect(retried.error).toBeUndefined();
    expect(requests).toHaveLength(2);
    expect(JSON.parse(String(requests[1].body))).toMatchObject({
      preferredOwnershipTypes: ["black-african-american"],
      supportLensMode: "strict_documented_designations",
    });
  });

  it("shows strict focus as a status while retaining real alternative actions", () => {
    for (const source of [directorySource, mapSource]) {
      const statusTag = exactFocusStatusOpeningTag(source);

      expect(source).toContain("Keeping your exact focus");
      expect(source).not.toContain("Keep exact focus");
      expect(source).not.toContain("onClick={() => {}}");
      expect(statusTag).toMatch(/^<p(?:\s|>)/);
      expect(statusTag).not.toMatch(/\b(?:onClick|onKeyDown|onKeyUp|tabIndex|href)\s*=/);
      expect(statusTag).not.toMatch(/\brole\s*=\s*["']button["']/);
    }

    expect(directorySource).toContain("onClick={onShowAll}");
    expect(directorySource).toContain("onClick={() => onRemoveDesignation(");
    expect(mapSource).toContain('setMapDiscoveryFocus("all")');
    expect(mapSource).toContain("void removeMapDesignation(");
  });
});
