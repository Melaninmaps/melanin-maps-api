import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chat = readFileSync(
  new URL("../components/AIChatWidget.tsx", import.meta.url),
  "utf8",
);
const travel = readFileSync(
  new URL("../app/travel.tsx", import.meta.url),
  "utf8",
);
const kinfolkHook = readFileSync(
  new URL("../hooks/useKinfolk.ts", import.meta.url),
  "utf8",
);

describe("native Kinfolk reviewed resource cards", () => {
  it("accepts, sanitizes, and renders server-reviewed health and image resources in the floating chat", () => {
    expect(chat).toContain("resourceCards?: KinfolkResourceCard[] | null");
    expect(chat).toContain("parseSafeSourceLink({ title: card.title, url: card.url })");
    expect(chat).toContain('testID="kinfolk-reviewed-resource-cards"');
    expect(chat).toContain('resource.type === "image_gallery" ? "Educational image library: " : ""');
    expect(chat).toContain("Linking.openURL(resource.url)");
  });

  it("preserves sanitized reviewed resources in the primary Kinfolk conversation", () => {
    expect(kinfolkHook).toContain('import { parseSafeSourceLink } from "@/lib/sourceLinks"');
    expect(kinfolkHook).toContain("resourceCards?: KinfolkResourceCard[] | null");
    expect(kinfolkHook).toContain("resourceCards: (data.resourceCards ?? []).flatMap");
    expect(travel).toContain('testID="kinfolk-primary-reviewed-resource-cards"');
    expect(travel).toContain("parseSafeSourceLink({ title: resource.title, url: resource.url })");
    expect(travel).toContain("Educational image library: ");
    expect(travel).toContain('openExternalUrl(resource.url, { kind: "web" })');
  });
});
