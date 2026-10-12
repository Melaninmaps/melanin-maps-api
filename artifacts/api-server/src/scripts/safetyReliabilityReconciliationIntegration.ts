import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");

const PG_BIN = "/usr/lib/postgresql/16/bin";
const PORT = 55524;
const RESTART_PHASE = process.argv.includes("--restart");
const API_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REPOSITORY_ROOT = resolve(API_DIRECTORY, "../..");

const OWNER = "safety-reconcile-owner";
const CONTACT = "safety-reconcile-contact";
const UNCONSENTED_CONTACT = "safety-reconcile-unconsented-contact";
const OUTSIDER = "safety-reconcile-outsider";
const REPORTER = "safety-reconcile-reporter";
const REVIEWER = "safety-reconcile-reviewer";

const CURRENT_EVENT = "reconcile-current";
const RETRY_EVENT = "reconcile-retry";
const REJECTED_EVENT = "reconcile-rejected";
const CANCELLED_EVENT = "reconcile-cancelled";

function shell(command: string, args: string[], options: Record<string, unknown> = {}): string {
  return String(execFileSync(command, args, { stdio: "pipe", ...options }));
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function count(value: unknown): number {
  return Number(value ?? 0);
}

function eventBody(sourceEventId: string) {
  return {
    source: "nws",
    sourceEventId,
    eventType: "severe_weather",
    generalArea: "Synthetic reconciliation area",
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    boundary: {
      kind: "polygon",
      coordinates: [[-75.18, 39.94], [-75.14, 39.94], [-75.14, 39.97], [-75.18, 39.97]],
    },
  };
}

function setSafetyEnvironment(databaseUrl: string): void {
  Object.assign(process.env, {
    DATABASE_URL: databaseUrl,
    FAMILY_IMPACT_INGEST_SECRET: "local-safety-reconciliation-ingest-secret",
    SAFETY_FAMILY_IMPACT_DELIVERY_ENABLED: "false",
    KINFOLK_MEMORY_STAGING_ISOLATION: "true",
    KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED: "true",
  });
}

async function initializeRelevantStartupSchema(): Promise<void> {
  const {
    ensureSafetyReliabilitySchema,
    ensureIsolatedSeriousThreatPrivateReviewSchema,
  } = await import("../lib/startup-migrations");
  await ensureSafetyReliabilitySchema();
  await ensureIsolatedSeriousThreatPrivateReviewSchema();
}

async function buildCurrentSafetyApp() {
  const [
    { default: locationSharesRouter },
    { default: trustedSafetyShareRouter },
    { default: familyImpactRouter },
    { default: communityAlertsRouter },
    { default: seriousThreatRouter },
    { default: seriousThreatReviewerRouter },
  ] = await Promise.all([
    import("../routes/location-shares"),
    import("../routes/trusted-safety-share"),
    import("../routes/family-impact-intelligence"),
    import("../routes/community-alerts"),
    import("../routes/serious-credible-threats"),
    import("../routes/serious-credible-threat-reviewer"),
  ]);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: () => void) => {
    const id = typeof req.header("x-qa-user") === "string" ? req.header("x-qa-user") : "";
    req.user = id ? { id, email: `${id}@example.test`, role: "user" } : undefined;
    req.isAuthenticated = () => Boolean(req.user);
    req.log = { error: () => undefined, warn: () => undefined, info: () => undefined };
    next();
  });
  // These mounts use the same current routers and relative order as routes/index.ts.
  app.use(locationSharesRouter);
  app.use(trustedSafetyShareRouter);
  app.use(familyImpactRouter);
  app.use(seriousThreatRouter);
  app.use(seriousThreatReviewerRouter);
  app.use(communityAlertsRouter);
  return app;
}

const as = (id: string) => ({ "x-qa-user": id });

async function ingest(app: any, sourceEventId: string): Promise<void> {
  const response = await request(app)
    .post("/internal/safety/family-impact/events")
    .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!)
    .send(eventBody(sourceEventId));
  assert(response.status === 202 && response.body.delivery === "disabled", "authoritative event intake must keep delivery disabled");
}

