import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

const createCircleScreen = readFileSync(
  fileURLToPath(new URL("../app/circles/create.tsx", import.meta.url)),
  "utf8",
);

describe("Circle create Free-member journey", () => {
  it("presents Free membership as eligible for its first private Circle", () => {
    const freeTierStart = createCircleScreen.indexOf('name: "Free"');
    const nextTierStart = createCircleScreen.indexOf(
      'name: "Explorer+"',
      freeTierStart,
    );
    const freeTier = createCircleScreen.slice(freeTierStart, nextTierStart);

    expect(freeTierStart).toBeGreaterThan(-1);
    expect(nextTierStart).toBeGreaterThan(freeTierStart);
    expect(freeTier).toContain('circles: "1 circle"');
    expect(freeTier).toContain(
      'privateMembers: "Up to 8 people in each Circle"',
    );
    expect(freeTier).toContain("canCreate: true");
    expect(createCircleScreen).toContain(
      "See Circle limits and membership options",
    );
  });

  it("keeps the private draft on a capped or failed create and navigates only after 201 success", () => {
    const createStart = createCircleScreen.indexOf(
      "const handleCreate = async () => {",
    );
    const createEnd = createCircleScreen.indexOf("\n  return (", createStart);
    const createHandler = createCircleScreen.slice(createStart, createEnd);
    const failureStart = createHandler.indexOf("if (!res.ok)");
    const successNavigation = createHandler.indexOf("router.replace");
    const failureBranch = createHandler.slice(failureStart, successNavigation);

    expect(createStart).toBeGreaterThan(-1);
    expect(createEnd).toBeGreaterThan(createStart);
    expect(createHandler).toContain('type: "private"');
    expect(createHandler).toContain('privacy: "invite_only"');
    expect(createHandler).toContain("maxMembers: 8");
    expect(createHandler).toContain('data.code === "TIER_LIMIT_REACHED"');
    expect(createHandler).toContain('"Circle limit reached"');
    expect(createHandler).toContain(
      'data.error ?? "Your current access includes one private Circle."',
    );
    expect(createHandler).toContain(
      '{ text: "Keep Editing", style: "cancel" }',
    );
    expect(createHandler).not.toContain('"Membership Required"');
    expect(createHandler).not.toContain(
      "Upgrade to Explorer+ to create Kinfolk Circles.",
    );
    expect(failureStart).toBeGreaterThan(-1);
    expect(successNavigation).toBeGreaterThan(failureStart);
    expect(failureBranch).toContain("return;");
    expect(failureBranch).not.toContain("router.replace");
    expect(createHandler).toContain('pathname: "/circles/[id]"');
  });
});
