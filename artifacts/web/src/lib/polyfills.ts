/**
 * Browser polyfills — must be the first import in main.tsx.
 *
 * @workspace/db statically imports pg (Node.js) which references several
 * Node globals at module-initialisation time.  We patch globalThis with
 * browser-safe replacements before any other module executes so that pg's
 * initialisation code finds what it needs without crashing.
 *
 * Globals patched:
 *  - Buffer  → npm `buffer` package (browser-compatible implementation)
 *  - process → minimal stub with process.env = {} so pg env checks pass
 *  - global  → alias for globalThis (some CJS-compat shims expect it)
 */
import { Buffer as BufferPolyfill } from "buffer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (typeof g.Buffer === "undefined") {
  g.Buffer = BufferPolyfill;
}

if (typeof g.process === "undefined") {
  g.process = { env: {}, version: "", versions: {}, platform: "browser" };
} else if (typeof g.process.env === "undefined") {
  g.process.env = {};
}

if (typeof g.global === "undefined") {
  g.global = globalThis;
}
