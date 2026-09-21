import { describe, expect, it } from "vitest";
import {
  buildImageCreationSafetyGuidance,
  isImageCreationSafetyQuestion,
} from "../image-creation-safety";

describe("Kinfolk ethical image-design guidance", () => {
  it("recognizes image-design safety questions without treating ordinary photo questions as product requests", () => {
    expect(isImageCreationSafetyQuestion("How should Kinfolk use images ethically for business flyers?")).toBe(true);
    expect(isImageCreationSafetyQuestion("Can you make a social media graphic for my restaurant?")).toBe(true);
    expect(isImageCreationSafetyQuestion("What should I wear in my photo tomorrow?")).toBe(false);
  });

  it("requires truthful guidance and blocks person rewriting, child manipulation, and deceptive imagery", () => {
    const guidance = buildImageCreationSafetyGuidance("How do I make an ethical flyer with AI images?");

    expect(guidance).toContain("design around a person");
    expect(guidance).toContain("false endorsements");
    expect(guidance).toContain("Children are a protected category");
    expect(guidance).toContain("Never say Kinfolk already generates");
  });

  it("adds no product-specific guidance to unrelated questions", () => {
    expect(buildImageCreationSafetyGuidance("What is the capital of Pennsylvania?")).toBe("");
  });
});
