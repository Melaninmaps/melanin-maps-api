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
const port = 55512;
const directory = mkdtempSync(join(tmpdir(), "mwm-safety-workflows-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void {
  execFileSync(command, args, { stdio: "ignore" });
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const OWNER = "safety-owner";
const CONTACT = "safety-contact";
const OUTSIDER = "safety-outsider";
const ADMIN = "safety-admin";

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;
  process.env.CRON_SECRET = "local-safety-cron";
  process.env.ADMIN_EMAILS = "safety-admin@example.test";
  process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = "local-safety-workflows";
  process.env.KINFOLK_PRIVATE_MEMORY_ENABLED = "false";

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (
        id varchar PRIMARY KEY, email varchar UNIQUE, first_name varchar, last_name varchar, profile_image_url varchar,
        stripe_customer_id varchar, stripe_subscription_id varchar, push_token varchar, is_load_test boolean NOT NULL DEFAULT false,
        approved boolean NOT NULL DEFAULT true, account_status varchar NOT NULL DEFAULT 'active', lifecycle_updated_at timestamptz,
        lifecycle_updated_by varchar, lifecycle_reason varchar, role varchar NOT NULL DEFAULT 'user', member_type varchar DEFAULT 'beta',
        trial_ends_at timestamptz, trial_reminder_3day_sent_at timestamptz, trial_reminder_1day_sent_at timestamptz,
        trial_expired_email_sent_at timestamptz, win_back_email_sent_at timestamptz, founding_member_number integer,
        username varchar UNIQUE, referral_code varchar UNIQUE, referral_count integer NOT NULL DEFAULT 0, referred_by_code varchar,
        industry varchar, job_title varchar, date_of_birth timestamp, kinfolk_query_month varchar, kinfolk_queries_this_month integer NOT NULL DEFAULT 0,
        trust_level integer NOT NULL DEFAULT 1, reputation_score integer NOT NULL DEFAULT 0, identity_verified boolean NOT NULL DEFAULT true,
        identity_verified_at timestamptz, policy_violations_count integer NOT NULL DEFAULT 0, helpful_reviews_count integer NOT NULL DEFAULT 0,
        is_private boolean NOT NULL DEFAULT false, followers_count integer NOT NULL DEFAULT 0, following_count integer NOT NULL DEFAULT 0,
        bio varchar, home_city varchar, home_state varchar, password_hash varchar, must_change_password boolean NOT NULL DEFAULT false,
        email_verified boolean NOT NULL DEFAULT true, email_verification_token varchar, email_verification_expires timestamptz,
        agree_to_terms boolean NOT NULL DEFAULT true, show_city boolean NOT NULL DEFAULT true, allow_dm boolean NOT NULL DEFAULT true,
        display_name_format varchar DEFAULT 'full', is_influencer boolean NOT NULL DEFAULT false, is_business_owner boolean NOT NULL DEFAULT false,
        is_content_creator boolean NOT NULL DEFAULT false, is_community_organizer boolean NOT NULL DEFAULT false,
        profile_setup_complete boolean NOT NULL DEFAULT true, apple_id varchar UNIQUE, apple_refresh_token text, phone_number varchar UNIQUE,
        phone_verified boolean NOT NULL DEFAULT false, notif_events boolean NOT NULL DEFAULT true, notif_business boolean NOT NULL DEFAULT true,
        notif_messages boolean NOT NULL DEFAULT true, notif_reviews boolean NOT NULL DEFAULT true, notif_community boolean NOT NULL DEFAULT false,
        notif_promotions boolean NOT NULL DEFAULT false, notif_digest boolean NOT NULL DEFAULT true, notif_tips boolean NOT NULL DEFAULT false,
        notif_post_nudges boolean NOT NULL DEFAULT true, quiet_hours_enabled boolean NOT NULL DEFAULT true,
        quiet_hours_from varchar NOT NULL DEFAULT '10:00 PM', quiet_hours_until varchar NOT NULL DEFAULT '8:00 AM',
        marketing_opt_out boolean NOT NULL DEFAULT false, failed_login_attempts integer NOT NULL DEFAULT 0, locked_until timestamptz,
        tester_status varchar, tester_access_source varchar, tester_granted_at timestamptz, tester_granted_by varchar,
        testing_entitlement_ends_at timestamptz, created_at timestamptz NOT NULL DEFAULT now() - interval '2 days', updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE user_blocks (id serial PRIMARY KEY, blocker_id varchar NOT NULL, blocked_id varchar NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE trusted_safety_shares (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id varchar NOT NULL, contact_type varchar NOT NULL,
        contact_user_id varchar, contact_name varchar NOT NULL, contact_phone varchar, contact_email varchar,
        owner_enabled boolean NOT NULL DEFAULT true, contact_accepted boolean NOT NULL DEFAULT false, status varchar NOT NULL DEFAULT 'pending',
        invite_token uuid, invite_expires_at timestamptz, activated_at timestamptz, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE location_shares (
        id serial PRIMARY KEY, sharer_id varchar NOT NULL, share_token varchar NOT NULL UNIQUE, recipient_email varchar,
        recipient_user_id varchar, label varchar NOT NULL DEFAULT 'Live Location', current_lat double precision, current_lng double precision,
        last_updated_at timestamp, expires_at timestamp NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE notification_preferences (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id varchar NOT NULL UNIQUE, topics text[] NOT NULL DEFAULT ARRAY['safety']::text[],
        push_enabled boolean NOT NULL DEFAULT false, email_enabled boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE notifications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id varchar NOT NULL, type varchar NOT NULL DEFAULT 'safety',
        title varchar NOT NULL, body text NOT NULL, entity_id varchar, entity_type varchar, data jsonb, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE push_tokens (id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id varchar NOT NULL, token varchar NOT NULL, platform varchar, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE trusted_safety_invitation_delivery_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), trusted_share_id uuid NOT NULL, channel varchar NOT NULL, provider varchar NOT NULL,
        state varchar NOT NULL, provider_receipt_fingerprint char(64), attempted_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
      );
      CREATE TABLE safety_checkins (
        id serial PRIMARY KEY, user_id varchar NOT NULL, trusted_contact_name varchar NOT NULL, trusted_contact_email varchar,
        scheduled_at timestamp NOT NULL, confirmed_at timestamp, status varchar NOT NULL DEFAULT 'pending', note text, location text, city varchar,
        notified_at timestamp, created_at timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE safety_checkin_recipients (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, checkin_id integer NOT NULL, trusted_share_id varchar NOT NULL,
        recipient_user_id varchar NOT NULL, recipient_name varchar NOT NULL, notification_id varchar, delivery_status varchar NOT NULL DEFAULT 'pending',
        in_app_attempt_count integer NOT NULL DEFAULT 0, push_attempt_count integer NOT NULL DEFAULT 0, in_app_attempted_at timestamptz,
        in_app_created_at timestamptz, in_app_failed_at timestamptz, push_attempted_at timestamptz, push_attempt_id uuid, push_submitted_at timestamptz,
        push_failed_at timestamptz, next_retry_at timestamptz, last_error_code varchar, notified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE user_settings (
        user_id varchar PRIMARY KEY, notif_events boolean NOT NULL DEFAULT true, notif_business boolean NOT NULL DEFAULT true,
        notif_messages boolean NOT NULL DEFAULT true, notif_reviews boolean NOT NULL DEFAULT true, notif_community boolean NOT NULL DEFAULT false,
        notif_promotions boolean NOT NULL DEFAULT false, notif_digest boolean NOT NULL DEFAULT true, notif_tips boolean NOT NULL DEFAULT false,
        notif_reminders boolean NOT NULL DEFAULT true, arrival_awareness_enabled boolean NOT NULL DEFAULT false, notif_post_nudges boolean NOT NULL DEFAULT true,
        notif_product_recalls boolean NOT NULL DEFAULT false, notif_public_health_alerts boolean NOT NULL DEFAULT false, quiet_hours_enabled boolean NOT NULL DEFAULT true,
        quiet_hours_from varchar NOT NULL DEFAULT '10:00 PM', quiet_hours_until varchar NOT NULL DEFAULT '8:00 AM', profile_visibility varchar NOT NULL DEFAULT 'community',
        show_location boolean NOT NULL DEFAULT true, location_precision varchar NOT NULL DEFAULT 'neighborhood', activity_status boolean NOT NULL DEFAULT true,
        usage_analytics boolean NOT NULL DEFAULT true, personalised_suggestions boolean NOT NULL DEFAULT true, kinfolk_memory_enabled boolean NOT NULL DEFAULT false,
        kinfolk_continuity_enabled boolean NOT NULL DEFAULT false, kinfolk_continuity_updated_at timestamptz, kinfolk_continuity_disclosure_decision varchar,
        kinfolk_continuity_disclosure_version varchar, kinfolk_continuity_disclosed_at timestamptz, profile_view_tracking_enabled boolean NOT NULL DEFAULT true,
        post_nudges_enabled boolean NOT NULL DEFAULT true, safety_alert_police boolean NOT NULL DEFAULT false, safety_alert_ice boolean NOT NULL DEFAULT false,
        safety_alert_radius_miles integer NOT NULL DEFAULT 5, safety_alert_area_city varchar, safety_alert_area_state varchar, updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE community_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), city_name varchar NOT NULL, state_code varchar, neighborhood_name varchar, latitude double precision, longitude double precision);
      CREATE TABLE neighborhood_surveys (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id varchar, city varchar NOT NULL, neighborhood varchar, visit_purpose varchar NOT NULL,
        visit_freq varchar, daytime_safety integer NOT NULL, nighttime_safety integer NOT NULL, walkability integer, transit_safety integer, atmosphere varchar NOT NULL,
        police_visibility varchar, police_impact varchar, community_rating integer, culturally_connected varchar, linked_business_id varchar, nomination_name varchar,
        nomination_category varchar, nomination_social_link varchar, accessibility jsonb NOT NULL DEFAULT '[]'::jsonb, tips jsonb NOT NULL DEFAULT '[]'::jsonb,
        comments text, safety_score integer NOT NULL DEFAULT 0, community_score integer NOT NULL DEFAULT 0, walkability_score integer NOT NULL DEFAULT 0,
        status varchar NOT NULL DEFAULT 'pending', moderator_notes text, reviewed_at timestamptz, reviewed_by varchar, community_intelligence_consent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE safety_reports (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, reporter_id varchar, reporter_name varchar NOT NULL DEFAULT 'Anonymous', category varchar NOT NULL,
        encounter_type varchar, target_type varchar NOT NULL DEFAULT 'business', target_id varchar, target_name varchar NOT NULL, incident_city varchar,
        incident_region varchar, incident_area varchar, incident_location_source varchar NOT NULL DEFAULT 'manual_area', incident_location_precision varchar NOT NULL DEFAULT 'city',
        description text, severity varchar NOT NULL DEFAULT 'medium', routing_type varchar NOT NULL DEFAULT 'moderation', business_response_requested boolean NOT NULL DEFAULT false,
        business_response_deadline timestamptz, business_response_text text, auto_escalated boolean NOT NULL DEFAULT false, incident_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
        incident_parties jsonb NOT NULL DEFAULT '[]'::jsonb, incident_severity varchar, incident_description text, evidence_links text, status varchar NOT NULL DEFAULT 'pending',
        moderator_notes text, reviewed_at timestamptz, reviewed_by varchar, display_expires_at timestamptz, withdrawn_at timestamptz, withdrawn_by varchar,
        withdrawal_reason text, corrected_at timestamptz, corrected_by varchar, correction_note text, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE safety_incidents (id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text, city varchar NOT NULL, region varchar, neighborhood varchar, category varchar NOT NULL, severity varchar NOT NULL DEFAULT 'medium', report_count integer NOT NULL DEFAULT 1, status varchar NOT NULL DEFAULT 'active', notifications_sent boolean NOT NULL DEFAULT false, triggered_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE member_connections (id serial PRIMARY KEY, requester_id text NOT NULL, recipient_id text NOT NULL, status text NOT NULL DEFAULT 'pending', group_id integer, created_at timestamp NOT NULL DEFAULT now(), responded_at timestamp);
      CREATE TABLE meetup_verifications (
        id serial PRIMARY KEY, initiator_id varchar NOT NULL, partner_id varchar NOT NULL, connection_id integer, location text, note text, status varchar NOT NULL DEFAULT 'pending',
        initiated_at timestamp NOT NULL DEFAULT now(), confirmed_at timestamp, scheduled_at timestamp, organizer_approved_at timestamp, partner_approved_at timestamp,
        corrected_at timestamp, cancelled_at timestamp, cancelled_by_id varchar, cancellation_reason varchar, expires_at timestamp NOT NULL, clear_code varchar,
        safety_watcher_id varchar, safety_watcher_email text, cleared_at timestamp, arrival_check_at timestamp, arrival_checked_at timestamp, arrival_check_status varchar,
        arrival_alert_sent_at timestamp, home_check_at timestamp, home_checked_at timestamp, home_check_status varchar, home_alert_sent_at timestamp,
        safety_friend_name varchar, safety_friend_email varchar
      );
      CREATE TABLE businesses (id varchar PRIMARY KEY, black_owned boolean);
    `);
    await client.query(
      `INSERT INTO users (id, email, first_name, last_name, username, approved, account_status, identity_verified, created_at)
       VALUES ($1,$2,'Owner','Member','owner',true,'active',true,now()-interval '2 days'),
              ($3,$4,'Trusted','Contact','contact',true,'active',true,now()-interval '2 days'),
              ($5,$6,'Outside','Member','outsider',true,'active',true,now()-interval '2 days'),
              ($7,$8,'Safety','Admin','admin',true,'active',true,now()-interval '2 days')`,
      [OWNER, "safety-owner@example.test", CONTACT, "safety-contact@example.test", OUTSIDER, "safety-outsider@example.test", ADMIN, "safety-admin@example.test"],
    );
    await client.query("INSERT INTO notification_preferences (user_id, topics, push_enabled) VALUES ($1, ARRAY['safety']::text[], false), ($2, ARRAY['safety']::text[], false)", [OWNER, CONTACT]);
    await client.query("INSERT INTO community_locations (city_name, state_code, neighborhood_name, latitude, longitude) VALUES ('Philadelphia','PA',NULL,39.95,-75.16)");

    const [
      { default: trustedSafetyRouter },
      { default: locationSharesRouter },
      { default: safetyCheckinsRouter },
      { default: cronRouter },
      { default: reportsRouter },
      { default: settingsRouter },
      { default: surveysRouter },
      { default: heatRouter },
      { default: meetupRouter },
    ] = await Promise.all([
      import("../routes/trusted-safety-share"),
      import("../routes/location-shares"),
      import("../routes/safety-checkins"),
      import("../routes/cron"),
      import("../routes/reports"),
      import("../routes/user-settings"),
      import("../routes/surveys"),
      import("../routes/safety-heatmap"),
      import("../routes/meetup-verifications"),
    ]);

    const app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: () => void) => {
      const userId = req.header("x-qa-user");
      const profile = userId === OWNER ? { id: OWNER, email: "safety-owner@example.test", approved: true, firstName: "Owner", lastName: "Member" }
        : userId === CONTACT ? { id: CONTACT, email: "safety-contact@example.test", approved: true, firstName: "Trusted", lastName: "Contact" }
        : userId === OUTSIDER ? { id: OUTSIDER, email: "safety-outsider@example.test", approved: true }
        : userId === ADMIN ? { id: ADMIN, email: "safety-admin@example.test", approved: true }
        : undefined;
      req.user = profile;
      req.isAuthenticated = () => Boolean(profile);
      req.log = { error: () => undefined, warn: () => undefined, info: () => undefined };
      next();
    });
    app.use(trustedSafetyRouter);
    app.use(locationSharesRouter);
    app.use(safetyCheckinsRouter);
    app.use(settingsRouter);
    app.use(surveysRouter);
    app.use(meetupRouter);
    app.use(reportsRouter);
    app.use(cronRouter);
    app.use(heatRouter);

    // Trusted Safety Share → explicit accepted contact → bounded live location.
    const invite = await request(app).post("/safety/trusted-shares").set("x-qa-user", OWNER).send({ contactName: "Trusted Contact", contactType: "mwm_user", contactUserId: CONTACT });
    assert(invite.status === 201 && invite.body.share?.id, "trusted contact invitation must be created through the authenticated route");
    const shareId = String(invite.body.share.id);
    const accepted = await request(app).patch(`/safety/trusted-shares/${shareId}/respond`).set("x-qa-user", CONTACT).send({ accept: true });
    assert(accepted.status === 200 && accepted.body.share?.status === "active", "trusted contact must explicitly accept before activation");
    const live = await request(app).post("/safety/location-shares").set("x-qa-user", OWNER).send({ recipientTrustedShareId: shareId, label: "Temporary safety handoff", durationMinutes: 30, liveLocationConsent: true });
    assert(live.status === 201 && live.body.share?.shareToken, "accepted contact must support a consented finite live-location session");
    const token = String(live.body.share.shareToken);
    const update = await request(app).patch(`/safety/location-shares/${token}/update`).set("x-qa-user", OWNER).send({ lat: 39.9526123, lng: -75.1652123 });
    assert(update.status === 200, "owner foreground coordinate update must be accepted");
    const outsiderRead = await request(app).get(`/safety/location-shares/${token}/view`).set("x-qa-user", OUTSIDER);
    assert(outsiderRead.status === 403, "untrusted account must not read live location");
    const contactRead = await request(app).get(`/safety/location-shares/${token}/view`).set("x-qa-user", CONTACT);
    assert(contactRead.status === 200 && contactRead.body.share?.coordinateState === "current", "accepted contact must read a fresh active coordinate");
    assert(!("lastUpdatedAt" in contactRead.body.share), "recipient location view must not disclose a timestamp");
    const revoke = await request(app).delete(`/safety/trusted-shares/${shareId}`).set("x-qa-user", OWNER);
    assert(revoke.status === 200, "owner must be able to immediately revoke trusted relationship");
    const revokedRead = await request(app).get(`/safety/location-shares/${token}/view`).set("x-qa-user", CONTACT);
    assert(revokedRead.status === 403, "revoked trusted relationship must deny future coordinate reads");
    const removedCoordinates = await client.query("SELECT current_lat, current_lng, is_active FROM location_shares WHERE share_token = $1", [token]);
    assert(removedCoordinates.rows[0]?.current_lat === null && removedCoordinates.rows[0]?.current_lng === null && removedCoordinates.rows[0]?.is_active === false, "revocation must remove retained coordinates and stop sharing");

    // Fresh accepted relationship for Check-In recipient authorization.
    const checkinInvite = await request(app).post("/safety/trusted-shares").set("x-qa-user", OWNER).send({ contactName: "Trusted Contact", contactType: "mwm_user", contactUserId: CONTACT });
    assert(checkinInvite.status === 201, "fresh trusted share invitation required for Check-In test");
    const checkinShareId = String(checkinInvite.body.share.id);
    assert((await request(app).patch(`/safety/trusted-shares/${checkinShareId}/respond`).set("x-qa-user", CONTACT).send({ accept: true })).status === 200, "Check-In contact must explicitly accept");
    const expiringLive = await request(app).post("/safety/location-shares").set("x-qa-user", OWNER).send({ recipientTrustedShareId: checkinShareId, label: "Short session", durationMinutes: 30, liveLocationConsent: true });
    assert(expiringLive.status === 201 && expiringLive.body.share?.shareToken, "accepted trusted contact must receive a new time-bounded session only after consent");
    const expiringToken = String(expiringLive.body.share.shareToken);
    assert((await request(app).patch(`/safety/location-shares/${expiringToken}/update`).set("x-qa-user", OWNER).send({ lat: 39.9526123, lng: -75.1652123 })).status === 200, "active short session must accept a foreground update");
    await client.query("UPDATE location_shares SET expires_at = now() - interval '1 minute' WHERE share_token = $1", [expiringToken]);
    const expiredRead = await request(app).get(`/safety/location-shares/${expiringToken}/view`).set("x-qa-user", CONTACT);
    assert(expiredRead.status === 410, "expired location session must deny recipient access");
    const expiredCoordinates = await client.query("SELECT current_lat, current_lng, is_active FROM location_shares WHERE share_token = $1", [expiringToken]);
    assert(expiredCoordinates.rows[0]?.current_lat === null && expiredCoordinates.rows[0]?.current_lng === null && expiredCoordinates.rows[0]?.is_active === false, "expiration must stop sharing and remove retained coordinates");

    // Scheduled Check-In: create, overdue escalation, recipient privacy, completion, and cancellation.
    const noLocation = await request(app).post("/safety/checkins").set("x-qa-user", OWNER).send({ recipientShareIds: [checkinShareId], scheduledAt: new Date(Date.now() + 60_000).toISOString(), city: "Philadelphia" });
    assert(noLocation.status === 400, "scheduled Check-In must reject location data");
    const createdCheckin = await request(app).post("/safety/checkins").set("x-qa-user", OWNER).send({ recipientShareIds: [checkinShareId], scheduledAt: new Date(Date.now() + 60_000).toISOString(), note: "Private note" });
    assert(createdCheckin.status === 201 && createdCheckin.body.checkin?.id, "selected trusted profile Check-In must be created");
    const checkinId = Number(createdCheckin.body.checkin.id);
    await client.query("UPDATE safety_checkins SET scheduled_at = now() - interval '2 minutes' WHERE id = $1", [checkinId]);
    const cron = await request(app).post("/cron/safety-checkins").set("x-cron-secret", "local-safety-cron");
    assert(cron.status === 200, `scheduled Check-In cron lifecycle must execute locally (${String(cron.body?.error ?? `status ${cron.status}`).replace(/secret/ig, "configured credential")})`);
    const alertRow = await client.query("SELECT notification_id FROM safety_checkin_recipients WHERE checkin_id = $1", [checkinId]);
    const alertId = alertRow.rows[0]?.notification_id as string | undefined;
    assert(alertId, "overdue Check-In must create an in-app recipient alert");
    const recipientAlert = await request(app).get(`/safety/checkins/received/${alertId}`).set("x-qa-user", CONTACT);
    assert(recipientAlert.status === 200 && recipientAlert.body.alert?.status === "overdue", "authorized recipient must read their addressed overdue alert");
    assert(!JSON.stringify(recipientAlert.body).match(/private note|philadelphia/i) && !("createdAt" in recipientAlert.body.alert), "recipient alert must not expose Check-In location, note, or timestamp");
    const otherAlert = await request(app).get(`/safety/checkins/received/${alertId}`).set("x-qa-user", OUTSIDER);
    assert(otherAlert.status === 404, "non-recipient must fail closed for Check-In alert");
    assert((await request(app).patch(`/safety/checkins/${checkinId}/confirm`).set("x-qa-user", OWNER).send({})).status === 200, "member must complete their own Check-In");
    const resolvedAlert = await request(app).get(`/safety/checkins/received/${alertId}`).set("x-qa-user", CONTACT);
    assert(resolvedAlert.status === 200 && resolvedAlert.body.alert?.status === "resolved", "completed Check-In must resolve recipient alert truthfully");
    const cancellation = await request(app).post("/safety/checkins").set("x-qa-user", OWNER).send({ recipientShareIds: [checkinShareId], scheduledAt: new Date(Date.now() + 120_000).toISOString() });
    assert(cancellation.status === 201, "future Check-In must be creatable for cancellation");
    const cancellationId = Number(cancellation.body.checkin.id);
    const cancelled = await request(app).delete(`/safety/checkins/${cancellationId}`).set("x-qa-user", OWNER);
    assert(cancelled.status === 200, "member must cancel their own scheduled Check-In");
    assert((await client.query("SELECT count(*)::int AS count FROM safety_checkins WHERE id = $1", [cancellationId])).rows[0]?.count === 0, "cancelled Check-In must not remain active");

    // City-only consented Police/ICE awareness and thresholded Community Intelligence.
    const optIn = await request(app).put("/users/settings").set("x-qa-user", CONTACT).send({ safetyAlertPolice: true, safetyAlertIce: true, safetyAlertAreaCity: "Philadelphia", safetyAlertAreaState: "PA" });
    assert(optIn.status === 200 && optIn.body.safetyAlertAreaCity === "Philadelphia", "member must explicitly select canonical city/state before Police/ICE opt-in");
    const optOut = await request(app).put("/users/settings").set("x-qa-user", CONTACT).send({ safetyAlertPolice: false, safetyAlertIce: false });
    assert(optOut.status === 200 && optOut.body.safetyAlertPolice === false && optOut.body.safetyAlertIce === false, "member must opt out of Police/ICE awareness independently");
    const reports = await Promise.all([1, 2, 3].map(() => request(app).post("/reports").set("x-qa-user", OWNER).send({ category: "police", encounterType: "checkpoint", severity: "medium", reportingConsent: true, reportingConsentVersion: "police-ice-p0-v1", incidentLocation: { city: "Philadelphia, PA", area: "ignored for police" } })));
    assert(reports.every((response) => response.status === 201 && response.body.report?.targetName === "Philadelphia, PA"), `Police/ICE intake must remain city/state-only and private (statuses ${reports.map((response) => response.status).join(",")})`);
    for (const response of reports) {
      assert((await request(app).patch(`/admin/safety-reports/${response.body.report.id}`).set("x-qa-user", ADMIN).send({ status: "approved" })).status === 200, "authorized moderator must be able to approve city-only report");
    }
    const publicReports = await request(app).get("/reports").set("x-qa-user", CONTACT);
    assert(publicReports.status === 410, "individual Safety reports must never become a public activity list");
    const incidents = await client.query("SELECT city, region, category, report_count FROM safety_incidents WHERE city = 'Philadelphia'");
    assert(incidents.rows.some((row: any) => row.city === "Philadelphia" && Number(row.report_count) >= 3), "corroborated Police/ICE reports must form a city-level internal incident aggregate");

    for (const score of [5, 4, 4, 5, 3]) {
      const survey = await request(app).post("/surveys").set("x-qa-user", OWNER).send({ city: "Philadelphia", visitPurpose: "community", visitFreq: "occasionally", daytimeSafety: score, nighttimeSafety: score, atmosphere: "mostly_welcoming", communityIntelligenceConsent: true });
      assert(survey.status === 201, "consented city-level Community Intelligence contribution must be accepted");
    }
    await client.query("UPDATE neighborhood_surveys SET status = 'approved' WHERE city = 'Philadelphia'");
    const heat = await request(app).get("/safety/heatmap/city?city=Philadelphia").set("x-qa-user", CONTACT);
    assert(heat.status === 200 && heat.body.dataStatus === "sufficient_evidence" && heat.body.point?.city === "Philadelphia", "Safety Heat must expose only thresholded city aggregate");
    assert(!("latitude" in heat.body.point) && !("longitude" in heat.body.point) && !("neighborhood" in heat.body.point) && !("reporterId" in heat.body.point) && heat.body.evidence?.rawReportsIncluded === false && heat.body.evidence?.reporterLocationsIncluded === false, "Safety Heat response must exclude individual locations and identities");

    // Participant-only private Meetup verification with approval and immediate cancellation redaction.
    await client.query("INSERT INTO member_connections (requester_id, recipient_id, status) VALUES ($1,$2,'accepted')", [OWNER, CONTACT]);
    const meetup = await request(app).post("/meetups").set("x-qa-user", OWNER).send({ partnerId: CONTACT, venue: "Private venue", scheduledAt: new Date(Date.now() + 3_600_000).toISOString(), organizerApproval: true });
    assert(meetup.status === 201 && meetup.body.verification?.id, `verified accepted participants must create a private meetup (status ${meetup.status})`);
    const meetupId = Number(meetup.body.verification.id);
    const confirmed = await request(app).patch(`/meetups/${meetupId}/confirm`).set("x-qa-user", CONTACT).send({ partnerApproval: true });
    assert(confirmed.status === 200 && confirmed.body.verification?.status === "approved", "partner must independently approve meetup venue/time window");
    const strangerMeetups = await request(app).get("/meetups").set("x-qa-user", OUTSIDER);
    assert(strangerMeetups.status === 200 && strangerMeetups.body.verifications.length === 0, "non-participant must not see private meetup");
    const cancelledMeetup = await request(app).post(`/meetups/${meetupId}/cancel`).set("x-qa-user", OWNER).send({ reason: "No longer meeting" });
    assert(cancelledMeetup.status === 200 && cancelledMeetup.body.verification?.status === "cancelled", "participant cancellation must be available");
    assert(!JSON.stringify(cancelledMeetup.body).includes("Private venue"), "meetup cancellation response must redact venue immediately");

    console.log("PASS Safety Hub integration: trusted foreground location lifecycle, private Check-In escalation, city-only Police/ICE opt-in, thresholded Safety Heat, and participant-only meetup cancellation");
  } finally {
    await client.end();
    shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]);
    rmSync(directory, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error("FAIL Safety Hub integration", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
