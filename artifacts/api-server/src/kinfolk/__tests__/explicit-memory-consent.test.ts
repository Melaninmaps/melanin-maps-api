import { describe, expect, it } from "vitest";
import { buildExplicitMemoryConsentPlan } from "../explicit-memory-consent";

describe("buildExplicitMemoryConsentPlan", () => {
  it("separates ordinary preferences from sensitive health, family, identity, and birthday details", () => {
    const plan = buildExplicitMemoryConsentPlan(
      "Please remember I am a Black woman 44 my birthday is 4/28 I do not have any allergies I prefer to support Black women owned businesses when available but am open to other minorities as well I have three children I am a project manager and I enjoy food travel and concerts",
    );

    expect(plan).not.toBeNull();
    expect(plan!.ordinary.map((item) => item.label)).toEqual(expect.arrayContaining([
      "Support preference",
      "Work or planning preference",
      "Interest or lifestyle preference",
    ]));
    expect(plan!.sensitive.map((item) => item.label)).toEqual(expect.arrayContaining([
      "Identity or background",
      "Birthday or age",
      "Health or allergy information",
      "Children or family information",
    ]));
  });

  it("does not classify a stated support preference as an identity record", () => {
    const plan = buildExplicitMemoryConsentPlan(
      "Please remember I prefer Black-owned businesses when available and I enjoy bookstores",
    );
    expect(plan?.sensitive).toEqual([]);
    expect(plan?.ordinary).toHaveLength(2);
  });

  it("keeps parent context sensitive and separate from adjacent ordinary preferences", () => {
    const plan = buildExplicitMemoryConsentPlan(
      "Kinfolk, this is what I want you to remember about me: I have locs, I prefer Caribbean food, and my mother lives in Philadelphia.",
    );
    expect(plan?.ordinary.map((item) => item.content)).toEqual([
      "I have locs",
      "I prefer Caribbean food",
    ]);
    expect(plan?.sensitive).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: "Children or family information",
        content: "my mother lives in Philadelphia",
        topic: "children",
      }),
    ]));

    for (const parentClause of [
      "my father lives in Philadelphia",
      "my parent lives in Philadelphia",
      "my parents live in Philadelphia",
    ]) {
      const parentPlan = buildExplicitMemoryConsentPlan(
        `Please remember ${parentClause}.`,
      );
      expect(parentPlan?.sensitive).toEqual([
        expect.objectContaining({
          label: "Children or family information",
          content: parentClause,
          topic: "children",
        }),
      ]);
      expect(parentPlan?.ordinary).toEqual([]);
    }

    const familyPreference = buildExplicitMemoryConsentPlan(
      "Please remember I prefer family-friendly Caribbean restaurants.",
    );
    expect(familyPreference?.sensitive).toEqual([]);
    expect(familyPreference?.ordinary.map((item) => item.content)).toEqual([
      "I prefer family-friendly Caribbean restaurants",
    ]);
  });

  it("returns null when the member did not explicitly ask Kinfolk to remember", () => {
    expect(buildExplicitMemoryConsentPlan("I enjoy food and travel.")).toBeNull();
  });

  it("offers a separate one-turn choice for an explicit delivery preference", () => {
    const plan = buildExplicitMemoryConsentPlan("Always give me short answers.");
    expect(plan).toMatchObject({
      purpose: "profile_context",
      oneTimeUseAvailable: true,
    });
    expect(plan?.ordinary).toEqual([
      expect.objectContaining({ label: "Communication preference" }),
    ]);
  });
});
