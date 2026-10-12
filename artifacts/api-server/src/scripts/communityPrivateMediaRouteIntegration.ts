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
const port = 55497;
const directory = mkdtempSync(join(tmpdir(), "mwm-community-private-media-"));
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
  process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID = "local-private-community";
  process.env.OBJECT_STORAGE_CREDENTIAL_MODE = "adc";
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE users (id varchar(255) PRIMARY KEY, email varchar(255), first_name text, last_name text, is_private boolean DEFAULT false, account_status varchar(32) DEFAULT 'active');
      CREATE TABLE community_posts (id varchar(255) PRIMARY KEY, author_id varchar(255) NOT NULL, author_name text DEFAULT 'Author Member', content text DEFAULT 'Private post', group_id integer, visibility varchar(32) NOT NULL DEFAULT 'public', comment_policy varchar(32) DEFAULT 'everyone', is_private_topic boolean DEFAULT false, requires_moderation boolean DEFAULT false, media_urls text, status varchar(32) DEFAULT 'active', deleted_at timestamptz);
      CREATE TABLE media_assets (id uuid PRIMARY KEY, uploader_id varchar(255) NOT NULL, purpose varchar(64) NOT NULL, mime_type varchar(128) NOT NULL, byte_size integer NOT NULL, object_key text NOT NULL, public_url text, status varchar(32) NOT NULL DEFAULT 'ready', created_at timestamptz DEFAULT now());
      CREATE TABLE user_blocks (id serial PRIMARY KEY, blocker_id varchar(255), blocked_id varchar(255));
      CREATE TABLE user_follows (id serial PRIMARY KEY, follower_id varchar(255), following_id varchar(255), status varchar(32));
      CREATE TABLE member_connections (id serial PRIMARY KEY, requester_id varchar(255), recipient_id varchar(255), status varchar(32));
      CREATE TABLE group_members (id serial PRIMARY KEY, group_id integer, user_id varchar(255), role varchar(32));
    `);
    await client.query("INSERT INTO users (id,email,first_name,last_name,is_private) VALUES ('author','author@example.test','Author','Member',false),('follower','follower@example.test','Follower','Member',false),('outsider','outsider@example.test','Outsider','Member',false)");
    await client.query("INSERT INTO user_follows (follower_id,following_id,status) VALUES ('follower','author','accepted')");

    const objects = new Map<string, Stored>();
    const fakeStorage = {
      bucket: () => ({ file: (objectKey: string) => ({
        save: async (data: Buffer, options: { contentType: string }) => { objects.set(objectKey, { data: Buffer.from(data), mime: options.contentType }); },
        makePublic: async () => undefined,
        getSignedUrl: async () => ["https://not-used.example.test/private"],
        delete: async () => { objects.delete(objectKey); },
        createReadStream: ({ start = 0, end }: { start?: number; end?: number } = {}) => {
          const stored = objects.get(objectKey);
          if (!stored) return Readable.from([]);
          return Readable.from(stored.data.subarray(start, end === undefined ? stored.data.length : end + 1));
        },
      }) }),
    } as any;

    const { setObjectStorageClientForTest } = await import("../lib/objectStorage");
    const { registerMediaRoutes } = await import("../media/registerMediaRoutes");
    const { default: communityRouter } = await import("../routes/community");
    setObjectStorageClientForTest(fakeStorage);
    const app = express();
    app.use(express.json());
    const identities = new Map(["author", "follower", "outsider"].map((id) => [id, { id, email: `${id}@example.test` }]));
    app.use((req: any, _res: any, next: () => void) => { req.user = identities.get(String(req.header("x-qa-user") ?? "")); req.log = { error: () => undefined, warn: () => undefined, info: () => undefined }; next(); });
    registerMediaRoutes(app, {
      storageClient: fakeStorage,
      recordAsset: async (values) => { await client.query("INSERT INTO media_assets (id,uploader_id,purpose,mime_type,byte_size,object_key,public_url,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'ready')", Array.from(values) as any[]); },
    });
    app.use(communityRouter);
    const as = (id: string) => ({ "x-qa-user": id });

    const upload = await request(app).post("/api/media/upload?purpose=community_post_private")
      .set(as("author"))
      .attach("file", Buffer.from("private-image-bytes"), { filename: "private.png", contentType: "image/png" });
    assert(upload.status === 201 && typeof upload.body.assetId === "string" && upload.body.url === undefined, "Private upload must return only an asset reference");
    const assetId = upload.body.assetId as string;
    await client.query("INSERT INTO community_posts (id,author_id,visibility,media_urls) VALUES ('private-post','author','followers_only',$1)", [JSON.stringify([`community-private-media:${assetId}`])]);

    const path = `/community/posts/private-post/private-media/${assetId}`;
    const authorized = await request(app).get(path).set(as("follower"));
    assert(authorized.status === 200 && authorized.headers["content-type"] === "image/png" && Buffer.isBuffer(authorized.body) && authorized.body.equals(Buffer.from("private-image-bytes")), `Follower private-media status=${authorized.status} contentType=${String(authorized.headers["content-type"] ?? "none")}`);
    assert(authorized.headers["cache-control"]?.includes("no-store"), "Private response must not be cacheable");
    const ranged = await request(app).get(path).set(as("follower")).set("Range", "bytes=0-6");
    assert(ranged.status === 206 && ranged.headers["content-range"] === "bytes 0-6/19", "Private media must support range playback without a signed URL");
    const outsider = await request(app).get(path).set(as("outsider"));
    assert(outsider.status === 404, "Unrelated member must not retrieve private media");
    await client.query("INSERT INTO community_posts (id,author_id,group_id,visibility,media_urls) VALUES ('group-private-post','author',7,'followers_only',$1)", [JSON.stringify([`community-private-media:${assetId}`])]);
    await client.query("INSERT INTO group_members (group_id,user_id,role) VALUES (7,'follower','member')");
    const groupPath = `/community/posts/group-private-post/private-media/${assetId}`;
    const groupAuthorized = await request(app).get(groupPath).set(as("follower"));
    assert(groupAuthorized.status === 200, "Current Group member must receive authorized private media");
    await client.query("DELETE FROM group_members WHERE group_id=7 AND user_id='follower'");
    const afterGroupRemoval = await request(app).get(groupPath).set(as("follower"));
    assert(afterGroupRemoval.status === 404, "Group removal must revoke future private-media access");
    await client.query("DELETE FROM user_follows WHERE follower_id='follower' AND following_id='author'");
    const afterUnfollow = await request(app).get(path).set(as("follower"));
    assert(afterUnfollow.status === 404, "Unfollowing must revoke future private-media access");
    await client.query("INSERT INTO user_follows (follower_id,following_id,status) VALUES ('follower','author','accepted')");
    await client.query("INSERT INTO user_blocks (blocker_id,blocked_id) VALUES ('author','follower')");
    const afterBlock = await request(app).get(path).set(as("follower"));
    assert(afterBlock.status === 404, "Blocking must revoke future private-media access");
    await client.query("DELETE FROM user_blocks");
    const lockedPrivacy = await request(app).patch("/community/posts/private-post/visibility").set(as("author")).send({ visibility: "public" });
    assert(lockedPrivacy.status === 409, "Private media must not become public through a privacy change");
    await client.query("DELETE FROM community_posts WHERE id='private-post'");
    const afterDelete = await request(app).get(path).set(as("author"));
    assert(afterDelete.status === 404, "Deleting a post must revoke future private-media access");
    console.log(JSON.stringify({ status: "passed", localPostgres: true, applicationUploadRoute: true, authenticatedStreamingRoute: true, authorizedDelivery: true, rangePlayback: true, deniedDelivery: true, unfollowRevocation: true, groupRemovalRevocation: true, blockRevocation: true, privacyLock: true, deletionRevocation: true, storageProvider: "in-memory route fixture" }));
    setObjectStorageClientForTest(null);
  } finally { await client.end(); }
}

main().finally(() => { try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]); } catch {} rmSync(directory, { recursive: true, force: true }); });
