import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";

const origin = (process.env.KINFOLK_ACCEPTANCE_ORIGIN ?? "http://127.0.0.1:3080").replace(/\/$/, "");
const outputPath = process.env.KINFOLK_ACCEPTANCE_OUTPUT?.trim() || null;

if (!/^https:\/\/mwm-staging\.[a-z0-9.-]+\.nip\.io$/i.test(origin) && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin)) {
  throw new Error("KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: origin must be isolated staging or loopback");
}

const profiles = [
  {
    label: "P21",
    ageBand: "18_plus",
    expectedBusiness: "Loomen Labs",
    preferences: {
      favoriteCategories: ["candle-making experiences"],
      favoriteCities: ["Philadelphia"],
      avoidCategories: ["nightclubs"],
      budgetRange: "moderate",
      tripStyle: ["hands-on", "creative"],
      travelCompanion: "friends",
      dietaryNotes: null,
      culturalInterests: [],
      lifestyleServices: [],
    },
  },
  {
    label: "P45",
    ageBand: "18_plus",
    expectedBusiness: "AMINA",
    preferences: {
      favoriteCategories: ["American Southern cuisine and African-inspired dining"],
      favoriteCities: ["Philadelphia"],
      avoidCategories: ["nightclubs"],
      budgetRange: "moderate",
      tripStyle: ["date night", "food"],
      travelCompanion: "partner",
      dietaryNotes: null,
      culturalInterests: [],
      lifestyleServices: [],
    },
  },
  {
    label: "P65",
    ageBand: "18_plus",
    expectedBusiness: "Uncle Bobbie's Coffee & Books",
    preferences: {
      favoriteCategories: ["independent bookstores and author events"],
      favoriteCities: ["Philadelphia"],
      avoidCategories: ["nightclubs"],
      budgetRange: "moderate",
      tripStyle: ["books", "cultural"],
      travelCompanion: "solo",
      dietaryNotes: null,
      culturalInterests: [],
      lifestyleServices: [],
    },
  },
  {
    label: "P14",
    ageBand: "13_15",
    expectedBusiness: "Queen & Rook Game Cafe",
    preferences: {
      favoriteCategories: ["video games and board games"],
      favoriteCities: ["Philadelphia"],
      avoidCategories: ["nightlife", "bars"],
      budgetRange: "moderate",
      tripStyle: ["family", "games"],
      travelCompanion: "family",
      dietaryNotes: null,
      culturalInterests: [],
      lifestyleServices: [],
    },
  },
] as const;

type JsonObject = Record<string, unknown>;

type AcceptanceResult = {
  profile: string;
  storedAgeBand: string;
  directoryTopResult: string;
  directoryWhy: string;
  directoryActions: string[];
  directoryClaimed: boolean;
  directoryVerified: boolean;
  teenAdultOnlyExcluded: boolean;
  tripExpectedVenuePresent: boolean;
  tripCanonicalVenues: string[];
  tripDayCount: number;
};

function cookieHeader(response: Response): string {
  const raw = response.headers.get("set-cookie") ?? "";
  return raw.split(/,(?=[^;,]+=[^;,]+)/).map((value) => value.split(";", 1)[0]).join("; ");
}

async function requestJson(path: string, init: RequestInit, cookie?: string): Promise<{ response: Response; body: JsonObject }> {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  let body: JsonObject = {};
  try {
    body = text ? JSON.parse(text) as JsonObject : {};
  } catch {
    throw new Error(`KINFOLK_FAMILY_ACCEPTANCE_NON_JSON status=${response.status} path=${path}`);
  }
  return { response, body };
}

