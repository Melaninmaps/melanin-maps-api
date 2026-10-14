import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");
const scope = readFileSync(new URL("../hooks/useTemporarySensitiveConversationContext.ts", import.meta.url), "utf8");
const section = (start: string, end: string) => page.slice(page.indexOf(start), page.indexOf(end, page.indexOf(start)));

describe("web temporary sensitive conversation context source contracts", () => {
  it("renders explicit accessible private controls, subject choice, disclosure, and clear in primary composer controls", () => {
    const controls = section('<div id="kinfolk-composer-controls"', "{pendingImageConsent &&");
    expect(controls).toContain('data-testid="kinfolk-temporary-sensitive-context"');
    expect(controls).toContain("Private context — active conversation only");
    expect(controls).toContain("Private for this active conversation only. It is not saved as memory, profile, or history.");
    expect(controls).toContain("Who does this concern?");
    expect(controls).toContain('name="kinfolk-temporary-sensitive-subject" value="member"');
    expect(controls).toContain('name="kinfolk-temporary-sensitive-subject" value="someone_else"');
    expect(controls).toContain('aria-label="Use private context for this conversation only"');
    expect(controls).toContain("Use this for this conversation only");
    expect(controls).toContain('aria-label="Clear private context immediately"');
    expect(controls).toContain("Clear private context");
  });

  it("keeps active context component-local, account-scoped, and free of storage, URLs, and handoff", () => {
    expect(page).toContain('useTemporarySensitiveConversationContext(\n    isLoggedIn && typeof authAccountId === "string" ? authAccountId : null,');
    expect(scope).toContain("[accountId, clearTemporarySensitiveContext]");
    expect(scope).toContain("return () => { clearTemporarySensitiveContext(); };");
    expect(scope).toContain("selection?.accountId === accountId");
    expect(scope).not.toMatch(/localStorage|sessionStorage|cookie|fetch\(|console\.|history|URL|handoff/);
  });

  it("adds an enabled temporary context only to the ordinary chat JSON and never to a Message or session payload", () => {
    const send = section("const send = useCallback", "// Change the depth");
    expect(send).toContain("...(temporarySensitiveContext ? { temporarySensitiveContext: temporarySensitiveContext } : {})");
    expect(section("const conversationContext =", "const userMsg:")).not.toContain("temporarySensitiveContext");
    expect(section("const userMsg:", "// 30-second client-side timeout")).not.toContain("temporarySensitiveContext");
    expect(send).not.toMatch(/setMessages\([^)]*temporarySensitiveContext/);

    const ast = ts.createSourceFile("travel.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let fields = 0;
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "temporarySensitiveContext") fields++;
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(ast);
        const args = node.arguments.map((arg) => arg.getText(ast)).join("\n");
        if (/Storage\.|console\.|history\.|analytics|capture/.test(name)) expect(args).not.toMatch(/temporarySensitiveContext|TemporarySensitiveConversationContext/);
        if (name === "fetch" && !node.arguments[0]?.getText(ast).includes("api/kinfolk/chat")) expect(args).not.toMatch(/temporarySensitiveContext|TemporarySensitiveConversationContext/);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(fields).toBe(1);
  });

  it("clears on historic-session replacement and new conversation", () => {
    expect(section("const loadSession =", "const newChat =")).toContain("clearTemporarySensitiveContext()");
    expect(section("const newChat =", "// Library suggestions")).toContain("clearTemporarySensitiveContext()");
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

describe("web temporary sensitive context state transitions", () => {
  it("requires explicit enablement and fails closed on an account change", () => {
    const harness = hookHarness(scope);
    let hook = harness.render("synthetic-account-a");
    expect(hook.temporarySensitiveContext).toBeNull();
    expect(hook.enableTemporarySensitiveContext()).toBe(false);
    hook.setDraftText("synthetic-private-marker");
    hook = harness.render("synthetic-account-a");
    expect(hook.enableTemporarySensitiveContext()).toBe(true);
    hook = harness.render("synthetic-account-a");
    expect(hook.temporarySensitiveContext).toEqual({ consent: true, text: "synthetic-private-marker", subject: "member" });
    hook = harness.render(null);
    expect(hook.temporarySensitiveContext).toBeNull();
    hook = harness.render(null);
    expect(hook.temporarySensitiveContext).toBeNull();
  });
});
