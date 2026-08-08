/**
 * Browser polyfills — must be the first import in main.tsx.
 *
 * @workspace/db (and pg transitively) reference the Node.js `Buffer` global at
 * module-initialisation time.  The npm `buffer` package provides a compatible
 * browser implementation; we attach it to `globalThis` before any other module
 * executes so that pg's internal code finds it.
 */
import { Buffer as BufferPolyfill } from "buffer";

if (typeof globalThis.Buffer === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Buffer = BufferPolyfill;
}
