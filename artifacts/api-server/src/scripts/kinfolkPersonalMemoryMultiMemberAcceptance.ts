import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { Client } from "pg";
import request from "supertest";

const POSTGRES_BIN = "/usr/lib/postgresql/16/bin";
const memberCount = 50;
const members = Array.from({ length: memberCount }, (_, index) => ({
  id: `synthetic-member-${String(index + 1).padStart(2, "0")}`,
  name: `Synthetic ${"a".repeat(index + 1)}`,
  note: `I prefer synthetic quiet cafes for member ${String(index + 1).padStart(2, "0")}.`,
  mode: ["big_cousin", "best_friend", "business_manager", "professor"][index % 4]!,
  voice: index % 2 === 0 ? "onyx" : "shimmer",
  sessionId: `synthetic-session-${String(index + 1).padStart(2, "0")}`,
}));

const tempRoot = mkdtempSync(join(tmpdir(), "mwm-kinfolk-memory-v1-"));
const dataDirectory = join(tempRoot, "postgres");
const socketDirectory = join(tempRoot, "socket");
const port = 56000 + (process.pid % 500);
const databaseUrl = `postgres://mwm_acceptance@127.0.0.1:${port}/postgres`;
let client: Client | undefined;

function runPostgres(...args: string[]) {
  execFileSync(join(POSTGRES_BIN, args.shift()!), args, { stdio: "ignore" });
}

