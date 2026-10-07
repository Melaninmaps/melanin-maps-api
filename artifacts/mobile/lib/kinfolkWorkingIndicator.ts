/**
 * Client-only request stopwatch for Kinfolk. The mobile client receives no
 * streaming server-work phases, so this deliberately never claims that current
 * research or recommendations are in progress before a completed response
 * proves that work happened.
 */
export function kinfolkWorkingElapsedSeconds(startedAt: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt) / 1_000));
}

export function kinfolkWorkingElapsedLabel(elapsedSeconds: number): string {
  return `Kinfolk is working… ${Math.max(0, Math.floor(elapsedSeconds))}s`;
}
