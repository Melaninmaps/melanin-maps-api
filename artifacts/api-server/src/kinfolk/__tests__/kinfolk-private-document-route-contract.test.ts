import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)), "utf8");
const mediaSource = readFileSync(fileURLToPath(new URL("../../media/registerMediaRoutes.ts", import.meta.url)), "utf8");
const retentionSource = readFileSync(fileURLToPath(new URL("../question-image-assets.ts", import.meta.url)), "utf8");

describe("Kinfolk private PDF route boundary", () => {
  it("accepts only opaque document asset IDs with per-answer consent and owner-scoped resolution", () => {
    expect(routeSource).toContain("normalizeKinfolkQuestionDocumentAssetIds(documentAssetIds)");
    expect(routeSource).toContain("explicitDocumentConsent: documentProcessingConsent === true");
    expect(routeSource).toContain("resolveConsentedKinfolkQuestionDocument");
    expect(routeSource).toContain("purgeKinfolkQuestionDocuments");
    expect(routeSource).not.toContain("documentUrl");
    expect(routeSource).not.toContain("documentText:");
  });

  it("keeps extracted text transient, untrusted, and outside retrieval or source presentation", () => {
    expect(routeSource).toContain("UNTRUSTED PRIVATE PDF TEXT");
    expect(routeSource).toContain("PRIVATE PDF GUIDANCE");
    expect(routeSource).toContain("isPrivateQuestionAttachment");
    expect(routeSource).toContain("!isPrivateQuestionAttachment");
    expect(routeSource).toContain("memberFacingSources = isPrivateQuestionAttachment");
    expect(routeSource).toContain("finalSessionId && !isPrivateDocumentTurn");
    expect(routeSource).toContain("!isPrivateDocumentTurn && req.user?.id && memoryEnabled");
    expect(routeSource).toContain("!isPrivateQuestionAttachment && explicitMemberMemoryEnabled");
  });

  it("requires a dedicated private bucket, opaque upload response, immediate removal route, and expiry cleanup", () => {
    expect(mediaSource).toContain('"kinfolk_question_document"');
    expect(mediaSource).toContain("kinfolkDocumentConsent");
    expect(mediaSource).toContain("media-uploads/kinfolk-private-documents");
    expect(mediaSource).toContain("/api/media/kinfolk-question-document/:assetId");
    expect(mediaSource).toContain("url = null");
    expect(retentionSource).toContain("purgeExpiredKinfolkQuestionDocuments");
  });
});
