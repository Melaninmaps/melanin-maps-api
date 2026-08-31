import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_CONTEXT_TRUTH_BLOCK,
  STAFF_DEMO_STYLE_BLOCK,
  buildCompatibilityFallbackLog,
  buildKinfolkChatCompletionRequest,
  buildKinfolkHistory,
  buildKinfolkProbeRequest,
  classifyCompatibilityFallback,
  isStaffDemoEligible,
  resolveKinfolkModelPolicy,
  resolveKinfolkProbeModel,
  staffDemoPromptBlock,
  staffDemoResponseMarker,
} from "../staff-demo-policy";

describe("staff-demo eligibility and policy", () => {
  it("requires authentication plus administrator or active tester status", () => {
    expect(isStaffDemoEligible({ authenticated: true, administrator: true, activeTester: false })).toBe(true);
    expect(isStaffDemoEligible({ authenticated: true, administrator: false, activeTester: true })).toBe(true);
    expect(isStaffDemoEligible({ authenticated: true, administrator: false, activeTester: false })).toBe(false);
    expect(isStaffDemoEligible({ authenticated: false, administrator: true, activeTester: true })).toBe(false);
  });

  it("uses configured staff and fallback models with safe defaults", () => {
    expect(resolveKinfolkModelPolicy(true, {})).toMatchObject({
      mode: "staff_demo",
      primaryModel: "gpt-5",
      fallbackModel: "gpt-4o-mini",
      maxOutputTokens: 900,
      historyMessageLimit: 12,
      historyCharacterLimit: 1200,
    });
    expect(resolveKinfolkModelPolicy(true, {
      KINFOLK_STAFF_DEMO_MODEL: " gpt-5-pro ",
      KINFOLK_FALLBACK_MODEL: " gpt-4.1-mini ",
    })).toMatchObject({ primaryModel: "gpt-5-pro", fallbackModel: "gpt-4.1-mini" });
  });

  it("preserves the exact standard model and limits regardless of staff env", () => {
    expect(resolveKinfolkModelPolicy(false, {
      KINFOLK_STAFF_DEMO_MODEL: "other-model",
      KINFOLK_FALLBACK_MODEL: "other-fallback",
    })).toEqual({
      mode: "standard",
      primaryModel: "gpt-4o-mini",
      fallbackModel: null,
      maxOutputTokens: 600,
      historyMessageLimit: 8,
      historyCharacterLimit: 400,
    });
  });
});

describe("family-compatible request parameters", () => {
  const messages = [{ role: "user", content: "hello" }];

  it("uses max_completion_tokens and omits temperature for GPT-5", () => {
    const request = buildKinfolkChatCompletionRequest({
      model: "openai/gpt-5-mini",
      messages,
      maxOutputTokens: 900,
      temperature: 0.2,
    });
    expect(request).toEqual({
      model: "openai/gpt-5-mini",
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 900,
    });
    expect(request).not.toHaveProperty("max_tokens");
    expect(request).not.toHaveProperty("temperature");
  });

  it("preserves legacy max_tokens, JSON output, and optional temperature", () => {
    const request = buildKinfolkChatCompletionRequest({
      model: "gpt-4o-mini",
      messages,
      maxOutputTokens: 600,
      temperature: 0.2,
    });
    expect(request).toEqual({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.2,
    });
  });

  it("uses the compatibility model and family-safe fields for probes", () => {
    expect(resolveKinfolkProbeModel({ KINFOLK_FALLBACK_MODEL: "gpt-5-mini" })).toBe("gpt-5-mini");
    expect(buildKinfolkProbeRequest({
      model: "gpt-5-mini",
      messages,
      maxOutputTokens: 8,
      temperature: 0,
    })).toEqual({ model: "gpt-5-mini", messages, max_completion_tokens: 8 });
  });
});

