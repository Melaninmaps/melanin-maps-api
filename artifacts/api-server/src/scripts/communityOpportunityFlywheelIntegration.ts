import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");

const PG_BIN = "/usr/lib/postgresql/16/bin";
const port = 55495;
const directory = mkdtempSync(join(tmpdir(), "mwm-community-opportunity-flywheel-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void { execFileSync(command, args, { stdio: "ignore" }); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (id varchar(255) PRIMARY KEY, email varchar(255), role varchar(32), account_status varchar(32) DEFAULT 'active', created_at timestamptz DEFAULT now(), member_type varchar(32), trust_level integer DEFAULT 3, first_name text, last_name text, profile_image_url text, is_private boolean DEFAULT false, is_load_test boolean DEFAULT false);
      CREATE TABLE businesses (id varchar(255) PRIMARY KEY, name text NOT NULL, black_owned boolean DEFAULT true, city text, category text);
      CREATE TABLE business_owner_links (id varchar(255) PRIMARY KEY, user_id varchar(255) NOT NULL, business_id varchar(255) NOT NULL, role varchar(32) NOT NULL, status varchar(32) NOT NULL, revoked_at timestamptz);
      CREATE TABLE kinfolk_response_feedback (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar(255) NOT NULL, session_id varchar(255), message_id varchar(128) NOT NULL, reaction varchar(16) NOT NULL, note text, intent_class varchar(64), topic_key varchar(64), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), revoked_at timestamptz, UNIQUE(user_id,message_id));
      CREATE TABLE kinfolk_community_need_insights (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id varchar(255) NOT NULL, topic_key varchar(64) NOT NULL, threshold integer NOT NULL, member_count integer NOT NULL, status varchar(16) NOT NULL, first_reached_at timestamptz DEFAULT now(), last_observed_at timestamptz DEFAULT now(), revoked_at timestamptz, UNIQUE(business_id,topic_key,threshold));
      CREATE TABLE community_posts (id varchar(255) PRIMARY KEY, author_id varchar(255) NOT NULL, content text NOT NULL, visibility varchar(32) NOT NULL DEFAULT 'public', hashtags text[], requires_moderation boolean NOT NULL DEFAULT false, is_private_topic boolean NOT NULL DEFAULT false, status varchar(32) DEFAULT 'active', deleted_at timestamptz, created_at timestamptz DEFAULT now(), media_urls text);
      CREATE TABLE user_blocks (blocker_id varchar(255), blocked_id varchar(255));
      CREATE TABLE content_reports (target_type varchar(32), target_id varchar(255));
    `);
    const owner = { id: "owner", email: "owner@example.test", role: "user" };
    const creator = { id: "creator", email: "creator@example.test", role: "user" };
    const unrelated = { id: "unrelated", email: "unrelated@example.test", role: "user" };
    const nonOpted = { id: "non-opted", email: "non-opted@example.test", role: "user" };
    const unauthorized = { id: "unauthorized", email: "unauthorized@example.test", role: "user" };
    const members = Array.from({ length: 5 }, (_, index) => ({ id: `member-${index + 1}`, email: `member-${index + 1}@example.test`, role: "user" }));
    await client.query(`INSERT INTO users (id,email,role,first_name,last_name) VALUES ${[owner, creator, unrelated, nonOpted, unauthorized, ...members].map((_, i) => `($${i * 5 + 1},$${i * 5 + 2},$${i * 5 + 3},$${i * 5 + 4},$${i * 5 + 5})`).join(",")}`,
      [owner, creator, unrelated, nonOpted, unauthorized, ...members].flatMap((u) => [u.id, u.email, u.role, u.id, "Test"]));
    const businessId = "c678e359-0000-4000-8000-000000000001";
    await client.query(`INSERT INTO businesses (id,name) VALUES ($1,'Fixture Business')`, [businessId]);
    await client.query(`INSERT INTO business_owner_links (id,user_id,business_id,role,status) VALUES ('owner-link',$1,$2,'owner','approved')`, [owner.id, businessId]);

    const { default: kinfolkRouter } = await import("../routes/kinfolk");
    const { default: opportunityRouter } = await import("../routes/community-opportunities");
    const { retrieveCommunityHashtagContext, extractCommunityTopicCandidates, buildCommunityHashtagContextQuery } = await import("../kinfolk/community-hashtag-context");
    const app = express(); app.use(express.json());
    const identities = new Map([owner, creator, unrelated, nonOpted, unauthorized, ...members].map((user) => [user.id, user]));
    app.use((req: any, _res: any, next: () => void) => { req.user = identities.get(String(req.header("x-qa-user") ?? "")); req.log = { error: (value: unknown) => console.error(value), warn: () => undefined, info: () => undefined }; next(); });
    app.use(kinfolkRouter); app.use(opportunityRouter);
    const put = (id: string, path: string) => request(app).put(path).set("x-qa-user", id);
    const post = (id: string, path: string) => request(app).post(path).set("x-qa-user", id);
    const get = (id: string, path: string) => request(app).get(path).set("x-qa-user", id);

    for (const [index, member] of members.entries()) {
      const response = await put(member.id, "/kinfolk/response-feedback").send({ messageId: `m-${index}`, reaction: "needs_more_help", topicKey: "life_insurance_terms" });
      assert(response.status === 200, "Could not create a qualifying thresholded aggregate need through the actual feedback route");
    }
    const insight = await client.query<{ id: string }>(`SELECT id FROM kinfolk_community_need_insights WHERE business_id=$1 AND topic_key='life_insurance_terms' AND status='active'`, [businessId]);
    assert(insight.rows.length === 1, "Thresholded aggregate need was not persisted");

    const deniedOwner = await post(unauthorized.id, `/businesses/${businessId}/kinfolk-community-needs/${insight.rows[0].id}/opportunities`).send({});
    assert(deniedOwner.status === 403, `Unauthorized owner response was ${deniedOwner.status}: ${JSON.stringify(deniedOwner.body)}`);
    const created = await post(owner.id, `/businesses/${businessId}/kinfolk-community-needs/${insight.rows[0].id}/opportunities`).send({});
    assert(created.status === 201, "Authorized owner could not create opportunity");
    const opportunityId = created.body.opportunity.id as string;

    for (const user of [creator, unrelated, nonOpted]) {
      const topics = user.id === unrelated.id ? ["money_basics"] : ["life_insurance_terms"];
      const optIn = user.id === creator.id;
      const registered = await put(user.id, "/community-opportunities/participation").send({ role: "creator", topicKeys: topics, notificationOptIn: optIn, active: true });
      assert(registered.status === 200, "Could not register local creator participation");
    }
    const creatorList = await get(creator.id, "/community-opportunities/me");
    assert(creatorList.status === 200 && creatorList.body.opportunities.some((row: { id: string }) => row.id === opportunityId), "Opted-in matching creator could not privately see opportunity");
    const unrelatedList = await get(unrelated.id, "/community-opportunities/me");
    assert(unrelatedList.status === 200 && unrelatedList.body.opportunities.length === 0, "Unrelated creator saw an opportunity");
    const noOptList = await get(nonOpted.id, "/community-opportunities/me");
    assert(noOptList.status === 200 && noOptList.body.opportunities.length === 0, "Non-opted-in creator saw an opportunity");
    const accepted = await post(creator.id, `/community-opportunities/${opportunityId}/accept`).send({});
    assert(accepted.status === 200, "Creator could not accept matched opportunity");

    // The Community post represents a public publication created by the participant. This deliberately uses the same persisted community_posts records and public visibility predicate Kinfolk retrieves.
    await client.query(`INSERT INTO community_posts (id,author_id,content,visibility,hashtags) VALUES ('public-post',$1,'Public resource video','public',ARRAY[]::text[])`, [creator.id]);
    await client.query(`INSERT INTO community_posts (id,author_id,content,visibility,hashtags) VALUES ('private-post',$1,'Private draft','followers_only',ARRAY['life_insurance_terms'])`, [creator.id]);
    const privateFulfillment = await post(creator.id, `/community-opportunities/${opportunityId}/fulfill`).send({ communityPostId: "private-post" });
    assert(privateFulfillment.status === 400, "Private post fulfilled opportunity");
    const fulfilled = await post(creator.id, `/community-opportunities/${opportunityId}/fulfill`).send({ communityPostId: "public-post" });
    assert(fulfilled.status === 200, "Creator could not fulfill with public post");

    const queryable = { query: async (text: string, values: unknown[]) => client.query(text, values) } as any;
    const context = await retrieveCommunityHashtagContext(queryable, { viewerId: members[0].id, message: "What community resources and tips exist for life insurance terms?", optedIn: true, evidenceRoute: { risk: "low", retrievalRequirement: "optional" }, intentPolicy: { blockCommunityAsProof: false } } as any);
    if (context.memberFacingPerspective?.itemCount !== 1) {
      const topics = extractCommunityTopicCandidates("What community resources and tips exist for life insurance terms?");
      const debugQuery = buildCommunityHashtagContextQuery({ viewerId: members[0].id, topicCandidates: topics });
      const debugRows = await client.query(debugQuery.text, debugQuery.values);
      throw new Error(`Kinfolk did not retrieve fulfilled public content: ${JSON.stringify({ topics, rowCount: debugRows.rowCount, rows: debugRows.rows })}`);
    }
    await client.query(`INSERT INTO content_reports (target_type,target_id) VALUES ('post','public-post')`);
    const blocked = await retrieveCommunityHashtagContext(queryable, { viewerId: members[0].id, message: "What community resources and tips exist for life insurance terms?", optedIn: true, evidenceRoute: { risk: "low", retrievalRequirement: "optional" }, intentPolicy: { blockCommunityAsProof: false } } as any);
    assert(blocked.memberFacingPerspective === null, "Blocked content bypassed retrieval protections");
    await client.query(`DELETE FROM content_reports WHERE target_id='public-post'`);
    const withdrawn = await request(app).delete(`/community-opportunities/${opportunityId}/fulfillment`).set("x-qa-user", creator.id);
    assert(withdrawn.status === 200, "Creator could not withdraw fulfillment");
    const afterWithdraw = await retrieveCommunityHashtagContext(queryable, { viewerId: members[0].id, message: "What community resources and tips exist for life insurance terms?", optedIn: true, evidenceRoute: { risk: "low", retrievalRequirement: "optional" }, intentPolicy: { blockCommunityAsProof: false } } as any);
    assert(afterWithdraw.memberFacingPerspective === null, "Withdrawn fulfillment remained in Kinfolk retrieval");
    console.log(JSON.stringify({ status: "passed", localPostgres: true, thresholdedNeed: true, ownerAuthorization: true, optInMatching: true, acceptance: true, publicFulfillment: true, kinfolkRetrieval: true, withdrawal: true, protectedCases: ["non_opted_in", "unrelated", "unauthorized_owner", "private_post", "blocked_content", "withdrawn"] }));
  } finally { await client.end(); }
}
main().finally(() => { try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]); } catch {} rmSync(directory, { recursive: true, force: true }); });
