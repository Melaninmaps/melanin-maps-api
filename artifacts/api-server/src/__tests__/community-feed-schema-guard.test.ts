import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const startupSource = readFileSync(
  fileURLToPath(new URL("../index.ts", import.meta.url)),
  "utf8",
);

describe("Community feed pre-traffic schema guard", () => {
  it("creates only additive feed dependencies before traffic and preserves safety relations", () => {
    expect(source).toContain("ensureCommunityFeedReadSchema");
    for (const table of [
      "community_posts",
      "community_post_comments",
      "user_blocks",
      "user_follows",
      "member_connections",
    ]) {
      expect(source).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(source).toContain("user_blocks_unique_idx");
    expect(source).toContain("Community feed schema verification failed");
    expect(source).not.toMatch(/DELETE\s+FROM\s+(?:community_posts|community_post_comments)/i);
  });

  it("runs the guard before the server listener opens", () => {
    expect(startupSource.indexOf("await ensureCommunityFeedReadSchema(logger)")).toBeLessThan(
      startupSource.indexOf("const server = host"),
    );
  });
});
