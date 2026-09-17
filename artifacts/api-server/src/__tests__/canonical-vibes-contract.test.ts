import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { findVibeKeysForSearch } from "@workspace/constants";
import { deriveBusinessSubject } from "../kinfolk/business-subject";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("canonical VIBES discovery", () => {
  it("recognizes approved plain-language atmosphere requests", () => {
    expect(findVibeKeysForSearch("a romantic dinner tonight")).toContain("date_night");
    expect(findVibeKeysForSearch("a romantic dinner tonight")).toContain("romantic_escape");
    expect(findVibeKeysForSearch("a place for kids")).toContain("kid_chaos_friendly");
    expect(findVibeKeysForSearch("late nightlife")).toContain("late_night_vibes");
  });

  it("carries a current-turn VIBE preference into Kinfolk subject discovery", () => {
    const subject = deriveBusinessSubject("Find a romantic dinner in Houston");
    expect(subject?.key).toBe("restaurant");
    expect(subject?.vibeKeys).toContain("date_night");
  });

  it("uses public listings and never injects a protected-trait visibility filter", () => {
    const route = source("../routes/vibes.ts");
    expect(route).toContain("FROM public.public_businesses b");
    expect(route).not.toContain("b.black_owned = true");
    expect(route).toContain("VIBES_BY_CATEGORY");
    expect(route).toContain("canonicalVibeKey");
  });

  it("keeps mobile VIBES, identity, keyword, and Kinfolk paths on canonical keys", () => {
    const mobile = source("../../../mobile/app/vibe-search.tsx");
    const identity = source("../routes/business-identity.ts");
    const businessSearch = source("../routes/businesses.ts");
    const governed = source("../kinfolk/governedBusinessRepository.ts");
    expect(mobile).toContain("/api/vibes/list");
    expect(identity).toContain("getBusinessExperiencePolicy(category, subcategory)");
    expect(identity).toContain(".set({ vibes: data.vibes");
    expect(businessSearch).toContain("findVibeKeysForSearch(q)");
    expect(governed).toContain("const vibeKeys = subject.vibeKeys ?? []");
  });
});
