import {
  db,
  familyLinksTable,
  contentFilterRulesTable,
  contentFilterViolationsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export interface FamilyScanResult {
  blocked: boolean;
  matchedKeywords: string[];
}

export async function scanForFamily(
  content: string,
  userId: string,
  channel: string
): Promise<FamilyScanResult> {
  const links = await db
    .select({
      linkId: familyLinksTable.id,
      parentUserId: familyLinksTable.parentUserId,
      keywords: contentFilterRulesTable.keywords,
      blockContent: contentFilterRulesTable.blockContent,
    })
    .from(familyLinksTable)
    .leftJoin(
      contentFilterRulesTable,
      eq(contentFilterRulesTable.familyLinkId, familyLinksTable.id)
    )
    .where(
      and(
        eq(familyLinksTable.childUserId, userId),
        eq(familyLinksTable.status, "active")
      )
    );

  if (links.length === 0) return { blocked: false, matchedKeywords: [] };

  const lower = content.toLowerCase();
  const allMatched = new Set<string>();
  let shouldBlock = false;

  for (const link of links) {
    const kws: string[] = link.keywords ?? [];
    if (kws.length === 0) continue;
    const matched = kws.filter((kw: string) => lower.includes(kw.toLowerCase()));
    if (matched.length === 0) continue;
    matched.forEach((kw: string) => allMatched.add(kw));
    if (link.blockContent !== false) shouldBlock = true;
    await db.insert(contentFilterViolationsTable).values({
      familyLinkId: link.linkId,
      childUserId: userId,
      parentUserId: link.parentUserId,
      channel,
      contentSnippet: content.slice(0, 300),
      matchedKeywords: matched,
      wasBlocked: link.blockContent !== false,
    });
  }

  return { blocked: shouldBlock, matchedKeywords: [...allMatched] };
}
