import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("knowledge feed-count response contract", () => {
  it("allows the count endpoint through authentication and returns zero for no user, follows, or query failures", () => {
    const knowledge = source("../routes/knowledge.ts");
    expect(knowledge).toMatch(/req\.path === "\/knowledge\/feed\/count"[\s\S]*?next\(\)/);

    const endpoint = knowledge.slice(
      knowledge.indexOf('router.get("/knowledge/feed/count"'),
      knowledge.indexOf("// ─── GET /api/knowledge/topics", knowledge.indexOf('router.get("/knowledge/feed/count"')),
    );
    expect(endpoint).toContain('if (!userId) { res.json({ count: 0 }); return; }');
    expect(endpoint).toContain('if (follows.length === 0) { res.json({ count: 0 }); return; }');
    expect(endpoint).toContain('res.json({ count });');
    expect(endpoint).toContain('catch {\n    res.json({ count: 0 });');
  });
});