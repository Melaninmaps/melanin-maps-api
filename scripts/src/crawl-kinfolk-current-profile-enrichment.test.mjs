import test from "node:test";
import assert from "node:assert/strict";
import {
  extractOfficialSocialLinks,
  extractPageText,
  inputRecords,
  selectRelevantInternalUrls,
} from "./crawl-kinfolk-current-profile-enrichment.mjs";

test("selects only relevant same-site profile pages", () => {
  const html = `
    <a href="/about">About us</a>
    <a href="/contact?utm_source=newsletter">Contact</a>
    <a href="https://www.example.com/services">Services</a>
    <a href="https://booking.example.test/appointment">Book now</a>
    <a href="/blog">Blog</a>
    <a href="/hours">Hours</a>
    <a href="/prices">Prices</a>
  `;
  assert.deepEqual(selectRelevantInternalUrls(html, "https://www.example.com/"), [
    "https://www.example.com/about",
    "https://www.example.com/contact",
    "https://www.example.com/services",
  ]);
});

test("extracts only actual social profile links from an official website", () => {
  const html = `
    <a href="https://www.instagram.com/example_business/">Instagram</a>
    <a href="https://www.facebook.com/example.business">Facebook</a>
    <a href="/contact">Contact</a>
  `;
  assert.deepEqual(extractOfficialSocialLinks(html, "https://www.example.com"), {
    instagram: "https://www.instagram.com/example_business/",
    facebook: "https://www.facebook.com/example.business",
  });
});

test("removes scripts and markup from source text without inventing facts", () => {
  const html = `<html><head><script>window.secret = 'ignored'</script></head>
    <body><h1>Example Studio</h1><p>Open Tuesday through Saturday.</p></body></html>`;
  const text = extractPageText(html);
  assert.match(text, /Example Studio/);
  assert.match(text, /Open Tuesday through Saturday/);
  assert.doesNotMatch(text, /window\.secret/);
});

test("selects a verified official social profile when no active website is available", () => {
  const records = inputRecords(`${JSON.stringify({
    businessId: "social-only-1",
    businessName: "Example Studio",
    city: "Philadelphia",
    state: "PA",
    website: { classification: "MISSING", normalizedUrl: null },
    social: {
      instagram: {
        classification: "KEEP_ACTIVE_SOCIAL",
        normalizedUrl: "https://www.instagram.com/example_studio/",
        reason: "Public profile matches the business.",
      },
    },
  })}\n`);
  assert.deepEqual(records, [{
    businessId: "social-only-1",
    businessName: "Example Studio",
    city: "Philadelphia",
    state: "PA",
    website: null,
    sourceUrl: "https://www.instagram.com/example_studio/",
    sourceKind: "social",
    sourceSnapshot: {},
    currentSnapshotHash: null,
    verifiedPresenceEvidence: {
      classification: "KEEP_ACTIVE_SOCIAL",
      reason: "Public profile matches the business.",
      checkedAt: null,
    },
  }]);
});
