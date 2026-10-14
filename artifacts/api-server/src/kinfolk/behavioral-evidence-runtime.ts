import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  kinfolkBehavioralEvidenceSettingsTable,
  kinfolkBehavioralEvidenceTable,
  type KinfolkBehavioralEvidence,
} from "@workspace/db";
import {
  type ActiveBehavioralEvidence,
  type BehavioralEvidenceMode,
  type BehavioralEvidenceSignal,
  type BehavioralEvidenceStatus,
  isSafeBehavioralIntent,
  mayUseBehavioralEvidence,
  resolveBehavioralEvidenceMode,
  statusForRecordedSignal,
} from "./behavioral-evidence-policy";

export type BehavioralEvidenceView = Readonly<{
  mode: BehavioralEvidenceMode;
  evidence: Array<{
    id: string;
    signalKey: string;
    stance: string;
    count: number;
    status: string;
    firstObservedAt: Date;
    lastObservedAt: Date;
    approvedAt: Date | null;
    updatedAt: Date;
  }>;
}>;

function schemaCode(error: unknown): string | undefined {
  const value =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  return typeof value === "string" && /^[A-Z0-9_]{1,64}$/.test(value)
    ? value
    : undefined;
}

/** Never log request or evidence content while degrading chat safely. */
function logUnavailable(stage: string, error: unknown): void {
  console.warn("[kinfolk-behavioral-evidence] unavailable", {
    stage,
    code: schemaCode(error),
  });
}

function viewRow(row: KinfolkBehavioralEvidence) {
  return {
    id: row.id,
    signalKey: row.signalKey,
    stance: row.stance,
    count: row.count,
    status: row.status,
    firstObservedAt: row.firstObservedAt,
    lastObservedAt: row.lastObservedAt,
    approvedAt: row.approvedAt,
    updatedAt: row.updatedAt,
  };
}

export async function getBehavioralEvidenceView(userId: string): Promise<BehavioralEvidenceView> {
  const [settings] = await db
    .select()
    .from(kinfolkBehavioralEvidenceSettingsTable)
    .where(eq(kinfolkBehavioralEvidenceSettingsTable.userId, userId))
    .limit(1);
  const rows = await db
    .select()
    .from(kinfolkBehavioralEvidenceTable)
    .where(eq(kinfolkBehavioralEvidenceTable.userId, userId))
    .orderBy(desc(kinfolkBehavioralEvidenceTable.updatedAt));
  return {
    mode: resolveBehavioralEvidenceMode(settings?.mode),
    evidence: rows.map(viewRow),
  };
}

export async function setBehavioralEvidenceMode(
  userId: string,
  mode: BehavioralEvidenceMode,
): Promise<BehavioralEvidenceMode> {
  const now = new Date();
  await db
    .insert(kinfolkBehavioralEvidenceSettingsTable)
    .values({ userId, mode, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: kinfolkBehavioralEvidenceSettingsTable.userId,
      set: { mode, updatedAt: now },
    });
  return mode;
}

/**
 * Called only after ordinary response feedback has committed successfully.
 * Storage errors intentionally propagate to the caller so that caller can make
 * recording nonfatal without masking the feedback result.
 */
export async function recordBehavioralFeedbackSignal(
  userId: string,
  signal: BehavioralEvidenceSignal | null,
): Promise<boolean> {
  if (!signal) return false;
  const [settings] = await db
    .select({ mode: kinfolkBehavioralEvidenceSettingsTable.mode })
    .from(kinfolkBehavioralEvidenceSettingsTable)
    .where(eq(kinfolkBehavioralEvidenceSettingsTable.userId, userId))
    .limit(1);
  const mode = resolveBehavioralEvidenceMode(settings?.mode);
  const status = statusForRecordedSignal(mode);
  if (!status) return false;

  const now = new Date();
  await db
    .insert(kinfolkBehavioralEvidenceTable)
    .values({
      userId,
      signalKey: signal.signalKey,
      stance: signal.stance,
      count: 1,
      status,
      provenance: signal.provenance,
      firstObservedAt: now,
      lastObservedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        kinfolkBehavioralEvidenceTable.userId,
        kinfolkBehavioralEvidenceTable.signalKey,
        kinfolkBehavioralEvidenceTable.stance,
      ],
      set: {
        count: sql`${kinfolkBehavioralEvidenceTable.count} + 1`,
        // Review mode cannot silently activate a new candidate. An already
        // approved signal may receive more of the same bounded feedback.
        status:
          mode === "on"
            ? "active"
            : sql`CASE WHEN ${kinfolkBehavioralEvidenceTable.status} = 'active' THEN 'active' ELSE 'pending' END`,
        lastObservedAt: now,
        updatedAt: now,
      },
    });
  return true;
}

/**
 * Removes one bounded aggregate when its source feedback is revised or revoked.
 * The ledger never retains a message or session identifier, note, location, or
 * response text merely to support this reconciliation.
 */
