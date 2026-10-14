import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import {
  TEMPORARY_SENSITIVE_CONTEXT_MAX_LENGTH,
  buildTemporarySensitiveConversationContextPrompt,
  parseTemporarySensitiveConversationContext,
} from "../temporary-sensitive-conversation-context";

const route = readFileSync(new URL("../../routes/kinfolk.ts", import.meta.url), "utf8");
const chatStart = route.indexOf('router.post("/kinfolk/chat"');
const chat = route.slice(chatStart, route.indexOf("\nrouter.", chatStart + 1));
const acceptedMember = { consent: true, subject: "member", text: "synthetic-private-marker" } as const;
const acceptedSomeoneElse = { consent: true, subject: "someone_else", text: "synthetic-private-marker" } as const;

function isolatedHandler() {
  const prefix = route.slice(chatStart, route.indexOf("  const earlyHealthCareEvidence", chatStart));
  const executable = ts.transpileModule(`${prefix}\nreturn void res.status(204).json({ isolated: true });\n});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  let handler: (req: any, res: any) => Promise<void> = async () => { throw new Error("Not registered"); };
  const trace = vi.fn(() => null);
  const medical = vi.fn((message: string) => message === "synthetic medical emergency" ? "fixed medical answer" : null);
  const safety = vi.fn((message: string) => message === "synthetic safety emergency" ? "fixed safety answer" : null);
  new Function(
    "router",
    "parseConversationInstruction",
    "parseTemporarySensitiveConversationContext",
    "parseKinfolkClientTrace",
    "immediateMedicalEmergencyReply",
    "immediateSafetyEmergencyReply",
    executable,
  )(
    { post: (_path: string, callback: typeof handler) => { handler = callback; } },
    () => ({ ok: true, instruction: undefined }),
    parseTemporarySensitiveConversationContext,
    trace,
    medical,
    safety,
  );
  return { handler, trace, medical, safety };
}

function request(temporarySensitiveContext: unknown, message = "synthetic ordinary question", authenticated = true) {
  const req = {
    body: { message, temporarySensitiveContext },
    user: authenticated ? { id: "synthetic-owner" } : undefined,
    get: vi.fn(),
    once: vi.fn(),
    log: { info: vi.fn(), error: vi.fn() },
  };
  const res = { status: vi.fn(function(this: any, _code: number) { return this; }), json: vi.fn(), once: vi.fn(), writableEnded: false };
  return { req, res };
}

describe("temporary sensitive conversation context", () => {
  it("accepts only omitted or explicit-consent bounded member/someone-else payloads", () => {
    expect(parseTemporarySensitiveConversationContext(undefined)).toEqual({ ok: true, context: undefined });
    expect(parseTemporarySensitiveConversationContext(acceptedMember)).toEqual({ ok: true, context: acceptedMember });
    expect(parseTemporarySensitiveConversationContext(acceptedSomeoneElse)).toEqual({ ok: true, context: acceptedSomeoneElse });
    const invalid = [
      null,
      [],
      {},
      { consent: false, subject: "member", text: "synthetic-private-marker" },
      { consent: true, subject: "unknown", text: "synthetic-private-marker" },
      { consent: true, subject: "member", text: "" },
      { consent: true, subject: "member", text: " synthetic-private-marker" },
      { consent: true, subject: "member", text: "synthetic-private-marker", extra: true },
      { consent: true, subject: "member", text: "x".repeat(TEMPORARY_SENSITIVE_CONTEXT_MAX_LENGTH + 1) },
    ];
    for (const value of invalid) expect(parseTemporarySensitiveConversationContext(value)).toEqual({ ok: false });
  });

  it("builds server-owned current-conversation instructions with explicit non-inference semantics", () => {
    const member = buildTemporarySensitiveConversationContextPrompt(acceptedMember);
    const someoneElse = buildTemporarySensitiveConversationContextPrompt(acceptedSomeoneElse);
    for (const prompt of [member, someoneElse]) {
      expect(prompt).toContain("PRIVATE, CURRENT CONVERSATION ONLY");
      expect(prompt).toContain("only when it is directly relevant");
      expect(prompt).toContain("private memory, a profile, current chapter, session history, analytics, logs, response metadata, or a cross-surface handoff");
      expect(prompt).toContain("Do not infer a profile, identity, or status");
      expect(prompt).toContain("general greetings, suggestions, recommendations, Map, Directory, Community, or Library flows");
      expect(prompt).toContain("<temporary_sensitive_context>");
      expect(prompt).toContain("synthetic-private-marker");
    }
    expect(member).toContain("concerns the member only for this current conversation");
    expect(someoneElse).toContain("concerns someone else");
    expect(someoneElse).toContain("Never infer, state, or imply that it describes the member");
    expect(buildTemporarySensitiveConversationContextPrompt(undefined)).toBe("");
  });

  it("rejects malformed or unconsented data before trace, listeners, or deterministic route work", async () => {
    const invalid = [null, {}, { consent: false, subject: "member", text: "synthetic-private-marker" }];
    for (const value of invalid) {
      const fixture = isolatedHandler();
      const { req, res } = request(value, "synthetic medical emergency");
      await fixture.handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request" });
      expect(fixture.trace).not.toHaveBeenCalled();
      expect(fixture.medical).not.toHaveBeenCalled();
      expect(fixture.safety).not.toHaveBeenCalled();
      expect(req.once).not.toHaveBeenCalled();
      expect(req.log.info).not.toHaveBeenCalled();
    }
  });

  it("preserves authentication and lets emergency replies ignore temporary context", async () => {
    const unauthorized = request({ consent: false }, "synthetic medical emergency", false);
    const unauthFixture = isolatedHandler();
    await unauthFixture.handler(unauthorized.req, unauthorized.res);
    expect(unauthorized.res.status).toHaveBeenCalledWith(401);
    expect(unauthorized.res.json).toHaveBeenCalledWith({ error: "Authentication required" });

    const fixture = isolatedHandler();
    const { req, res } = request(acceptedSomeoneElse, "synthetic medical emergency");
    await fixture.handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ reply: "fixed medical answer" }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("temporarySensitiveContext");
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("synthetic-private-marker");
  });

  it("parses before trace and uses the parsed value only in both normal and lean system-prompt paths", () => {
    expect(route.indexOf("parseTemporarySensitiveConversationContext(")).toBeGreaterThan(chatStart);
    expect(route.indexOf("parseTemporarySensitiveConversationContext(")).toBeLessThan(route.indexOf("parseKinfolkClientTrace", chatStart));
    expect(route.indexOf("temporarySensitiveContextPrompt")).toBeLessThan(route.indexOf("const newUserMsg", chatStart));
    expect(route.match(/parsedTemporarySensitiveContext\.context/g)).toHaveLength(1);
    const promptAssembly = route.slice(
      route.indexOf("const systemPromptWithLibrary"),
      route.indexOf("const explicitResumeResponsePolicy"),
    );
    expect(promptAssembly).toContain("leanGeneralChat");
    expect(promptAssembly).toContain("temporarySensitiveContextPrompt");
    expect(promptAssembly).toMatch(/\) \+ \(temporarySensitiveContextPrompt/);

    const ast = ts.createSourceFile("kinfolk.ts", chat, ts.ScriptTarget.Latest, true);
    let checked = 0;
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["values", "set", "info", "warn", "error", "debug"].includes(node.expression.name.text)) {
        checked++;
        const argumentsText = node.arguments.map((argument) => argument.getText(ast)).join("\n");
        expect(argumentsText).not.toMatch(/temporarySensitiveContext|parsedTemporarySensitiveContext|temporarySensitiveContextPrompt|req\.body|systemPrompt/);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(checked).toBeGreaterThan(5);
    const messages = route.slice(route.indexOf("const newUserMsg", chatStart), route.indexOf('chatStage = "session_persist"', chatStart));
    expect(messages).not.toMatch(/temporarySensitiveContext|temporarySensitiveContextPrompt/);
  });
});
