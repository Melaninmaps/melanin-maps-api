import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(fileURLToPath(new URL("../app/travel.tsx", import.meta.url)), "utf8");
const widgetSource = readFileSync(fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)), "utf8");
const hookSource = readFileSync(fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)), "utf8");
const hookRequest = hookSource.slice(hookSource.indexOf("body: JSON.stringify({"), hookSource.indexOf("signal: controller.signal"));
const widgetRequestStart = widgetSource.indexOf('fetch(`${base}/api/kinfolk/chat`');
const widgetRequest = widgetSource.slice(widgetRequestStart, widgetSource.indexOf("signal,", widgetRequestStart));

describe("native Kinfolk private PDF question contract", () => {
  it("requires an explicit per-answer disclosure in primary and floating Kinfolk before upload", () => {
    for (const source of [travelSource, widgetSource]) {
      expect(source).toContain("Use this PDF for this answer?");
      expect(source).toContain("is not used to train Kinfolk");
      expect(source).toContain("is not saved as memory");
      expect(source).toContain("expires within 15 minutes");
      expect(source).toContain('form.append("kinfolkDocumentConsent", "true")');
      expect(source).toContain("/api/media/upload?purpose=kinfolk_question_document");
      expect(source).toContain("/api/media/kinfolk-question-document/${encodeURIComponent(attachment.assetId)}");
    }
  });

  it("uses document picker input only for private PDF upload and sends only opaque asset IDs in chat", () => {
    expect(travelSource).toContain('DocumentPicker.getDocumentAsync');
    expect(widgetSource).toContain('DocumentPicker.getDocumentAsync');
    expect(travelSource).toContain('type: ["application/pdf"]');
    expect(widgetSource).toContain('type: ["application/pdf"]');
    expect(hookRequest).toContain("documentAssetIds: opts?.documentAssetIds ?? []");
    expect(hookRequest).toContain("documentProcessingConsent: opts?.documentProcessingConsent === true");
    expect(hookRequest).not.toContain("displayName");
    expect(hookRequest).not.toContain("asset.uri");
    expect(widgetRequest).toContain("documentAssetIds: options?.documentAssetIds ?? []");
    expect(widgetRequest).toContain("documentProcessingConsent: options?.documentProcessingConsent === true");
    expect(widgetRequest).not.toContain("displayName");
    expect(widgetRequest).not.toContain("asset.uri");
  });

  it("caps local selection, preserves ordinary text chat, and clears the private attachment only after an accepted send", () => {
    for (const source of [travelSource, widgetSource]) {
      expect(source).toContain("Private Kinfolk PDFs must be under 2 MB.");
      expect(source).toContain("Kinfolk document questions currently accept PDFs only.");
      expect(source).toContain("setKinfolkDocument(null)");
    }
    expect(travelSource).toContain("if (!msg) return;");
    expect(widgetSource).toContain("if (!text) return;");
  });
});
