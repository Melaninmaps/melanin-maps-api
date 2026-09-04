import { describe, expect, it, vi } from "vitest";
import {
  persistAnswerPlan,
  updateOwnedAnswerPlanDepth,
  type AnswerPlanQuery,
} from "../answer-plan-persistence";

describe("Kinfolk answer-plan persistence", () => {
  it("persists a member-owned, short-lived plan without a raw question", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const logger = { warn: vi.fn() };

    const id = await persistAnswerPlan({
      query: { query } as unknown as AnswerPlanQuery,
      logger,
      userId: "member-a",
      sessionId: "session-a",
      domainClass: "culture",
      isSensitive: false,
      audienceBand: "18_plus",
      plan: { reply: "A source-backed answer", depth: "standard", sources: [] },
    });

    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(query).toHaveBeenCalledOnce();
    const [, values] = query.mock.calls[0];
    expect(values).toEqual(expect.arrayContaining(["member-a", "session-a", "culture"]));
    expect(JSON.parse(values[6])).not.toHaveProperty("message");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("fails open when answer-plan persistence is unavailable", async () => {
    const logger = { warn: vi.fn() };
    const id = await persistAnswerPlan({
      query: { query: vi.fn().mockRejectedValue(new Error("table unavailable")) } as unknown as AnswerPlanQuery,
      logger,
      userId: "member-a",
      sessionId: undefined,
      domainClass: "general",
      isSensitive: false,
      audienceBand: "unknown",
      plan: { reply: "Still delivered", depth: "standard", sources: [] },
    });

    expect(id).toBeNull();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("updates a depth only when the plan belongs to the requesting member", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ domain_class: "culture", is_sensitive: false, audience_band: "18_plus" }],
    });

    const updated = await updateOwnedAnswerPlanDepth({
      query: { query } as unknown as AnswerPlanQuery,
      answerPlanId: "plan-a",
      userId: "member-a",
      action: "show_more",
    });

    expect(updated).toEqual({
      domainClass: "culture",
      isSensitive: false,
      audienceBand: "18_plus",
    });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain("UPDATE kinfolk_answer_plans");
    expect(sql).toContain("AND user_id = $2");
    expect(values).toEqual(["plan-a", "member-a", "deep"]);
  });

  it("does not reveal or modify another member's plan", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    const updated = await updateOwnedAnswerPlanDepth({
      query: { query } as unknown as AnswerPlanQuery,
      answerPlanId: "member-b-plan",
      userId: "member-a",
      action: "show_less",
    });

    expect(updated).toBeNull();
    expect(query.mock.calls[0][1]).toEqual(["member-b-plan", "member-a", "brief"]);
  });
});