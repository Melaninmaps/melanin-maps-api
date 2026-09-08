import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";

const origin = process.env.KINFOLK_ACCEPTANCE_ORIGIN?.trim() || "http://127.0.0.1:3080";
const outputPath = process.env.KINFOLK_ACCEPTANCE_OUTPUT?.trim() || null;
const expectedSha = process.env.KINFOLK_ACCEPTANCE_EXPECTED_SHA?.trim() ?? "";
const expectedBundleSha256 = process.env.KINFOLK_ACCEPTANCE_EXPECTED_BUNDLE_SHA256?.trim() ?? "";

if (!/^[a-f0-9]{40}$/.test(expectedSha)) {
  throw new Error("KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: exact expected SHA is required");
}
if (!/^http:\/\/127\.0\.0\.1:308[01]$/.test(origin)) {
  throw new Error("KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: origin must be exact loopback staging");
}
if (!/^[a-f0-9]{64}$/.test(expectedBundleSha256)) {
  throw new Error("KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: exact expected bundle fingerprint is required");
}
if (process.env.DEPLOYMENT_TIER !== "local_staging" || process.env.DIRECTORY_IMPORT_LOCAL_STAGING !== "1") {
  throw new Error("KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: exact isolated-staging markers are required");
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
      budgetRange: "mid",
      tripStyle: ["group"],
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
      budgetRange: "mid",
      tripStyle: ["couple"],
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
      favoriteCategories: ["author events and workshops"],
      favoriteCities: ["Philadelphia"],
      avoidCategories: ["nightclubs"],
      budgetRange: "mid",
      tripStyle: ["solo"],
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
      budgetRange: "mid",
      tripStyle: ["family"],
      travelCompanion: "family",
      dietaryNotes: null,
      culturalInterests: [],
      lifestyleServices: [],
    },
  },
] as const;

type JsonObject = Record<string, unknown>;

