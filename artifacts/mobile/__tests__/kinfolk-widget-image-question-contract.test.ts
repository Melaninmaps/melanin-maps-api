import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const widgetSource = readFileSync(
  fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);
const chatRequestStart = widgetSource.indexOf('fetch(`${base}/api/kinfolk/chat`');
const chatRequest = widgetSource.slice(
  chatRequestStart,
  widgetSource.indexOf("signal,", chatRequestStart),
);

describe("floating Kinfolk private image question contract", () => {
  it("requires an explicit per-answer consent before an authenticated private upload", () => {
    expect(widgetSource).toContain("Use this image for this answer?");
    expect(widgetSource).toContain("is not used to train Kinfolk");
    expect(widgetSource).toContain("is not saved as memory");
    expect(widgetSource).toContain("expires within 15 minutes");
    expect(widgetSource).toContain('form.append("kinfolkVisionConsent", "true")');
    expect(widgetSource).toContain("/api/media/upload?purpose=kinfolk_question");
    expect(widgetSource).toContain("Your Kinfolk session needs to be refreshed before adding a private image.");
  });

  it("sends only private asset IDs and affirmative consent with the chat question", () => {
    expect(widgetSource).toContain("imagePreviewUris: attachedImagePreviewUris");
    expect(chatRequest).toContain("imageAssetIds: options?.imageAssetIds ?? []");
    expect(chatRequest).toContain("imageVisionConsent: options?.imageVisionConsent === true");
    expect(chatRequest).not.toContain("previewUri");
    expect(chatRequest).not.toContain("imagePreviewUris");
    expect(chatRequest).not.toContain("imageUrls");
    expect(chatRequest).not.toContain("FormData");
  });

  it("caps attachments at two and supports an authenticated immediate removal path", () => {
    expect(widgetSource).toContain("kinfolkImages.length >= 2");
    expect(widgetSource).toContain("const assetId = body.assetId");
    expect(widgetSource).toContain("[...items, { assetId, previewUri: asset.uri }].slice(0, 2)");
    expect(widgetSource).toContain("/api/media/kinfolk-question/${encodeURIComponent(attachment.assetId)}");
    expect(widgetSource).toContain("The image was removed from this screen and will expire shortly from private processing.");
  });

  it("does not auto-submit a question or discard a recoverable text draft", () => {
    expect(widgetSource).toContain("const send = () => void sendMessage(input);");
    expect(widgetSource).toContain("Your question is back in the composer");
    expect(widgetSource).toContain("KinfolkAI is temporarily unavailable. Please try again in a moment.");
  });
});
