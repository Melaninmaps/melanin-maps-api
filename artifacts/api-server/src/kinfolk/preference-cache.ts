import { eq } from "drizzle-orm";
import { db, userPreferencesTable } from "@workspace/db";

type PrefsCacheEntry = {
  promise: Promise<typeof userPreferencesTable.$inferSelect | null>;
  expiresAt: number;
};

const prefsCache = new Map<string, PrefsCacheEntry>();
const PREFS_CACHE_TTL_MS = 30_000;

export function invalidatePrefsCache(userId: string): void {
  prefsCache.delete(userId);
}

export async function getCachedPrefs(
  userId: string,
): Promise<typeof userPreferencesTable.$inferSelect | null> {
  const now = Date.now();
  const cached = prefsCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.promise;
  const promise = db
    .select()
    .from(userPreferencesTable)
    .where(eq(userPreferencesTable.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null)
    .catch(() => null);
  prefsCache.set(userId, { promise, expiresAt: now + PREFS_CACHE_TTL_MS });
  return promise;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of prefsCache) {
    if (value.expiresAt <= now) prefsCache.delete(key);
  }
}, 60_000).unref();