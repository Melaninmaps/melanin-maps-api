import { describe, expect, it } from "vitest";
import {
  isKinfolkRaisePreparationRequest,
  renderKinfolkRaisePreparation,
} from "../career-mode-response";

describe("Kinfolk deterministic raise-preparation modes", () => {
  it("recognizes a natural-language raise preparation request", () => {
    expect(isKinfolkRaisePreparationRequest(
      "I feel nervous about asking my boss for a raise. Help me prepare for tomorrow.",
    )).toBe(true);
    expect(isKinfolkRaisePreparationRequest("Where should I eat dinner in Minneapolis?")).toBe(false);
  });

  it("renders visibly distinct, truthful coaching structures for all four modes", () => {
    const replies = ["community", "best_friend", "professor", "business_manager"]
      .map((mode) => renderKinfolkRaisePreparation(mode as never).reply);

    expect(new Set(replies).size).toBe(4);
    expect(replies[0]).toMatch(/bring receipts|do not apologize/i);
    expect(replies[1]).toMatch(/you can do this|practice one sentence/i);
    expect(replies[2]).toMatch(/market value|specific evidence/i);
    expect(replies[3]).toMatch(/objective|follow-up/i);
    for (const reply of replies) {
      expect(reply).toMatch(/contribution|responsibilit/i);
      expect(reply).not.toMatch(/guarantee|you deserve a raise/i);
    }
  });
});
