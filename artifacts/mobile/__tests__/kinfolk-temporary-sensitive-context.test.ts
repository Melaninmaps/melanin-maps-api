import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const scope = source("../hooks/useTemporarySensitiveConversationContext.ts");
const primary = source("../hooks/useKinfolk.ts");
const travel = source("../app/travel.tsx");
const section = (text: string, start: string, end: string) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));

describe("native temporary sensitive conversation context source contracts", () => {
  it("provides an explicit accessible active-conversation-only control with subject choices and immediate clear", () => {
    expect(travel).toContain("Private context — active conversation only");
    expect(travel).toContain("Private for this active conversation only. It is not saved as memory, profile, or history.");
    expect(travel).toContain('accessibilityLabel="Private context for this conversation only"');
    expect(travel).toContain('accessibilityLabel="This private context concerns me"');
    expect(travel).toContain('accessibilityLabel="This private context concerns someone else"');
    expect(travel).toContain('accessibilityLabel="Use private context for this conversation only"');
    expect(travel).toContain("Use this for this conversation only");
    expect(travel).toContain('accessibilityLabel="Clear private context immediately"');
    expect(travel).toContain("Clear private context");
    expect(travel).toContain('accessibilityRole="radio"');
    expect(travel).toContain("temporarySensitiveSubject === \"member\"");
    expect(travel).toContain("temporarySensitiveSubject === \"someone_else\"");
  });

  it("keeps the sensitive text component-local and account-bound with no device persistence or handoff", () => {
    expect(scope).toContain("Each mounted primary chat owns only this React state.");
    expect(scope).toContain("[accountId, clearTemporarySensitiveContext]");
    expect(scope).toContain("return () => { clearTemporarySensitiveContext(); };");
    expect(scope).toContain("selection?.accountId === accountId");
    expect(scope).not.toMatch(/SecureStore|AsyncStorage|localStorage|sessionStorage|fetch\(|console\.|recordKinfolkConversation|handoff|URL/);
    expect(travel).toContain("useTemporarySensitiveConversationContext(\n    isAuthenticated ? user?.id ?? null : null,");
  });

  it("passes only an enabled context in the normal primary chat request and never into ChatMessage/session context", () => {
    expect(travel).toContain("temporarySensitiveContext: temporarySensitiveContext ?? undefined");
    expect(primary).toContain("...(opts?.temporarySensitiveContext");
    expect(primary).toContain("? { temporarySensitiveContext: opts.temporarySensitiveContext }");
    expect(section(primary, "const conversationContext =", "const userMsg:")).not.toContain("temporarySensitiveContext");
    expect(section(primary, "const userMsg:", "setMessages((prev)")).not.toContain("temporarySensitiveContext");
    expect(section(primary, "const sendMessage =", "const submitFeedback =")).not.toMatch(/recordKinfolkConversation\([^)]*temporarySensitiveContext|setMessages\([^)]*temporarySensitiveContext/);

    const ast = ts.createSourceFile("useKinfolk.ts", primary, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let requestFields = 0;
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "temporarySensitiveContext") requestFields++;
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(ast);
        const args = node.arguments.map((arg) => arg.getText(ast)).join("\n");
        if (/Storage\.|SecureStore\.|console\.|recordKinfolkConversation|submitFeedback/.test(name)) {
          expect(args).not.toMatch(/temporarySensitiveContext|TemporarySensitiveConversationContext/);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(requestFields).toBe(1);
  });

  it("clears local context on history replacement and explicit new conversation", () => {
    expect(section(travel, "const handleHistorySelect =", "const handleNewSession =")).toContain("clearTemporarySensitiveContext()");
    expect(section(travel, "const handleNewSession =", "const handleCompareToggle =")).toContain("clearTemporarySensitiveContext()");
  });
});

function hookHarness(text: string) {
  const slots: any[] = [];
  let cursor = 0;
  let pending: Array<() => void> = [];
  const same = (a: unknown[] | undefined, b: unknown[]) => a?.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial: unknown) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (next: unknown) => { slots[index].value = next; }];
    },
    useCallback(fn: unknown, deps: unknown[]) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { value: fn, deps };
      return slots[index].value;
    },
    useEffect(setup: () => (() => void), deps: unknown[]) {
      const index = cursor++;
      if (same(slots[index]?.deps, deps)) return;
      pending.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: setup() }; });
    },
  };
  const exports: Record<string, any> = {};
  const executable = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function("require", "exports", executable)((name: string) => { if (name !== "react") throw new Error("Unexpected import"); return react; }, exports);
  return {
    render(accountId: string | null) {
      cursor = 0;
      const value = exports.useTemporarySensitiveConversationContext(accountId);
      const effects = pending;
      pending = [];
      effects.forEach((effect) => effect());
      return value;
    },
  };
}

describe("native temporary sensitive context state transitions", () => {
  it("requires explicit enablement and clears at an account boundary", () => {
    const harness = hookHarness(scope);
    let hook = harness.render("synthetic-account-a");
    expect(hook.temporarySensitiveContext).toBeNull();
    expect(hook.enableTemporarySensitiveContext()).toBe(false);
    hook.setDraftText("synthetic-private-marker");
    hook.setDraftSubject("someone_else");
    hook = harness.render("synthetic-account-a");
    expect(hook.enableTemporarySensitiveContext()).toBe(true);
    hook = harness.render("synthetic-account-a");
    expect(hook.temporarySensitiveContext).toEqual({ consent: true, text: "synthetic-private-marker", subject: "someone_else" });
    hook = harness.render("synthetic-account-b");
    expect(hook.temporarySensitiveContext).toBeNull();
    hook = harness.render("synthetic-account-b");
    expect(hook.temporarySensitiveContext).toBeNull();
  });
});
