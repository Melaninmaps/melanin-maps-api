import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
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
let fakeProviderServer: Server | undefined;

const CARIBBEAN_PREFERENCE = "I prefer Caribbean food";
const DRAFT_ALPHA_MARKER = "DRAFT_ALPHA";
const DRAFT_BETA_MARKER = "DRAFT_BETA";
const TOPIC_SWITCH_MARKER = "TOPIC_SWITCH_GARDENS";
type FakeProviderCall = {
  systemPrompt: string;
  history: string;
  currentUserText: string;
};
const fakeProviderCalls: FakeProviderCall[] = [];

function runPostgres(...args: string[]) {
  execFileSync(join(POSTGRES_BIN, args.shift()!), args, { stdio: "ignore" });
}

/**
 * A loopback-only OpenAI-compatible endpoint. The real router uses its normal
 * client and HTTP code path, while this harness deterministically verifies the
 * prompt boundary without a credential, remote provider, or real member data.
 */
async function startLocalFakeProvider(): Promise<string> {
  const provider = express();
  provider.use(express.json({ limit: "1mb" }));
  provider.post("/v1/chat/completions", (req, res) => {
    const messages: Array<{ role?: unknown; content?: unknown }> = (
      Array.isArray(req.body?.messages) ? req.body.messages as unknown[] : []
    ).filter((message: unknown): message is { role?: unknown; content?: unknown } =>
      Boolean(message) && typeof message === "object",
    );
    const contentOf = (value: unknown) =>
      typeof value === "string" ? value : JSON.stringify(value ?? "");
    const systemPrompt = messages
      .filter((message) => message.role === "system")
      .map((message) => contentOf(message.content))
      .join("\n");
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
    const currentUserText = lastUserIndex >= 0
      ? contentOf(messages[lastUserIndex]?.content)
      : "";
    const history = messages
      .slice(0, Math.max(0, lastUserIndex))
      .filter((message) => message.role !== "system")
      .map((message) => contentOf(message.content))
      .join("\n");
    fakeProviderCalls.push({ systemPrompt, history, currentUserText });

    let reply = "LOCAL_PROVIDER: ordinary answer without private preference.";
    if (/go back to the earlier email draft and revise/i.test(currentUserText)) {
      reply = history.includes(DRAFT_BETA_MARKER)
        && !history.includes(DRAFT_ALPHA_MARKER)
        && !history.includes(TOPIC_SWITCH_MARKER)
        ? "LOCAL_PROVIDER: revised active beta draft only."
        : "LOCAL_PROVIDER: incorrect draft context.";
    } else if (systemPrompt.includes(CARIBBEAN_PREFERENCE)) {
      reply = "LOCAL_PROVIDER: Caribbean preference applied.";
    } else if (currentUserText.includes(DRAFT_ALPHA_MARKER)) {
      reply = "LOCAL_PROVIDER: alpha draft ready.";
    } else if (currentUserText.includes(DRAFT_BETA_MARKER)) {
      reply = "LOCAL_PROVIDER: beta draft ready.";
    } else if (currentUserText.includes(TOPIC_SWITCH_MARKER)) {
      reply = "LOCAL_PROVIDER: garden topic answer.";
    }

    res.json({
      id: "local-kinfolk-acceptance",
      object: "chat.completion",
      created: 0,
      model: typeof req.body?.model === "string" ? req.body.model : "local-fake",
      choices: [{
        index: 0,
        message: { role: "assistant", content: JSON.stringify({ reply }) },
        finish_reason: "stop",
      }],
    });
  });

  fakeProviderServer = await new Promise<Server>((resolve, reject) => {
    const server = createServer(provider);
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server);
    });
  });
  const address = fakeProviderServer.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/v1`;
}

async function installDisposableSchema(db: Client) {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE users (
      id varchar(255) PRIMARY KEY,
      email varchar(255),
      first_name varchar(255),
      last_name varchar(255),
      profile_image_url varchar(255),
      stripe_customer_id varchar(255),
      stripe_subscription_id varchar(255),
      push_token varchar(255),
      is_load_test boolean NOT NULL DEFAULT false,
      approved boolean NOT NULL DEFAULT false,
      account_status varchar(32) NOT NULL DEFAULT 'active',
      lifecycle_updated_at timestamptz,
      lifecycle_updated_by varchar(255),
      lifecycle_reason varchar(500),
      role varchar(32) NOT NULL DEFAULT 'user',
      member_type varchar(32) DEFAULT 'individual',
      trial_ends_at timestamptz,
      trial_reminder_3day_sent_at timestamptz,
      trial_reminder_1day_sent_at timestamptz,
      trial_expired_email_sent_at timestamptz,
      win_back_email_sent_at timestamptz,
      founding_member_number integer,
      username varchar(30),
      referral_code varchar(255),
      referral_count integer NOT NULL DEFAULT 0,
      referred_by_code varchar(255),
      industry varchar(100),
      job_title varchar(150),
      date_of_birth timestamp,
      kinfolk_query_month varchar(7),
      kinfolk_queries_this_month integer NOT NULL DEFAULT 0,
      trust_level integer NOT NULL DEFAULT 1,
      reputation_score integer NOT NULL DEFAULT 0,
      identity_verified boolean NOT NULL DEFAULT false,
      identity_verified_at timestamptz,
      policy_violations_count integer NOT NULL DEFAULT 0,
      helpful_reviews_count integer NOT NULL DEFAULT 0,
      is_private boolean NOT NULL DEFAULT false,
      followers_count integer NOT NULL DEFAULT 0,
      following_count integer NOT NULL DEFAULT 0,
      bio varchar(300),
      home_city varchar(100),
      home_state varchar(2),
      password_hash varchar(255),
      must_change_password boolean NOT NULL DEFAULT false,
      email_verified boolean NOT NULL DEFAULT false,
      email_verification_token varchar(255),
      email_verification_expires timestamptz,
      agree_to_terms boolean NOT NULL DEFAULT false,
      show_city boolean NOT NULL DEFAULT true,
      allow_dm boolean NOT NULL DEFAULT true,
      display_name_format varchar(32) DEFAULT 'full',
      is_influencer boolean NOT NULL DEFAULT false,
      is_business_owner boolean NOT NULL DEFAULT false,
      is_content_creator boolean NOT NULL DEFAULT false,
      is_community_organizer boolean NOT NULL DEFAULT false,
      profile_setup_complete boolean NOT NULL DEFAULT false,
      apple_id varchar(255),
      apple_refresh_token text,
      phone_number varchar(20),
      phone_verified boolean NOT NULL DEFAULT false,
      notif_events boolean NOT NULL DEFAULT true,
      notif_business boolean NOT NULL DEFAULT true,
      notif_messages boolean NOT NULL DEFAULT true,
      notif_reviews boolean NOT NULL DEFAULT false,
      notif_community boolean NOT NULL DEFAULT false,
      notif_promotions boolean NOT NULL DEFAULT false,
      notif_digest boolean NOT NULL DEFAULT true,
      notif_tips boolean NOT NULL DEFAULT false,
      notif_post_nudges boolean NOT NULL DEFAULT false,
      quiet_hours_enabled boolean NOT NULL DEFAULT true,
      quiet_hours_from varchar(10) NOT NULL DEFAULT '10:00 PM',
      quiet_hours_until varchar(10) NOT NULL DEFAULT '8:00 AM',
      marketing_opt_out boolean NOT NULL DEFAULT false,
      failed_login_attempts integer NOT NULL DEFAULT 0,
      locked_until timestamptz,
      tester_status varchar(32),
      tester_access_source varchar(32),
      tester_granted_at timestamptz,
      tester_granted_by varchar(255),
      testing_entitlement_ends_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
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
      tone_preference varchar(20) NOT NULL DEFAULT 'default',
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE kinfolk_sessions (
      id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
      sensitive_encrypted_content text,
      sensitive_encryption_key_id varchar(64),
      sensitive_restricted boolean NOT NULL DEFAULT true,
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
    // Do not inherit any external provider credentials. Every non-deterministic
    // chat call below must terminate at this harness's loopback server.
    delete process.env.OPENAI_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.KINFOLK_TAVILY_API_KEY;
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "local-kinfolk-acceptance";
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = await startLocalFakeProvider();
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
      await client.query("INSERT INTO users (id, member_type, date_of_birth) VALUES ($1, 'legacy_member', DATE '1980-01-01')", [member.id]);
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

    // No per-turn voiceMode is supplied. The actual route must read each
    // authenticated member's saved persona and take the deterministic coaching
    // path rather than calling the local provider.
    const raiseReplies = await Promise.all(
      members.slice(0, 4).map(async (member) => {
        const payload = { message: "Help me prepare for a raise conversation with my manager." };
        assert.equal(Object.hasOwn(payload, "voiceMode"), false, "raise fixture omits per-turn voiceMode");
        const response = await authed(member.id).post("/kinfolk/chat").send(payload);
        assert.equal(response.status, 200, `${member.id} raise chat succeeds`);
        assert.equal(response.body.answerMode, "career_coaching", `${member.id} uses deterministic career route`);
        assert.equal(response.body.itinerary, null, `${member.id} career chat has no itinerary`);
        return { mode: member.mode, reply: response.body.reply as string };
      }),
    );
    const repliesByMode = new Map(raiseReplies.map(({ mode, reply }) => [mode, reply]));
    assert.match(repliesByMode.get("big_cousin") ?? "", /Here is how to go about it/i);
    assert.match(repliesByMode.get("best_friend") ?? "", /You can do this/i);
    assert.match(repliesByMode.get("business_manager") ?? "", /Objective:/i);
    assert.match(repliesByMode.get("professor") ?? "", /A raise conversation is strongest/i);
    assert.equal(new Set(raiseReplies.map(({ reply }) => reply)).size, 4, "saved personas render four differentiated raise responses");
    assert.equal(fakeProviderCalls.length, 0, "deterministic raise path makes no provider call");
    console.error("[acceptance] verified four saved-persona deterministic raise chats");

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

    // A real, owner-scoped consent route must persist only the individually
    // selected ordinary preferences, then make them available for a different
    // conversation without granting access to the family/location clause.
    const { buildExplicitMemoryConsentPlan } = await import("../kinfolk/explicit-memory-consent");
    const { buildPrivateMemoryPersonalizationBlock, isApprovedPrivateMemoryRelevant } = await import("../kinfolk/private-memory-personalization");
    const scenarioMember = initial[9]!.member;
    const scenarioMessage = "Kinfolk, this is what I want you to remember about me: I have locs, I prefer Caribbean food, and my mother lives in Philadelphia.";
    const scenarioPlan = buildExplicitMemoryConsentPlan(scenarioMessage);
    assert.ok(scenarioPlan, "explicit scenario creates a reviewable plan");
    const locChoice = scenarioPlan!.ordinary.find((item) => /locs/i.test(item.content));
    const foodChoice = scenarioPlan!.ordinary.find((item) => /caribbean/i.test(item.content));
    assert.ok(locChoice && foodChoice, "loc and Caribbean preferences are individually selectable");
    const savedScenario = await authed(scenarioMember.id).post("/kinfolk/memory-consent").send({
      message: scenarioMessage, selectedIds: [locChoice!.id, foodChoice!.id], consent: true,
    });
    assert.equal(savedScenario.status, 201, "selected details persist through the actual consent route");
    const reviewedScenario = await authed(scenarioMember.id).get("/kinfolk/memories");
    assert.equal(reviewedScenario.status, 200, "member can review selected memories");
    assert.equal(reviewedScenario.body.memories.some((item: { content: string }) => /mother lives/i.test(item.content)), false, "unselected family/location clause is not stored");
    const locMemory = reviewedScenario.body.memories.find((item: { content: string }) => /locs/i.test(item.content));
    const foodMemory = reviewedScenario.body.memories.find((item: { content: string }) => /caribbean/i.test(item.content));
    assert.ok(locMemory && foodMemory, "only selected preferences are reviewable by the owner");
    const scenarioRows = await client.query<{ id: string; content: string; purpose: string; is_sensitive: boolean }>(
      "SELECT id, content, purpose, is_sensitive FROM kinfolk_private_memories WHERE user_id = $1 AND revoked_at IS NULL", [scenarioMember.id],
    );
    const relevant = (rows: readonly { content: string; purpose: string; is_sensitive: boolean }[], currentMessage: string) => rows.filter((memory) => isApprovedPrivateMemoryRelevant({ memory: { content: memory.content, purpose: memory.purpose, isSensitive: memory.is_sensitive }, currentMessage, legacyRelevant: false }));
    const hairPrompt = buildPrivateMemoryPersonalizationBlock(relevant(scenarioRows.rows, "Find me a loctician in Philadelphia."));
    const foodPrompt = buildPrivateMemoryPersonalizationBlock(relevant(scenarioRows.rows, "Where should I get dinner?"));
    assert.match(hairPrompt, /locs/i, "new hair conversation receives only the relevant loc preference");
    assert.doesNotMatch(hairPrompt, /caribbean/i, "hair conversation excludes unrelated food preference");
    assert.match(foodPrompt, /caribbean/i, "new dinner conversation receives the relevant food preference");
    assert.equal((await authed(scenarioMember.id).patch(`/kinfolk/memories/${locMemory.id}`).send({ content: "I wear wigs now." })).status, 200, "member can replace outdated hair preference");
    const afterUpdateRows = await client.query<{ content: string; purpose: string; is_sensitive: boolean }>(
      "SELECT content, purpose, is_sensitive FROM kinfolk_private_memories WHERE user_id = $1 AND revoked_at IS NULL", [scenarioMember.id],
    );
    const wigPrompt = buildPrivateMemoryPersonalizationBlock(relevant(afterUpdateRows.rows, "Find me a hair stylist."));
    assert.match(wigPrompt, /wigs/i, "replacement hair preference is available in a later conversation");
    assert.doesNotMatch(wigPrompt, /I have locs/i, "outdated loc preference is no longer applied");
    assert.equal((await authed(scenarioMember.id).delete(`/kinfolk/memories/${foodMemory.id}`)).status, 200, "member can revoke an individual food preference");
    const afterRevokeRows = await client.query<{ content: string; purpose: string; is_sensitive: boolean }>(
      "SELECT content, purpose, is_sensitive FROM kinfolk_private_memories WHERE user_id = $1 AND revoked_at IS NULL", [scenarioMember.id],
    );
    assert.doesNotMatch(buildPrivateMemoryPersonalizationBlock(relevant(afterRevokeRows.rows, "Where should I get dinner?")), /caribbean/i, "revoked food preference is not reused");
    const doNotRemember = await authed(scenarioMember.id).post("/kinfolk/memory-consent").send({ message: "Kinfolk, remember: I prefer vegan food.", selectedIds: ["o-1"], consent: false });
    assert.equal(doNotRemember.status, 400, "do-not-remember selection writes nothing");
    const sensitivePlan = buildExplicitMemoryConsentPlan("Kinfolk, remember: I have eczema.");
    assert.ok(sensitivePlan?.sensitive[0], "health detail receives an additional sensitive consent path");
    const sensitiveWithoutConfirmation = await authed(scenarioMember.id).post("/kinfolk/memory-consent").send({ message: "Kinfolk, remember: I have eczema.", selectedIds: [sensitivePlan!.sensitive[0]!.id], consent: true });
    assert.equal(sensitiveWithoutConfirmation.status, 409, "sensitive detail cannot save without additional confirmation");

    // Exercise the actual chat route through the loopback provider: a selected,
    // relevant food preference is visible only for the owner and only while
    // active. The fake answer and captured prompt make the route boundary
    // observable without transmitting anything beyond this disposable process.
    const chatMemoryOwner = initial[10]!.member;
    const chatMemoryOther = initial[11]!.member;
    const chatPreferenceMessage = `Kinfolk, this is what I want you to remember about me: ${CARIBBEAN_PREFERENCE}`;
    const chatPreferencePlan = buildExplicitMemoryConsentPlan(chatPreferenceMessage);
    const chatPreferenceChoice = chatPreferencePlan?.ordinary.find((item) => item.content === CARIBBEAN_PREFERENCE);
    assert.ok(chatPreferenceChoice, "Caribbean preference has an explicit ordinary consent choice");
    const savedChatPreference = await authed(chatMemoryOwner.id)
      .post("/kinfolk/memory-consent")
      .send({ message: chatPreferenceMessage, selectedIds: [chatPreferenceChoice!.id], consent: true });
    assert.equal(savedChatPreference.status, 201, "actual consent route saves the owner-selected food preference");
    const savedChatMemories = await authed(chatMemoryOwner.id).get("/kinfolk/memories");
    const chatPreferenceMemory = savedChatMemories.body.memories.find(
      (memory: { content: string }) => memory.content === CARIBBEAN_PREFERENCE,
    );
    assert.ok(chatPreferenceMemory, "owner can identify the selected food preference for later revocation");

    const dinnerMessage = "What should I make for dinner tonight?";
    const ownerDinner = await authed(chatMemoryOwner.id).post("/kinfolk/chat").send({ message: dinnerMessage });
    assert.equal(ownerDinner.status, 200, "owner's relevant dinner chat succeeds");
    assert.match(ownerDinner.body.reply, /LOCAL_PROVIDER: Caribbean preference applied\./, "relevant owner turn receives the selected preference through the actual route");
    assert.equal(ownerDinner.body.memoryUse?.applied, true, "route discloses actual saved-preference use only after the local answer accepts it");

    const ownerDinnerCall = fakeProviderCalls.at(-1);
    assert.ok(ownerDinnerCall?.systemPrompt.includes(CARIBBEAN_PREFERENCE), "owner's relevant provider prompt includes the selected preference");
    const crossOwnerDinner = await authed(chatMemoryOther.id).post("/kinfolk/chat").send({ message: dinnerMessage });
    assert.equal(crossOwnerDinner.status, 200, "cross-owner dinner chat succeeds without shared memory");
    assert.match(crossOwnerDinner.body.reply, /LOCAL_PROVIDER: ordinary answer without private preference\./, "cross-owner turn cannot receive another member's food preference");
    assert.equal(fakeProviderCalls.at(-1)?.systemPrompt.includes(CARIBBEAN_PREFERENCE), false, "cross-owner prompt excludes the owner's food preference");

    const unrelatedOwnerTurn = await authed(chatMemoryOwner.id)
      .post("/kinfolk/chat")
      .send({ message: "Draft a short email asking for a meeting." });
    assert.equal(unrelatedOwnerTurn.status, 200, "owner's unrelated drafting chat succeeds");
    assert.match(unrelatedOwnerTurn.body.reply, /LOCAL_PROVIDER: ordinary answer without private preference\./, "unrelated owner turn does not receive a food preference");
    assert.equal(fakeProviderCalls.at(-1)?.systemPrompt.includes(CARIBBEAN_PREFERENCE), false, "unrelated owner prompt excludes the irrelevant food preference");

    const revokedChatPreference = await authed(chatMemoryOwner.id)
      .delete(`/kinfolk/memories/${chatPreferenceMemory.id}`);
    assert.equal(revokedChatPreference.status, 200, "owner can revoke the food preference through the actual route");
    const revokedOwnerDinner = await authed(chatMemoryOwner.id).post("/kinfolk/chat").send({ message: dinnerMessage });
    assert.equal(revokedOwnerDinner.status, 200, "owner dinner chat succeeds after revocation");
    assert.match(revokedOwnerDinner.body.reply, /LOCAL_PROVIDER: ordinary answer without private preference\./, "revoked preference cannot influence a later owner turn");
    assert.equal(fakeProviderCalls.at(-1)?.systemPrompt.includes(CARIBBEAN_PREFERENCE), false, "revoked preference is absent from the later provider prompt");

    // Use one owner session for two discrete drafts separated by topic switches.
    // The final request expressly returns to a draft, so the real route must send
    // the most recent drafting pair (beta) and no unrelated/older context.
    const draftMember = initial[12]!.member;
    const sendDraftChat = async (message: string, sessionId?: string) => {
      const response = await authed(draftMember.id).post("/kinfolk/chat").send({ message, ...(sessionId ? { sessionId } : {}) });
      assert.equal(response.status, 200, `draft-scope chat succeeds: ${message}`);
      assert.ok(typeof response.body.sessionId === "string" && response.body.sessionId.length > 0, "chat returns an owned session id");
      return response;
    };
    const alphaDraft = await sendDraftChat(`Draft an email to my manager about a schedule change. ${DRAFT_ALPHA_MARKER}`);
    assert.match(alphaDraft.body.reply, /LOCAL_PROVIDER: alpha draft ready\./, "first draft reaches the local provider");
    const afterAlphaTopicSwitch = await sendDraftChat(`Tell me one concise garden tip. ${TOPIC_SWITCH_MARKER}`, alphaDraft.body.sessionId as string);
    assert.match(afterAlphaTopicSwitch.body.reply, /LOCAL_PROVIDER: garden topic answer\./, "first topic switch is a separate current turn");
    const betaDraft = await sendDraftChat(`Draft an email to my manager about a project update. ${DRAFT_BETA_MARKER}`, alphaDraft.body.sessionId as string);
    assert.match(betaDraft.body.reply, /LOCAL_PROVIDER: beta draft ready\./, "second draft reaches the local provider");
    const afterBetaTopicSwitch = await sendDraftChat(`Give me another garden tip. ${TOPIC_SWITCH_MARKER}`, alphaDraft.body.sessionId as string);
    assert.match(afterBetaTopicSwitch.body.reply, /LOCAL_PROVIDER: garden topic answer\./, "second topic switch is a separate current turn");
    const revisedDraft = await sendDraftChat("Go back to the earlier email draft and revise it to be warmer.", alphaDraft.body.sessionId as string);
    assert.match(revisedDraft.body.reply, /LOCAL_PROVIDER: revised active beta draft only\./, "explicit return-to-draft uses only the active beta drafting pair");
    const revisionCall = fakeProviderCalls.at(-1);
    assert.ok(revisionCall?.history.includes(DRAFT_BETA_MARKER), "revision prompt retains the active beta draft");
    assert.doesNotMatch(revisionCall?.history ?? "", new RegExp(DRAFT_ALPHA_MARKER), "revision prompt excludes the older alpha draft");
    assert.doesNotMatch(revisionCall?.history ?? "", new RegExp(TOPIC_SWITCH_MARKER), "revision prompt excludes intervening topic-switch context");

    // This memory harness deliberately has no governed destination catalog.
    // Neither an explicit nor hypothetical trip may fabricate an itinerary from
    // the model; catalog-backed itinerary construction is covered by the
    // dedicated governed-discovery acceptance harness.
    const travelMember = initial[13]!.member;
    const explicitOneDayPlan = await authed(travelMember.id)
      .post("/kinfolk/chat")
      .send({ message: "Plan a one-day trip to Atlanta.", cityHint: "Atlanta, GA" });
    assert.equal(explicitOneDayPlan.status, 200, "explicit one-day travel plan chat succeeds");
    assert.equal(explicitOneDayPlan.body.itinerary, null, "an explicit plan without governed coverage does not invent an itinerary");
    const hypotheticalTravel = await authed(travelMember.id)
      .post("/kinfolk/chat")
      .send({ message: "If I were to visit Atlanta for one day, what should I think about?", cityHint: "Atlanta, GA" });
    assert.equal(hypotheticalTravel.status, 200, "hypothetical travel chat succeeds");
    assert.equal(hypotheticalTravel.body.itinerary, null, "hypothetical travel prompt does not become an itinerary");
    console.error("[acceptance] verified actual chat memory relevance/revocation, active draft scope, and explicit-only travel itinerary");

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
        "individual consent selection, cross-conversation relevant use, replacement, revocation, do-not-remember, and sensitive-consent gate",
        "actual no-override saved-persona raise chats are differentiated and provider-free",
        "actual owner-only relevant private-memory use excludes cross-owner, unrelated, and revoked turns through a loopback fake provider",
        "actual topic-switch and explicit return-to-draft chat retains only the active draft pair",
        "actual explicit and hypothetical travel turns do not invent an itinerary without governed destination coverage",
      ],
    }));
  } finally {
    await new Promise<void>((resolve) => fakeProviderServer?.close(() => resolve()) ?? resolve());
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