async function cleanupUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await pool.query(
    `DELETE FROM sessions WHERE sess #>> '{user,id}' = ANY($1::text[])`,
    [userIds],
  ).catch(() => undefined);

  const refs = await pool.query<{ table_schema: string; table_name: string; column_name: string }>(
    `SELECT DISTINCT table_schema, table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'user_id'
        AND table_name <> 'users'`,
  );
  for (const ref of refs.rows) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(ref.table_name) || !/^[a-z_][a-z0-9_]*$/i.test(ref.column_name)) continue;
    const table = `"${ref.table_schema}"."${ref.table_name}"`;
    const column = `"${ref.column_name}"`;
    await pool.query(`DELETE FROM ${table} WHERE ${column}::text = ANY($1::text[])`, [userIds]).catch(() => undefined);
  }
  await pool.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [userIds]);
  const remainingUsers = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users WHERE id = ANY($1::text[])`,
    [userIds],
  );
  const remainingSessions = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM sessions WHERE sess #>> '{user,id}' = ANY($1::text[])`,
    [userIds],
  );
  if (remainingUsers.rows[0]?.count !== "0" || remainingSessions.rows[0]?.count !== "0") {
    throw new Error("KINFOLK_FAMILY_ACCEPTANCE_CLEANUP_FAILED");
  }
}

