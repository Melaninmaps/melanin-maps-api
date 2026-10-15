import assert from "node:assert/strict";
import test from "node:test";
import { urlsFromLegacyReceipt } from "./recheck-kinfolk-current-legacy-presence.mjs";

test("urlsFromLegacyReceipt uses only prior successful non-social public sources", () => {
  const urls = urlsFromLegacyReceipt([{
    unitId: "official-presence-0042",
    officialDestinationCandidates: [
      "https://example.org/",
      "https://www.instagram.com/example/",
      "https://www.yelp.com/biz/example",
    ],
    pages: [
      { requestedUrl: "https://example.org/", finalUrl: "https://www.example.org/", status: "ok", httpStatus: 200, checkedAt: "2026-10-08T00:00:00.000Z" },
      { requestedUrl: "https://www.instagram.com/example/", finalUrl: "https://www.instagram.com/example/", status: "ok", httpStatus: 200 },
      { requestedUrl: "https://closed.example.org/", finalUrl: "https://closed.example.org/", status: "unavailable", httpStatus: 503 },
    ],
  }]);
  assert.deepEqual(urls, [
    { url: "https://example.org/", receiptUnitId: "official-presence-0042", priorCheckedAt: "2026-10-08T00:00:00.000Z" },
    { url: "https://www.example.org/", receiptUnitId: "official-presence-0042", priorCheckedAt: "2026-10-08T00:00:00.000Z" },
  ]);
});

test("urlsFromLegacyReceipt rejects directory-only and malformed links", () => {
  const urls = urlsFromLegacyReceipt([{
    unitId: "official-presence-0043",
    officialDestinationCandidates: ["https://www.yelp.com/biz/example", "not a url"],
    pages: [],
  }]);
  assert.deepEqual(urls, []);
});
