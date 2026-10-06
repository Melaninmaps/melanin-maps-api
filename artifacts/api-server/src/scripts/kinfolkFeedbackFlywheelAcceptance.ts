import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");

const PG_BIN = "/usr/lib/postgresql/16/bin";
const port = 55493;
const directory = mkdtempSync(join(tmpdir(), "mwm-kinfolk-feedback-flywheel-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void {
  execFileSync(command, args, { stdio: "ignore" });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE users (
        id varchar(255) PRIMARY KEY,
        email varchar(255) UNIQUE,
        role varchar(32) NOT NULL DEFAULT 'user',
        account_status varchar(32) NOT NULL DEFAULT 'active'
      );
      CREATE TABLE businesses (
        id varchar(255) PRIMARY KEY,
        name text NOT NULL,
        website text,
        status varchar(32),
        listing_status varchar(64)
      );
      CREATE TABLE business_owner_links (
        id varchar(255) PRIMARY KEY,
        user_id varchar(255) NOT NULL REFERENCES users(id),
        business_id varchar(255) NOT NULL REFERENCES businesses(id),
        role varchar(32) NOT NULL,
        status varchar(32) NOT NULL,
        approved_by varchar(255),
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_by varchar(255),
        revoked_at timestamptz,
        revocation_reason text
      );
      CREATE UNIQUE INDEX business_owner_links_one_active_primary_owner
        ON business_owner_links (business_id)
        WHERE role = 'owner' AND status = 'approved' AND revoked_at IS NULL;
      CREATE TABLE kinfolk_response_feedback (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL REFERENCES users(id),
        session_id varchar(255),
        message_id varchar(128) NOT NULL,
        reaction varchar(16) NOT NULL CHECK (reaction IN ('helpful', 'not_helpful', 'needs_more_help')),
        note text,
        intent_class varchar(64),
        topic_key varchar(64),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        UNIQUE (user_id, message_id)
      );
      CREATE TABLE kinfolk_community_need_insights (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id varchar(255) NOT NULL REFERENCES businesses(id),
        topic_key varchar(64) NOT NULL,
        threshold integer NOT NULL,
        member_count integer NOT NULL,
        status varchar(16) NOT NULL,
        first_reached_at timestamptz NOT NULL DEFAULT now(),
        last_observed_at timestamptz NOT NULL DEFAULT now(),
        revoked_at timestamptz,
        UNIQUE (business_id, topic_key, threshold)
      );
      CREATE TABLE canonical_mwm_owner_attachment_audit (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id varchar(255) NOT NULL REFERENCES businesses(id),
        target_user_id varchar(255) NOT NULL REFERENCES users(id),
        actor_user_id varchar(255) NOT NULL REFERENCES users(id),
        action varchar(48) NOT NULL,
        prior_owner_link_id varchar(255),
        prior_owner_user_id varchar(255),
        new_owner_link_id varchar(255),
        prior_state jsonb NOT NULL,
        next_state jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE FUNCTION reject_canonical_mwm_owner_attachment_audit_mutation()
      RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'append-only'; END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER canonical_mwm_owner_attachment_audit_immutable
        BEFORE UPDATE OR DELETE ON canonical_mwm_owner_attachment_audit
        FOR EACH ROW EXECUTE FUNCTION reject_canonical_mwm_owner_attachment_audit_mutation();
      CREATE TABLE kinfolk_private_memories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL REFERENCES users(id),
        content text NOT NULL
      );
    `);

    const founder = { id: "founder-owner", email: "tlindsay428@yahoo.com", role: "admin" };
    const nonOwnerAdmin = { id: "non-owner-admin", email: "admin@example.test", role: "admin" };
    await client.query(
      `INSERT INTO users (id, email, role) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [founder.id, founder.email, founder.role, nonOwnerAdmin.id, nonOwnerAdmin.email, nonOwnerAdmin.role],
    );
    for (let index = 1; index <= 50; index++) {
      await client.query(`INSERT INTO users (id, email, role) VALUES ($1, $2, 'user')`, [
        `qa-${index}`,
        `qa-${index}@example.test`,
      ]);
    }
    await client.query(
      `INSERT INTO businesses (id, name, website, status, listing_status)
       VALUES ('c678e359-0000-4000-8000-000000000001', 'Mapping With Melanin', 'https://mappingwithmelanin.com', 'suspended', 'archived')`,
    );

    const { default: kinfolkRouter } = await import("../routes/kinfolk");
    const { default: ownerInsightsRouter } = await import("../routes/business-owner-insights");
    const { default: ownerAttachmentRouter } = await import("../routes/canonical-mwm-owner-attachment");
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: () => void) => {
      const requested = String(req.header("x-qa-user") ?? "");
      const user = requested === founder.id
        ? founder
        : requested === nonOwnerAdmin.id
          ? nonOwnerAdmin
          : requested.startsWith("qa-")
            ? { id: requested, email: `${requested}@example.test`, role: "user" }
            : undefined;
      req.user = user;
      req.log = { error: () => undefined, warn: () => undefined, info: () => undefined };
      next();
    });
    app.use(kinfolkRouter);
    app.use(ownerInsightsRouter);
    app.use(ownerAttachmentRouter);

    const founderGet = (path: string) => request(app).get(path).set("x-qa-user", founder.id);
    const founderPost = (path: string) => request(app).post(path).set("x-qa-user", founder.id);
    const businessId = "c678e359-0000-4000-8000-000000000001";

    const preflight = await founderGet("/admin/canonical-mwm-owner-attachment");
    assert(preflight.status === 200 && preflight.body.attachment.activeOwnerLinkPresent === false, "Expected an unattached canonical profile before the operation");
    const attached = await founderPost("/admin/canonical-mwm-owner-attachment")
      .send({ confirmation: "ATTACH_CANONICAL_MWM_OWNER" });
    assert(attached.status === 200 && attached.body.ownerAttached === true && attached.body.businessStateChanged === false, "Canonical owner attach did not succeed");
    const businessAfterAttach = await client.query(`SELECT status, listing_status FROM businesses WHERE id = $1`, [businessId]);
    assert(businessAfterAttach.rows[0]?.status === "suspended" && businessAfterAttach.rows[0]?.listing_status === "archived", "Attachment changed the business lifecycle");
    const activeOwner = await client.query(`SELECT user_id FROM business_owner_links WHERE business_id = $1 AND revoked_at IS NULL`, [businessId]);
    assert(activeOwner.rowCount === 1 && activeOwner.rows[0]?.user_id === founder.id, "Founder owner link was not the only active link");
    const repeatAttachment = await founderPost("/admin/canonical-mwm-owner-attachment")
      .send({ confirmation: "ATTACH_CANONICAL_MWM_OWNER" });
    assert(repeatAttachment.status === 200 && repeatAttachment.body.action === "already_attached", "Repeated canonical attach was not idempotent");
    let immutable = false;
    try { await client.query(`UPDATE canonical_mwm_owner_attachment_audit SET action = 'changed'`); } catch { immutable = true; }
    assert(immutable, "Canonical owner audit was mutable");

    const adminDenied = await request(app).get(`/businesses/${businessId}/kinfolk-community-needs`).set("x-qa-user", nonOwnerAdmin.id);
    assert(adminDenied.status === 403, "A non-owner administrator reached owner insights");

    for (let index = 1; index <= 4; index++) {
      const response = await request(app).put("/kinfolk/response-feedback").set("x-qa-user", `qa-${index}`).send({
        messageId: `life-${index}`,
        reaction: "needs_more_help",
        topicKey: "life_insurance_terms",
        note: `Controlled QA note ${index}`,
      });
      assert(response.status === 200, `QA member ${index} could not submit feedback`);
    }
    const beforeThreshold = await founderGet(`/businesses/${businessId}/kinfolk-community-needs`);
    assert(beforeThreshold.status === 200 && beforeThreshold.body.insights.length === 0, "Owner insight appeared before five distinct members");

    for (let index = 5; index <= 50; index++) {
      const response = await request(app).put("/kinfolk/response-feedback").set("x-qa-user", `qa-${index}`).send({
        messageId: `life-${index}`,
        reaction: "needs_more_help",
        topicKey: "life_insurance_terms",
        note: `Controlled QA note ${index}`,
      });
      assert(response.status === 200, `QA member ${index} could not submit feedback`);
    }
    const duplicate = await request(app).put("/kinfolk/response-feedback").set("x-qa-user", "qa-1").send({
      messageId: "life-1", reaction: "needs_more_help", topicKey: "life_insurance_terms", note: "Retry should update, not duplicate",
    });
    assert(duplicate.status === 200, "A retried member feedback failed");

    const ownerInsight = await founderGet(`/businesses/${businessId}/kinfolk-community-needs`);
    assert(ownerInsight.status === 200 && ownerInsight.body.insights.length === 1, "Owner did not receive exactly one threshold insight");
    assert(ownerInsight.body.insights[0].memberCount === 5, "The sixth-or-later feedback changed the threshold alert count");
    const serializedInsight = JSON.stringify(ownerInsight.body);
    assert(!serializedInsight.includes("qa-") && !serializedInsight.includes("Controlled QA note") && !serializedInsight.includes("life-1"), "Owner insight exposed member or message data");

    const crossMemberRevoke = await request(app).delete("/kinfolk/response-feedback/life-1").set("x-qa-user", "qa-2");
    assert(crossMemberRevoke.status === 404, "A member could revoke another member's feedback");

    for (let index = 1; index <= 46; index++) {
      const revoke = await request(app).delete(`/kinfolk/response-feedback/life-${index}`).set("x-qa-user", `qa-${index}`);
      assert(revoke.status === 200, `QA member ${index} could not revoke their own feedback`);
    }
    const belowThreshold = await founderGet(`/businesses/${businessId}/kinfolk-community-needs`);
    assert(belowThreshold.status === 200 && belowThreshold.body.insights.length === 0, "Revoked feedback still appeared as an active owner insight");
    const reactivated = await request(app).put("/kinfolk/response-feedback").set("x-qa-user", "qa-1").send({
      messageId: "life-1", reaction: "needs_more_help", topicKey: "life_insurance_terms", note: null,
    });
    assert(reactivated.status === 200, "A member could not re-submit explicitly revoked feedback");
    const ownerAfterReactivate = await founderGet(`/businesses/${businessId}/kinfolk-community-needs`);
    assert(ownerAfterReactivate.status === 200 && ownerAfterReactivate.body.insights.length === 1, "A re-crossed threshold did not restore the one aggregate insight");
    const insightRows = await client.query(`SELECT COUNT(*)::int AS count FROM kinfolk_community_need_insights`);
    assert(insightRows.rows[0]?.count === 1, "The same topic created a duplicate owner insight");

    const privateMemoryRows = await client.query(`SELECT COUNT(*)::int AS count FROM kinfolk_private_memories`);
    assert(privateMemoryRows.rows[0]?.count === 0, "Feedback created private memory without explicit memory consent");
    const feedbackRows = await client.query(`SELECT COUNT(*)::int AS count FROM kinfolk_response_feedback`);
    assert(feedbackRows.rows[0]?.count === 50, "Fifty isolated members did not remain deduplicated to fifty feedback rows");

    console.log(JSON.stringify({
      status: "passed",
      members: 50,
      distinctNeedThreshold: 5,
      ownerInsightRows: insightRows.rows[0]?.count,
      businessLifecyclePreserved: true,
      founderOwnerAttached: true,
      nonOwnerAdminDenied: true,
      noPrivateMemoryCreated: true,
      cleanup: "ephemeral PostgreSQL cluster removed",
    }));
  } finally {
    await client.end();
  }
}

try {
  await main();
} finally {
  try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]); } catch { /* already stopped */ }
  rmSync(directory, { recursive: true, force: true });
}
