import { db, usersTable, contentFilterViolationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { checkContent } from "./contentFilter";

export interface FamilyScanResult {
  blocked: boolean;
  matchedKeywords: string[];
}

export async function scanForFamily(
  content: string,
  userId: string,
  channel: string
): Promise<FamilyScanResult> {
  const [user] = await db
    .select({ dateOfBirth: usersTable.dateOfBirth })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user?.dateOfBirth) return { blocked: false, matchedKeywords: [] };

  const ageMs = Date.now() - new Date(user.dateOfBirth).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);

  if (ageYears >= 18) return { blocked: false, matchedKeywords: [] };

  const result = checkContent(content);
  if (result.ok) return { blocked: false, matchedKeywords: [] };

  await db.insert(contentFilterViolationsTable).values({
    userId,
    channel,
    contentSnippet: content.slice(0, 300),
    matchedKeywords: [result.matched],
    wasBlocked: true,
  });

  return { blocked: true, matchedKeywords: [result.matched] };
}
