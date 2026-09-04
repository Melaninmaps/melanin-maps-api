import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getSocialShareUrl, OFFICIAL_SOCIAL_LINKS } from "../lib/socialLinks";

const readSource = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

const layoutSource = readSource("../components/layout.tsx");
const publicShareSources = [
  readSource("../pages/home.tsx"),
  readSource("../pages/waitlist.tsx"),
  readSource("../pages/pending-approval.tsx"),
];

describe("official social links", () => {
  it("uses the exact four official Mapping With Melanin accounts", () => {
    expect(OFFICIAL_SOCIAL_LINKS).toEqual([
      {
        id: "tiktok",
        label: "TikTok",
        handle: "@mapping.with.mela",
        href: "https://www.tiktok.com/@mapping.with.mela",
      },
      {
        id: "instagram",
        label: "Instagram",
        handle: "@mapping_with_melanin",
        href: "https://www.instagram.com/mapping_with_melanin/",
      },
      {
        id: "facebook",
        label: "Facebook",
        handle: "Mapping With Melanin.com",
        href: "https://www.facebook.com/profile.php?id=61591358846366",
      },
      {
        id: "threads",
        label: "Threads",
        handle: "@mapping_with_melanin",
        href: "https://www.threads.com/@mapping_with_melanin",
      },
    ]);
  });

  it("creates a valid Threads post intent with encoded text and URL", () => {
    expect(getSocialShareUrl("Threads", "Join us & connect", "https://mappingwithmelanin.com/waitlist?ref=A B"))
      .toBe("https://www.threads.com/intent/post?text=Join%20us%20%26%20connect&url=https%3A%2F%2Fmappingwithmelanin.com%2Fwaitlist%3Fref%3DA%20B");
  });

  it("renders every official account in the global footer as a safe external link", () => {
    expect(layoutSource).toContain("OFFICIAL_SOCIAL_LINKS.map");
    expect(layoutSource).toContain('target="_blank"');
    expect(layoutSource).toContain('rel="noopener noreferrer"');
    expect(layoutSource).toContain("pb-28 sm:py-16");
    for (const id of OFFICIAL_SOCIAL_LINKS.map((link) => link.id)) {
      expect(layoutSource).toContain("official-social-${id}");
    }
  });

  it("replaces public Twitter/X referral actions with Threads", () => {
    for (const source of publicShareSources) {
      expect(source).toContain("Threads");
      expect(source).not.toContain("twitter.com/intent");
      expect(source).not.toMatch(/platform:\s*["']X["']/);
    }
  });
});
