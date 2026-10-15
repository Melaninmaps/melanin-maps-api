import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const scope = source("../hooks/useConversationInstruction.ts");
const primary = source("../hooks/useKinfolk.ts");
const travel = source("../app/travel.tsx");
const widget = source("../components/AIChatWidget.tsx");
const controls = source("../components/KinfolkConversationInstructionControls.tsx");
const section = (text: string, start: string, end: string) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));
const choices = [
  ["concise", "Keep answers concise"], ["step_by_step", "Use step-by-step guidance"],
  ["answer_first", "Start with the direct answer"], ["gentle", "Use a gentle, supportive tone"],
];
function assertNoPersistence(text: string, expectedRequestFields: number) {
  const ast = ts.createSourceFile("surface.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let fields = 0;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "conversationInstruction") fields++;
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(ast);
      if (/Storage\.|SecureStore\.|console\.|recordKinfolkConversation|submitFeedback/.test(name)) {
        expect(node.arguments.map((arg) => arg.getText(ast)).join("\n")).not.toMatch(/conversationInstruction|ConversationInstruction|getConversationInstruction/);
      }
      if (name === "fetch" && !node.arguments[0]?.getText(ast).includes("/kinfolk/chat")) {
        expect(node.arguments.map((arg) => arg.getText(ast)).join("\n")).not.toMatch(/conversationInstruction|getConversationInstruction/);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  expect(fields).toBe(expectedRequestFields);
}

describe("native conversation-only instruction source contracts", () => {
  it("offers exactly the four fixed choices with explicit scope, selected radio state, and clear", () => {
    for (const [id, label] of choices) expect(scope).toContain(`{ id: "${id}", label: "${label}" }`);
    expect(scope.match(/\{ id: "/g)).toHaveLength(4);
    expect(controls).toContain("This conversation only");
    expect(controls).toContain('accessibilityRole="radio"');
    expect(controls).toContain("checked: value === option.id");
    expect(controls).toContain("Current:");
    expect(controls).toContain('accessibilityLabel="Clear conversation instruction"');
    expect(controls).not.toContain("TextInput");
    for (const surface of [travel, widget]) expect(surface).toContain("<KinfolkConversationInstructionControls value={conversationInstruction} onChange={setConversationInstruction} onClear={clearConversationInstruction}");
    expect(travel).toContain("{showComposerControls && <>");
    expect(widget).toContain('accessibilityLabel="Open conversation delivery controls"');
  });
  it("keeps the choice local and account-scoped, clearing on logout/account changes and unmount", () => {
    expect(primary).toContain("useConversationInstruction(user?.id ?? null)");
    expect(widget).toContain("useConversationInstruction(isAuthenticated ? user?.id ?? null : null)");
    expect(scope).toContain("[accountId, clearConversationInstruction]");
    expect(scope).toContain("return () => { selectionRef.current = null; }");
    expect(scope).toContain("current?.accountId === accountId");
    expect(scope).toContain("selection?.accountId === accountId");
    expect(scope).toContain("createConversationInstructionClientId");
    expect(scope).toContain("clientIdRef.current = createConversationInstructionClientId()");
    expect(scope).toContain("conversationInstructionClientId: accountId ? clientIdRef.current : undefined");
    expect(scope).not.toMatch(/Storage\.|SecureStore\.|fetch\(|console\.|recordKinfolkConversation\(|oneTurnInstruction/);
  });
  it("sends the current choice on every request, without success/failure/abort consumption", () => {
    expect(primary).toContain("conversationInstruction: getConversationInstruction()");
    expect(widget).toContain("conversationInstruction: options?.conversationInstruction");
    expect(widget).toContain("conversationInstruction: getConversationInstruction()");
    expect(primary).toContain("conversationInstructionClientId,");
    expect(widget).toContain("conversationInstructionClientId: options?.conversationInstructionClientId");
    const primarySend = section(primary, "const sendMessage =", "const submitFeedback =");
    const widgetSend = section(widget, "const sendMessage =", "const saveProposedTaskAction =");
    for (const send of [primarySend, widgetSend]) {
      const failure = send.slice(send.lastIndexOf("catch"));
      expect(failure).not.toContain("clearConversationInstruction()");
      expect(send).not.toMatch(/if \(.*(?:ok|oneTurnInstruction).*\).*clearConversationInstruction/);
    }
    assertNoPersistence(primary, 1);
    assertNoPersistence(widget, 2);
    assertNoPersistence(travel, 0);
    expect(section(primary, "const conversationContext =", "const userMsg:")).not.toContain("conversationInstruction");
    expect(section(widget, "const userMsg:", "setMessages((m)")).not.toContain("conversationInstruction");
  });
  it("clears primary new-session, history load, and external session replacement boundaries", () => {
    expect(section(travel, "const handleNewSession =", "const handleCompareToggle =")).toContain("clearConversationInstruction()");
    expect(section(primary, "const startNewSession =", "const confirmTaskAction =")).toContain("clearConversationInstruction()");
    const history = section(primary, "const loadSession =", "// The opaque handoff ID");
    expect(history.indexOf("clearConversationInstruction()")).toBeLessThan(history.indexOf("await getToken()"));
    expect(history).not.toMatch(/(?:data|m)\.conversationInstruction/);
    expect(primary).toMatch(/effectiveSessionId !== sessionId\) \{\s*clearConversationInstruction\(\)/);
  });
  it("clears widget new/replaced conversations but does not hand off the instruction", () => {
    expect(section(widget, "const startNewWidgetConversation =", "const openRecommendationBusiness =")).toContain("clearConversationInstruction()");
    expect(widget).toContain("if (nextSessionId !== widgetConversationSessionRef.current) clearConversationInstruction()");
    expect(widget).toContain("if (requestSessionId !== widgetConversationSessionRef.current) clearConversationInstruction()");
    expect(widget).toContain("if (onPrimaryKinfolkConversation) clearConversationInstruction()");
    expect(section(widget, "const setWidgetOpen =", "const startNewWidgetConversation =")).not.toMatch(/if \(!nextOpen\)[\s\S]*clearConversationInstruction\(\)/);
    expect(source("../lib/kinfolkConversationHandoff.ts")).not.toMatch(/conversationInstruction|ConversationInstruction/);
  });
  it("preserves separate one-time controls and clears them only after non-aborted successful responses", () => {
    for (const surface of [primary, widget]) {
      expect(surface).toContain("oneTurnInstruction: oneTurnInstruction ?? undefined");
      expect(surface).toContain("if (oneTurnInstruction) oneTurnDeliveryInstructionRef.current = null;");
      expect(surface.match(/if \(oneTurnInstruction\) oneTurnDeliveryInstructionRef\.current = null;/g)).toHaveLength(1);
    }
    const primarySend = section(primary, "const sendMessage =", "const submitFeedback =");
    expect(primarySend.indexOf("await res.json()")).toBeLessThan(primarySend.indexOf("if (oneTurnInstruction)"));
    expect(primarySend).toContain("if (controller.signal.aborted || requestGeneration !== requestGenerationRef.current) return false;");
    expect(widget).toMatch(/if \(requestGeneration !== chatRequestGenerationRef.current\) return;\s*if \(oneTurnInstruction\)/);
    expect(travel).toContain("useOneTimeDeliveryInstruction(instruction)");
    expect(widget).toContain("oneTurnDeliveryInstructionRef.current = instruction");
    expect(controls).not.toContain("oneTurn");
  });
});

// Deterministic React-hook adapter, no native runtime, services, storage, or data.
// Run the exact source for both client implementations, not a substitute reducer.
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
    useRef(initial: unknown) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
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
      const value = exports.useConversationInstruction(accountId);
      const effects = pending;
      pending = [];
      effects.forEach((effect) => effect());
      return value;
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

describe("isolated native and browser instruction state transitions", () => {
  it.each([scope, source("../../web/src/hooks/useConversationInstruction.ts")])("retains one current selection across requests, changes/clears it, and never resurrects it across scopes", (text) => {
    const harness = hookHarness(text);
    let hook = harness.render("synthetic-account-a");
    expect(hook.getConversationInstruction()).toBeUndefined();
    hook.setConversationInstruction("concise");
    hook = harness.render("synthetic-account-a");
    expect(hook.conversationInstruction).toBe("concise");
    // The sender reads state for every attempt; neither success nor failure nor
    // abort has any consumption operation for this independent instruction.
    for (const _outcome of ["success", "failure", "abort", "success"]) {
      expect(hook.getConversationInstruction()).toBe("concise");
      hook = harness.render("synthetic-account-a");
    }
    hook.setConversationInstruction("gentle");
    hook = harness.render("synthetic-account-a");
    expect(hook.getConversationInstruction()).toBe("gentle");
    const firstClientId = hook.conversationInstructionClientId;
    hook.clearConversationInstruction();
    hook = harness.render("synthetic-account-a");
    expect(hook.conversationInstruction).toBeNull();
    expect(hook.conversationInstructionClientId).not.toBe(firstClientId);
    hook.setConversationInstruction("answer_first");
    hook = harness.render("synthetic-account-b");
    expect(hook.conversationInstruction).toBeNull();
    expect(hook.getConversationInstruction()).toBeUndefined();
    hook = harness.render("synthetic-account-a");
    expect(hook.getConversationInstruction()).toBeUndefined();
    hook.setConversationInstruction("step_by_step");
    hook = harness.render(null);
    expect(hook.getConversationInstruction()).toBeUndefined();
    hook = harness.render("synthetic-account-a");
    expect(hook.getConversationInstruction()).toBeUndefined();
    hook.setConversationInstruction("concise");
    harness.unmount();
    expect(hook.getConversationInstruction()).toBeUndefined();
    expect(hookHarness(text).render("synthetic-account-a").conversationInstruction).toBeNull();
  });
});
