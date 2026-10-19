import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const chat = readFileSync(
  fileURLToPath(new URL("../app/chat/[id].tsx", import.meta.url)),
  "utf8",
);

function sendMessageSlice(): string {
  const start = chat.indexOf("  const sendMessage = async () => {");
  if (start < 0) throw new Error("Missing mobile sendMessage handler");
  const end = chat.indexOf("\n  const convTitle = ", start);
  return chat.slice(start, end < 0 ? undefined : end);
}

describe("mobile direct-message send fail-closed", () => {
  it("shows an accessible sending provisional bubble rather than a sent result", () => {
    const send = sendMessageSlice();
    expect(chat).toContain('status?: "sending" | "sent" | "delivered" | "read";');
    expect(send).toContain('status: "sending",');
    expect(send.indexOf('status: "sending",')).toBeLessThan(send.indexOf("setMessages((prev) => [...prev, optimistic]);"));
    expect(chat).toContain('item.status === "sending" && (');
    expect(chat).toContain("Sending… / Enviando…");
    expect(chat).toContain('accessibilityLabel={item.status === "sending" ? "Sending message / Enviando mensaje"');
  });

  it("promotes only the exact provisional bubble to sent after a successful POST", () => {
    const send = sendMessageSlice();
    const append = send.indexOf("setMessages((prev) => [...prev, optimistic]);");
    const request = send.indexOf("const res = await fetch(");
    const nonOk = send.indexOf("if (!res.ok) {");
    const promote = send.indexOf('message.id === optimistic.id ? { ...message, status: "sent" } : message');
    expect(append).toBeGreaterThanOrEqual(0);
    expect(request).toBeGreaterThan(append);
    expect(nonOk).toBeGreaterThan(request);
    expect(promote).toBeGreaterThan(nonOk);
    expect(send).toContain('body: JSON.stringify({ content: sent }),');
    expect(send).not.toContain('status: "delivered"');
  });

  it("removes the exact provisional bubble and restores the unsent draft on any non-OK or unreadable failure", () => {
    const send = sendMessageSlice();
    expect(send).toContain("const recoverUnsentMessage = (feedback: string) => {");
    expect(send).toContain("setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));");
    expect(send).toContain("setText((current) => current.trim() ? current : sent);");
    expect(send).toContain("let feedback = MESSAGE_SEND_RECOVERY;");
    expect(send).toContain("const body = await res.json() as { code?: unknown };");
    expect(send).toContain("// A failure body is optional and never shown to the member.");
    expect(send).toContain("recoverUnsentMessage(feedback);");
    expect(send).toContain("recoverUnsentMessage(MESSAGE_SEND_RECOVERY);");
    expect(send).not.toContain("body.error");
  });

  it("keeps the safely known pending explanation while using bounded generic retry copy otherwise", () => {
    const send = sendMessageSlice();
    expect(chat).toContain('const MESSAGE_SEND_RECOVERY = "Message was not sent. Please try again. / El mensaje no se envió. Inténtalo de nuevo.";');
    expect(chat).toContain('const PENDING_MESSAGE_SEND_RECOVERY = "This message request hasn\'t been accepted yet. / Esta solicitud de mensaje aún no ha sido aceptada.";');
    expect(send).toContain('if (body?.code === "REQUEST_PENDING") feedback = PENDING_MESSAGE_SEND_RECOVERY;');
    expect(send).not.toContain("res.status");
    expect(send).not.toContain("requestStatus");
    expect(send).not.toContain('"/accept"');
    expect(send).not.toContain('"/decline"');
  });
});
