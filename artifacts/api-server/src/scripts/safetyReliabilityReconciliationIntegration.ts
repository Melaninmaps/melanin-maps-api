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
const REPORTER_TWO = "safety-reconcile-reporter-two";
const REPORTER_THREE = "safety-reconcile-reporter-three";
const REVIEWER = "safety-reconcile-reviewer";

const CURRENT_EVENT = "reconcile-current";
const PERSISTENT_EVENT = "reconcile-persistent";
const RETRY_EVENT = "reconcile-retry";
const REJECTED_EVENT = "reconcile-rejected";
const CANCELLED_EVENT = "reconcile-cancelled";
const STAGING_BRIDGE_EVENT = "fixture-family-impact-local-validation-0001";
const STAGING_VIOLENCE_EVENT = "fixture-family-impact-local-violence-0001";

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
    SAFETY_PERSISTENT_LOCATION_COLLECTION_ENABLED: "true",
    SAFETY_PERSISTENT_LOCATION_MAX_AGE_SECONDS: "600",
    MWM_PERSISTENT_SAFETY_LOCATION_ENCRYPTION_KEYS: `v1:${Buffer.alloc(32, 29).toString("base64")}`,
    KINFOLK_MEMORY_STAGING_ISOLATION: "true",
    KINFOLK_SERIOUS_THREAT_PRIVATE_REVIEW_STAGING_ENABLED: "true",
    RAILWAY_ENVIRONMENT_NAME: "staging",
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
    { default: persistentSafetyLocationRouter },
    { default: communityAlertsRouter },
    { default: seriousThreatRouter },
    { default: seriousThreatReviewerRouter },
  ] = await Promise.all([
    import("../routes/location-shares"),
    import("../routes/trusted-safety-share"),
    import("../routes/family-impact-intelligence"),
    import("../routes/persistent-safety-location"),
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
  app.use(persistentSafetyLocationRouter);
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
            ($11,$12,'Reporter',true,'active','beta'),
            ($13,$14,'Reporter',true,'active','beta'),
            ($15,$16,'Reviewer',true,'active','beta')`,
    [
      OWNER, "kinfolk-safety-contact-family-impact-local-owner@example.test", CONTACT, "kinfolk-safety-contact-family-impact-local-contact@example.test",
      UNCONSENTED_CONTACT, "kinfolk-safety-contact-family-impact-local-unconsented@example.test", OUTSIDER, "kinfolk-safety-contact-family-impact-local-outsider@example.test",
      REPORTER, "kinfolk-safety-contact-family-impact-local-reporter-one@example.test", REPORTER_TWO, "kinfolk-safety-contact-family-impact-local-reporter-two@example.test",
      REPORTER_THREE, "kinfolk-safety-contact-family-impact-local-reporter-three@example.test", REVIEWER, "kinfolk-safety-contact-family-impact-local-reviewer@example.test",
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
    const unconsentedShareId = await createAcceptedShare(app, UNCONSENTED_CONTACT, "Non-consented contact");

    const initialPersistent = await request(app).get("/safety/persistent-location").set(as(OWNER));
    assert(initialPersistent.status === 200 && initialPersistent.body.enabled === false && initialPersistent.body.available === true, `Persistent Safety Location must require a new, disabled-by-default member consent (status ${initialPersistent.status})`);
    const persistentConsent = await request(app)
      .put("/safety/persistent-location/consent")
      .set(as(OWNER))
      .send({
        enabled: true,
        consentVersion: "mwm-persistent-safety-location-v1",
        disclosureAcknowledged: true,
        backgroundOptIn: true,
        foregroundPermission: "granted",
        backgroundPermission: "granted",
      });
    assert(persistentConsent.status === 200 && persistentConsent.body.enabled === true && persistentConsent.body.backgroundOptIn === true, "Persistent Safety Location requires its own explicit primary and background consent");
    const contactsBeforeConsent = await request(app).get("/safety/persistent-location/contacts").set(as(OWNER));
    assert(contactsBeforeConsent.status === 200 && contactsBeforeConsent.body.contacts?.some((contact: { trustedShareId?: string; allowedForEmergencyImpact?: boolean }) => contact.trustedShareId === shareId && contact.allowedForEmergencyImpact === false), "trusted-contact emergency disclosure must begin disabled even when a contact is accepted");
    const persistentContactConsent = await request(app)
      .put(`/safety/persistent-location/contacts/${shareId}`)
      .set(as(OWNER))
      .send({ enabled: true, consentVersion: "mwm-persistent-safety-location-family-impact-v1" });
    assert(persistentContactConsent.status === 200 && persistentContactConsent.body.enabled === true, "Persistent Safety Location requires separate per-contact emergency disclosure consent");
    const unconsentedPersistentContact = await request(app).get("/safety/persistent-location/contacts").set(as(OWNER));
    assert(unconsentedPersistentContact.status === 200 && unconsentedPersistentContact.body.contacts?.some((contact: { trustedShareId?: string; allowedForEmergencyImpact?: boolean }) => contact.trustedShareId === unconsentedShareId && contact.allowedForEmergencyImpact === false), "unselected trusted contacts must not inherit persistent emergency disclosure consent");
    const firstPersistentFix = await request(app)
      .post("/safety/persistent-location/fix")
      .set(as(OWNER))
      .send({
        location: { latitude: 39.9526123, longitude: -75.1652123, capturedAt: new Date().toISOString(), accuracyMeters: 18, platform: "ios", background: true },
        foregroundPermission: "granted", backgroundPermission: "granted",
      });
    assert(firstPersistentFix.status === 202 && firstPersistentFix.body.accepted === true, "an explicitly authorized encrypted current location must be accepted without a contact map grant");
    const persistentStatus = await request(app).get("/safety/persistent-location").set(as(OWNER));
    assert(persistentStatus.status === 200 && persistentStatus.body.locationState === "current" && !/latitude|longitude|encrypted|payload/i.test(JSON.stringify(persistentStatus.body)), "member settings may show only private freshness metadata, never raw coordinates or ciphertext");
    const outsiderPersistentWrite = await request(app)
      .post("/safety/persistent-location/fix")
      .set(as(OUTSIDER))
      .send({ location: { latitude: 39.9526123, longitude: -75.1652123, capturedAt: new Date().toISOString(), accuracyMeters: 18, platform: "ios", background: true }, foregroundPermission: "granted", backgroundPermission: "granted" });
    assert(outsiderPersistentWrite.status === 409, "another authenticated member cannot create or overwrite an owner’s persistent Safety Location");
    const pausePersistent = await request(app).patch("/safety/persistent-location/pause").set(as(OWNER)).send({ paused: true });
    assert(pausePersistent.status === 200 && pausePersistent.body.paused === true, "member pause must stop persistent protection without revoking the underlying consent");
    const pausedPersistentStatus = await request(app).get("/safety/persistent-location").set(as(OWNER));
    assert(pausedPersistentStatus.status === 200 && pausedPersistentStatus.body.locationState === "unavailable", "pause must immediately delete the current precise location");
    const resumePersistent = await request(app).patch("/safety/persistent-location/pause").set(as(OWNER)).send({ paused: false });
    assert(resumePersistent.status === 200 && resumePersistent.body.paused === false, "member resume must remain explicit and never invent a prior location");
    const resumedPersistentFix = await request(app)
      .post("/safety/persistent-location/fix")
      .set(as(OWNER))
      .send({
        location: { latitude: 39.9526123, longitude: -75.1652123, capturedAt: new Date().toISOString(), accuracyMeters: 18, platform: "ios", background: true },
        foregroundPermission: "granted", backgroundPermission: "granted",
      });
    assert(resumedPersistentFix.status === 202, "resume must require a new device update rather than revive deleted location data");

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
    await client.query(
      "UPDATE mwm_persistent_safety_location_authorizations SET consented_at = NOW() - INTERVAL '6 months' WHERE owner_id = $1",
      [OWNER],
    );
    await client.query(
      "UPDATE mwm_persistent_safety_location_contact_consents SET consented_at = NOW() - INTERVAL '6 months' WHERE owner_id = $1 AND trusted_share_id = $2",
      [OWNER, shareId],
    );
    await ingest(app, CURRENT_EVENT);
    const currentImpact = await request(app).get(`/safety/family-impact/events/${CURRENT_EVENT}/impact`).set(as(CONTACT));
    assert(currentImpact.status === 200 && currentImpact.body.impact === "potentially_affected", "active temporary sharing may produce only a coarse impact classification");
    assert(!/latitude|longitude|updated/i.test(JSON.stringify(currentImpact.body)), "Family Impact responses must not disclose coordinates or timestamps");
    await ingest(app, PERSISTENT_EVENT);
    const persistentImpact = await request(app).get(`/safety/family-impact/events/${PERSISTENT_EVENT}/impact`).set(as(CONTACT));
    assert(persistentImpact.status === 200 && persistentImpact.body.impact === "potentially_affected" && !/latitude|longitude|updated/i.test(JSON.stringify(persistentImpact.body)), "persistent MWM-only location may produce only a coarse, separately consented emergency classification");

    const bridgeBody = { ...eventBody(STAGING_BRIDGE_EVENT), sourceEventId: STAGING_BRIDGE_EVENT };
    const bridgeDenied = await request(app).post("/internal/safety/family-impact/staging-validation/events").send(bridgeBody);
    assert(bridgeDenied.status === 404, "synthetic dispatch bridge must be unavailable without the isolated staging fixture gate");
    const bridgeEvent = await request(app)
      .post("/internal/safety/family-impact/staging-validation/events")
      .set("x-kinfolk-staging-fixture", "enable")
      .send(bridgeBody);
    assert(bridgeEvent.status === 202 && bridgeEvent.body.delivery === "disabled", "synthetic staging intake must retain default-off delivery");
    const bridgeDispatch = await request(app)
      .post(`/internal/safety/family-impact/staging-validation/events/${STAGING_BRIDGE_EVENT}/dispatch`)
      .set("x-kinfolk-staging-fixture", "enable")
      .send({ outcome: "provider_rejected" });
    assert(bridgeDispatch.status === 200 && bridgeDispatch.body.provider === "fake_no_device_delivery" && bridgeDispatch.body.result?.providerAccepted === 0, "staging bridge must use only the in-process fake provider");
    const bridgeStatus = await request(app)
      .get(`/internal/safety/family-impact/staging-validation/events/${STAGING_BRIDGE_EVENT}/status`)
      .set("x-kinfolk-staging-fixture", "enable");
    assert(bridgeStatus.status === 200 && bridgeStatus.body.attempts?.length === 1 && bridgeStatus.body.attempts[0]?.hasInAppAlert === true && bridgeStatus.body.attempts[0]?.deliveryState === "provider_rejected", "fake provider rejection must preserve one durable in-app fallback without a device-delivery claim");
    const bridgeCleanup = await request(app)
      .delete(`/internal/safety/family-impact/staging-validation/events/${STAGING_BRIDGE_EVENT}`)
      .set("x-kinfolk-staging-fixture", "enable");
    assert(bridgeCleanup.status === 200 && bridgeCleanup.body.removed === 1, "synthetic bridge cleanup must delete only its own fixture event and dependent audit rows");
    const reviewedViolence = await request(app)
      .post("/internal/safety/family-impact/staging-validation/reviewed-violence-events")
      .set("x-kinfolk-staging-fixture", "enable")
      .send({ ...eventBody(STAGING_VIOLENCE_EVENT), sourceEventId: STAGING_VIOLENCE_EVENT });
    assert(reviewedViolence.status === 202 && reviewedViolence.body.delivery === "disabled", "synthetic violence event creation must remain delivery-disabled");
    for (const reporter of [REPORTER, REPORTER_TWO, REPORTER_THREE]) {
      const report = await request(app).post(`/safety/family-impact/violence-reports/${STAGING_VIOLENCE_EVENT}`).set(as(reporter)).send({});
      assert(report.status === 201 && report.body.notificationQueued === false, "independent synthetic violence reports must remain review-only");
    }
    const bridgeReviewerDenied = await request(app)
      .post(`/internal/safety/family-impact/staging-validation/events/${STAGING_VIOLENCE_EVENT}/review`)
      .set("x-kinfolk-staging-fixture", "enable")
      .send({ reviewerId: OUTSIDER });
    assert(bridgeReviewerDenied.status === 403, "only the designated synthetic reviewer may approve the review-only incident");
    const bridgeReviewed = await request(app)
      .post(`/internal/safety/family-impact/staging-validation/events/${STAGING_VIOLENCE_EVENT}/review`)
      .set("x-kinfolk-staging-fixture", "enable")
      .send({ reviewerId: REVIEWER });
    assert(bridgeReviewed.status === 200 && bridgeReviewed.body.delivery === "disabled", "qualified synthetic review must not enable a serious-threat delivery path");
    const bridgeThreatDispatch = await request(app)
      .post(`/internal/safety/family-impact/staging-validation/events/${STAGING_VIOLENCE_EVENT}/dispatch`)
      .set("x-kinfolk-staging-fixture", "enable")
      .send({ outcome: "provider_accepted" });
    assert(bridgeThreatDispatch.status === 409, "reviewed violence must not bypass the disabled delivery gate");
    const bridgeViolenceCleanup = await request(app)
      .delete(`/internal/safety/family-impact/staging-validation/events/${STAGING_VIOLENCE_EVENT}`)
      .set("x-kinfolk-staging-fixture", "enable");
    assert(bridgeViolenceCleanup.status === 200 && bridgeViolenceCleanup.body.removed === 1, "review-only synthetic incident must be removable with all dependent reports");

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
    const persistentAfterRestart = await request(app).get("/safety/persistent-location").set(as(OWNER));
    assert(persistentAfterRestart.status === 200 && persistentAfterRestart.body.enabled === true && persistentAfterRestart.body.locationState === "current", "six-month Persistent Safety Location authorization and its current encrypted fix must survive application restart");
    const persistentContactsAfterRestart = await request(app).get("/safety/persistent-location/contacts").set(as(OWNER));
    assert(persistentContactsAfterRestart.status === 200 && persistentContactsAfterRestart.body.contacts?.some((contact: { trustedShareId?: string; allowedForEmergencyImpact?: boolean }) => contact.trustedShareId && contact.allowedForEmergencyImpact === true), "separate six-month per-contact persistent emergency consent must survive restart");
    const persistedShareId = String(persistentContactsAfterRestart.body.contacts?.find((contact: { allowedForEmergencyImpact?: boolean }) => contact.allowedForEmergencyImpact)?.trustedShareId ?? "");
    assert(persistedShareId, "persistent emergency consent must remain bound to the accepted contact after restart");
    const revokePersistentContact = await request(app)
      .put(`/safety/persistent-location/contacts/${persistedShareId}`)
      .set(as(OWNER))
      .send({ enabled: false });
    assert(revokePersistentContact.status === 200 && revokePersistentContact.body.enabled === false, "persistent emergency disclosure must be independently revocable after restart");
    const persistentContactsRevoked = await request(app).get("/safety/persistent-location/contacts").set(as(OWNER));
    assert(persistentContactsRevoked.status === 200 && persistentContactsRevoked.body.contacts?.some((contact: { trustedShareId?: string; allowedForEmergencyImpact?: boolean }) => contact.trustedShareId === persistedShareId && contact.allowedForEmergencyImpact === false), "per-contact revocation must not auto-reactivate after restart");
    const deletePersistentLocation = await request(app).delete("/safety/persistent-location/location").set(as(OWNER));
    assert(deletePersistentLocation.status === 200 && deletePersistentLocation.body.deleted === true, "member location deletion must be available without revoking all Safety settings");
    const expiredImpact = await request(app).get(`/safety/family-impact/events/${CURRENT_EVENT}/impact`).set(as(CONTACT));
    assert(expiredImpact.status === 200 && expiredImpact.body.impact === "location_unknown", "expired or absent location must return LOCATION UNKNOWN");
    const scrubbed = await client.query("SELECT is_active, current_lat, current_lng FROM location_shares WHERE sharer_id = $1", [OWNER]);
    assert(scrubbed.rows.every((row) => row.is_active === false && row.current_lat === null && row.current_lng === null), "restart cleanup must expire and scrub only temporary coordinates");

    const shareId = String(shares.body.shares.find((share: { contact_user_id?: string }) => share.contact_user_id === CONTACT)?.id ?? "");
    assert(shareId, "primary trusted relationship must remain addressable after restart");
    const restartedLive = await request(app)
      .post("/safety/location-shares")
      .set(as(OWNER))
      .send({ recipientTrustedShareId: shareId, label: "Fresh explicit reconciliation session", durationMinutes: 30, liveLocationConsent: true });
    assert(restartedLive.status === 201 && restartedLive.body.share?.shareToken, "an expired session must require a new explicit location authorization");
    const restartedUpdate = await request(app)
      .patch(`/safety/location-shares/${String(restartedLive.body.share.shareToken)}/update`)
      .set(as(OWNER))
      .send({ lat: 39.9526123, lng: -75.1652123 });
    assert(restartedUpdate.status === 200, "a new explicit session must accept only a foreground coordinate update");

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
    const restoreConsent = await request(app).put(`/safety/family-impact/consents/${shareId}`).set(as(OWNER)).send({ enabled: true, locationScope: "active_temporary_location_only", consentVersion: "family-impact-v1" });
    assert(restoreConsent.status === 200 && restoreConsent.body.enabled === true, "the owner may explicitly restore individual Family Impact consent before testing revocation");
    const revocationLive = await request(app)
      .post("/safety/location-shares")
      .set(as(OWNER))
      .send({ recipientTrustedShareId: shareId, label: "Revocation retry session", durationMinutes: 30, liveLocationConsent: true });
    assert(revocationLive.status === 201 && revocationLive.body.share?.shareToken, "a fresh foreground session is required before a later potential-impact retry");
    const revocationUpdate = await request(app)
      .patch(`/safety/location-shares/${String(revocationLive.body.share.shareToken)}/update`)
      .set(as(OWNER))
      .send({ lat: 39.9526123, lng: -75.1652123 });
    assert(revocationUpdate.status === 200, "the explicit revocation test session must have a current foreground coordinate");
    await ingest(app, "reconcile-revoked-before-retry");
    const scheduledBeforeRevocation = await dispatchFamilyImpactEvent("reconcile-revoked-before-retry", { enableDelivery: true, provider: { send: async () => "retryable_failure" } });
    assert(scheduledBeforeRevocation.retryScheduled === 1, "a potential-impact provider outage must persist one bounded retry before relationship revocation");
    const revokeRelationship = await request(app).delete(`/safety/trusted-shares/${shareId}`).set(as(OWNER));
    assert(revokeRelationship.status === 200, "trusted relationship revocation must remain available after restart");
    let callsAfterRevocation = 0;
    const afterRevocation = await dispatchFamilyImpactEvent("reconcile-revoked-before-retry", { enableDelivery: true, provider: { send: async () => { callsAfterRevocation += 1; return "provider_accepted"; } } });
    assert(afterRevocation.eligibleRelationships === 0 && callsAfterRevocation === 0, "relationship revocation must be rechecked before every persisted retry");
    const cancelledForRevocation = await client.query<{ delivery_state: string }>(
      `SELECT attempt.delivery_state FROM family_impact_delivery_attempts attempt
       JOIN family_impact_events event ON event.id = attempt.event_id
       WHERE event.source_event_id = 'reconcile-revoked-before-retry'`,
    );
    assert(cancelledForRevocation.rows[0]?.delivery_state === "cancelled", "a retry invalidated by relationship revocation must record a terminal cancellation");

    const revokePersistentConsent = await request(app).delete("/safety/persistent-location/consent").set(as(OWNER));
    assert(revokePersistentConsent.status === 200 && revokePersistentConsent.body.revoked === true && revokePersistentConsent.body.locationDeleted === true, "member revocation must immediately stop persistent collection and delete current data");
    const revokedPersistentStatus = await request(app).get("/safety/persistent-location").set(as(OWNER));
    assert(revokedPersistentStatus.status === 200 && revokedPersistentStatus.body.enabled === false && revokedPersistentStatus.body.locationState === "unavailable", "revoked persistent consent must never auto-reactivate or retain a current fix");
    const rejectedAfterPersistentRevoke = await request(app)
      .post("/safety/persistent-location/fix")
      .set(as(OWNER))
      .send({ location: { latitude: 39.9526123, longitude: -75.1652123, capturedAt: new Date().toISOString(), accuracyMeters: 18, platform: "ios", background: true }, foregroundPermission: "granted", backgroundPermission: "granted" });
    assert(rejectedAfterPersistentRevoke.status === 409, "revoked Persistent Safety Location consent must block new collection immediately");

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