async function createAcceptedShare(app: any, contactId: string, name: string): Promise<string> {
  const invite = await request(app)
    .post("/safety/trusted-shares")
    .set(as(OWNER))
    .send({ contactName: name, contactType: "mwm_user", contactUserId: contactId });
  assert(invite.status === 201 && invite.body.share?.id, "trusted-contact invitation must be created through the current route");
  const shareId = String(invite.body.share.id);
  const accepted = await request(app)
    .patch(`/safety/trusted-shares/${shareId}/respond`)
    .set(as(contactId))
    .send({ accept: true });
  assert(accepted.status === 200 && accepted.body.share?.status === "active", "trusted contact must explicitly accept");
  return shareId;
}

async function initializeCurrentDatabase(databaseUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    // Current Drizzle definitions use gen_random_uuid() defaults. Prepare this
    // standard PostgreSQL prerequisite before applying the actual schema.
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  } finally {
    await client.end();
  }
  shell("pnpm", ["--filter", "@workspace/db", "run", "push-force"], {
    cwd: REPOSITORY_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  await initializeRelevantStartupSchema();
}

async function insertFixtureUsers(client: import("pg").Client): Promise<void> {
  await client.query(
    `INSERT INTO users (id, email, first_name, approved, account_status, member_type)
     VALUES ($1,$2,'Owner',true,'active','beta'),
            ($3,$4,'Contact',true,'active','beta'),
            ($5,$6,'Contact',true,'active','beta'),
            ($7,$8,'Outside',true,'active','beta'),
            ($9,$10,'Reporter',true,'active','beta'),
            ($11,$12,'Reviewer',true,'active','beta')`,
    [
      OWNER, "owner@example.test", CONTACT, "contact@example.test",
      UNCONSENTED_CONTACT, "unconsented@example.test", OUTSIDER, "outsider@example.test",
      REPORTER, "reporter@example.test", REVIEWER, "reviewer@example.test",
    ],
  );
}

async function initialPhase(databaseUrl: string): Promise<void> {
  setSafetyEnvironment(databaseUrl);
  await initializeCurrentDatabase(databaseUrl);
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  let applicationPool: { end(): Promise<void> } | null = null;
  try {
    await insertFixtureUsers(client);
    const app = await buildCurrentSafetyApp();
    const shareId = await createAcceptedShare(app, CONTACT, "Trusted contact");
    await createAcceptedShare(app, UNCONSENTED_CONTACT, "Non-consented contact");

    const consent = await request(app)
      .put(`/safety/family-impact/consents/${shareId}`)
      .set(as(OWNER))
      .send({ enabled: true, locationScope: "active_temporary_location_only", consentVersion: "family-impact-v1" });
    assert(consent.status === 200 && consent.body.enabled === true, "Family Impact requires separate per-contact consent");

    const live = await request(app)
      .post("/safety/location-shares")
      .set(as(OWNER))
      .send({ recipientTrustedShareId: shareId, label: "Temporary reconciliation session", durationMinutes: 30, liveLocationConsent: true });
    assert(live.status === 201 && live.body.share?.shareToken, "accepted trusted contact must receive an explicit temporary foreground session");
    const token = String(live.body.share.shareToken);
    const update = await request(app)
      .patch(`/safety/location-shares/${token}/update`)
      .set(as(OWNER))
      .send({ lat: 39.9526123, lng: -75.1652123 });
    assert(update.status === 200 && update.body.coordinateState === "published", "foreground location update must use the current route");
    const contactRead = await request(app).get(`/safety/location-shares/${token}/view`).set(as(CONTACT));
    assert(contactRead.status === 200 && contactRead.body.share?.coordinateState === "current", "accepted recipient must read only a current minimized location");
    assert(!Object.hasOwn(contactRead.body.share, "lastUpdatedAt"), "recipient view must omit update timestamps");
    assert((await request(app).get(`/safety/location-shares/${token}/view`)).status === 401, "a bearer value must not grant public location access");
    assert((await request(app).get(`/safety/location-shares/${token}/view`).set(as(OUTSIDER))).status === 403, "unrelated members must not read live location");
    assert((await request(app).get(`/safety/location-shares/public/${token}`)).status === 404, "retired public location-link variants must remain unavailable");
    assert((await request(app).get("/community-alerts/nearby")).status === 410, "retired proximity alerts must remain unavailable");
    assert((await request(app).get("/community-alerts")).status === 410, "retired community-alert routes must remain unavailable");

    await client.query(
      "UPDATE trusted_safety_shares SET created_at = NOW() - INTERVAL '6 months', activated_at = NOW() - INTERVAL '6 months' WHERE id = $1",
      [shareId],
    );
    await client.query(
      "UPDATE family_impact_consents SET consented_at = NOW() - INTERVAL '6 months', expires_at = NOW() + INTERVAL '6 months' WHERE trusted_share_id = $1",
      [shareId],
    );
    await ingest(app, CURRENT_EVENT);
    const currentImpact = await request(app).get(`/safety/family-impact/events/${CURRENT_EVENT}/impact`).set(as(CONTACT));
    assert(currentImpact.status === 200 && currentImpact.body.impact === "potentially_affected", "active temporary sharing may produce only a coarse impact classification");
    assert(!/latitude|longitude|updated/i.test(JSON.stringify(currentImpact.body)), "Family Impact responses must not disclose coordinates or timestamps");

    const { dispatchFamilyImpactEvent } = await import("../safety/familyImpactDispatch");
    await ingest(app, RETRY_EVENT);
    const retry = await dispatchFamilyImpactEvent(RETRY_EVENT, { enableDelivery: true, provider: { send: async () => "retryable_failure" } });
    assert(retry.eligibleRelationships === 1 && retry.retryScheduled === 1, "only an individually consented contact may receive a retry-scheduled event");
    await ingest(app, REJECTED_EVENT);
    const rejected = await dispatchFamilyImpactEvent(REJECTED_EVENT, { enableDelivery: true, provider: { send: async () => "provider_rejected" } });
    assert(rejected.eligibleRelationships === 1, "provider rejection must not include an unconsented contact");
    await ingest(app, CANCELLED_EVENT);
    const cancelable = await dispatchFamilyImpactEvent(CANCELLED_EVENT, { enableDelivery: true, provider: { send: async () => "retryable_failure" } });
    assert(cancelable.retryScheduled === 1, "cancellable event must retain its pending audit state");
    const unconsentedAudit = await client.query(
      `SELECT COUNT(*)::int AS count FROM family_impact_delivery_attempts WHERE contact_user_id = $1`,
      [UNCONSENTED_CONTACT],
    );
    assert(count(unconsentedAudit.rows[0]?.count) === 0, "no Family Impact delivery record may exist without individual consent");
    await client.query("UPDATE location_shares SET expires_at = NOW() - INTERVAL '1 minute' WHERE share_token = $1", [token]);

    const { pool } = await import("@workspace/db");
    applicationPool = pool;
    await applicationPool.end();
    applicationPool = null;
    const childOutput = shell("pnpm", ["exec", "tsx", "src/scripts/safetyReliabilityReconciliationIntegration.ts", "--restart"], {
      cwd: API_DIRECTORY,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    assert(childOutput.includes('"result":"PASS"'), "restart phase must complete the Safety reliability reconciliation");
    console.log(JSON.stringify({ result: "PASS", database: "fresh disposable PostgreSQL", migrationPath: "Drizzle initialization plus current additive Safety registry", restart: "verified", realDelivery: false }));
  } finally {
    if (applicationPool) await applicationPool.end().catch(() => undefined);
    await client.end();
  }
}

async function restartPhase(databaseUrl: string): Promise<void> {
  setSafetyEnvironment(databaseUrl);
  await initializeRelevantStartupSchema();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const { pool } = await import("@workspace/db");
  try {
    const app = await buildCurrentSafetyApp();
    const shares = await request(app).get("/safety/trusted-shares").set(as(OWNER));
    assert(shares.status === 200 && shares.body.shares?.some((share: { status?: string }) => share.status === "active"), "six-month trusted-contact authorization must survive restart");
    const consents = await request(app).get("/safety/family-impact/consents").set(as(OWNER));
    assert(consents.status === 200 && consents.body.consents?.some((consent: { enabled?: boolean }) => consent.enabled === true), "six-month Family Impact consent must survive restart");
    const expiredImpact = await request(app).get(`/safety/family-impact/events/${CURRENT_EVENT}/impact`).set(as(CONTACT));
    assert(expiredImpact.status === 200 && expiredImpact.body.impact === "location_unknown", "expired or absent location must return LOCATION UNKNOWN");
    const scrubbed = await client.query("SELECT is_active, current_lat, current_lng FROM location_shares WHERE sharer_id = $1", [OWNER]);
    assert(scrubbed.rows.every((row) => row.is_active === false && row.current_lat === null && row.current_lng === null), "restart cleanup must expire and scrub only temporary coordinates");

    const { dispatchFamilyImpactEvent } = await import("../safety/familyImpactDispatch");
    let prematureCalls = 0;
    const notDue = await dispatchFamilyImpactEvent(RETRY_EVENT, { enableDelivery: true, provider: { send: async () => { prematureCalls += 1; return "provider_accepted"; } } });
    assert(notDue.skipped === 1 && prematureCalls === 0, "persisted retry must not dispatch before its due time after restart");
    await client.query(`UPDATE family_impact_delivery_attempts SET next_retry_at = NOW() - INTERVAL '1 second'
      WHERE event_id = (SELECT id FROM family_impact_events WHERE source_event_id = $1)`, [RETRY_EVENT]);
    const due = await dispatchFamilyImpactEvent(RETRY_EVENT, { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(due.providerAccepted === 1, "due retry must recover after restart");
    const rejectedFallback = await client.query(
      `SELECT COUNT(*)::int AS count FROM family_impact_delivery_attempts attempt
       JOIN family_impact_events event ON event.id = attempt.event_id
       JOIN notifications notice ON notice.id = attempt.in_app_notification_id
       WHERE event.source_event_id = $1 AND attempt.delivery_state = 'provider_rejected'`,
      [REJECTED_EVENT],
    );
    assert(count(rejectedFallback.rows[0]?.count) === 1, "provider rejection must retain one durable in-app fallback after restart");

    const cancellation = await request(app)
      .post(`/internal/safety/family-impact/events/${CANCELLED_EVENT}/cancel`)
      .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!);
    assert(cancellation.status === 200 && cancellation.body.delivery === "disabled", "event cancellation remains delivery-disabled");
    const cancelledAudit = await client.query(
      `SELECT delivery_state FROM family_impact_delivery_attempts WHERE event_id = (SELECT id FROM family_impact_events WHERE source_event_id = $1)`,
      [CANCELLED_EVENT],
    );
    assert(cancelledAudit.rows[0]?.delivery_state === "cancelled", "cancellation must persist a truthful audit state");
    assert((await request(app).get(`/safety/family-impact/events/${CANCELLED_EVENT}/impact`).set(as(CONTACT))).status === 404, "cancelled event must not expose impact");

    const shareId = String(shares.body.shares.find((share: { contact_user_id?: string }) => share.contact_user_id === CONTACT)?.id ?? "");
    assert(shareId, "primary trusted relationship must remain addressable after restart");
    const paused = await request(app).patch(`/safety/trusted-shares/${shareId}/pause`).set(as(OWNER)).send({ pause: true });
    assert(paused.status === 200 && paused.body.share?.status === "paused_manual", "owner pause must immediately remove alert eligibility");
    await ingest(app, "reconcile-paused");
    const pausedDispatch = await dispatchFamilyImpactEvent("reconcile-paused", { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(pausedDispatch.eligibleRelationships === 0, "paused relationship must receive no Family Impact alert");
    const resumed = await request(app).patch(`/safety/trusted-shares/${shareId}/pause`).set(as(OWNER)).send({ pause: false });
    assert(resumed.status === 200 && resumed.body.share?.status === "active", "durable relationship may resume without reviving an expired location session");

    await client.query("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1,$2)", [OWNER, CONTACT]);
    await ingest(app, "reconcile-blocked");
    const blocked = await dispatchFamilyImpactEvent("reconcile-blocked", { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(blocked.eligibleRelationships === 0, "a new block must immediately remove Family Impact eligibility");
    await client.query("DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2", [OWNER, CONTACT]);

    const revokeConsent = await request(app).put(`/safety/family-impact/consents/${shareId}`).set(as(OWNER)).send({ enabled: false });
    assert(revokeConsent.status === 200 && revokeConsent.body.enabled === false, "individual Family Impact consent must be revocable");
    await ingest(app, "reconcile-revoked-consent");
    const revokedDispatch = await dispatchFamilyImpactEvent("reconcile-revoked-consent", { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(revokedDispatch.eligibleRelationships === 0, "revoked individual consent must prevent all further dispatch");
    const unconsentedOrRevoked = await client.query(
      `SELECT COUNT(*)::int AS count FROM family_impact_delivery_attempts attempt
       JOIN family_impact_events event ON event.id = attempt.event_id
       WHERE event.source_event_id = $1`,
      ["reconcile-revoked-consent"],
    );
    assert(count(unconsentedOrRevoked.rows[0]?.count) === 0, "no alert audit may be created after consent revocation");

    await client.query(
      `INSERT INTO safety_serious_credible_threat_fixture_reviewers (user_id, scope, expires_at)
       VALUES ($1,'isolated_staging_validation',NOW() + INTERVAL '10 minutes')`,
      [REVIEWER],
    );
    const notificationsBefore = await client.query("SELECT COUNT(*)::int AS count FROM notifications");
    const seriousReport = await request(app).post("/safety/serious-credible-threats/reports").set(as(REPORTER)).send({
      category: "imminent_violence",
      consent: { privateReview: true, anonymousCityLevelNotice: true },
      // Use a normal state abbreviation: the policy correctly rejects "ST" as
      // potentially street-like text rather than accepting a made-up region.
      area: { city: "Fixtureville", region: "PA" },
    });
    assert(seriousReport.status === 202 && seriousReport.body.reportId, "authorized serious-threat intake must remain private review only");
    const approval = await request(app)
      .patch(`/moderation/serious-credible-threats/reviews/${encodeURIComponent(String(seriousReport.body.reportId))}`)
      .set(as(REVIEWER))
      .send({
        decision: "approved",
        evidence: [
          { referenceId: "source-one", kind: "official_public_safety_source", independentlyVerified: true, verifiedAt: new Date(Date.now() - 60_000).toISOString() },
          { referenceId: "source-two", kind: "trusted_organization", independentlyVerified: true, verifiedAt: new Date(Date.now() - 60_000).toISOString() },
        ],
        publicSummary: "Follow official public-safety guidance.",
        requestedExpiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      });
    assert(approval.status === 200 && approval.body.privateDecision?.publicationState === "not_published", "review approval must not publish or deliver a serious-threat notice");
    const notificationsAfter = await client.query("SELECT COUNT(*)::int AS count FROM notifications");
    const threatDeliveryRows = await client.query("SELECT COUNT(*)::int AS count FROM trusted_safety_alert_log");
    assert(count(notificationsAfter.rows[0]?.count) === count(notificationsBefore.rows[0]?.count) && count(threatDeliveryRows.rows[0]?.count) === 0, "serious-threat review must not reach a Family Impact or trusted-contact delivery path");

    const revokeRelationship = await request(app).delete(`/safety/trusted-shares/${shareId}`).set(as(OWNER));
    assert(revokeRelationship.status === 200, "trusted relationship revocation must remain available after restart");
    assert((await request(app).get(`/safety/family-impact/events/${CURRENT_EVENT}/impact`).set(as(CONTACT))).status === 404, "revoked trusted relationship must lose future Family Impact access");
    console.log(JSON.stringify({ result: "PASS", checks: ["current approved sharing", "retired route denial", "additive migration restart", "durable six-month authorization", "location unknown", "retry and fallback", "pause block and revocation", "review-only serious threat", "individual consent"] }));
  } finally {
    await pool.end();
    await client.end();
  }
}

async function main(): Promise<void> {
  if (RESTART_PHASE) {
    assert(process.env.DATABASE_URL, "restart phase requires its disposable database URL");
    await restartPhase(process.env.DATABASE_URL);
    return;
  }
  const directory = mkdtempSync(join(tmpdir(), "mwm-safety-reconciliation-"));
  const socketDirectory = join(directory, "socket");
  const databaseUrl = `postgresql://postgres@127.0.0.1:${PORT}/postgres`;
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  // pg_ctl forks PostgreSQL. Its inherited stdout pipe would keep execFileSync
  // open after the daemon starts, so this process deliberately has no captured
  // stdio while pg_ctl waits for readiness.
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${PORT} -k ${socketDirectory}`, "-w", "start"], { stdio: "ignore" });
  try {
    await initialPhase(databaseUrl);
  } finally {
    try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"], { stdio: "ignore" }); } catch { /* cleanup only */ }
    rmSync(directory, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Safety reliability reconciliation failed");
  process.exitCode = 1;
});
