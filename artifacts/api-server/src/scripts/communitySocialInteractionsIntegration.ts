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
const port = 55504;
const directory = mkdtempSync(join(tmpdir(), "mwm-community-social-"));
const socketDirectory = join(directory, "socket");
const databaseUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;

function shell(command: string, args: string[]): void { execFileSync(command, args, { stdio: "ignore" }); }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

async function notificationCount(client: import("pg").Client, userId: string): Promise<number> {
  const { rows } = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM notifications WHERE user_id = $1", [userId]);
  return Number(rows[0]?.count ?? 0);
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
        email varchar(255),
        first_name text,
        last_name text,
        username text,
        profile_image_url text,
        is_private boolean NOT NULL DEFAULT false,
        notif_community boolean NOT NULL DEFAULT false,
        followers_count integer NOT NULL DEFAULT 0,
        following_count integer NOT NULL DEFAULT 0,
        date_of_birth date,
        account_status varchar(32) DEFAULT 'active',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE community_posts (
        id varchar(255) PRIMARY KEY,
        author_id varchar(255),
        author_name varchar(100) NOT NULL DEFAULT 'Community member',
        author_initials varchar(4) NOT NULL DEFAULT 'CM',
        author_color varchar(20) NOT NULL DEFAULT '#3B1F0E',
        content text NOT NULL DEFAULT '',
        group_id integer,
        visibility varchar(32) NOT NULL DEFAULT 'public',
        comment_policy varchar(32) NOT NULL DEFAULT 'everyone',
        is_private_topic boolean NOT NULL DEFAULT false,
        status varchar(32) NOT NULL DEFAULT 'active',
        requires_moderation boolean NOT NULL DEFAULT false,
        upvotes integer NOT NULL DEFAULT 0,
        downvotes integer NOT NULL DEFAULT 0,
        comments_count integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE community_post_comments (
        id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id varchar(255) NOT NULL,
        parent_comment_id varchar(255),
        author_id varchar(255),
        author_name varchar(100) NOT NULL,
        author_initials varchar(4) NOT NULL,
        author_color varchar(20) NOT NULL,
        content text NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'active',
        edited_at timestamptz,
        deleted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE community_post_reactions (post_id varchar(255) NOT NULL, user_id varchar(255) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (post_id, user_id));
      CREATE TABLE user_blocks (id serial PRIMARY KEY, blocker_id varchar(255), blocked_id varchar(255));
      CREATE TABLE user_follows (id serial PRIMARY KEY, follower_id varchar(255), following_id varchar(255), status varchar(32) NOT NULL DEFAULT 'accepted', created_at timestamptz NOT NULL DEFAULT now(), accepted_at timestamptz);
      CREATE TABLE member_connections (id serial PRIMARY KEY, requester_id varchar(255), recipient_id varchar(255), status varchar(32));
      CREATE TABLE group_members (id serial PRIMARY KEY, group_id integer, user_id varchar(255), role varchar(32));
      CREATE TABLE content_reports (id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id varchar(255), target_type varchar(32), target_id varchar(255), reason varchar(64), description text, status varchar(32) DEFAULT 'pending', created_at timestamptz DEFAULT now());
      CREATE TABLE notifications (id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar(255) NOT NULL, type varchar(32) NOT NULL, title text NOT NULL, body text NOT NULL, entity_id varchar(255), entity_type varchar(64), data jsonb, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE push_tokens (user_id varchar(255) PRIMARY KEY, token varchar(500) NOT NULL, platform varchar(20), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
    `);
    await client.query(`
      INSERT INTO users (id,email,first_name,last_name,username,is_private,notif_community) VALUES
        ('author','author@example.test','Author','Member','author',false,true),
        ('member','member@example.test','Member','One','member',false,true),
        ('other','other@example.test','Other','Member','other',false,true),
        ('quiet','quiet@example.test','Quiet','Member','quiet',false,false),
        ('private-author','private-author@example.test','Private','Author','private-author',true,true),
        ('outsider','outsider@example.test','Outside','Member','outsider',false,true)
    `);
    await client.query("INSERT INTO community_posts (id,author_id,author_name,author_initials,author_color,content) VALUES ('post','author','Author Member','AM','#3B1F0E','A public Community post'),('private-post','private-author','Private Author','PA','#3B1F0E','A private Community post')");

    const { default: communityRouter } = await import("../routes/community");
    const { default: followsRouter } = await import("../routes/follows");
    const app = express();
    app.use(express.json());
    const identities = new Map([
      "author", "member", "other", "quiet", "private-author", "outsider",
    ].map((id) => [id, { id, email: `${id}@example.test` }]));
    app.use((req: any, _res: any, next: () => void) => {
      req.user = identities.get(String(req.header("x-qa-user") ?? ""));
      req.isAuthenticated = () => Boolean(req.user);
      req.log = { error: (error: unknown) => {
        const detail = error && typeof error === "object" && "err" in error ? (error as { err?: { message?: unknown; code?: unknown } }).err : error;
        console.error("local-route-error", detail && typeof detail === "object" ? `${String((detail as { code?: unknown }).code ?? "unknown")}:${String((detail as { message?: unknown }).message ?? "route failure")}` : "route failure");
      }, warn: () => undefined, info: () => undefined };
      next();
    });
    app.use(communityRouter);
    app.use(followsRouter);
    const as = (id: string) => ({ "x-qa-user": id });

    const follow = await request(app).post("/users/author/follow").set(as("member"));
    assert(follow.status === 200 && follow.body.status === "accepted", `Public follow must succeed (status=${follow.status}, code=${String(follow.body?.error ?? "none").slice(0, 80)})`);
    assert(await notificationCount(client, "author") === 1, "Opted-in public follow must create one in-app notification");
    const duplicateFollow = await request(app).post("/users/author/follow").set(as("member"));
    assert(duplicateFollow.status === 200 && await notificationCount(client, "author") === 1, "Duplicate follow must not duplicate a notification");
    const unfollow = await request(app).delete("/users/author/follow").set(as("member"));
    assert(unfollow.status === 200, "Member must be able to unfollow a permitted account");
    const afterUnfollow = await client.query<{ followers_count: number; following_count: number }>("SELECT (SELECT followers_count FROM users WHERE id = 'author') AS followers_count, (SELECT following_count FROM users WHERE id = 'member') AS following_count");
    assert(afterUnfollow.rows[0]?.followers_count === 0 && afterUnfollow.rows[0]?.following_count === 0 && await notificationCount(client, "author") === 1, "Unfollow must restore counts without creating activity");
    const refollow = await request(app).post("/users/author/follow").set(as("member"));
    assert(refollow.status === 200 && await notificationCount(client, "author") === 2, "A later new follow must create exactly one new activity item");

    const pendingFollow = await request(app).post("/users/private-author/follow").set(as("member"));
    assert(pendingFollow.status === 200 && pendingFollow.body.status === "pending", "Private account must create a pending request");
    assert(await notificationCount(client, "private-author") === 1, "Opted-in pending request must create one in-app notification");
    const [{ id: pendingRequestId }] = (await client.query<{ id: number }>("SELECT id FROM user_follows WHERE follower_id = 'member' AND following_id = 'private-author' AND status = 'pending' LIMIT 1")).rows;
    const acceptFollow = await request(app).post(`/users/follow-requests/${pendingRequestId}/accept`).set(as("private-author"));
    assert(acceptFollow.status === 200 && await notificationCount(client, "member") === 1, "Accepting a private follow request must notify the opted-in requester");

    const like = await request(app).post("/community/posts/post/vote").set(as("member")).send({ direction: "up" });
    assert(like.status === 200 && like.body.liked === true, "Member must be able to like a permitted post");
    assert(await notificationCount(client, "author") === 3, "First like must create one recipient activity item");
    const duplicateLike = await request(app).post("/community/posts/post/vote").set(as("member")).send({ direction: "up" });
    assert(duplicateLike.status === 200 && await notificationCount(client, "author") === 3, "Repeat like must be idempotent");

    const comment = await request(app).post("/community/posts/post/comments").set(as("member")).send({ content: "Thoughtful public comment" });
    assert(comment.status === 201 && typeof comment.body.comment?.id === "string", "Permitted member comment must persist");
    const commentId = String(comment.body.comment.id);
    assert(await notificationCount(client, "author") === 4, "Top-level comment must notify only its opted-in post author");

    const reply = await request(app).post("/community/posts/post/comments").set(as("other")).send({ content: "Helpful reply", parentCommentId: commentId });
    assert(reply.status === 201 && reply.body.comment?.parentCommentId === commentId, "Reply must retain its same-post parent identifier");
    assert(await notificationCount(client, "member") === 2, "Reply must notify its opted-in parent-comment author");
    assert(await notificationCount(client, "author") === 4, "Reply must not duplicate a post-author notification");

    const crossPostReply = await request(app).post("/community/posts/private-post/comments").set(as("member")).send({ content: "Cross-post attempt", parentCommentId: commentId });
    assert(crossPostReply.status === 404, "A parent comment from another post must not be reused");

    const unauthorizedEdit = await request(app).patch(`/community/posts/post/comments/${commentId}`).set(as("other")).send({ content: "Unauthorized overwrite" });
    assert(unauthorizedEdit.status === 403, "Another member cannot edit a comment they do not own");
    const ownEdit = await request(app).patch(`/community/posts/post/comments/${commentId}`).set(as("member")).send({ content: "Corrected thoughtful comment" });
    assert(ownEdit.status === 200 && ownEdit.body.comment?.content === "Corrected thoughtful comment" && ownEdit.body.comment?.editedAt, "Comment author must be able to edit with audit timestamp");

    const reported = await request(app).post(`/community/posts/post/comments/${commentId}/report`).set(as("other")).send({ reason: "inappropriate" });
    assert(reported.status === 201, "Permitted member must be able to report a comment for moderation");
    const reportRows = await client.query("SELECT count(*)::int AS count FROM content_reports WHERE target_id = $1", [commentId]);
    assert(reportRows.rows[0]?.count === 1, "Report must be retained for moderation review");

    const commentList = await request(app).get("/community/posts/post/comments").set(as("author"));
    assert(commentList.status === 200 && commentList.body.comments.some((entry: { parentCommentId?: string; id: string }) => entry.id === commentId) && commentList.body.comments.some((entry: { parentCommentId?: string }) => entry.parentCommentId === commentId), "Authorized post viewer must receive the threaded comment contract");

    const deleted = await request(app).delete(`/community/posts/post/comments/${commentId}`).set(as("member"));
    assert(deleted.status === 200 && deleted.body.commentsCount === 0, "Deleting a parent comment must soft-delete its one-level reply and recalculate counts");
    const afterDelete = await request(app).get("/community/posts/post/comments").set(as("author"));
    assert(afterDelete.status === 200 && afterDelete.body.comments.length === 0, "Deleted parent and child reply must not remain readable");

    await client.query("UPDATE users SET notif_community = false WHERE id = 'author'");
    const quietComment = await request(app).post("/community/posts/post/comments").set(as("quiet")).send({ content: "No notification should be created" });
    assert(quietComment.status === 201 && await notificationCount(client, "author") === 4, "Disabled Community notifications must suppress both in-app and push activity");

    const blockedPost = await request(app).post("/community/posts/post/vote").set(as("outsider")).send({ direction: "up" });
    assert(blockedPost.status === 200, "Unblocked permitted member may react before a block");
    await client.query("INSERT INTO user_blocks (blocker_id,blocked_id) VALUES ('author','outsider')");
    const afterBlock = await request(app).post("/community/posts/post/comments").set(as("outsider")).send({ content: "Blocked attempt" });
    assert(afterBlock.status === 404, "Blocked member must not interact with a future post route");

    const privateFeed = await request(app).get("/community/posts/private-post/comments").set(as("outsider"));
    assert(privateFeed.status === 404, "Unrelated member must not read private-account post comments");

    const notificationRows = await client.query<{ body: string; data: unknown }>("SELECT body, data FROM notifications WHERE user_id = 'author' ORDER BY created_at ASC");
    assert(notificationRows.rows.every((row) => !row.body.includes("Thoughtful") && !row.body.includes("comment".repeat(50))), "In-app activity must not retain private comment content");
    console.log(JSON.stringify({
      status: "passed",
      localPostgres: true,
      actualCommunityRoutes: true,
      actualFollowRoutes: true,
      followLifecycle: true,
      likeIdempotency: true,
      commentReplyEditDelete: true,
      moderationReport: true,
      notificationPreferences: true,
      blockedAndPrivateAccessDenied: true,
      notificationContentRedacted: true,
    }));
  } finally {
    await client.end();
  }
}

main().finally(() => {
  try { shell(`${PG_BIN}/pg_ctl`, ["-D", directory, "-m", "immediate", "stop"]); } catch {}
  rmSync(directory, { recursive: true, force: true });
});
