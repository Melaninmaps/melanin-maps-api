import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");
const PG_BIN = "/usr/lib/postgresql/16/bin";
const port = 55517;
const directory = mkdtempSync(join(tmpdir(), "mwm-family-impact-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void { execFileSync(command, args, { stdio: "ignore" }); }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const OWNER = "impact-owner";
const CONTACT = "impact-contact";
const CONTACT_TWO = "impact-contact-two";
const OUTSIDER = "impact-outsider";
const REPORTER_ONE = "impact-reporter-1";
const REPORTER_TWO = "impact-reporter-2";
const REPORTER_THREE = "impact-reporter-3";
const REVIEWER = "impact-reviewer";

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;
  process.env.FAMILY_IMPACT_INGEST_SECRET = "local-family-impact-ingest-secret";
  process.env.FAMILY_IMPACT_REVIEWER_IDS = REVIEWER;
  process.env.SAFETY_FAMILY_IMPACT_DELIVERY_ENABLED = "false";
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (id varchar PRIMARY KEY, email varchar, first_name varchar, approved boolean NOT NULL DEFAULT true, account_status varchar NOT NULL DEFAULT 'active');
      CREATE TABLE user_blocks (id serial PRIMARY KEY, blocker_id varchar NOT NULL, blocked_id varchar NOT NULL);
      CREATE TABLE trusted_safety_shares (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id varchar NOT NULL, contact_type varchar NOT NULL, contact_user_id varchar,
        contact_name varchar NOT NULL, owner_enabled boolean NOT NULL DEFAULT true, contact_accepted boolean NOT NULL DEFAULT false,
        status varchar NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE location_shares (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sharer_id varchar NOT NULL, recipient_user_id varchar, current_lat double precision,
        current_lng double precision, last_updated_at timestamptz, expires_at timestamptz NOT NULL, is_active boolean NOT NULL DEFAULT true
      );
      CREATE TABLE notifications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id varchar NOT NULL, type varchar NOT NULL, title varchar NOT NULL,
        body text NOT NULL, entity_id varchar, entity_type varchar, data jsonb, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE family_impact_consents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id varchar NOT NULL, trusted_share_id uuid NOT NULL, location_scope varchar NOT NULL,
        consent_version varchar NOT NULL, consented_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
        revoked_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id, trusted_share_id)
      );
      CREATE TABLE family_impact_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source varchar NOT NULL, source_event_id varchar NOT NULL, event_type varchar NOT NULL,
        status varchar NOT NULL DEFAULT 'active', boundary jsonb NOT NULL, general_area varchar NOT NULL, expires_at timestamptz NOT NULL,
        reviewer_approved_at timestamptz, reviewer_id varchar, withdrawn_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source, source_event_id)
      );
      CREATE TABLE family_impact_violence_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), incident_id uuid NOT NULL, reporter_id varchar NOT NULL, submitted_at timestamptz NOT NULL DEFAULT now(),
        abuse_state varchar NOT NULL DEFAULT 'accepted', UNIQUE(incident_id, reporter_id)
      );
      CREATE TABLE family_impact_delivery_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL, trusted_share_id uuid NOT NULL, owner_id varchar NOT NULL, contact_user_id varchar,
        impact_status varchar NOT NULL, delivery_state varchar NOT NULL DEFAULT 'queued', attempt_count integer NOT NULL DEFAULT 0, next_retry_at timestamptz,
        in_app_notification_id varchar, acknowledged_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id, trusted_share_id)
      );
      CREATE TABLE family_impact_checkin_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL, trusted_share_id uuid NOT NULL, owner_id varchar NOT NULL,
        contact_user_id varchar NOT NULL, state varchar NOT NULL DEFAULT 'requested', requested_at timestamptz NOT NULL DEFAULT now(), responded_at timestamptz,
        expires_at timestamptz NOT NULL, UNIQUE(event_id, trusted_share_id)
      );
    `);
    await client.query(
      `INSERT INTO users (id,email,first_name,approved,account_status) VALUES
        ($1,'owner@example.test','Morgan',true,'active'),($2,'contact@example.test','Jordan',true,'active'),($3,'contact-two@example.test','Taylor',true,'active'),($4,'outsider@example.test','Outside',true,'active'),
        ($5,'reporter1@example.test','Reporter',true,'active'),($6,'reporter2@example.test','Reporter',true,'active'),($7,'reporter3@example.test','Reporter',true,'active'),($8,'reviewer@example.test','Reviewer',true,'active')`,
      [OWNER, CONTACT, CONTACT_TWO, OUTSIDER, REPORTER_ONE, REPORTER_TWO, REPORTER_THREE, REVIEWER],
    );
    const share = await client.query<{ id: string }>(
      `INSERT INTO trusted_safety_shares (owner_id, contact_type, contact_user_id, contact_name, owner_enabled, contact_accepted, status)
       VALUES ($1,'mwm_user',$2,'Jordan',true,true,'active') RETURNING id`, [OWNER, CONTACT]);
    const shareId = share.rows[0]!.id;
    const shareTwo = await client.query<{ id: string }>(
      `INSERT INTO trusted_safety_shares (owner_id, contact_type, contact_user_id, contact_name, owner_enabled, contact_accepted, status)
       VALUES ($1,'mwm_user',$2,'Taylor',true,true,'active') RETURNING id`, [OWNER, CONTACT_TWO]);
    const shareTwoId = shareTwo.rows[0]!.id;
    await client.query(
      `INSERT INTO location_shares (sharer_id, recipient_user_id, current_lat, current_lng, last_updated_at, expires_at, is_active)
       VALUES ($1,$2,39.9526,-75.1652,NOW(),NOW() + interval '30 minutes',true)`, [OWNER, CONTACT]);
    await client.query(
      `INSERT INTO location_shares (sharer_id, recipient_user_id, current_lat, current_lng, last_updated_at, expires_at, is_active)
       VALUES ($1,$2,39.90,-75.25,NOW(),NOW() + interval '30 minutes',true)`, [OWNER, CONTACT_TWO]);

    const { default: familyRouter } = await import("../routes/family-impact-intelligence");
    const { dispatchFamilyImpactEvent } = await import("../safety/familyImpactDispatch");
    const app = express(); app.use(express.json());
    app.use((req: any, _res: any, next: () => void) => {
      const id = String(req.header("x-qa-user") ?? "");
      req.user = id ? { id, email: `${id}@example.test` } : undefined;
      req.isAuthenticated = () => Boolean(req.user);
      req.log = { error: (value: { code?: unknown }) => console.error(`family-impact-route-error:${String(value.code ?? "unknown")}`) };
      next();
    });
    app.use(familyRouter);
    const as = (id: string) => ({ "x-qa-user": id });

    const consent = await request(app).put(`/safety/family-impact/consents/${shareId}`).set(as(OWNER)).send({ enabled: true, locationScope: "active_temporary_location_only", consentVersion: "family-impact-v1" });
    assert(consent.status === 200 && consent.body.enabled === true, "owner must explicitly enable a durable family-impact relationship");
    const consentTwo = await request(app).put(`/safety/family-impact/consents/${shareTwoId}`).set(as(OWNER)).send({ enabled: true, locationScope: "active_temporary_location_only", consentVersion: "family-impact-v1" });
    assert(consentTwo.status === 200 && consentTwo.body.enabled === true, "each trusted contact requires their own family-impact consent");
    const consentList = await request(app).get("/safety/family-impact/consents").set(as(OWNER));
    assert(consentList.status === 200 && consentList.body.consents?.[0]?.locationScope === "active_temporary_location_only", "consent list must disclose location scope without coordinates");
    await client.query("UPDATE trusted_safety_shares SET created_at = NOW() - interval '6 months' WHERE owner_id = $1", [OWNER]);
    await client.query("UPDATE family_impact_consents SET consented_at = NOW() - interval '6 months', expires_at = NOW() + interval '6 months' WHERE owner_id = $1", [OWNER]);

    const event = await request(app).post("/internal/safety/family-impact/events")
      .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!)
      .send({ source: "nws", sourceEventId: "nws-local-1", eventType: "severe_weather", generalArea: "Philadelphia, PA", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(), boundary: { kind: "polygon", coordinates: [[-75.18,39.94],[-75.14,39.94],[-75.14,39.97],[-75.18,39.97]], uncertaintyMeters: 50 } });
    assert(event.status === 202 && event.body.delivery === "disabled", "authoritative event ingestion must remain delivery-disabled by default");

    const providerRecipients: string[] = [];
    const dispatched = await dispatchFamilyImpactEvent("nws-local-1", { enableDelivery: true, provider: { send: async ({ recipientUserId }) => { providerRecipients.push(recipientUserId); return "provider_accepted"; } } });
    assert(dispatched.potential === 1 && dispatched.outside === 1 && dispatched.providerAccepted === 2 && providerRecipients.length === 2, "synthetic provider must process each authorized durable contact with its own impact state");
    const duplicate = await dispatchFamilyImpactEvent("nws-local-1", { enableDelivery: true, provider: { send: async ({ recipientUserId }) => { providerRecipients.push(recipientUserId); return "provider_accepted"; } } });
    assert(duplicate.skipped === 2 && providerRecipients.length === 2, "reprocessing the same event must not duplicate a provider handoff");
    const contactImpact = await request(app).get("/safety/family-impact/events/nws-local-1/impact").set(as(CONTACT));
    assert(contactImpact.status === 200 && contactImpact.body.impact === "potentially_affected", "authorized contact must receive a coarse potential-impact result");
    assert(!JSON.stringify(contactImpact.body).match(/39\.95|75\.16|lastUpdated|latitude|longitude/i), "impact API must never expose coordinates or location timestamps");
    const outsiderImpact = await request(app).get("/safety/family-impact/events/nws-local-1/impact").set(as(OUTSIDER));
    assert(outsiderImpact.status === 404, "unrelated members must not read family impact");

    const requestCheckin = await request(app).post("/safety/family-impact/check-in-requests").set(as(CONTACT)).send({ eventId: "nws-local-1", trustedShareId: shareId });
    assert(requestCheckin.status === 201, "authorized contact must be able to request an explicit safety check-in");
    const responseCheckin = await request(app).post(`/safety/family-impact/check-in-requests/${requestCheckin.body.requestId}/respond`).set(as(OWNER)).send({ response: "safe" });
    assert(responseCheckin.status === 200 && responseCheckin.body.state === "safe", "member must explicitly confirm safety rather than infer it from geography");
    const confirmed = await request(app).get("/safety/family-impact/events/nws-local-1/impact").set(as(CONTACT));
    assert(confirmed.body.impact === "member_confirmed_safety", "explicit response must supersede geographic classification");

    const retryEvent = await request(app).post("/internal/safety/family-impact/events")
      .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!)
      .send({ source: "nws", sourceEventId: "nws-retry-1", eventType: "severe_weather", generalArea: "Philadelphia, PA", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(), boundary: { kind: "polygon", coordinates: [[-75.18,39.94],[-75.14,39.94],[-75.14,39.97],[-75.18,39.97]] } });
    assert(retryEvent.status === 202, "retry fixture event must enter the default-disabled source boundary");
    const retryScheduled = await dispatchFamilyImpactEvent("nws-retry-1", { enableDelivery: true, provider: { send: async () => "retryable_failure" } });
    assert(retryScheduled.retryScheduled === 2, "temporary provider failure must persist a bounded retry for each authorized contact");
    const fallbackAfterFailure = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM family_impact_delivery_attempts attempt
         JOIN family_impact_events event ON event.id = attempt.event_id
         JOIN notifications notice ON notice.id = attempt.in_app_notification_id
        WHERE event.source_event_id = 'nws-retry-1' AND attempt.delivery_state = 'retry_scheduled'`,
    );
    assert(Number(fallbackAfterFailure.rows[0]?.count) === 2, "a retryable provider failure must retain one durable in-app notice per authorized contact");
    let prematureRetryCalls = 0;
    const retryNotDue = await dispatchFamilyImpactEvent("nws-retry-1", { enableDelivery: true, provider: { send: async () => { prematureRetryCalls += 1; return "provider_accepted"; } } });
    assert(retryNotDue.skipped === 2 && prematureRetryCalls === 0, "a persisted retry must not be re-sent before its bounded retry time");
    await client.query("UPDATE family_impact_delivery_attempts SET next_retry_at = NOW() - interval '1 second' WHERE event_id = (SELECT id FROM family_impact_events WHERE source_event_id = 'nws-retry-1')");
    const retryRecovered = await dispatchFamilyImpactEvent("nws-retry-1", { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(retryRecovered.providerAccepted === 2, "a due persisted retry must be re-attempted after a recoverable provider failure");

    const rejectedEvent = await request(app).post("/internal/safety/family-impact/events")
      .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!)
      .send({ source: "nws", sourceEventId: "nws-rejected-1", eventType: "severe_weather", generalArea: "Philadelphia, PA", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(), boundary: { kind: "polygon", coordinates: [[-75.18,39.94],[-75.14,39.94],[-75.14,39.97],[-75.18,39.97]] } });
    assert(rejectedEvent.status === 202, "provider-rejection fixture event must enter the source boundary");
    await dispatchFamilyImpactEvent("nws-rejected-1", { enableDelivery: true, provider: { send: async () => "provider_rejected" } });
    const fallbackAfterRejection = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
         FROM family_impact_delivery_attempts attempt
         JOIN family_impact_events event ON event.id = attempt.event_id
         JOIN notifications notice ON notice.id = attempt.in_app_notification_id
        WHERE event.source_event_id = 'nws-rejected-1' AND attempt.delivery_state = 'provider_rejected'`,
    );
    assert(Number(fallbackAfterRejection.rows[0]?.count) === 2, "a provider rejection such as an expired token must not erase the durable in-app alert");

    await client.query("UPDATE location_shares SET last_updated_at = NOW() - interval '15 minutes' WHERE sharer_id = $1", [OWNER]);
    const staleEvent = await request(app).post("/internal/safety/family-impact/events")
      .set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!)
      .send({ source: "nws", sourceEventId: "nws-stale-1", eventType: "severe_weather", generalArea: "Philadelphia, PA", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(), boundary: { kind: "polygon", coordinates: [[-75.18,39.94],[-75.14,39.94],[-75.14,39.97],[-75.18,39.97]] } });
    assert(staleEvent.status === 202, "second authoritative event must be accepted into disabled source flow");
    const stale = await dispatchFamilyImpactEvent("nws-stale-1", { enableDelivery: false });
    assert(stale.unknown === 2 && stale.potential === 0, "stale authorized location must become unknown, not safe or outside");

    await client.query(
      `INSERT INTO family_impact_events (source,source_event_id,event_type,status,boundary,general_area,expires_at)
       VALUES ('reviewed_violence','violence-local-1','serious_violent_threat','active',$1::jsonb,'Philadelphia, PA',NOW() + interval '1 hour')`,
      [JSON.stringify({ kind: "county", countyCode: "42091" })],
    );
    for (const reporter of [REPORTER_ONE, REPORTER_TWO, REPORTER_THREE]) {
      const report = await request(app).post("/safety/family-impact/violence-reports/violence-local-1").set(as(reporter));
      assert(report.status === 201, `independent synthetic report must enter review-only pipeline (status=${report.status})`);
    }
    const premature = await dispatchFamilyImpactEvent("violence-local-1", { enableDelivery: true, provider: { send: async () => "provider_accepted" } });
    assert(premature.eventState === "not_current", "three reports must not automatically authorize a threat notification");
    const review = await request(app).post("/internal/safety/family-impact/events/violence-local-1/review").set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!).send({ reviewerId: REVIEWER });
    assert(review.status === 200 && review.body.delivery === "disabled", "qualified review must remain delivery-disabled by default");

    const cancelled = await request(app).post("/internal/safety/family-impact/events/nws-local-1/cancel").set("x-family-impact-ingest-secret", process.env.FAMILY_IMPACT_INGEST_SECRET!);
    assert(cancelled.status === 200, `authoritative cancellation must update the event lifecycle (status=${cancelled.status})`);
    const cancelledImpact = await request(app).get("/safety/family-impact/events/nws-local-1/impact").set(as(CONTACT));
    assert(cancelledImpact.status === 404, "cancelled event must no longer expose an impact result");
    const delivery = await client.query<{ delivery_state: string }>("SELECT delivery_state FROM family_impact_delivery_attempts ORDER BY created_at LIMIT 1");
    assert(delivery.rows[0]?.delivery_state === "provider_accepted" || delivery.rows[0]?.delivery_state === "cancelled", "delivery audit must preserve a truthful provider state or cancellation");

    await client.query("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1,$2)", [OWNER, CONTACT]);
    const blockedImpact = await request(app).get("/safety/family-impact/events/violence-local-1/impact").set(as(CONTACT));
    assert(blockedImpact.status === 404, "a newly blocked contact must immediately lose family-impact read access");
    const blocked = await dispatchFamilyImpactEvent("violence-local-1", { enableDelivery: false });
    assert(blocked.eligibleRelationships === 1, "a new block must immediately remove only the blocked contact while preserving another separately consented relationship");

    console.log(JSON.stringify({ result: "PASS", checks: ["six-month durable consent", "temporary location-only impact", "coarse status", "explicit safety confirmation", "idempotency", "provider retry recovery", "in-app failure fallback", "stale location", "review-only violence escalation", "cancellation", "block revocation"], realDelivery: false }));
  } finally {
    await client.end();
    shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]);
    rmSync(directory, { recursive: true, force: true });
  }
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "family impact integration failed"); process.exitCode = 1; });
