import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { extractDuckDuckGoResults } from "./discover-source-backed-official-presence.mjs";

const script = readFileSync(new URL("./discover-source-backed-official-presence.mjs", import.meta.url), "utf8");

test("extractDuckDuckGoResults retains public candidates without treating search text as proof", () => {
  const html = `
    <article class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2F1000wordsindy.com%2F">1000 Words Inc. &amp; Gallery</a></article>
    <article class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2F1000wordsindy%2F">1000 Words Gallery | Indianapolis</a></article>
  `;
  assert.deepEqual(extractDuckDuckGoResults(html), [
    { url: "https://1000wordsindy.com/", title: "1000 Words Inc. & Gallery" },
    { url: "https://www.instagram.com/1000wordsindy/", title: "1000 Words Gallery | Indianapolis" },
  ]);
});

test("targets only records without a verified website and never writes production data", () => {
  assert.match(script, /\["MISSING", "REMOVE_CONFIRMED_INACTIVE", "HOLD_INCONCLUSIVE"\]/);
  assert.match(script, /RETAIN_SOCIAL_ONLY", "RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL/);
  assert.match(script, /productionWrite: false/);
  assert.match(script, /No candidate URL is written to a Mapping with Melanin profile/);
});
