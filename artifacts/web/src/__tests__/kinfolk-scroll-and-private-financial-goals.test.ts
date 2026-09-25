import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_BOTTOM_TOLERANCE_PX,
  isNearConversationBottom,
  scrollConversationToBottom,
  shouldScrollConversation,
} from "../features/kinfolk/conversationScroll";
import {
  calculatePrivateFinancialGoalMonthlyAmount,
  isExplicitSavingsGoalPrompt,
  PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE,
  PRIVATE_FINANCIAL_GOAL_OFFER_COPY,
  PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE,
} from "../features/financial-goals/privateFinancialGoalMath";

const travelPage = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");
const financialGoalsPage = readFileSync(new URL("../pages/financial-goals.tsx", import.meta.url), "utf8");
const resourcesPage = readFileSync(new URL("../pages/resources.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("Kinfolk conversation scroll and private financial goals", () => {
  it("keeps browser scrolling bounded to the active conversation pane and respects a reader who has moved away from the bottom", () => {
    expect(isNearConversationBottom({ scrollTop: 840, clientHeight: 160, scrollHeight: 1_000 })).toBe(true);
    expect(isNearConversationBottom({ scrollTop: 650, clientHeight: 160, scrollHeight: 1_000 })).toBe(false);
    expect(KINFOLK_BOTTOM_TOLERANCE_PX).toBeGreaterThan(0);
    expect(shouldScrollConversation(false, null)).toBe(false);
    expect(shouldScrollConversation(true, null)).toBe(true);
    expect(shouldScrollConversation(false, "send")).toBe(true);
    expect(shouldScrollConversation(false, "completion")).toBe(true);

    const conversation = { scrollTop: 1, scrollHeight: 4_200 };
    scrollConversationToBottom(conversation);
    expect(conversation.scrollTop).toBe(4_200);

    expect(travelPage).toContain('data-testid="kinfolk-conversation-scroll-region"');
    expect(travelPage).toContain("onScroll={handleConversationScroll}");
    expect(travelPage).toContain("requestConversationScroll(\"send\")");
    expect(travelPage).toContain("requestConversationScroll(\"completion\")");
    expect(travelPage).toContain("min-h-0 px-4 py-5 space-y-4");
    expect(travelPage).toContain('"flex-1 overflow-y-auto"');
    expect(travelPage).not.toContain("scrollIntoView");
    expect(travelPage).not.toContain("window.scrollTo");
  });

  it("keeps standard keyboard navigation available inside the fixed Kinfolk shell", () => {
    expect(travelPage).toContain("handleConversationKeyboardScroll");
    expect(travelPage).toContain('event.key === "ArrowUp"');
    expect(travelPage).toContain('event.key === "ArrowDown"');
    expect(travelPage).toContain('event.key === "PageUp"');
    expect(travelPage).toContain('event.key === "PageDown"');
    expect(travelPage).toContain('event.key === "Home"');
    expect(travelPage).toContain('event.key === "End"');
    expect(travelPage).toContain('window.addEventListener("keydown", handleConversationKeyboardScroll)');
    expect(travelPage).toContain('target === inputRef.current');
    expect(travelPage).toContain("focusedComposer && !input.trim()");
  });

  it("shows simple monthly math only from valid voluntary target and future-deadline inputs", () => {
    const now = new Date(2026, 8, 18);
    const complete = calculatePrivateFinancialGoalMonthlyAmount({
      targetAmount: "1,200",
      currentSavedAmount: "200",
      deadline: "2026-12-18",
    }, now);
    expect(complete).toMatchObject({ kind: "complete", remainingAmount: 1_000, months: 3 });
    if (complete.kind === "complete") expect(complete.monthlyAmount).toBeCloseTo(333.333, 2);

    expect(calculatePrivateFinancialGoalMonthlyAmount({ targetAmount: "", currentSavedAmount: "", deadline: "" }, now)).toMatchObject({
      kind: "insufficient",
      message: expect.stringContaining("No monthly amount"),
    });
    expect(calculatePrivateFinancialGoalMonthlyAmount({ targetAmount: "1000", currentSavedAmount: "1200", deadline: "2026-12-18" }, now)).toMatchObject({
      kind: "insufficient",
      errors: { currentSavedAmount: expect.stringContaining("cannot be greater") },
    });
    expect(calculatePrivateFinancialGoalMonthlyAmount({ targetAmount: "oops", currentSavedAmount: "", deadline: "2026-12-18" }, now)).toMatchObject({
      kind: "insufficient",
      errors: { targetAmount: expect.any(String) },
    });
    expect(calculatePrivateFinancialGoalMonthlyAmount({ targetAmount: "1000", currentSavedAmount: "", deadline: "2026-09-18" }, now)).toMatchObject({
      kind: "insufficient",
      errors: { deadline: "Choose a future deadline." },
    });
  });

  it("offers the worksheet only for explicit savings-goal prompts and starts a blank private page", () => {
    expect(isExplicitSavingsGoalPrompt("How can I save for a car?")).toBe(true);
    expect(isExplicitSavingsGoalPrompt("I am saving toward a vacation.")).toBe(true);
    expect(isExplicitSavingsGoalPrompt("What is a savings account?")).toBe(false);
    expect(isExplicitSavingsGoalPrompt("How can I afford a car?")).toBe(false);
    expect(travelPage).toContain("Boolean(data.reply?.trim()) && isExplicitSavingsGoalPrompt(trimmed)");
    expect(travelPage).toContain('data-testid="kinfolk-private-financial-goal-offer"');
    expect(travelPage).toContain("PRIVATE_FINANCIAL_GOAL_OFFER_COPY");
    expect(travelPage).toContain("PRIVATE_FINANCIAL_GOAL_ROUTE");
    expect(travelPage).not.toContain("privateFinancialGoalOffer: true");
  });

  it("keeps worksheet values client-only and visibly states its education and privacy limits", () => {
    expect(app).toContain('path="/resources/financial-goals"');
    expect(resourcesPage).toContain("FinancialGoalsResourceCard");
    expect(resourcesPage).toContain("Create a private financial goal");
    expect(financialGoalsPage).toContain("PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE");
    expect(financialGoalsPage).toContain("PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE");
    expect(PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE).toContain("do not save");
    expect(PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE).toContain("not financial, legal, tax, or credit advice");
    expect(financialGoalsPage).toContain("income, debt, credit score, race, ethnicity, gender, family status");
    expect(financialGoalsPage).not.toMatch(/fetch\(|localStorage|sessionStorage|authenticatedFetch|api\//);
    expect(financialGoalsPage).toContain("does not direct you to open credit or other accounts");
  });
});
