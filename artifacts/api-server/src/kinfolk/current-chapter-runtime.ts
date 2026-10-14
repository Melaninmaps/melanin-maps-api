import { and, desc, eq, isNull } from "drizzle-orm";
import { db, kinfolkCurrentChaptersTable } from "@workspace/db";
import { buildCurrentChapterPrompt, type ChapterPromptRequest } from "./current-chapter-policy";

/** Read-only, transient current answer use. Never included in response metadata. */
export async function currentChapterPromptForRequest(request: ChapterPromptRequest): Promise<string> {
  if (!request.owner || request.surface !== "conversation" || request.excludedContext ||
      !["medical_health", "general_knowledge"].includes(request.intent) ||
      !/\bmy (?:career change|career transition|job change|relocation|move|moving plans|caregiving|caregiver responsibilities|family change|family transition|health|recovery|fertility|pregnancy|later pregnancy|miscarriage|grief|bereavement)\b/i.test(request.message)) return "";
  try {
    const rows = await db.select().from(kinfolkCurrentChaptersTable).where(and(
      eq(kinfolkCurrentChaptersTable.userId, request.owner),
      eq(kinfolkCurrentChaptersTable.allowRelevantUse, true),
      isNull(kinfolkCurrentChaptersTable.endedAt),
    )).orderBy(desc(kinfolkCurrentChaptersTable.updatedAt)).limit(20);
    return buildCurrentChapterPrompt(rows, request);
  } catch { return ""; }
}
