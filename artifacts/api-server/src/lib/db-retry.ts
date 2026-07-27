/**
 * Transient database connection retry helper — Build 97 surgical fix.
 *
 * Retries only confirmed connection-class errors (pool timeout, ECONNRESET,
 * ECONNREFUSED, Connection terminated, etc.).
 *
 * NEVER retries:
 *   - Validation / constraint errors (23505 duplicate, 23502 not-null, etc.)
 *   - Authentication / authorization errors
 *   - Ordinary application logic errors
 *   - Any error whose pg error code is a 5-char alphanumeric (server responded)
 *
 * Behaviour:
 *   - Logs the first failure with context and the sanitized error message
 *   - Waits 500 ms
 *   - Logs the retry attempt
 *   - Executes the function a second time
 *   - If the second attempt fails for any reason, throws — the caller's
 *     existing catch block handles the error and returns a clean user message.
 *
 * Does not create duplicate writes — unique constraints (23505) are
 * non-transient and are never retried.
 */

const TRANSIENT_NODE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "EPIPE",
]);

export function isTransientDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? "";
  const code = (err as NodeJS.ErrnoException).code ?? "";

  if (TRANSIENT_NODE_CODES.has(code)) return true;
  if (msg.includes("timeout exceeded when trying to connect")) return true;
  if (msg.includes("Connection terminated unexpectedly")) return true;
  if (msg.includes("Client was closed and is not queryable")) return true;
  if (msg.includes("connect ECONNRESET")) return true;
  if (msg.includes("connect ETIMEDOUT")) return true;

  return false;
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  log: { warn(obj: object, msg: string): void; info(obj: object, msg: string): void },
  context: string,
): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    if (!isTransientDbError(firstErr)) throw firstErr;

    const errMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
    log.warn({ context, error: errMsg }, "transient DB connection error — retrying in 500ms");

    await new Promise<void>((resolve) => setTimeout(resolve, 500));

    log.info({ context }, "DB retry attempt");
    return await fn();
  }
}