async function run(): Promise<void> {
  const database = await pool.query<{ current_database: string; server_addr: string | null }>(
    "SELECT current_database(), inet_server_addr()::text AS server_addr",
  );
  const databaseName = database.rows[0]?.current_database ?? "";
  if (!databaseName.startsWith("mwm_directory_staging")) {
    throw new Error(`KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: database ${databaseName || "unknown"} is not isolated staging`);
  }

  const nonce = `${Date.now()}-${randomBytes(5).toString("hex")}`;
  const password = randomBytes(32).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 8);
  const userIds: string[] = [];
  const results: AcceptanceResult[] = [];

  try {
    for (const [index, profile] of profiles.entries()) {
      const userId = randomUUID();
      userIds.push(userId);
      const email = `kinfolk-family-${profile.label.toLowerCase()}-${nonce}@example.invalid`;
      const username = `kf_${profile.label.toLowerCase()}_${nonce.replace(/[^a-z0-9]/gi, "").slice(-16)}_${index}`.slice(0, 30);

      await pool.query(
        `INSERT INTO users
           (id, email, first_name, last_name, username, password_hash,
            email_verified, approved, role, member_type, tester_status,
            tester_access_source, tester_granted_at, agree_to_terms,
            profile_setup_complete, created_at, updated_at)
         VALUES ($1,$2,'Family','Acceptance',$3,$4,true,true,'tester','beta',
                 'active','website_test',NOW(),true,true,NOW(),NOW())`,
        [userId, email, username, passwordHash],
      );

      const login = await requestJson("/api/auth/login-email", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      assert.equal(login.response.status, 200, `${profile.label} login`);
      const cookie = cookieHeader(login.response);
      assert.ok(cookie, `${profile.label} session cookie`);

      const ageSave = await requestJson("/api/age-assurance", {
        method: "PUT",
        body: JSON.stringify({ ageBand: profile.ageBand, attested: true }),
      }, cookie);
      assert.equal(ageSave.response.status, 200, `${profile.label} age save`);

      const preferenceSave = await requestJson("/api/kinfolk/preferences", {
        method: "PUT",
        body: JSON.stringify(profile.preferences),
      }, cookie);
      assert.equal(preferenceSave.response.status, 200, `${profile.label} preference save`);

      const ageRead = await requestJson("/api/age-assurance", { method: "GET" }, cookie);
      assert.equal(ageRead.response.status, 200, `${profile.label} age read`);
      assert.equal(ageRead.body.ageBand, profile.ageBand, `${profile.label} stored age band`);
      assert.equal(Object.prototype.hasOwnProperty.call(ageRead.body, "dateOfBirth"), false, `${profile.label} no DOB`);

      const preferenceRead = await requestJson("/api/kinfolk/preferences", { method: "GET" }, cookie);
      assert.equal(preferenceRead.response.status, 200, `${profile.label} preference read`);
      const saved = preferenceRead.body.preferences as JsonObject;
      assert.deepEqual(saved.favoriteCategories, profile.preferences.favoriteCategories, `${profile.label} saved categories`);

      const directory = await requestJson("/api/kinfolk/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Find things to do in Philadelphia PA" }),
      }, cookie);
      assert.equal(directory.response.status, 200, `${profile.label} directory search`);
      const resultView = directory.body.resultView as { cards?: Array<Record<string, unknown>> } | undefined;
      const cards = resultView?.cards ?? [];
      const top = cards[0];
      assert.equal(top?.title, profile.expectedBusiness, `${profile.label} directory top result`);
      assert.equal(top?.claimed, false, `${profile.label} claim truth`);
      assert.equal(top?.verified, false, `${profile.label} verification truth`);
      assert.match(String(top?.matchReason ?? ""), /saved preference|published youth/i, `${profile.label} why this fits`);
      const actions = (top?.actions as Array<{ label?: string; url?: string }> | undefined) ?? [];
      assert.deepEqual(actions.map((action) => action.label), ["View details", "Visit website"], `${profile.label} actions`);
      assert.ok(actions.every((action) => typeof action.url === "string" && action.url.length > 0), `${profile.label} action URLs`);
      const teenAdultOnlyExcluded = profile.label !== "P14"
        || !/\b(?:night\s*club|nightclub|adults? only|21\+)\b/i.test(JSON.stringify(cards));
      assert.equal(teenAdultOnlyExcluded, true, `${profile.label} adult-only exclusion`);

      const trip = await requestJson("/api/kinfolk/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Plan a one-day trip in Philadelphia PA" }),
      }, cookie);
      assert.equal(trip.response.status, 200, `${profile.label} trip plan`);
      const itinerary = trip.body.itinerary as { days?: Array<{ activities?: Array<{ canonicalVenue?: string }> }> } | undefined;
      const days = itinerary?.days ?? [];
      assert.equal(days.length, 1, `${profile.label} trip day count`);
      const canonicalVenues = days.flatMap((day) => day.activities ?? [])
        .map((activity) => activity.canonicalVenue)
        .filter((value): value is string => typeof value === "string" && value.length > 0);
      const tripExpectedVenuePresent = canonicalVenues.includes(profile.expectedBusiness)
        || String(trip.body.reply ?? "").toLowerCase().includes(profile.expectedBusiness.toLowerCase());
      assert.equal(tripExpectedVenuePresent, true, `${profile.label} profile-aware trip venue`);
      if (profile.label === "P14") {
        assert.doesNotMatch(
          JSON.stringify(trip.body),
          /\b(?:night\s*club|nightclub|adults? only|21\+)\b/i,
          "P14 trip adult-only exclusion",
        );
      }

      results.push({
        profile: profile.label,
        storedAgeBand: String(ageRead.body.ageBand),
        directoryTopResult: String(top?.title),
        directoryWhy: String(top?.matchReason),
        directoryActions: actions.map((action) => String(action.label)),
        directoryClaimed: false,
        directoryVerified: false,
        teenAdultOnlyExcluded,
        tripExpectedVenuePresent,
        tripCanonicalVenues: canonicalVenues,
        tripDayCount: days.length,
      });
    }
  } finally {
    await cleanupUsers(userIds);
  }

  assert.equal(new Set(results.map((result) => result.directoryTopResult)).size, 4, "four distinct directory winners");
  const report = {
    ok: true,
    checkedAt: new Date().toISOString(),
    sourceSha: process.env.APP_GIT_SHA ?? process.env.GIT_SHA ?? null,
    origin,
    databaseClass: "isolated_staging",
    disposableAccountsRemoved: true,
    results,
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) await writeFile(outputPath, serialized, { mode: 0o600 });
  process.stdout.write(serialized);
}

run()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown acceptance failure";
    console.error(`KINFOLK_FAMILY_ACCEPTANCE_FAILED: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
