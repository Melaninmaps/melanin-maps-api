---
name: pino-pretty swallows async logs
description: pino-pretty worker-thread transport silently drops logger.info/error calls during async request handling in dev mode
---

## The rule
Do not rely on `logger.info/error` from `src/lib/logger.ts` to confirm whether async request-handler code is executing in development. Use file-based tracing instead.

## Why
pino-pretty in worker-thread transport mode buffers log records and flushes asynchronously. The Replit log capture system misses these buffered records for async handler calls, even though startup logs (synchronous) appear correctly. The same `logger` instance works at startup but not mid-request.

## How to apply
- For debugging "is this code path running?", use `appendFileSync('/tmp/debug.log', msg)` with a wrapping try/catch — this is synchronous and bypasses pino entirely.
- `process.stdout.write(msg)` is NOT reliable either (same stdout stream as pino-pretty, may be interleaved or buffered differently).
- File-based debugging confirms execution definitively; check the file after requests complete.
- pino-http's `req.log` (request completion logs) does appear — only the standalone `logger` calls are unreliable.