const ADULT_ONLY_PATTERN = /(?:\b(?:night\s*club|nightclub|adult entertainment|strip\s*club|stripclub|gentlemen(?:'s|s)?\s*club|cabaret|adults? only|age[- ]restricted|mature audiences? only)\b|(?:^|[^a-z0-9])(?:18|21)\s*\+(?=$|[^a-z0-9]))/i;

type AcceptanceResult = {
  profile: string;
  storedAgeBand: string;
  directoryClarificationPassed: boolean;
  directoryTopResult: string;
  directoryWhy: string;
  directoryActions: string[];
  directoryClaimed: boolean;
  directoryVerified: boolean;
  teenAdultOnlyExcluded: boolean;
  teenAdultPhraseCouldNotWeakenSafety: boolean;
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
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  if (new URL(response.url).origin !== origin) {
    throw new Error(`KINFOLK_FAMILY_ACCEPTANCE_ORIGIN_MISMATCH path=${path}`);
  }
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
  const refs = await pool.query<{ table_schema: string; table_name: string; column_name: string }>(
    `SELECT DISTINCT c.table_schema, c.table_name, c.column_name
       FROM information_schema.columns c
       JOIN information_schema.tables t
         ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'user_id'
        AND c.table_name <> 'users'
        AND t.table_type = 'BASE TABLE'`,
  );
  for (const ref of refs.rows) {
    if (
      !/^[a-z_][a-z0-9_]*$/i.test(ref.table_schema)
      || !/^[a-z_][a-z0-9_]*$/i.test(ref.table_name)
      || !/^[a-z_][a-z0-9_]*$/i.test(ref.column_name)
    ) throw new Error("KINFOLK_FAMILY_ACCEPTANCE_CLEANUP_IDENTIFIER_INVALID");
  }

  const deleteRelatedRows = async (): Promise<void> => {
    await pool.query(`DELETE FROM sessions WHERE sess #>> '{user,id}' = ANY($1::text[])`, [userIds]);
    for (const ref of refs.rows) {
      const table = `"${ref.table_schema}"."${ref.table_name}"`;
      const column = `"${ref.column_name}"`;
      await pool.query(`DELETE FROM ${table} WHERE ${column}::text = ANY($1::text[])`, [userIds]);
    }
  };

  const assertZeroResidue = async (): Promise<void> => {
    const remainingUsers = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users WHERE id = ANY($1::text[])`, [userIds],
    );
    const remainingSessions = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM sessions WHERE sess #>> '{user,id}' = ANY($1::text[])`, [userIds],
    );
    if (remainingUsers.rows[0]?.count !== "0" || remainingSessions.rows[0]?.count !== "0") {
      throw new Error("KINFOLK_FAMILY_ACCEPTANCE_CLEANUP_FAILED");
    }
    for (const ref of refs.rows) {
      const table = `"${ref.table_schema}"."${ref.table_name}"`;
      const column = `"${ref.column_name}"`;
      const residue = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${table} WHERE ${column}::text = ANY($1::text[])`,
        [userIds],
      );
      if (residue.rows[0]?.count !== "0") {
        throw new Error(`KINFOLK_FAMILY_ACCEPTANCE_CLEANUP_RELATED_ROWS_REMAIN table=${ref.table_name}`);
      }
    }
  };

  await deleteRelatedRows();
  await pool.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [userIds]);
  await new Promise((resolve) => setTimeout(resolve, 500));
  await deleteRelatedRows();
  await assertZeroResidue();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await deleteRelatedRows();
  await assertZeroResidue();
}

async function run(): Promise<void> {
  const database = await pool.query<{ current_database: string; server_addr: string | null }>(
    "SELECT current_database(), inet_server_addr()::text AS server_addr",
  );
  const databaseName = database.rows[0]?.current_database ?? "";
  const serverAddress = database.rows[0]?.server_addr ?? "";
  if (databaseName !== "mwm_directory_staging" || serverAddress !== "127.0.0.1/32") {
    throw new Error(`KINFOLK_FAMILY_ACCEPTANCE_BLOCKED: database ${databaseName || "unknown"} is not isolated staging`);
  }
  const version = await requestJson("/api/version", { method: "GET" });
  assert.equal(version.response.status, 200, "version endpoint");
  assert.equal(version.body.built_from_sha, expectedSha, "compiled exact SHA");
  assert.equal(version.body.stale_bundle, false, "compiled bundle is current");
  assert.equal(version.body.bundle_sha256, expectedBundleSha256, "recorded exact bundle fingerprint");
  assert.match(String(version.body.bundle_sha256_self ?? ""), /^[a-f0-9]{64}$/, "running bundle fingerprint");

  const nonce = `${Date.now()}-${randomBytes(5).toString("hex")}`;
  const password = randomBytes(32).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 8);
  const userIds: string[] = [];
  const sessionCookies: string[] = [];
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
      sessionCookies.push(cookie);

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

      const initialDirectory = await requestJson("/api/kinfolk/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Find things to do in Philadelphia PA" }),
      }, cookie);
      assert.equal(initialDirectory.response.status, 200, `${profile.label} initial directory request`);
      let directoryClarificationPassed = false;
      let directory = initialDirectory;
      if (initialDirectory.body.needsClarification === true) {
        const clarificationSteps = (initialDirectory.body.clarificationSteps as Array<{
          options?: Array<{ label?: string }>;
        }> | undefined) ?? [];
        assert.ok(
          clarificationSteps.some((step) => (step.options ?? []).some((option) => /keep this search broad/i.test(option.label ?? ""))),
          `${profile.label} skip option`,
        );
        directory = await requestJson("/api/kinfolk/chat", {
          method: "POST",
          body: JSON.stringify({ message: "Find things to do in Philadelphia PA — keep this search broad" }),
        }, cookie);
        directoryClarificationPassed = true;
      }
      assert.equal(directory.response.status, 200, `${profile.label} directory search`);
      const resultView = directory.body.resultView as { cards?: Array<Record<string, unknown>> } | undefined;
      const cards = resultView?.cards ?? [];
      const top = cards[0];
      if (!top) {
        const responseKeys = Object.keys(directory.body).sort().join(",");
        throw new Error(
          `${profile.label} directory cards missing intent=${String(directory.body.intentClass ?? "unknown")} keys=${responseKeys}`,
        );
      }
      assert.equal(top?.title, profile.expectedBusiness, `${profile.label} directory top result`);
      assert.equal(top?.claimed, false, `${profile.label} claim truth`);
      assert.equal(top?.verified, false, `${profile.label} verification truth`);
      assert.match(String(top?.matchReason ?? ""), /saved preference|published youth/i, `${profile.label} why this fits`);
      const actions = (top?.actions as Array<{ label?: string; url?: string }> | undefined) ?? [];
      assert.deepEqual(actions.map((action) => action.label), ["View details", "Visit website"], `${profile.label} actions`);
      assert.ok(actions.every((action) => typeof action.url === "string" && action.url.length > 0), `${profile.label} action URLs`);
      const teenAdultOnlyExcluded = profile.label !== "P14"
        || !ADULT_ONLY_PATTERN.test(JSON.stringify(directory.body));
      assert.equal(teenAdultOnlyExcluded, true, `${profile.label} adult-only exclusion`);
      let teenAdultPhraseCouldNotWeakenSafety = true;
      if (profile.label === "P14") {
        for (const adultRequest of [
          "Find adult entertainment in Philadelphia PA",
          "Find a strip club in Philadelphia PA",
          "Find a gentlemen's club in Philadelphia PA",
          "Find a cabaret in Philadelphia PA",
          "Find a nightclub in Philadelphia PA",
          "Find an 18+ venue in Philadelphia PA",
          "Find a 21+ venue in Philadelphia PA",
        ]) {
          const adversarialAudience = await requestJson("/api/kinfolk/chat", {
            method: "POST",
            body: JSON.stringify({ message: adultRequest }),
          }, cookie);
          assert.equal(adversarialAudience.response.status, 200, `P14 adult-language route probe: ${adultRequest}`);
          const serializedAdversarial = JSON.stringify(adversarialAudience.body);
          teenAdultPhraseCouldNotWeakenSafety = teenAdultPhraseCouldNotWeakenSafety
            && !ADULT_ONLY_PATTERN.test(serializedAdversarial.replace(adultRequest, ""));
          assert.equal(
            teenAdultPhraseCouldNotWeakenSafety,
            true,
            `P14 adult language cannot weaken persisted safety: ${adultRequest}`,
          );
        }
      }

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
          ADULT_ONLY_PATTERN,
          "P14 trip adult-only exclusion",
        );
      }

      results.push({
        profile: profile.label,
        storedAgeBand: String(ageRead.body.ageBand),
        directoryClarificationPassed,
        directoryTopResult: String(top?.title),
        directoryWhy: String(top?.matchReason),
        directoryActions: actions.map((action) => String(action.label)),
        directoryClaimed: false,
        directoryVerified: false,
        teenAdultOnlyExcluded,
        teenAdultPhraseCouldNotWeakenSafety,
        tripExpectedVenuePresent,
        tripCanonicalVenues: canonicalVenues,
        tripDayCount: days.length,
      });
    }
  } finally {
    let logoutFailed = false;
    for (const cookie of sessionCookies) {
      try {
        const logout = await requestJson("/api/auth/logout-all", { method: "POST" }, cookie);
        if (logout.response.status !== 200 || logout.body.success !== true) logoutFailed = true;
      } catch {
        logoutFailed = true;
      }
    }
    await cleanupUsers(userIds);
    if (logoutFailed) throw new Error("KINFOLK_FAMILY_ACCEPTANCE_LOGOUT_FAILED");
  }

  assert.equal(new Set(results.map((result) => result.directoryTopResult)).size, 4, "four distinct directory winners");
  const report = {
    ok: true,
    checkedAt: new Date().toISOString(),
    sourceSha: expectedSha,
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
