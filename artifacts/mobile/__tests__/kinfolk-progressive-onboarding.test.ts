import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  BEAUTY_OPTIONS, BUDGET_OPTIONS, COMPANION_OPTIONS, CORE_STEPS, INTEREST_OPTIONS,
  PURPOSE_OPTIONS, RESPONSE_OPTIONS, TRIP_OPTIONS, buildOnboardingPayload,
  buildOnboardingSteps, completeOnboarding, emptyOnboardingDraft, skipOnboardingPrompt,
  type OnboardingDraft, type OnboardingStep,
} from "../lib/kinfolk-onboarding";

const onboarding = readFileSync(new URL("../components/KinfolkOnboarding.tsx", import.meta.url), "utf8");
const flow = readFileSync(new URL("../lib/kinfolk-onboarding.ts", import.meta.url), "utf8");
const otherFlow = readFileSync(new URL("../../web/src/lib/kinfolk-onboarding.ts", import.meta.url), "utf8");
const filled = (): OnboardingDraft => ({
  ...emptyOnboardingDraft(), interests: ["Beauty & Wellness", "Family Activities"],
  purposes: ["Places to go", "Services"], budget: "mid", responseStyle: "concise",
  beautyServices: ["barber"], tripStyles: ["group"], travelCompanion: "friends",
  familyFriendly: true, familyCompanion: "family",
});