async function installDisposableSchema(db: Client) {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE users (
      id varchar(255) PRIMARY KEY,
      date_of_birth date
    );
    CREATE TABLE user_settings (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      kinfolk_memory_enabled boolean NOT NULL DEFAULT true,
      kinfolk_continuity_enabled boolean NOT NULL DEFAULT false,
      kinfolk_continuity_disclosure_decision varchar(32),
      kinfolk_continuity_disclosure_version varchar(64),
      kinfolk_continuity_disclosed_at timestamptz,
      kinfolk_continuity_updated_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE user_preferences (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      recommendation_life_stage varchar(20) NOT NULL DEFAULT 'unspecified',
      favorite_categories jsonb DEFAULT '[]'::jsonb,
      favorite_cities jsonb DEFAULT '[]'::jsonb,
      avoid_categories jsonb DEFAULT '[]'::jsonb,
      budget_range varchar(20) DEFAULT 'any',
      trip_style jsonb DEFAULT '[]'::jsonb,
      travel_companion varchar(30) DEFAULT 'solo',
      dietary_notes text,
      communication_style varchar(20) DEFAULT 'friendly',
      personality_mode varchar(30) DEFAULT 'neighborhood_guide',
      emoji_level varchar(10) DEFAULT 'some',
      humor_level varchar(10) DEFAULT 'light',
      cultural_interests jsonb DEFAULT '[]'::jsonb,
      know_before_you_go boolean DEFAULT true,
      regional_flavor varchar(30) DEFAULT 'off',
      kinfolk_voice varchar(20) NOT NULL DEFAULT 'onyx',
      auto_speak boolean NOT NULL DEFAULT false,
      preferred_ownership_types jsonb DEFAULT '[]'::jsonb,
      support_lens_mode varchar(40) NOT NULL DEFAULT 'all_businesses',
      social_video_platforms jsonb DEFAULT '[]'::jsonb,
      community_feed_display varchar(20) NOT NULL DEFAULT 'mixed',
      diaspora_countries jsonb DEFAULT '[]'::jsonb,
      communities jsonb DEFAULT '[]'::jsonb,
      cultures jsonb DEFAULT '[]'::jsonb,
      preferred_languages jsonb DEFAULT '[]'::jsonb,
      personalization_context_completed_at timestamptz,
      use_member_context_by_default boolean NOT NULL DEFAULT false,
      lifestyle_services jsonb DEFAULT '[]'::jsonb,
      search_history jsonb DEFAULT '[]'::jsonb,
      aave_level smallint DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE kinfolk_delivery_profiles (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      detail_level varchar(20) NOT NULL DEFAULT 'standard',
      tone_preference varchar(20) NOT NULL DEFAULT 'default'
    );
    CREATE TABLE kinfolk_sessions (
      id varchar(255) PRIMARY KEY,
      user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(255),
      destination varchar(255),
      vibes jsonb DEFAULT '[]'::jsonb,
      messages jsonb DEFAULT '[]'::jsonb,
      share_id varchar(64),
      archived_at timestamptz,
      pinned_at timestamptz,
      is_pinned boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE kinfolk_private_memories (
      id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content text NOT NULL,
      purpose varchar(64) NOT NULL,
      source_session_id varchar(255),
      is_sensitive boolean NOT NULL DEFAULT false,
      consent_granted_at timestamptz NOT NULL DEFAULT now(),
      sensitive_consent_granted_at timestamptz,
      expires_at timestamptz,
      paused_at timestamptz,
      revoked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX kinfolk_private_memories_user_review_idx
      ON kinfolk_private_memories (user_id, revoked_at, paused_at, expires_at, created_at DESC);
    CREATE OR REPLACE FUNCTION kinfolk_private_memories_reject_owner_change()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
          RAISE EXCEPTION 'Kinfolk private memory ownership cannot be reassigned'
            USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
      END;
      $$;
    CREATE TRIGGER kinfolk_private_memories_owner_immutable
      BEFORE UPDATE OF user_id ON kinfolk_private_memories
      FOR EACH ROW EXECUTE FUNCTION kinfolk_private_memories_reject_owner_change();
  `);
}

async function main() {
  try {
    console.error("[acceptance] starting disposable PostgreSQL");
    runPostgres(
      "initdb",
      "-D",
      dataDirectory,
      "--username=mwm_acceptance",
      "--auth=trust",
      "--no-locale",
      "--encoding=UTF8",
    );
    mkdirSync(socketDirectory);
    runPostgres(
      "pg_ctl",
      "-D",
      dataDirectory,
      "-l",
      join(tempRoot, "postgres.log"),
      "-o",
      `-F -p ${port} -h 127.0.0.1 -k ${socketDirectory}`,
      "-w",
      "start",
    );
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await installDisposableSchema(client);
    console.error("[acceptance] disposable schema ready");

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.KINFOLK_EXPLICIT_MEMBER_MEMORY_ENABLED = "true";
    const { default: kinfolkRouter } = await import("../routes/kinfolk");
    const {
      buildPrivateMemoryPromptBlock,
      mergeActivePreferredNameForPrompt,
    } = await import("../kinfolk/private-memory");
    console.error("[acceptance] Kinfolk router loaded");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const userId = req.get("x-synthetic-member");
      const testRequest = req as unknown as {
        user?: { id: string };
        log?: { error: () => void; info: () => void; warn: () => void };
      };
      if (userId) testRequest.user = { id: userId };
      testRequest.log = {
        error: (...args: unknown[]) => console.error("[acceptance route error]", ...args),
        info: () => undefined,
        warn: () => undefined,
      };
      next();
    });
    app.use("/api", kinfolkRouter);
    const authed = (memberId: string) => ({
      get: (path: string) => request(app).get(`/api${path}`).set("x-synthetic-member", memberId),
      put: (path: string) => request(app).put(`/api${path}`).set("x-synthetic-member", memberId),
      post: (path: string) => request(app).post(`/api${path}`).set("x-synthetic-member", memberId),
      patch: (path: string) => request(app).patch(`/api${path}`).set("x-synthetic-member", memberId),
      delete: (path: string) => request(app).delete(`/api${path}`).set("x-synthetic-member", memberId),
    });

    for (const member of members) {
      await client.query("INSERT INTO users (id, date_of_birth) VALUES ($1, DATE '1980-01-01')", [member.id]);
      await client.query(
        `INSERT INTO user_settings (
          user_id, kinfolk_memory_enabled, kinfolk_continuity_enabled,
          kinfolk_continuity_disclosure_decision, kinfolk_continuity_disclosed_at
        ) VALUES ($1, true, true, 'accepted', now())`,
        [member.id],
      );
      await client.query(
        "INSERT INTO user_preferences (user_id, personality_mode, kinfolk_voice) VALUES ($1, $2, $3)",
        [member.id, member.mode, member.voice],
      );
      await client.query(
        "INSERT INTO kinfolk_sessions (id, user_id, title, messages) VALUES ($1, $2, $3, $4::jsonb)",
        [
          member.sessionId,
          member.id,
          `Synthetic history for ${member.id}`,
          JSON.stringify([{ role: "user", content: `Private history for ${member.id}`, timestamp: new Date().toISOString() }]),
        ],
      );
    }
    console.error("[acceptance] seeded 50 synthetic members");

    const preferredSaves = await Promise.all(
      members.map(async (member) => {
        const preferred = await authed(member.id)
          .put("/kinfolk/preferred-name")
          .send({ name: member.name, consent: true });
        assert.equal(preferred.status, 201, `${member.id} preferred-name save`);
      }),
    );
    assert.equal(preferredSaves.length, memberCount, "50 concurrent preferred-name saves complete");
    console.error("[acceptance] completed 50 concurrent preferred-name saves");

    const initial = await Promise.all(
      members.map(async (member) => {
        const note = await authed(member.id)
          .post("/kinfolk/memories")
          .send({ content: member.note, purpose: "preference", consent: true });
        assert.equal(note.status, 201, `${member.id} explicit note save`);
        return { member, memoryId: note.body.memory.id as string };
      }),
    );
    console.error("[acceptance] completed 50 concurrent explicit-note saves");

    const promptOwner = initial[0]!.member;
    const promptOther = initial[1]!.member;
    const promptRows = await client.query<{
      content: string;
      purpose: string;
      expires_at: Date | null;
    }>(
      "SELECT content, purpose, expires_at FROM kinfolk_private_memories WHERE user_id = $1 AND revoked_at IS NULL",
      [promptOwner.id],
    );
    const preferredNameRow = promptRows.rows.find((row) => row.purpose === "preferred_name") ?? null;
    const preferredNameMemory = preferredNameRow
      ? {
          content: preferredNameRow.content,
          purpose: preferredNameRow.purpose,
          expiresAt: preferredNameRow.expires_at,
        }
      : null;
    const prompt = buildPrivateMemoryPromptBlock(
      true,
      mergeActivePreferredNameForPrompt({
        memories: promptRows.rows
          .filter((row) => row.purpose !== "preferred_name")
          .map(({ content, purpose }) => ({ content, purpose })),
        preferredNameMemory,
        explicitMemoryEnabled: true,
      }),
    );
    assert.match(prompt, new RegExp(promptOwner.name));
    assert.match(prompt, new RegExp(promptOwner.note));
    assert.doesNotMatch(prompt, new RegExp(promptOther.name));
    assert.doesNotMatch(prompt, new RegExp(promptOther.note));

    for (const { member } of initial) {
      const [name, notes, preferences, history] = await Promise.all([
        authed(member.id).get("/kinfolk/preferred-name"),
        authed(member.id).get("/kinfolk/memories"),
        authed(member.id).get("/kinfolk/preferences"),
        authed(member.id).get(`/kinfolk/sessions/${member.sessionId}`),
      ]);
      assert.equal(name.status, 200, `${member.id} preferred-name read`);
      assert.equal(name.body.name, member.name, `${member.id} sees only own name`);
      assert.equal(notes.status, 200, `${member.id} note list`);
      assert.deepEqual(notes.body.memories.map((note: { content: string }) => note.content), [member.note]);
      assert.equal(preferences.status, 200, `${member.id} preference read`);
      assert.equal(preferences.body.preferences.personalityMode, member.mode, `${member.id} sees only own mode`);
      assert.equal(preferences.body.preferences.kinfolkVoice, member.voice, `${member.id} sees only own voice`);
      assert.equal(history.status, 200, `${member.id} history read`);
      assert.equal(history.body.session.id, member.sessionId, `${member.id} sees only own history`);
    }
    console.error("[acceptance] completed owner-isolation reads");

    const owner = initial[0]!;
    const other = initial[1]!;
    const crossReads = await Promise.all([
      authed(owner.member.id).get(`/kinfolk/sessions/${other.member.sessionId}`),
      authed(owner.member.id).patch(`/kinfolk/memories/${other.memoryId}`).send({ content: "cross-member overwrite" }),
      authed(owner.member.id).patch(`/kinfolk/memories/${other.memoryId}/pause`).send({ paused: true }),
      authed(owner.member.id).delete(`/kinfolk/memories/${other.memoryId}`),
    ]);
    for (const response of crossReads) assert.equal(response.status, 404, "cross-member API access is rejected");
    await assert.rejects(
      client.query("UPDATE kinfolk_private_memories SET user_id = $1 WHERE id = $2", [owner.member.id, other.memoryId]),
      (error: { code?: string }) => error.code === "42501",
      "database rejects owner reassignment",
    );

    const lifecycle = initial[2]!;
    assert.equal((await authed(lifecycle.member.id).patch(`/kinfolk/memories/${lifecycle.memoryId}/pause`).send({ paused: true })).status, 200);
    const paused = await authed(lifecycle.member.id).get("/kinfolk/memories?includeInactive=true");
    assert.equal(paused.body.memories.find((note: { id: string }) => note.id === lifecycle.memoryId)?.state, "paused");
    assert.equal((await authed(lifecycle.member.id).patch(`/kinfolk/memories/${lifecycle.memoryId}/pause`).send({ paused: false })).status, 200);
    assert.equal((await authed(lifecycle.member.id).delete(`/kinfolk/memories/${lifecycle.memoryId}`)).status, 200);
    assert.equal((await authed(lifecycle.member.id).get("/kinfolk/memories")).body.memories.some((note: { id: string }) => note.id === lifecycle.memoryId), false);

    const preferredLifecycle = initial[3]!.member;
    assert.equal((await authed(preferredLifecycle.id).patch("/kinfolk/preferred-name/pause").send({ paused: true })).status, 200);
    assert.equal((await authed(preferredLifecycle.id).patch("/kinfolk/preferred-name/pause").send({ paused: false })).status, 200);
    assert.equal((await authed(preferredLifecycle.id).post("/kinfolk/preferred-name/revoke").send({})).status, 200);
    assert.equal((await authed(preferredLifecycle.id).delete("/kinfolk/preferred-name")).status, 404, "revoke removes the active preferred name");

    const capacityMember = initial[4]!.member;
    const capacityWrites = await Promise.all(
      Array.from({ length: 49 }, (_, index) =>
        authed(capacityMember.id)
          .post("/kinfolk/memories")
          .send({ content: `Capacity note ${index + 1} for ${capacityMember.id}.`, purpose: "preference", consent: true }),
      ),
    );
    assert.equal(capacityWrites.every((response) => response.status === 201), true, "49 concurrent member notes save");
    const overCapacity = await authed(capacityMember.id)
      .post("/kinfolk/memories")
      .send({ content: `Capacity note 51 for ${capacityMember.id}.`, purpose: "preference", consent: true });
    assert.equal(overCapacity.status, 409, "per-member 51st active note is rejected");
    assert.equal(overCapacity.body.code, "PRIVATE_MEMORY_ACTIVE_LIMIT_REACHED");

    const independentMember = initial[5]!.member;
    const independentWrites = await Promise.all(
      Array.from({ length: 49 }, (_, index) =>
        authed(independentMember.id)
          .post("/kinfolk/memories")
          .send({ content: `Independent note ${index + 1} for ${independentMember.id}.`, purpose: "preference", consent: true }),
      ),
    );
    assert.equal(independentWrites.every((response) => response.status === 201), true, "capacity is not shared across members");

    const duplicateMember = initial[6]!.member;
    const duplicateContent = `Duplicate-safe note for ${duplicateMember.id}.`;
    const duplicateWrites = await Promise.all(
      Array.from({ length: 12 }, () =>
        authed(duplicateMember.id)
          .post("/kinfolk/memories")
          .send({ content: duplicateContent, purpose: "preference", consent: true }),
      ),
    );
    assert.equal(duplicateWrites.filter((response) => response.status === 201).length, 1, "one concurrent duplicate write creates a note");
    assert.equal(duplicateWrites.filter((response) => response.status === 200 && response.body.alreadySaved === true).length, 11, "remaining concurrent duplicate writes are idempotent");
    const duplicateCount = await client.query(
      "SELECT count(*)::integer AS count FROM kinfolk_private_memories WHERE user_id = $1 AND content = $2 AND revoked_at IS NULL",
      [duplicateMember.id, duplicateContent],
    );
    assert.equal(duplicateCount.rows[0]?.count, 1, "no duplicate active note exists");

    const raceMember = initial[8]!.member;
    const raceCreate = await authed(raceMember.id)
      .post("/kinfolk/memories")
      .send({ content: `Concurrent update note for ${raceMember.id}.`, purpose: "preference", consent: true });
    assert.equal(raceCreate.status, 201, "race fixture note saves");
    const raceId = raceCreate.body.memory.id as string;
    const [raceEdit, raceDelete] = await Promise.all([
      authed(raceMember.id)
        .patch(`/kinfolk/memories/${raceId}`)
        .send({ content: `Edited concurrent update note for ${raceMember.id}.` }),
      authed(raceMember.id).delete(`/kinfolk/memories/${raceId}`),
    ]);
    assert.equal([200, 404].includes(raceEdit.status), true, "concurrent edit is applied or truthfully sees a deletion");
    assert.equal([200, 404].includes(raceDelete.status), true, "concurrent delete is applied or truthfully sees a prior deletion");
    const raceAfter = await client.query(
      "SELECT count(*)::integer AS count FROM kinfolk_private_memories WHERE id = $1 AND revoked_at IS NULL",
      [raceId],
    );
    assert.equal(raceAfter.rows[0]?.count, 0, "concurrent edit/delete leaves no duplicated or orphaned active record");

    const ordinaryMember = initial[7]!.member;
    const beforeOrdinary = await client.query(
      "SELECT count(*)::integer AS count FROM kinfolk_private_memories WHERE user_id = $1",
      [ordinaryMember.id],
    );
    const ordinaryAttempt = await authed(ordinaryMember.id)
      .post("/kinfolk/memory-consent")
      .send({
        message: "I prefer ordinary conversation to stay private without a save command.",
        selectedIds: ["not-a-memory-choice"],
        consent: true,
      });
    assert.equal(ordinaryAttempt.status, 400, "ordinary chat cannot become memory without an explicit remember plan");
    const afterOrdinary = await client.query(
      "SELECT count(*)::integer AS count FROM kinfolk_private_memories WHERE user_id = $1",
      [ordinaryMember.id],
    );
    assert.equal(afterOrdinary.rows[0]?.count, beforeOrdinary.rows[0]?.count, "ordinary chat attempt creates no note");

    const activeCount = await client.query(
      "SELECT user_id, count(*)::integer AS count FROM kinfolk_private_memories WHERE revoked_at IS NULL AND paused_at IS NULL AND (expires_at IS NULL OR expires_at > now()) AND purpose <> 'preferred_name' GROUP BY user_id",
    );
    assert.equal(activeCount.rows.find((row) => row.user_id === capacityMember.id)?.count, 50, "capacity member retains exactly 50 active notes");
    assert.equal(activeCount.rows.find((row) => row.user_id === independentMember.id)?.count, 50, "independent member retains exactly 50 active notes");

    console.log(JSON.stringify({
      status: "passed",
      environment: "disposable-local-postgresql",
      syntheticMembers: memberCount,
      concurrentInitialSaves: memberCount,
      perMemberCapacity: "one preferred name plus 50 active private notes",
      checks: [
        "owner-only preferred names, notes, modes, voices, and session history",
        "owner-scoped prompt assembly contains no other member's name or note",
        "owner pause/resume/revoke/delete",
        "cross-member API rejection and immutable database ownership",
        "50-member concurrent save stability and edit/delete race handling",
        "per-member capacity and duplicate-write idempotency",
        "ordinary chat has no implicit memory write",
      ],
    }));
  } finally {
    await client?.end().catch(() => undefined);
    try {
      runPostgres("pg_ctl", "-D", dataDirectory, "-m", "immediate", "-w", "stop");
    } catch {
      // The disposable cluster may not have reached startup if a prior assertion failed.
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

await main();
