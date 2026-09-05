import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("native founder directory resource routing", () => {
  it("loads canonical Resources and opportunities with the stored bearer token", () => {
    const resources = source("../app/(tabs)/resources.tsx");
    const canonicalRead = resources.slice(
      resources.indexOf("const fetchResources"),
      resources.indexOf("const reportItem"),
    );
    expect(canonicalRead).toContain('SecureStore.getItemAsync("auth_session_token")');
    expect(canonicalRead).toContain("/api/resources?");
    expect(canonicalRead).toContain("/api/resources/opportunities?");
    expect(canonicalRead).toContain("Authorization: `Bearer ${token}`");
  });
});
