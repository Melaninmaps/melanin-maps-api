import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

const require = createRequire(import.meta.url);
const express = require("express") as typeof import("express");
const request = require("supertest") as typeof import("supertest");
const pg = require("pg") as typeof import("pg");

const PG_BIN = "/usr/lib/postgresql/16/bin";
const port = 55512;
const directory = mkdtempSync(join(tmpdir(), "mwm-member-social-profile-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void { execFileSync(command, args, { stdio: "ignore" }); }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

type Stored = { data: Buffer; mime: string };

async function main(): Promise<void> {
  shell(`${PG_BIN}/initdb`, ["-D", directory, "-A", "trust", "-U", "postgres"]);
  mkdirSync(socketDirectory);
  shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-o", `-h 127.0.0.1 -p ${port} -k ${socketDirectory}`, "-w", "start"]);
  process.env.DATABASE_URL = databaseUrl;
  process.env.PRIVATE_OBJECT_DIR = "local-member-social/private";
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE users (
        id varchar(255) PRIMARY KEY, email varchar(255), first_name text, last_name text, username text,
        profile_image_url text, bio text, industry text, job_title text, date_of_birth timestamp,
        home_city text, home_state text, member_type varchar(50) DEFAULT 'individual', is_private boolean DEFAULT false,
        allow_dm boolean DEFAULT true, followers_count integer DEFAULT 0, following_count integer DEFAULT 0,
        account_status varchar(32) DEFAULT 'active', created_at timestamptz DEFAULT now(), is_load_test boolean DEFAULT false
      );
      CREATE TABLE user_blocks (id serial PRIMARY KEY, blocker_id varchar(255), blocked_id varchar(255));
      CREATE TABLE user_follows (id serial PRIMARY KEY, follower_id varchar(255), following_id varchar(255), status varchar(32));
      CREATE TABLE member_connections (id serial PRIMARY KEY, requester_id varchar(255), recipient_id varchar(255), status varchar(32));
      CREATE TABLE reviews (id varchar(255) PRIMARY KEY, user_id varchar(255), business_id varchar(255), rating integer, text text, video_url text, social_handle text, social_platform text, is_anonymous boolean DEFAULT false, created_at timestamptz DEFAULT now());
      CREATE TABLE profile_tags (id serial PRIMARY KEY, tagger_id varchar(255), tagged_user_id varchar(255), content text, created_at timestamptz DEFAULT now());
      CREATE TABLE user_achievements (id serial PRIMARY KEY, user_id varchar(255), achievement_type text, earned_at timestamptz DEFAULT now());
      CREATE TABLE member_profile_presentations_v1 (
        user_id varchar(255) PRIMARY KEY, cover_object_key text, show_age boolean NOT NULL DEFAULT false,
        show_birthday boolean NOT NULL DEFAULT false, show_location boolean NOT NULL DEFAULT false,
        show_professional_details boolean NOT NULL DEFAULT false, show_badges boolean NOT NULL DEFAULT false,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );
      CREATE TABLE community_posts (
        id varchar(255) PRIMARY KEY, author_id varchar(255) NOT NULL, author_name text NOT NULL DEFAULT 'Author',
        author_initials text NOT NULL DEFAULT 'AU', author_color text NOT NULL DEFAULT '#CA922B', content text NOT NULL,
        category text NOT NULL DEFAULT 'discussion', visibility varchar(32) NOT NULL DEFAULT 'public', requires_moderation boolean DEFAULT false,
        media_urls jsonb, upvotes integer NOT NULL DEFAULT 0, downvotes integer NOT NULL DEFAULT 0,
        created_at timestamptz DEFAULT now(), status varchar(32) DEFAULT 'active'
      );
      CREATE TABLE community_post_comments (id serial PRIMARY KEY, post_id varchar(255), status varchar(32) DEFAULT 'active');
      CREATE TABLE community_post_member_tags_v1 (post_id varchar(255), tagged_user_id varchar(255), tagged_by_user_id varchar(255), created_at timestamptz DEFAULT now(), PRIMARY KEY(post_id, tagged_user_id));
      CREATE TABLE group_members (id serial PRIMARY KEY, group_id integer, user_id varchar(255), role varchar(32));
    `);
    await client.query(`INSERT INTO users (id,email,first_name,last_name,username,bio,industry,job_title,date_of_birth,home_city,home_state,is_private,followers_count,following_count)
      VALUES ('author','author@example.test','Author','Member','author_member','Local organizer','Education','Teacher','1991-06-01','Philadelphia','PA',true,3,4),
             ('follower','follower@example.test','Follower','Member','follower_member',NULL,NULL,NULL,'1992-03-05',NULL,NULL,false,1,1),
             ('outsider','outsider@example.test','Outsider','Member','outsider_member',NULL,NULL,NULL,'1990-01-01',NULL,NULL,false,1,1)`);
    await client.query("INSERT INTO user_follows (follower_id,following_id,status) VALUES ('follower','author','accepted')");
    await client.query("INSERT INTO user_achievements (user_id,achievement_type) VALUES ('author','community_contributor')");

    const objects = new Map<string, Stored>();
    const fakeStorage = {
      bucket: () => ({ file: (objectKey: string) => ({
        save: async (data: Buffer, options: { contentType?: string }) => { objects.set(objectKey, { data: Buffer.from(data), mime: options.contentType ?? "application/octet-stream" }); },
        exists: async () => [objects.has(objectKey)],
        getMetadata: async () => [{ contentType: objects.get(objectKey)?.mime }],
        createReadStream: () => Readable.from(objects.get(objectKey)?.data ?? Buffer.alloc(0)),
      }) }),
    } as any;

    const { setObjectStorageClientForTest } = await import("../lib/objectStorage");
    const { default: usersRouter } = await import("../routes/users");
    const { fetchCommunityFeedRows } = await import("../community/communityFeed");
    setObjectStorageClientForTest(fakeStorage);
    const app = express();
    app.use(express.json());
    const identities = new Map(["author", "follower", "outsider"].map((id) => [id, { id, email: `${id}@example.test` }]));
    app.use((req: any, _res: any, next: () => void) => { req.user = identities.get(String(req.header("x-qa-user") ?? "")); req.log = { error: () => undefined, warn: () => undefined, info: () => undefined }; next(); });
    app.use(usersRouter);
    const as = (id: string) => ({ "x-qa-user": id });

    const beforeOptIn = await request(app).get("/users/author/profile").set(as("follower"));
    assert(beforeOptIn.status === 200 && beforeOptIn.body.profile.industry === undefined && beforeOptIn.body.profile.location === undefined && beforeOptIn.body.badges.length === 0, "Optional profile details must be hidden by default");

    const updated = await request(app).put("/users/me/profile-presentation").set(as("author")).send({ showLocation: true, showProfessionalDetails: true, showBadges: true, showAge: true, showBirthday: true });
    assert(updated.status === 200, "Owner must be able to opt in to selected profile details");
    const afterOptIn = await request(app).get("/users/author/profile").set(as("follower"));
    assert(afterOptIn.status === 200 && afterOptIn.body.profile.industry === "Education" && afterOptIn.body.profile.location === "Philadelphia, PA" && afterOptIn.body.profile.age > 18 && afterOptIn.body.profile.birthday === "June 1" && afterOptIn.body.badges.length === 1, "Follower must receive only explicitly opted-in profile details");

    const coverUpload = await request(app).post("/users/me/profile-cover").set(as("author")).attach("cover", Buffer.from("cover-image-bytes"), { filename: "cover.png", contentType: "image/png" });
    assert(coverUpload.status === 201 && typeof coverUpload.body.coverUrl === "string" && !String(coverUpload.body.coverUrl).includes("member-profile-covers"), "Cover upload must return an application route, not a private object key");
    const coverPath = "/users/author/profile-cover";
    const followerCover = await request(app).get(coverPath).set(as("follower"));
    assert(followerCover.status === 200 && followerCover.headers["cache-control"]?.includes("no-store") && Buffer.isBuffer(followerCover.body) && followerCover.body.equals(Buffer.from("cover-image-bytes")), "Authorized follower must receive no-store cover bytes through the app route");
    const outsiderCover = await request(app).get(coverPath).set(as("outsider"));
    assert(outsiderCover.status === 404, "Non-follower must not receive a private account cover");
    await client.query("DELETE FROM user_follows WHERE follower_id='follower' AND following_id='author'");
    const afterUnfollowCover = await request(app).get(coverPath).set(as("follower"));
    assert(afterUnfollowCover.status === 404, "Unfollowing must revoke future profile-cover access");
    await client.query("INSERT INTO user_follows (follower_id,following_id,status) VALUES ('follower','author','accepted')");

    await client.query("INSERT INTO community_posts (id,author_id,content,visibility,media_urls) VALUES ('public-tagged','author','A public community post with media','public',$1), ('private-tagged','author','A private community post','private',NULL)", [JSON.stringify(["community-private-media:synthetic-asset"])]);
    await client.query("INSERT INTO community_post_member_tags_v1 (post_id,tagged_user_id,tagged_by_user_id) VALUES ('public-tagged','follower','author'), ('private-tagged','follower','author')");
    const visibleTagged = await fetchCommunityFeedRows(client, { viewerId: "follower", feedMode: "everyone", taggedUserId: "follower", limit: 20, offset: 0 });
    assert(visibleTagged.length === 1 && visibleTagged[0]?.id === "public-tagged", `Profile tagged-content retrieval must return only viewer-authorized public content (count=${visibleTagged.length}; ids=${visibleTagged.map((row) => row.id).join(",")})`);
    await client.query("INSERT INTO user_blocks (blocker_id,blocked_id) VALUES ('author','follower')");
    const blockedTagged = await fetchCommunityFeedRows(client, { viewerId: "follower", feedMode: "everyone", taggedUserId: "follower", limit: 20, offset: 0 });
    assert(blockedTagged.length === 0, "Blocking must revoke tagged Community content");
    await client.query("DELETE FROM user_blocks");
    await client.query("DELETE FROM community_post_member_tags_v1 WHERE post_id='public-tagged' AND tagged_user_id='follower'");
    const withdrawnTagged = await fetchCommunityFeedRows(client, { viewerId: "follower", feedMode: "everyone", taggedUserId: "follower", limit: 20, offset: 0 });
    assert(withdrawnTagged.length === 0, "Removing a tag must remove it from the member profile retrieval path");

    console.log(JSON.stringify({ status: "passed", localPostgres: true, profilePresentationOptIn: true, privateCoverUploadAndDelivery: true, privateCoverRevocation: true, taggedCommunityRetrieval: true, privateTaggedContentExcluded: true, blockRevocation: true, tagRemovalRevocation: true }));
    setObjectStorageClientForTest(null);
  } finally { await client.end(); }
}

main().finally(() => { try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]); } catch {} rmSync(directory, { recursive: true, force: true }); });