export async function revokeBehavioralFeedbackSignal(
  userId: string,
  signal: BehavioralEvidenceSignal | null,
): Promise<boolean> {
  if (!signal) return false;
  const [existing] = await db
    .select({
      id: kinfolkBehavioralEvidenceTable.id,
      count: kinfolkBehavioralEvidenceTable.count,
    })
    .from(kinfolkBehavioralEvidenceTable)
    .where(
      and(
        eq(kinfolkBehavioralEvidenceTable.userId, userId),
        eq(kinfolkBehavioralEvidenceTable.signalKey, signal.signalKey),
        eq(kinfolkBehavioralEvidenceTable.stance, signal.stance),
      ),
    )
    .limit(1);
  if (!existing) return false;
  if (existing.count <= 1) {
    await db
      .delete(kinfolkBehavioralEvidenceTable)
      .where(
        and(
          eq(kinfolkBehavioralEvidenceTable.userId, userId),
          eq(kinfolkBehavioralEvidenceTable.id, existing.id),
        ),
      );
    return true;
  }
  await db
    .update(kinfolkBehavioralEvidenceTable)
    .set({ count: existing.count - 1, updatedAt: new Date() })
    .where(
      and(
        eq(kinfolkBehavioralEvidenceTable.userId, userId),
        eq(kinfolkBehavioralEvidenceTable.id, existing.id),
      ),
    );
  return true;
}

export async function approveBehavioralEvidence(
  userId: string,
  id: string,
): Promise<ReturnType<typeof viewRow> | null> {
  const now = new Date();
  const [saved] = await db
    .update(kinfolkBehavioralEvidenceTable)
    .set({ status: "active", approvedAt: now, updatedAt: now })
    .where(
      and(
        eq(kinfolkBehavioralEvidenceTable.userId, userId),
        eq(kinfolkBehavioralEvidenceTable.id, id),
        eq(kinfolkBehavioralEvidenceTable.status, "pending"),
      ),
    )
    .returning();
  return saved ? viewRow(saved) : null;
}

export async function removeBehavioralEvidence(
  userId: string,
  id: string,
): Promise<boolean> {
  const removed = await db
    .delete(kinfolkBehavioralEvidenceTable)
    .where(
      and(
        eq(kinfolkBehavioralEvidenceTable.userId, userId),
        eq(kinfolkBehavioralEvidenceTable.id, id),
      ),
    )
    .returning({ id: kinfolkBehavioralEvidenceTable.id });
  return removed.length > 0;
}

export async function clearBehavioralEvidence(userId: string): Promise<number> {
  const removed = await db
    .delete(kinfolkBehavioralEvidenceTable)
    .where(eq(kinfolkBehavioralEvidenceTable.userId, userId))
    .returning({ id: kinfolkBehavioralEvidenceTable.id });
  return removed.length;
}

/**
 * Chat-only, fail-closed load. It queries no session, message, note, text,
 * location, directory, map, source, business, image, or document context.
 */
export async function loadActiveBehavioralEvidenceForPrompt(
  userId: string,
  intentClass: unknown,
): Promise<ActiveBehavioralEvidence[]> {
  if (!isSafeBehavioralIntent(intentClass)) return [];
  try {
    const [settings] = await db
      .select({ mode: kinfolkBehavioralEvidenceSettingsTable.mode })
      .from(kinfolkBehavioralEvidenceSettingsTable)
      .where(eq(kinfolkBehavioralEvidenceSettingsTable.userId, userId))
      .limit(1);
    const mode = resolveBehavioralEvidenceMode(settings?.mode);
    if (!mayUseBehavioralEvidence(mode, "active")) return [];
    const rows = await db
      .select({
        signalKey: kinfolkBehavioralEvidenceTable.signalKey,
        stance: kinfolkBehavioralEvidenceTable.stance,
        count: kinfolkBehavioralEvidenceTable.count,
        status: kinfolkBehavioralEvidenceTable.status,
      })
      .from(kinfolkBehavioralEvidenceTable)
      .where(
        and(
          eq(kinfolkBehavioralEvidenceTable.userId, userId),
          eq(kinfolkBehavioralEvidenceTable.signalKey, intentClass),
          eq(kinfolkBehavioralEvidenceTable.status, "active"),
        ),
      );
    return rows
      .filter(
        (row): row is ActiveBehavioralEvidence =>
          isSafeBehavioralIntent(row.signalKey) &&
          (row.stance === "helpful" || row.stance === "not_helpful") &&
          row.status === "active" &&
          Number.isInteger(row.count) &&
          row.count > 0,
      )
      .map((row) => ({ ...row, signalKey: row.signalKey, stance: row.stance }));
  } catch (error) {
    logUnavailable("chat_load", error);
    return [];
  }
}
