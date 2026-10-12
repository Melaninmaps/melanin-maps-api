import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chat = readFileSync(
  new URL("../components/AIChatWidget.tsx", import.meta.url),
  "utf8",
);

describe("native Kinfolk reviewed resource cards", () => {
  it("accepts, sanitizes, and renders server-reviewed health and image resources", () => {
    expect(chat).toContain("resourceCards?: KinfolkResourceCard[] | null");
    expect(chat).toContain("parseSafeSourceLink({ title: card.title, url: card.url })");
    expect(chat).toContain('testID="kinfolk-reviewed-resource-cards"');
    expect(chat).toContain('resource.type === "image_gallery" ? "Educational image library: " : ""');
    expect(chat).toContain("Linking.openURL(resource.url)");
  });
});
