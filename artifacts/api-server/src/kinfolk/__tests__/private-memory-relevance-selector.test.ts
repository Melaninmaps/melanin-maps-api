import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isOrdinaryContinuityMemoryRelevant } from "../ordinary-continuity-memory";
import {
  isAuthorizedRelevantPrivateMemoryForTurn,
  memberFacingPrivateMemoryUseForAnswer,
  resolvePrivateMemoryUseDecision,
} from "../private-memory-personalization";

const routeFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../routes/kinfolk.ts",
);

const requirement = {
  content: "I must have a wheelchair-accessible restaurant.",
  purpose: "requirement_context",
  isSensitive: false,
};

describe("Kinfolk private-memory relevance selection", () => {
  it("suppresses a hard requirement for an unrelated arithmetic turn", () => {
    const currentMessage = "What is 8 plus 5?";
    const directRelevance = isOrdinaryContinuityMemoryRelevant(
      requirement,
      currentMessage,
    );

    expect(directRelevance).toBe(false);
    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: requirement,
      currentMessage,
      directRelevance,
      sensitiveUseAllowed: true,
    })).toBe(false);
  });

  it("retains a directly relevant hard requirement as a hard constraint", () => {
    const currentMessage = "Find a wheelchair-accessible restaurant.";
    const directRelevance = isOrdinaryContinuityMemoryRelevant(
      requirement,
      currentMessage,
    );

    expect(directRelevance).toBe(true);
    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: requirement,
      currentMessage,
      directRelevance,
      sensitiveUseAllowed: true,
    })).toBe(true);
  });

  it("suppresses an unrelated ordinary preference while retaining a matching one", () => {
    const preference = {
      content: "I prefer vegan restaurants.",
      purpose: "preference",
      isSensitive: false,
    };

    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: preference,
      currentMessage: "What is 8 plus 5?",
      directRelevance: isOrdinaryContinuityMemoryRelevant(
        preference,
        "What is 8 plus 5?",
      ),
      sensitiveUseAllowed: true,
    })).toBe(false);
    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: preference,
      currentMessage: "Where can I find a vegan dinner?",
      directRelevance: false,
      sensitiveUseAllowed: true,
    })).toBe(true);
  });

  it("keeps sensitive-use authorization separate from relevance", () => {
    const sensitiveRequirement = {
      content: "I have a private health accommodation requirement.",
      purpose: "requirement_context",
      isSensitive: true,
    };

    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: sensitiveRequirement,
      currentMessage: "Find an accessible clinic.",
      directRelevance: true,
      sensitiveUseAllowed: false,
    })).toBe(false);
    expect(isAuthorizedRelevantPrivateMemoryForTurn({
      memory: sensitiveRequirement,
      currentMessage: "Find an accessible clinic.",
      directRelevance: true,
      sensitiveUseAllowed: true,
    })).toBe(true);
  });

  it("shows the generic memory-use notice only for an eligible applied decision", () => {
    const notRelevant = resolvePrivateMemoryUseDecision({
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: 1,
      relevantMemoryCount: 0,
      allowPersonalization: true,
    });
    const applied = resolvePrivateMemoryUseDecision({
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: 1,
      relevantMemoryCount: 1,
      allowPersonalization: true,
    });

    expect(memberFacingPrivateMemoryUseForAnswer({
      decision: notRelevant,
      answerUsedPersonalization: true,
    })).toBeNull();
    expect(memberFacingPrivateMemoryUseForAnswer({
      decision: applied,
      answerUsedPersonalization: true,
    })).toEqual({
      applied: true,
      message: "Your saved preference helped tailor this answer.",
    });
  });

  it("keeps route-level selection on direct relevance and active-record controls", () => {
    const source = readFileSync(routeFile, "utf8");
    const selector = source.slice(
      source.indexOf("function selectRelevantPrivateMemoriesForTurn(input:"),
      source.indexOf("async function findPreferredNameMemory"),
    );
    const activeMemoryQuery = source.slice(
      source.indexOf("const activePrivateMemories ="),
      source.indexOf("const relevantPrivateMemories ="),
    );

    expect(selector).toContain(
      '["preference", "goal", "ongoing_context", "requirement_context"].includes(memory.purpose)',
    );
    expect(selector).toContain("isAuthorizedRelevantPrivateMemoryForTurn({");
    expect(selector).toContain("sensitiveUseAllowed,");
    expect(activeMemoryQuery).toContain(
      "isNull(kinfolkPrivateMemoriesTable.revokedAt)",
    );
    expect(activeMemoryQuery).toContain(
      "isNull(kinfolkPrivateMemoriesTable.pausedAt)",
    );
  });
});
