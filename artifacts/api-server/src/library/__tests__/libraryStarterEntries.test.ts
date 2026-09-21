import { describe, expect, it } from "vitest";
import { LIBRARY_STARTER_TOPICS } from "../libraryStarterTopicSeed";
import { buildLibraryStarterEntry } from "../seedLibraryStarterEntries";

describe("Living Library starter guides", () => {
  it("turns each vetted starter topic into a published source-linked explanation", () => {
    expect(LIBRARY_STARTER_TOPICS).toHaveLength(112);
    const culture = LIBRARY_STARTER_TOPICS.find((topic) => topic.slug === "culture-history-identity");
    expect(culture?.isFeatured).toBe(true);
    expect(culture?.candidateSources.length).toBeGreaterThanOrEqual(2);
    const fertility = LIBRARY_STARTER_TOPICS.find((topic) => topic.slug === "infertility-evaluation-and-diagnosis");
    expect(fertility).toBeDefined();
    const guide = buildLibraryStarterEntry(fertility!);
    expect(guide.title).toContain(fertility!.title);
    expect(guide.body).toContain("What this guide is for");
    expect(guide.body).toContain("Build the next question");
    expect(guide.body).toContain("Important boundary");
    expect(guide.sources.length).toBeGreaterThan(0);
    expect(guide.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(guide.relatedQuestions.length).toBeGreaterThan(0);
  });
});
