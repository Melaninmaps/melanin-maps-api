import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
const page = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");
const scope = readFileSync(new URL("../hooks/useConversationInstruction.ts", import.meta.url), "utf8");
const section = (start: string, end: string) => page.slice(page.indexOf(start), page.indexOf(end, page.indexOf(start)));

describe("web conversation-only instruction source contracts", () => {
  it("offers only fixed accessible radio choices, current selection, and clear inside composer controls", () => {
    for (const [id, label] of [["concise", "Keep answers concise"], ["step_by_step", "Use step-by-step guidance"], ["answer_first", "Start with the direct answer"], ["gentle", "Use a gentle, supportive tone"]]) {
      expect(scope).toContain(`{ id: "${id}", label: "${label}" }`);
    }
    expect(scope.match(/\{ id: "/g)).toHaveLength(4);
    const controls = section('<div id="kinfolk-composer-controls"', "{pendingImageConsent &&");
    const deliveryControls = controls.slice(0, controls.indexOf("</fieldset>") + "</fieldset>".length);
    expect(controls).toContain("<legend className=\"font-bold\">This conversation only</legend>");
    expect(controls).toContain('type="radio" name="kinfolk-conversation-instruction"');
    expect(controls).toContain("checked={conversationInstruction === option.id}");
    expect(controls).toContain("onChange={() => setConversationInstruction(option.id)}");
    expect(controls).toContain('aria-live="polite">Current:');
    expect(controls).toContain('aria-label="Clear conversation instruction"');
    expect(deliveryControls).not.toContain("textarea");
  });
  it("keeps selection component-local and clears for logout, account change, and unmount", () => {
    expect(page).toContain('useConversationInstruction(isLoggedIn && typeof authAccountId === "string" ? authAccountId : null)');
    expect(scope).toContain("[accountId, clearConversationInstruction]");
    expect(scope).toContain("return () => { selectionRef.current = null; }");
    expect(scope).toContain("current?.accountId === accountId");
    expect(scope).toContain("selection?.accountId === accountId");
    expect(scope).not.toMatch(/localStorage|sessionStorage|cookie|fetch|console|history|oneTurnInstruction/);
  });
  it("sends only the named request field and never consumes it after successful, failed, or aborted turns", () => {
    const send = section("const send = useCallback", "// Change the depth");
    expect(send).toContain("conversationInstruction: getConversationInstruction()");
    expect(send).not.toContain("clearConversationInstruction");
    expect(send).not.toContain("setConversationInstruction");
    expect(section("const userMsg:", "// 30-second client-side timeout")).not.toContain("conversationInstruction");
    const ast = ts.createSourceFile("travel.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let fields = 0;
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "conversationInstruction") fields++;
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(ast);
        const args = node.arguments.map((arg) => arg.getText(ast)).join("\n");
        if (/Storage\.|console\.|history\.|analytics|capture/.test(name)) expect(args).not.toMatch(/conversationInstruction|getConversationInstruction/);
        if (name === "fetch" && !node.arguments[0]?.getText(ast).includes("api/kinfolk/chat")) expect(args).not.toMatch(/conversationInstruction|getConversationInstruction/);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(fields).toBe(1);
  });
  it("clears on new chat and historic session load and never restores from history", () => {
    expect(section("const newChat =", "// Library suggestions")).toContain("clearConversationInstruction()");
    const history = section("const loadSession =", "const newChat =");
    expect(history.indexOf("clearConversationInstruction()")).toBeLessThan(history.indexOf("await fetch"));
    expect(history).not.toMatch(/(?:d|session)\.conversationInstruction/);
    expect(history).not.toContain("setConversationInstruction");
  });
  it("preserves independent one-turn selection and consumes only a completed, non-aborted success", () => {
    const send = section("const send = useCallback", "// Change the depth");
    expect(send).toContain("oneTurnInstruction: oneTurnInstruction ?? undefined");
    expect(send.match(/if \(oneTurnInstruction\) oneTurnDeliveryInstructionRef.current = null;/g)).toHaveLength(1);
    expect(send.indexOf("await r.json() as")).toBeLessThan(send.indexOf("if (oneTurnInstruction)"));
    expect(send).toMatch(/if \(controller.signal.aborted\) return;\s*if \(oneTurnInstruction\)/);
    expect(page).toContain("onUseOnce={(instruction) => { oneTurnDeliveryInstructionRef.current = instruction;");
    expect(scope).not.toContain("oneTurn");
  });
});