describe("compatibility-only fallback classification", () => {
  it.each([400, 404, 422])("allows request/model compatibility HTTP %s", (status) => {
    expect(classifyCompatibilityFallback(Object.assign(new Error("provider rejected request"), { status }))).toEqual({
      eligible: true,
      reason: "compatibility_http_status",
      providerStatus: status,
    });
  });

  it("recognizes clear model and parameter compatibility messages", () => {
    expect(classifyCompatibilityFallback(new Error("The requested model was not found"))).toMatchObject({
      eligible: true,
      reason: "model_not_found",
    });
    expect(classifyCompatibilityFallback(new Error("Unsupported parameter: temperature"))).toMatchObject({
      eligible: true,
      reason: "unsupported_request_parameter",
    });
  });

  it.each([401, 403, 429, 500, 503])("does not downgrade on provider HTTP %s", (status) => {
    expect(classifyCompatibilityFallback(Object.assign(new Error("provider error"), { status })).eligible).toBe(false);
  });

  it("does not downgrade on aborts, timeouts, or unknown errors", () => {
    for (const name of ["AbortError", "TimeoutError"]) {
      const error = Object.assign(new Error("request stopped"), { name });
      expect(classifyCompatibilityFallback(error).eligible).toBe(false);
    }
    expect(classifyCompatibilityFallback(new Error("socket hang up")).eligible).toBe(false);
  });

  it("builds a sanitized structured log without model names or provider text", () => {
    const providerMessage = "Unsupported parameter containing user prompt and secret";
    const policy = resolveKinfolkModelPolicy(true, {
      KINFOLK_STAFF_DEMO_MODEL: "private-primary-model-name",
      KINFOLK_FALLBACK_MODEL: "private-fallback-model-name",
    });
    const log = buildCompatibilityFallbackLog({
      requestId: "request-123",
      policy,
      classification: classifyCompatibilityFallback(Object.assign(new Error(providerMessage), { status: 400 })),
    });
    expect(log).toEqual({
      requestId: "request-123",
      mode: "staff_demo",
      reason: "compatibility_http_status",
      providerStatus: 400,
      primaryFamily: "legacy",
      fallbackFamily: "legacy",
    });
    expect(JSON.stringify(log)).not.toContain(providerMessage);
    expect(JSON.stringify(log)).not.toContain(policy.primaryModel);
    expect(JSON.stringify(log)).not.toContain(policy.fallbackModel);
  });
});

describe("bounded history", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    content: `${index}:` + "x".repeat(1400),
  }));

  it("keeps standard history exactly at last 8 messages and 400 characters", () => {
    const history = buildKinfolkHistory(messages, resolveKinfolkModelPolicy(false, {}));
    expect(history).toHaveLength(8);
    expect(history[0].content.startsWith("6:")).toBe(true);
    expect(history.every((message) => message.content.length === 400)).toBe(true);
  });

  it("keeps staff history at last 12 messages and 1200 characters", () => {
    const history = buildKinfolkHistory(messages, resolveKinfolkModelPolicy(true, {}));
    expect(history).toHaveLength(12);
    expect(history[0].content.startsWith("2:")).toBe(true);
    expect(history.every((message) => message.content.length === 1200)).toBe(true);
  });
});

describe("truthful prompt and response marker", () => {
  it("describes supplied and consent-gated context without persistence claims", () => {
    expect(KINFOLK_CONTEXT_TRUTH_BLOCK).toContain("context supplied in this request");
    expect(KINFOLK_CONTEXT_TRUTH_BLOCK).toContain("consent-gated private memory");
    expect(KINFOLK_CONTEXT_TRUTH_BLOCK).toContain("does not train you");
    expect(KINFOLK_CONTEXT_TRUTH_BLOCK).not.toContain("remembers everything");
    expect(KINFOLK_CONTEXT_TRUTH_BLOCK).not.toContain("learn from every interaction");
  });

  it("makes staff style concise, citation-safe, and subordinate to governing rules", () => {
    expect(staffDemoPromptBlock(resolveKinfolkModelPolicy(true, {}))).toBe(STAFF_DEMO_STYLE_BLOCK);
    expect(STAFF_DEMO_STYLE_BLOCK).toMatch(/at most one optional clarifying question/i);
    expect(STAFF_DEMO_STYLE_BLOCK).toMatch(/multiple plausible referents.*one concise clarifying question/i);
    expect(STAFF_DEMO_STYLE_BLOCK).toMatch(/overwhelmed.*no more than three manageable next steps/i);
    expect(STAFF_DEMO_STYLE_BLOCK).toMatch(/Never invent a citation or URL/i);
    expect(STAFF_DEMO_STYLE_BLOCK).toMatch(/Safety, privacy, source and citation requirements.*override/i);
    expect(staffDemoPromptBlock(resolveKinfolkModelPolicy(false, {}))).toBe("");
  });

  it("wires a non-sensitive marker only for staff-demo responses", () => {
    expect(staffDemoResponseMarker(resolveKinfolkModelPolicy(true, {}))).toEqual({
      experience: {
        mode: "staff_demo",
        label: "Staff demo",
        qualityTier: "quality",
        contextTurns: 6,
      },
    });
    expect(staffDemoResponseMarker(resolveKinfolkModelPolicy(false, {}))).toEqual({});
  });

  it("wires eligibility, the marker, and Library fallback into the primary chat route", () => {
    const routeFile = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../routes/kinfolk.ts",
    );
    const source = readFileSync(routeFile, "utf8");
    expect(source).toContain("administrator: isAdmin(req)");
    expect(source).toContain("activeTester");
    expect(source).toContain("const experienceMarker = staffDemoResponseMarker(modelPolicy)");
    expect(source).toContain("return callOpenAIWithCompatibilityFallback(");
    expect(source).toContain("const fallbackReply = buildLibraryFallbackReply(libraryTopic)");
    expect(source.match(/\.\.\.experienceMarker/g)?.length).toBeGreaterThanOrEqual(6);
    expect(source).not.toMatch(/req\.(?:headers?|query).*staff.?demo/i);
  });
});
