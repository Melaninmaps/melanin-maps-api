import crypto from "node:crypto";
import { Client } from "pg";
import { buildExplicitMemoryConsentPlan } from "../src/kinfolk/explicit-memory-consent";
import {
  buildPrivateMemoryPersonalizationBlock,
  isApprovedPrivateMemoryRelevant,
  resolvePrivateMemoryUseDecision,
  type PrivateMemoryCandidate,
} from "../src/kinfolk/private-memory-personalization";

const adminUrl = process.env.KINFOLK_DISPOSABLE_PROOF_ADMIN_DATABASE_URL;
if (!adminUrl) {
  throw new Error("KINFOLK_DISPOSABLE_PROOF_ADMIN_DATABASE_URL is required.");
}

const databaseName = `kinfolk_memory_proof_${crypto.randomBytes(6).toString("hex")}`;
const memberId = `disposable-member-${crypto.randomUUID()}`;
const safeDatabaseName = `"${databaseName}"`;
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${databaseName}`;

function activeRows(
  rows: Array<PrivateMemoryCandidate>,
): PrivateMemoryCandidate[] {
  return rows;
}

async function main() {
  const admin = new Client({ connectionString: adminUrl });
  let proof: Client | null = null;
  let disposed = false;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${safeDatabaseName}`);
    proof = new Client({ connectionString: databaseUrl.toString() });
    await proof.connect();

    await proof.query(`
      CREATE TABLE kinfolk_private_memories (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        content text NOT NULL,
        purpose text NOT NULL,
        is_sensitive boolean NOT NULL DEFAULT false,
        sensitive_consent_granted_at timestamptz NULL,
        revoked_at timestamptz NULL,
        paused_at timestamptz NULL,
        expires_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    // Conversation A: the member makes an explicit request, receives a
    // deterministic item-level consent plan, and selects only its ordinary item.
    const plan = buildExplicitMemoryConsentPlan(
      "Kinfolk, remember: I prefer vegan restaurants and quiet places.",
    );
    if (!plan || plan.ordinary.length !== 1 || plan.sensitive.length !== 0) {
      throw new Error(
        "Disposable proof could not create the expected ordinary consent selection.",
      );
    }
    const selected = plan.ordinary[0]!;
    await proof.query(
      `INSERT INTO kinfolk_private_memories
        (id, user_id, content, purpose, is_sensitive)
       VALUES ($1, $2, $3, $4, false)`,
      [crypto.randomUUID(), memberId, selected.content, plan.purpose],
    );

    // Conversation B: retrieve only the active, same-member, consented record.
    const activeResult = await proof.query<PrivateMemoryCandidate>(
      `SELECT content, purpose, is_sensitive AS "isSensitive"
       FROM kinfolk_private_memories
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND paused_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (is_sensitive = false OR sensitive_consent_granted_at IS NOT NULL)`,
      [memberId],
    );
    const active = activeRows(activeResult.rows);
    const currentRequest =
      "What current vegan dinner options are near City Hall?";
    const relevant = active.filter((memory) =>
      isApprovedPrivateMemoryRelevant({
        memory,
        currentMessage: currentRequest,
        legacyRelevant: false,
      }),
    );
    const applied = resolvePrivateMemoryUseDecision({
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: active.length,
      relevantMemoryCount: relevant.length,
      allowPersonalization: true,
    });
    const prompt = applied.shouldApply
      ? buildPrivateMemoryPersonalizationBlock(relevant)
      : "";

    const unrelatedRelevant = active.filter((memory) =>
      isApprovedPrivateMemoryRelevant({
        memory,
        currentMessage: "Help me write a professional follow-up email.",
        legacyRelevant: false,
      }),
    );
    const unrelated = resolvePrivateMemoryUseDecision({
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: active.length,
      relevantMemoryCount: unrelatedRelevant.length,
      allowPersonalization: true,
    });

    await proof.query(
      "UPDATE kinfolk_private_memories SET paused_at = NOW() WHERE user_id = $1",
      [memberId],
    );
    const pausedResult = await proof.query<PrivateMemoryCandidate>(
      `SELECT content, purpose, is_sensitive AS "isSensitive"
       FROM kinfolk_private_memories
       WHERE user_id = $1
         AND revoked_at IS NULL
         AND paused_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [memberId],
    );
    const paused = resolvePrivateMemoryUseDecision({
      runtimeEnabled: true,
      memberEnabled: true,
      storageUnavailable: false,
      activeMemoryCount: pausedResult.rows.length,
      relevantMemoryCount: 0,
      allowPersonalization: true,
    });

    if (
      applied.state !== "applied" ||
      !applied.memberFacingUse ||
      !prompt.includes("PRIVATE PERSONALIZATION BOUNDARY") ||
      unrelated.state !== "no_relevant_memory" ||
      paused.state !== "no_active_memory"
    ) {
      throw new Error("Disposable proof assertions failed.");
    }

    // Deliberately omit content, IDs, and any source detail from output.
    console.log(
      JSON.stringify(
        {
          proof: "passed",
          mode: "local_disposable_postgresql",
          consentPlan: {
            ordinarySelected: plan.ordinary.length,
            sensitiveSelected: plan.sensitive.length,
          },
          newConversation: {
            appliedState: applied.state,
            memberFacingNotice: applied.memberFacingUse.message,
            promptUsesEvidenceBoundary: true,
          },
          unrelatedConversationState: unrelated.state,
          pausedPreferenceState: paused.state,
        },
        null,
        2,
      ),
    );
  } finally {
    if (proof) await proof.end().catch(() => undefined);
    if (admin) {
      await admin
        .query(`DROP DATABASE IF EXISTS ${safeDatabaseName}`)
        .catch(() => undefined);
      disposed = true;
      await admin.end().catch(() => undefined);
    }
    if (!disposed)
      throw new Error("Disposable proof database cleanup did not complete.");
  }
}

void main();