describe("native progressive Kinfolk onboarding", () => {
  it("keeps native and web source contracts identical", () => {
    expect(flow).toBe(otherFlow);
  });

  it.each(Array.from({ length: 8 }, (_, mask) => mask))("bounds explicit eligibility combination %i to 6–8 steps with fixed core order", mask => {
    const draft = emptyOnboardingDraft();
    if (mask & 1) draft.interests.push("Beauty & Wellness");
    if (mask & 2) draft.interests.push("Family Activities");
    if (mask & 4) draft.purposes.push("Places to go");
    const steps = buildOnboardingSteps(draft);
    const conditional = Number(Boolean(mask & 1)) + Number(Boolean(mask & 2)) + Number(Boolean(mask & 4));
    expect(steps.length).toBe(5 + Math.max(1, conditional));
    expect(steps.length).toBeGreaterThanOrEqual(6);
    expect(steps.length).toBeLessThanOrEqual(8);
    expect(steps.slice(0, 5)).toEqual(["welcome", "interests", "use_cases", "budget", "response_style"]);
    expect(steps.includes("beauty_services")).toBe(Boolean(mask & 1));
    expect(steps.includes("family_planning")).toBe(Boolean(mask & 2));
    expect(steps.includes("travel_style")).toBe(Boolean(mask & 4));
    expect(steps.includes("ready")).toBe(mask === 0);
  });

  it("does not show any conditional prompt for unrelated interests or purposes", () => {
    for (const interest of INTEREST_OPTIONS.filter(value => !["Beauty & Wellness", "Family Activities"].includes(value))) {
      expect(buildOnboardingSteps({ ...emptyOnboardingDraft(), interests: [interest] })).toEqual([...CORE_STEPS, "ready"]);
    }
    for (const purpose of PURPOSE_OPTIONS.filter(value => !["Places to go", "Family-friendly plans"].includes(value))) {
      expect(buildOnboardingSteps({ ...emptyOnboardingDraft(), purposes: [purpose] })).toEqual([...CORE_STEPS, "ready"]);
    }
  });

  it("shows family planning only after a selected family interest or explicit planning/travel choice", () => {
    expect(buildOnboardingSteps({ ...emptyOnboardingDraft(), purposes: ["Family-friendly plans"] })).toEqual([...CORE_STEPS, "family_planning"]);
    for (const patch of [{ travelCompanion: "family" as const }, { tripStyles: ["family"] }]) {
      expect(buildOnboardingSteps({ ...emptyOnboardingDraft(), ...patch })).not.toContain("family_planning");
      const steps = buildOnboardingSteps({ ...emptyOnboardingDraft(), purposes: ["Places to go"], ...patch });
      expect(steps).toEqual([...CORE_STEPS, "travel_style", "family_planning"]);
    }
  });

  it("keeps travel before a late explicit family follow-up and prevents a ninth step", () => {
    const draft = { ...filled(), interests: ["Beauty & Wellness"], travelCompanion: "family" as const };
    expect(buildOnboardingSteps(draft)).toEqual([...CORE_STEPS, "beauty_services", "travel_style", "family_planning"]);
    expect(buildOnboardingSteps(skipOnboardingPrompt(draft, "travel_style"))).toEqual([...CORE_STEPS, "beauty_services", "travel_style"]);
  });

  it("does not infer follow-ups or save stale conditional answers after eligibility is removed", () => {
    const draft = { ...filled(), interests: [], purposes: [] };
    expect(buildOnboardingSteps(draft)).toEqual([...CORE_STEPS, "ready"]);
    expect(buildOnboardingPayload(draft)).toEqual({ budgetRange: "mid", communicationStyle: "concise" });
  });

  it("starts with no selected defaults and never sends blank preference fields", () => {
    expect(buildOnboardingPayload(emptyOnboardingDraft())).toEqual({});
    expect(buildOnboardingPayload({ ...emptyOnboardingDraft(), budget: "any", responseStyle: "friendly" })).toEqual({ budgetRange: "any", communicationStyle: "friendly" });
  });

  it("builds only explicit selected ordinary preferences, with no setup or identity field", () => {
    expect(buildOnboardingPayload(filled())).toEqual({
      favoriteCategories: ["Beauty & Wellness", "Family Activities"], culturalInterests: ["Places to go", "Services"],
      budgetRange: "mid", communicationStyle: "concise", lifestyleServices: ["barber"],
      tripStyle: ["group", "family"], travelCompanion: "family",
    });
    for (const value of Object.values(buildOnboardingPayload(filled()))) {
      expect(value).not.toBe("");
      if (Array.isArray(value)) expect(value.length).toBeGreaterThan(0);
    }
  });

  it("does not translate a selected family interest into a family status or companion default", () => {
    expect(buildOnboardingPayload({ ...emptyOnboardingDraft(), interests: ["Family Activities"] })).toEqual({ favoriteCategories: ["Family Activities"] });
    expect(buildOnboardingPayload({ ...emptyOnboardingDraft(), purposes: ["Family-friendly plans"], familyCompanion: "friends" })).toEqual({ culturalInterests: ["Family-friendly plans"], travelCompanion: "friends" });
    expect(onboarding).toContain("Choosing company here replaces the earlier company preference. Skip to keep that choice.");
  });

  it.each(["welcome", "interests", "use_cases", "budget", "response_style", "beauty_services", "travel_style", "family_planning", "ready"] as OnboardingStep[])("skip %s omits that answer without wiping unrelated saved preferences", step => {
    const draft = filled();
    const before = structuredClone(draft);
    const skipped = skipOnboardingPrompt(draft, step);
    expect(draft).toEqual(before);
    const payload = buildOnboardingPayload(skipped);
    const field: Partial<Record<OnboardingStep, string>> = {
      interests: "favoriteCategories", use_cases: "culturalInterests", budget: "budgetRange",
      response_style: "communicationStyle", beauty_services: "lifestyleServices",
    };
    if (field[step]) expect(payload).not.toHaveProperty(field[step]!);
    if (step === "travel_style") {
      expect(payload.tripStyle).toEqual(["family"]);
      expect(payload.travelCompanion).toBe("family");
    }
    if (step === "family_planning") {
      expect(payload.tripStyle).toEqual(["group"]);
      expect(payload.travelCompanion).toBe("friends");
    }
    const existing = { favoriteCities: ["existing city"], communities: ["existing context"], preferredOwnershipTypes: ["existing support"], supportLensMode: "strict_documented_designations", personalityMode: "big_cousin", dietaryNotes: "existing independent note" };
    const result = { ...existing, ...payload };
    for (const key of Object.keys(existing)) expect(result[key as keyof typeof existing]).toEqual(existing[key as keyof typeof existing]);
  });

  it("skipping every render preserves all saved preferences and issues no preference update", async () => {
    let draft = emptyOnboardingDraft();
    for (const step of buildOnboardingSteps(draft)) draft = skipOnboardingPrompt(draft, step);
    const save = vi.fn(async () => true);
    const complete = vi.fn(async () => true);
    expect(await completeOnboarding(buildOnboardingPayload(draft), save, complete)).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
  });

  it("full skip discards neither the current draft nor saved preferences", async () => {
    const draft = filled();
    const before = structuredClone(draft);
    const save = vi.fn(async () => true);
    expect(await completeOnboarding(buildOnboardingPayload(emptyOnboardingDraft()), save, async () => true)).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(draft).toEqual(before);
  });

  it.each([false, "throw"])("failed preference save (%s) never confirms completion", async failure => {
    const complete = vi.fn(async () => true);
    const save = vi.fn(async () => { if (failure === "throw") throw new Error("offline"); return false; });
    expect(await completeOnboarding(buildOnboardingPayload(filled()), save, complete)).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });

  it("waits for preference server confirmation before the completion marker/profile patch", async () => {
    let confirmSave!: (value: boolean) => void;
    const complete = vi.fn(async () => true);
    const pending = completeOnboarding({ budgetRange: "mid" }, () => new Promise(resolve => { confirmSave = resolve; }), complete);
    expect(complete).not.toHaveBeenCalled();
    confirmSave(true);
    expect(await pending).toBe(true);
    expect(complete).toHaveBeenCalledOnce();
  });

  it.each([false, "throw"])("failed completion (%s) stays incomplete and supports retry with the same draft", async failure => {
    const draft = filled();
    const before = structuredClone(draft);
    const save = vi.fn(async () => true);
    const failedCompletion = async () => { if (failure === "throw") throw new Error("offline"); return false; };
    expect(await completeOnboarding(buildOnboardingPayload(draft), save, failedCompletion)).toBe(false);
    expect(draft).toEqual(before);
    expect(await completeOnboarding(buildOnboardingPayload(draft), save, async () => true)).toBe(true);
    expect(save.mock.calls[0]).toEqual(save.mock.calls[1]);
  });

  it("full-skip failure retains retry intent and retries completion only", async () => {
    const save = vi.fn(async () => true);
    expect(await completeOnboarding({}, save, async () => false)).toBe(false);
    expect(await completeOnboarding({}, save, async () => true)).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(onboarding).toContain("setRetryFullSkip(fullSkip)");
    expect(onboarding).toContain("retryFullSkip ? emptyOnboardingDraft() : draft");
    expect(onboarding).toContain("Nothing was marked complete; please try again.");
    expect(onboarding).toContain("if (saved) onComplete()");
    expect(onboarding).toContain("Retry");
  });

  it("uses only API-valid tap values and lifestyle-only beauty services", () => {
    expect(BUDGET_OPTIONS.map(option => option.value)).toEqual(["budget", "mid", "luxury", "any"]);
    expect(RESPONSE_OPTIONS.map(option => option.value)).toEqual(["friendly", "concise", "detailed"]);
    expect(COMPANION_OPTIONS.map(option => option.value)).toEqual(["solo", "partner", "friends", "family", "colleagues"]);
    expect(TRIP_OPTIONS.map(option => option.value)).toEqual(["solo", "couple", "family", "group", "business", "spiritual"]);
    expect(BEAUTY_OPTIONS.map(option => option.value)).toEqual(["barber", "loctician", "natural_hair_stylist", "braider", "nail_tech", "esthetician", "massage_therapist", "personal_trainer"]);
  });

  it("contains no sensitive/current-life/location collection or free-text field in the initial path", () => {
    const source = onboarding + flow;
    expect(source).not.toMatch(/recommendationLifeStage|ageAssurance|dateOfBirth|date_of_birth|birthDate|birth_date|\bDOB\b|sexAssignedAtBirth|genderIdentity|identity-context|allowMedical|homeCity|homeState|favoriteCities|setCommunities|communities:|cultures:|preferredLanguages|Support Lens|supportLensMode|preferredOwnershipTypes|isBusinessOwner|isCommunityOrg|dietaryNotes|pregnancy|fertility|currentChapter|current-chapter|vault|TextInput|<input|<textarea/i);
    expect(onboarding).toContain("No sensitive or current-life details are requested here");
    expect(onboarding).toContain("does not infer identity or life status from your answers or activity");
    expect(onboarding).toContain("not public profile information");
    expect(source).not.toMatch(/gets smarter every time|learn through your saves|learn everything about|community signals|Thumbs up a spot|already lined up|analytics\.|track\(/i);
  });

  it("renders only the active prompt with Back, Continue, optional skip, and editable-later copy", () => {
    expect(onboarding).toContain("switch (stepId)");
    expect(onboarding).toContain("const totalSteps = steps.length");
    expect(onboarding).toContain("nextSteps.indexOf(stepId)");
    expect(onboarding).toContain("skipOnboardingPrompt(draft, stepId)");
    expect(onboarding).toContain("advance(true)");
    expect(onboarding).toContain("Skip for now");
    expect(onboarding).toContain("Skip all");
    expect(onboarding).toContain("Back");
    expect(onboarding).toContain("Continue");
    expect(onboarding).toContain("Every prompt is optional and editable later in Kinfolk Settings and Taste Profile");
    expect(onboarding).not.toMatch(/showAllSections|TOTAL_STEPS = 15/);
  });

  it("uses accessible modal, checked options, live progress, and errors", () => {
    expect(onboarding).toContain("accessibilityViewIsModal");
    expect(onboarding).toContain('accessibilityRole={multiple ? "checkbox" : "radio"}');
    expect(onboarding).toContain("accessibilityState={{ checked: active, disabled: saving }}");
    expect(onboarding).toContain('accessibilityRole="progressbar"');
    expect(onboarding).toContain("max: totalSteps, now: step + 1");
    expect(onboarding).toContain("`${step + 1} of ${totalSteps}`");
    expect(onboarding).toContain('accessibilityLiveRegion="assertive"');
  });

  it("writes only the existing visibility marker, awaits it, and never stores response fields", () => {
    expect(onboarding.match(/AsyncStorage\.setItem/g)).toHaveLength(1);
    expect(onboarding).toContain('await AsyncStorage.setItem(ONBOARDING_KEY, "1")');
    expect(onboarding).toContain("catch { return false; }");
    expect(onboarding).toContain("buildOnboardingPayload(currentDraft), update, markKinfolkOnboardingDone");
    expect(onboarding).toContain("finish(emptyOnboardingDraft(), true)");
    expect(onboarding).not.toMatch(/AsyncStorage\.(multiSet|mergeItem)|JSON\.stringify|fetch\(/);
    const finish = onboarding.slice(onboarding.indexOf("async function finish"), onboarding.indexOf("function advance"));
    expect(finish).not.toContain("setDraft(");
  });
});
