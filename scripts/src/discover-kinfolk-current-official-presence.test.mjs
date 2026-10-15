import assert from "node:assert/strict";
import test from "node:test";
import { extractDuckDuckGoResults } from "./discover-kinfolk-current-official-presence.mjs";

test("extractDuckDuckGoResults decodes a public result target and title", () => {
  const html = `
    <article class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2F1000wordsindy.com%2F">1000 Words Inc. &amp; Gallery</a></article>
    <article class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.facebook.com%2F1000wordsindy%2F">1000 Words Gallery | Indianapolis</a></article>
  `;
  assert.deepEqual(extractDuckDuckGoResults(html), [
    { url: "https://1000wordsindy.com/", title: "1000 Words Inc. & Gallery" },
    { url: "https://www.facebook.com/1000wordsindy/", title: "1000 Words Gallery | Indianapolis" },
  ]);
});

test("extractDuckDuckGoResults removes duplicate URLs without treating result text as a source", () => {
  const html = `
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F">First result</a>
    <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F">Duplicate result</a>
  `;
  assert.deepEqual(extractDuckDuckGoResults(html), [
    { url: "https://example.com/", title: "First result" },
  ]);
});
