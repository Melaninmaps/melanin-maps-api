import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/db")>();
  return {
    ...actual,
    pool: { query: poolQuery },
  };
});

import { ensureBusinessKinfolkVoiceProfileSchema } from "../../lib/startup-migrations";

const route = readFileSync(
  fileURLToPath(new URL("../business-voice-profile.ts", import.meta.url)),
  "utf8",
);
const migration = readFileSync(
  fileURLToPath(new URL("../../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const routerIndex = readFileSync(
  fileURLToPath(new URL("../index.ts", import.meta.url)),
  "utf8",
);
const serverIndex = readFileSync(
  fileURLToPath(new URL("../../index.ts", import.meta.url)),
  "utf8",
);

describe("Business Voice Profile ownership boundary", () => {
  it("allows profile writes only for approved owners and does not use member content", () => {
    expect(route).toContain("business_owner_links bol");
    expect(route).toContain("bol.business_id = b.id");
    expect(route).toContain("bol.user_id = $2");
    expect(route).toContain("bol.role = 'owner'");
    expect(route).toContain("bol.status = 'approved'");
    expect(route).toContain("bol.revoked_at IS NULL");
    expect(route).toContain("[businessId, req.user.id]");
    expect(route).toContain('"/businesses/:businessId/kinfolk-voice-profile"');
    expect(route).toContain("FROM business_kinfolk_voice_profiles");
    expect(route).toContain("ownerConfirmed");
    expect(route).not.toMatch(/FROM\s+(?:community_posts|reviews)/i);
    expect(route).not.toMatch(/JOIN\s+(?:community_posts|reviews)/i);
  });

  it("registers only an additive owner-profile table and authenticated routes", () => {
    expect(migration).toContain('name: "business_kinfolk_voice_profiles_v1"');
    expect(migration).toContain("business_kinfolk_voice_profiles");
    expect(routerIndex).toContain(
      'import businessVoiceProfileRouter from "./business-voice-profile"',
    );
    expect(
      routerIndex.indexOf("router.use(businessVoiceProfileRouter)"),
    ).toBeGreaterThan(routerIndex.indexOf("router.use(requireAuth)"));
  });

  it("keeps owner-requested drafting editable-only and outside member or business mutation paths", () => {
    const draftStart = route.indexOf('"/businesses/:businessId/kinfolk-drafts"');
    const draftRoute = route.slice(draftStart);
    expect(draftStart).toBeGreaterThan(-1);
    expect(draftRoute).toContain("requireApprovedBusinessOwner");
    expect(draftRoute).toContain("sanitizeBusinessDraftRequest");
    expect(draftRoute).toContain("owner_confirmed_at IS NOT NULL");
    expect(draftRoute).toContain("Editable draft — owner review required");
    expect(draftRoute).toContain('Cache-Control", "no-store');
    expect(draftRoute).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+businesses/i);
    expect(draftRoute).not.toMatch(/(?:community_posts|reviews|directory)/i);
    expect(draftRoute).not.toMatch(/\.post\(|\.send\(|\.reply\(/i);
  });
});

describe("Business Voice Profile pre-traffic schema readiness", () => {
  const logger = { info: vi.fn() } as never;

  beforeEach(() => {
    poolQuery.mockReset();
  });

  it("repairs and verifies the named table's one-profile-per-business invariant on every boot", async () => {
    poolQuery.mockResolvedValue({ rows: [{ business_id_unique: true }] });

    await ensureBusinessKinfolkVoiceProfileSchema(logger);
    await ensureBusinessKinfolkVoiceProfileSchema(logger);

    expect(poolQuery).toHaveBeenCalledTimes(6);
    const [firstDdl, firstColumnProbe, firstUniqueProbe, repeatedDdl, repeatedColumnProbe, repeatedUniqueProbe] =
      poolQuery.mock.calls.map(([sql]) => sql as string);
    expect(firstDdl).toContain("CREATE TABLE IF NOT EXISTS business_kinfolk_voice_profiles");
    expect(firstDdl).toContain("CREATE INDEX IF NOT EXISTS business_kinfolk_voice_profiles_owner_updated_idx");
    expect(firstDdl).toContain(
      "CREATE UNIQUE INDEX business_kinfolk_voice_profiles_business_id_unique_idx",
    );
    expect(firstDdl).toContain("index_meta.indpred IS NULL");
    expect(firstDdl).toContain("index_meta.indnkeyatts = 1");
    expect(firstColumnProbe).toContain(
      "SELECT id, business_id, owner_user_id, tones, language_preference, audience_guidance, words_to_use, words_to_avoid, signature_phrases, owner_confirmed_at, created_at, updated_at FROM business_kinfolk_voice_profiles LIMIT 0",
    );
    expect(firstUniqueProbe).toContain("SELECT EXISTS");
    expect(firstUniqueProbe).toContain("FROM pg_index index_meta");
    expect(firstUniqueProbe).toContain("column_meta.attname = 'business_id'");
    expect(firstUniqueProbe).toContain("index_meta.indpred IS NULL");
    expect(firstUniqueProbe).toContain("index_meta.indnkeyatts = 1");
    expect(repeatedDdl).toBe(firstDdl);
    expect(repeatedColumnProbe).toBe(firstColumnProbe);
    expect(repeatedUniqueProbe).toBe(firstUniqueProbe);
    expect(migration).toContain(
      'const BUSINESS_KINFOLK_VOICE_PROFILE_SCHEMA_MIGRATIONS = new Set([',
    );
    expect(migration).toContain('"business_kinfolk_voice_profiles_v1",');
    expect(migration).toContain(
      "if (migrations.length !== BUSINESS_KINFOLK_VOICE_PROFILE_SCHEMA_MIGRATIONS.size)",
    );
    expect(migration).toContain(
      'throw new Error("Business Kinfolk Voice Profile schema migration definition is missing.")',
    );
  });

  it("propagates a table-creation failure before a structural read or route traffic", async () => {
    poolQuery.mockRejectedValueOnce(new Error("permission denied"));

    await expect(ensureBusinessKinfolkVoiceProfileSchema(logger)).rejects.toThrow(
      "permission denied",
    );
    expect(poolQuery).toHaveBeenCalledTimes(1);
  });

  it("propagates a malformed-table structural failure after idempotent DDL", async () => {
    poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(new Error('column "signature_phrases" does not exist'));

    await expect(ensureBusinessKinfolkVoiceProfileSchema(logger)).rejects.toThrow(
      'column "signature_phrases" does not exist',
    );
    expect(poolQuery).toHaveBeenCalledTimes(2);
  });

  it("fails closed after the column probe when no equivalent unique business_id index is observable", async () => {
    poolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ business_id_unique: false }] });

    await expect(ensureBusinessKinfolkVoiceProfileSchema(logger)).rejects.toThrow(
      "Business Kinfolk Voice Profile schema is missing a unique business_id invariant.",
    );
    expect(poolQuery).toHaveBeenCalledTimes(3);
  });

  it("runs owner-profile readiness after owner-link safety and before either release mode can accept traffic", () => {
    const lifecycleGate = serverIndex.indexOf("await ensureBusinessOwnerLinkLifecycleSchema(logger)");
    const voiceGate = serverIndex.indexOf("await ensureBusinessKinfolkVoiceProfileSchema(logger)");
    const releaseModeBranch = serverIndex.indexOf("if (explicitFeatureReleaseMode)");
    const listener = serverIndex.indexOf("app.listen");

    expect(serverIndex).toContain("ensureBusinessKinfolkVoiceProfileSchema");
    expect(lifecycleGate).toBeGreaterThan(-1);
    expect(voiceGate).toBeGreaterThan(lifecycleGate);
    expect(releaseModeBranch).toBeGreaterThan(voiceGate);
    expect(listener).toBeGreaterThan(voiceGate);
    expect(serverIndex).toContain("runStartupMigrations(logger)");
  });
});
