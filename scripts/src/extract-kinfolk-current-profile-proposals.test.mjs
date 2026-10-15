import test from "node:test";
import assert from "node:assert/strict";
import { buildExtractionPrompt, validateExtractedProposal } from "./extract-kinfolk-current-profile-proposals.mjs";

const source = {
  businessId: "biz-1",
  businessName: "Example Studio",
  city: "Philadelphia",
  state: "PA",
  pages: [{
    sourceUrl: "https://example.test/about",
    title: "Example Studio",
    text: "Example Studio is a neighborhood salon offering natural hair styling and braids. Hours: Tuesday through Saturday, 10 AM to 6 PM. Call (215) 555-0100.",
  }],
};

test("accepts source-quoted, in-scope facts", () => {
  const result = validateExtractedProposal(source, {
    identityConfirmed: true,
    identityReason: "Business name appears in the source page heading.",
    proposals: [
      { field: "description", valueText: "Neighborhood salon offering natural hair styling and braids.", valueList: [], sourcePageIndex: 0, evidenceQuote: "Example Studio is a neighborhood salon offering natural hair styling and braids.", confidence: "high" },
      { field: "hours", valueText: "Tuesday through Saturday, 10 AM to 6 PM", valueList: [], sourcePageIndex: 0, evidenceQuote: "Hours: Tuesday through Saturday, 10 AM to 6 PM.", confidence: "high" },
      { field: "tags", valueText: "", valueList: ["natural hair styling", "braids"], sourcePageIndex: 0, evidenceQuote: "offering natural hair styling and braids", confidence: "medium" },
    ],
    holdReasons: [],
  });
  assert.equal(result.identityConfirmed, true);
  assert.equal(result.issues.length, 0);
  assert.deepEqual(result.accepted.map((item) => item.field), ["description", "hours", "tags"]);
});

test("holds facts whose evidence quote is absent from captured source", () => {
  const result = validateExtractedProposal(source, {
    identityConfirmed: true,
    identityReason: "Name is visible.",
    proposals: [{ field: "phone", valueText: "(215) 555-0100", valueList: [], sourcePageIndex: 0, evidenceQuote: "This number was found elsewhere.", confidence: "high" }],
    holdReasons: [],
  });
  assert.equal(result.accepted.length, 0);
  assert.match(result.issues[0], /not found/);
});

test("does not issue profile facts when identity is not confirmed", () => {
  const result = validateExtractedProposal(source, {
    identityConfirmed: false,
    identityReason: "No match.",
    proposals: [{ field: "hours", valueText: "Tuesday", valueList: [], sourcePageIndex: 0, evidenceQuote: "Tuesday through Saturday", confidence: "high" }],
    holdReasons: [],
  });
  assert.equal(result.accepted.length, 0);
  assert.equal(result.identityConfirmed, false);
});

test("prompt identifies website material as untrusted and limits extraction scope", () => {
  const prompt = buildExtractionPrompt(source);
  assert.match(prompt, /Untrusted source content follows/);
  assert.match(prompt, /Do not propose address/);
  assert.match(prompt, /Example Studio/);
});
