import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/community.tsx", import.meta.url)),
  "utf8",
);

describe("mobile Community feed recovery", () => {
  it("keeps the member-only feed protected while giving failures a safe recovery path", () => {
    expect(source).toContain('kind: "auth" | "temporary" | "configuration" | "unknown"');
    expect(source).toContain('res.headers.get("x-request-id")');
    expect(source).toContain("Your Community session needs to reconnect");
    expect(source).toContain("Your existing posts and media are safe");
    expect(source).toContain('router.push("/login" as any)');
    expect(source).toContain("Community could not refresh right now");
  });

  it("places the compose control and posts directly below Community navigation", () => {
    const feedList = source.split("data={filteredPosts}")[1] ?? "";
    expect(feedList).toContain('contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}');
    expect(feedList).not.toContain('contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100, flexGrow: 1 }]}');
    expect(feedList.indexOf("ListHeaderComponent")).toBeLessThan(feedList.indexOf("ListEmptyComponent"));
    expect(feedList).toContain("What&apos;s on your mind?");
  });
});
