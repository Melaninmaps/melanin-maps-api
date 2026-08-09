import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, pool, usersTable, profileTagsTable, reviewsTable, memberConnections, userFollowsTable, userBlocksTable } from "@workspace/db";
import { eq, ilike, or, and, ne, desc, inArray, sql } from "drizzle-orm";
import { objectStorageClient } from "../lib/objectStorage";
import { deleteAllSessionsForUser } from "../lib/auth";
import { decryptToken, generateClientSecret, revokeAppleToken } from "../lib/apple";
import { isAdmin } from "../lib/adminAuth";

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
function isReservedUsername(username: string): boolean {
  const n = username.toLowerCase().replace(/_/g, "");
  return ["mappingwithmelanin", "melaninmaps", "melaninmap", "melaninmapping", "mappingmelanin"].some(p => n.includes(p));
}

const router: IRouter = Router();

router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Auto-start 90-day community premium trial if not yet set
    if (!user.trialEndsAt) {
      const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await db.update(usersTable).set({ trialEndsAt }).where(eq(usersTable.id, req.user.id));
      user = { ...user, trialEndsAt };
    }

    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/users/check-username/:username", async (req: Request, res: Response) => {
  const raw = String(req.params.username ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!USERNAME_RE.test(raw)) {
    res.json({ available: false, reason: "Username must be 3–30 characters: letters, numbers, underscores only." });
    return;
  }
  if (isReservedUsername(raw) && !isAdmin(req)) {
    res.json({ available: false, reason: "That username is reserved." });
    return;
  }
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, raw))
      .limit(1);
    if (existing && req.user?.id && existing.id === req.user.id) {
      res.json({ available: true });
    } else {
      res.json({ available: !existing });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to check username");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/search", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const raw = String(req.query.q ?? "").trim().replace(/^@/, "");
    if (!raw || raw.length < 2) {
      res.json({ users: [] });
      return;
    }

    const pattern = `%${raw}%`;
    const results = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        bio: usersTable.bio,
      })
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, req.user.id),
          or(
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern),
            ilike(usersTable.username, pattern),
          )
        )
      )
      .limit(20);

    res.json({ users: results });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/suggestions", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const myId = req.user.id;
  try {
    const rows = await pool.query<{
      id: string; firstName: string | null; lastName: string | null;
      username: string | null; profileImageUrl: string | null; bio: string | null; mutualCount: number;
    }>(
      `WITH my_connections AS (
         SELECT
           CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END AS friend_id
         FROM member_connections
         WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'
       ),
       friend_of_friend AS (
         SELECT
           CASE WHEN mc.requester_id = my.friend_id THEN mc.recipient_id ELSE mc.requester_id END AS suggested_id,
           COUNT(*) AS mutual_count
         FROM member_connections mc
         JOIN my_connections my ON (mc.requester_id = my.friend_id OR mc.recipient_id = my.friend_id)
         WHERE mc.status = 'accepted'
           AND CASE WHEN mc.requester_id = my.friend_id THEN mc.recipient_id ELSE mc.requester_id END != $1
           AND CASE WHEN mc.requester_id = my.friend_id THEN mc.recipient_id ELSE mc.requester_id END NOT IN (SELECT friend_id FROM my_connections)
         GROUP BY suggested_id
       )
       SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName",
              u.username, u.profile_image_url AS "profileImageUrl", u.bio,
              COALESCE(fof.mutual_count, 0)::int AS "mutualCount"
       FROM users u
       LEFT JOIN friend_of_friend fof ON fof.suggested_id = u.id
       WHERE u.id != $1
         AND u.id NOT IN (SELECT friend_id FROM my_connections)
       ORDER BY fof.mutual_count DESC NULLS LAST, u.created_at DESC
       LIMIT 12`,
      [myId],
    );

    res.json({ suggestions: rows.rows });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/suggestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const { firstName, lastName, profileImageUrl, industry, jobTitle, username, bio } = req.body as Record<string, unknown>;

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof firstName === "string") updates.firstName = firstName.trim() || null;
    if (typeof lastName === "string") updates.lastName = lastName.trim() || null;
    if (typeof profileImageUrl === "string") updates.profileImageUrl = profileImageUrl.trim() || null;
    if (typeof industry === "string") updates.industry = industry.trim() || null;
    if (typeof jobTitle === "string") updates.jobTitle = jobTitle.trim() || null;
    if (typeof bio === "string") updates.bio = bio.trim().slice(0, 300) || null;
    if (typeof username === "string") {
      const clean = username.trim().toLowerCase().replace(/^@/, "");
      if (clean === "") {
        updates.username = null;
      } else if (!USERNAME_RE.test(clean)) {
        res.status(400).json({ error: "Username must be 3–30 characters: letters, numbers, underscores only." });
        return;
      } else if (isReservedUsername(clean) && !isAdmin(req)) {
        res.status(400).json({ error: "That username is reserved." });
        return;
      } else {
        const [existing] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(and(eq(usersTable.username, clean), ne(usersTable.id, req.user.id)))
          .limit(1);
        if (existing) {
          res.status(409).json({ error: "That username is already taken." });
          return;
        }
        updates.username = clean;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ── Privacy & bio update ────────────────────────────────────────────── */
router.patch("/users/me/privacy", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { isPrivate, bio } = req.body as Record<string, unknown>;

  try {
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof isPrivate === "boolean") updates.isPrivate = isPrivate;
    if (typeof bio === "string") updates.bio = bio.trim().slice(0, 300) || null;

    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

    const [user] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id))
      .returning({
        isPrivate: usersTable.isPrivate,
        bio: usersTable.bio,
      });

    // When switching to public: auto-accept all pending follow requests
    if (isPrivate === false) {
      const pending = await db
        .select({ id: userFollowsTable.id, followerId: userFollowsTable.followerId })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")));

      if (pending.length > 0) {
        await db.update(userFollowsTable)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(and(eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")));
        await db.update(usersTable)
          .set({ followersCount: sql`${usersTable.followersCount} + ${pending.length}` })
          .where(eq(usersTable.id, req.user.id));
        for (const p of pending) {
          await db.update(usersTable)
            .set({ followingCount: sql`${usersTable.followingCount} + 1` })
            .where(eq(usersTable.id, p.followerId));
        }
      }
    }

    res.json({ user });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/users/me/privacy error");
    res.status(500).json({ error: "Failed to update privacy setting" });
  }
});

router.get("/users/:userId/profile", async (req: Request, res: Response) => {
  try {
    const targetId = String(req.params.userId);
    const callerId = req.user?.id ?? null;

    const [user] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        bio: usersTable.bio,
        industry: usersTable.industry,
        jobTitle: usersTable.jobTitle,
        createdAt: usersTable.createdAt,
        memberType: usersTable.memberType,
      })
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);

    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Recent reviews with social post links
    const reviews = await db
      .select({
        id: reviewsTable.id,
        businessId: reviewsTable.businessId,
        rating: reviewsTable.rating,
        text: reviewsTable.text,
        socialPostUrl: reviewsTable.videoUrl,
        socialHandle: reviewsTable.socialHandle,
        socialPlatform: reviewsTable.socialPlatform,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, targetId), eq(reviewsTable.isAnonymous, false)))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(20);

    // Profile tags on this user's page
    const tags = await db
      .select({
        id: profileTagsTable.id,
        taggerId: profileTagsTable.taggerId,
        content: profileTagsTable.content,
        createdAt: profileTagsTable.createdAt,
        taggerFirstName: usersTable.firstName,
        taggerLastName: usersTable.lastName,
        taggerUsername: usersTable.username,
        taggerProfileImageUrl: usersTable.profileImageUrl,
      })
      .from(profileTagsTable)
      .leftJoin(usersTable, eq(profileTagsTable.taggerId, usersTable.id))
      .where(eq(profileTagsTable.taggedUserId, targetId))
      .orderBy(desc(profileTagsTable.createdAt))
      .limit(30);

    // Connection status (if caller is authenticated)
    let connectionStatus: string | null = null;
    let connectionId: number | null = null;
    if (callerId && callerId !== targetId) {
      const [conn] = await db
        .select({ id: memberConnections.id, status: memberConnections.status, requesterId: memberConnections.requesterId })
        .from(memberConnections)
        .where(
          or(
            and(eq(memberConnections.requesterId, callerId), eq(memberConnections.recipientId, targetId)),
            and(eq(memberConnections.requesterId, targetId), eq(memberConnections.recipientId, callerId)),
          ),
        )
        .limit(1);
      if (conn) {
        connectionStatus = conn.status === "accepted" ? "connected" : conn.requesterId === callerId ? "pending_sent" : "pending_received";
        connectionId = conn.id;
      }
    }

    res.json({ user, reviews, tags, connectionStatus, connectionId });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/:userId/profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Profile tags ────────────────────────────────────────────────────── */
router.post("/users/:userId/tags", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const taggedUserId = String(req.params.userId);
    const taggerId = req.user.id;
    if (taggerId === taggedUserId) { res.status(400).json({ error: "Cannot tag yourself" }); return; }

    const { content } = req.body as { content?: string };
    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (content.trim().length > 280) { res.status(400).json({ error: "Tag must be 280 chars or fewer" }); return; }

    const [tag] = await db
      .insert(profileTagsTable)
      .values({ taggerId, taggedUserId, content: content.trim() })
      .onConflictDoUpdate({ target: [profileTagsTable.taggerId, profileTagsTable.taggedUserId], set: { content: content.trim(), createdAt: new Date() } })
      .returning();

    res.status(201).json({ tag });
  } catch (err) {
    req.log.error({ err }, "POST /api/users/:userId/tags error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId/tags", async (req: Request, res: Response) => {
  try {
    const taggedUserId = String(req.params.userId);
    const tags = await db
      .select({
        id: profileTagsTable.id,
        taggerId: profileTagsTable.taggerId,
        content: profileTagsTable.content,
        createdAt: profileTagsTable.createdAt,
        taggerFirstName: usersTable.firstName,
        taggerLastName: usersTable.lastName,
        taggerUsername: usersTable.username,
        taggerProfileImageUrl: usersTable.profileImageUrl,
      })
      .from(profileTagsTable)
      .leftJoin(usersTable, eq(profileTagsTable.taggerId, usersTable.id))
      .where(eq(profileTagsTable.taggedUserId, taggedUserId))
      .orderBy(desc(profileTagsTable.createdAt))
      .limit(50);
    res.json({ tags });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/:userId/tags error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profile-tags/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const tagId = parseInt(String(req.params.id), 10);
    if (isNaN(tagId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user.id;

    const [tag] = await db.select().from(profileTagsTable).where(eq(profileTagsTable.id, tagId)).limit(1);
    if (!tag) { res.status(404).json({ error: "Tag not found" }); return; }
    if (tag.taggerId !== userId && tag.taggedUserId !== userId) {
      res.status(403).json({ error: "Not authorized to delete this tag" }); return;
    }

    await db.delete(profileTagsTable).where(eq(profileTagsTable.id, tagId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/profile-tags/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const userId = req.user.id;
  try {
    const [userRecord] = await db
      .select({ appleId: usersTable.appleId, appleRefreshToken: usersTable.appleRefreshToken })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!userRecord) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // ── Apple token revocation (non-blocking — before transaction per TN3194) ──
    const APPLE_CLIENT_ID = "com.melaninmaps.app";
    let appleRevocationStatus: string | undefined;

    if (userRecord.appleId) {
      if (userRecord.appleRefreshToken) {
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const rawKey = process.env.APPLE_PRIVATE_KEY;
        const encKey = process.env.APPLE_TOKEN_ENCRYPTION_KEY;
        if (teamId && keyId && rawKey && encKey) {
          try {
            const privateKey = rawKey.replace(/\\n/g, "\n");
            const plainToken = decryptToken(userRecord.appleRefreshToken, encKey);
            const clientSecret = generateClientSecret(teamId, keyId, privateKey, APPLE_CLIENT_ID);
            await revokeAppleToken(plainToken, APPLE_CLIENT_ID, clientSecret);
            appleRevocationStatus = "revoked";
            req.log.info({ event: "APPLE_TOKEN_REVOKED", userId }, "Apple refresh token revoked");
          } catch {
            appleRevocationStatus = "revocation_failed";
            req.log.error({ event: "APPLE_REVOCATION_FAILED", userId }, "Apple token revocation failed — proceeding with local deletion per TN3194");
          }
        } else {
          appleRevocationStatus = "revocation_failed";
          req.log.warn({ event: "APPLE_SECRETS_MISSING_AT_DELETION", userId }, "Apple credentials not configured — cannot revoke token");
        }
      } else {
        appleRevocationStatus = "manual_revocation_required";
        req.log.info({ event: "APPLE_LEGACY_USER_DELETION", userId }, "Legacy Apple user — no stored token, manual revocation required");
      }
    }

    // ── Atomic transaction: sessions + user row ──────────────────────────────
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM sessions WHERE sess->'user'->>'id' = $1`,
        [userId],
      );
      const result = await client.query<{ id: string }>(
        `DELETE FROM users WHERE id = $1 RETURNING id`,
        [userId],
      );
      if ((result.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "User not found" });
        return;
      }
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    req.log.info({ userId, appleRevocationStatus }, "User self-deleted account");
    const responseBody: Record<string, unknown> = { deleted: true };
    if (appleRevocationStatus) responseBody.appleRevocationStatus = appleRevocationStatus;
    res.json(responseBody);

  } catch (err) {
    req.log.error({ err }, "DELETE /api/users/me error");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

/* POST /users/match-contacts — find registered members by email list */
router.post("/users/match-contacts", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { emails } = req.body as { emails?: unknown };
  if (!Array.isArray(emails) || emails.length === 0) { res.json({ matches: [] }); return; }
  const normalized = [...new Set(
    (emails as unknown[]).filter((e): e is string => typeof e === "string")
      .map((e) => e.toLowerCase().trim())
      .filter((e) => e.includes("@"))
  )].slice(0, 500);
  if (normalized.length === 0) { res.json({ matches: [] }); return; }
  try {
    const matches = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        memberType: usersTable.memberType,
        bio: usersTable.bio,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.email, normalized), ne(usersTable.id, req.user.id)));
    res.json({ matches });
  } catch (err) {
    req.log.error({ err }, "POST /users/match-contacts error");
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /users/avatar — upload profile photo ──────────────────────────────
router.post("/users/avatar", avatarUpload.single("avatar"), async (req: any, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!req.file) { res.status(400).json({ error: "No image provided" }); return; }
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const { originalname, mimetype, buffer } = req.file;
    const ext = originalname.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
    const objectKey = `avatars/${req.user.id}/${randomUUID()}.${safeExt}`;
    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(buffer, { contentType: mimetype });
    await gcsFile.makePublic();
    const avatarUrl = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    await db
      .update(usersTable)
      .set({ profileImageUrl: avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id));
    res.json({ url: avatarUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to upload avatar");
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// GET /users/settings — fetch notification & quiet-hour preferences
router.get("/users/settings", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required." }); return; }
  try {
    const [user] = await db.select({
      notifEvents: usersTable.notifEvents,
      notifBusiness: usersTable.notifBusiness,
      notifMessages: usersTable.notifMessages,
      notifReviews: usersTable.notifReviews,
      notifCommunity: usersTable.notifCommunity,
      notifPromotions: usersTable.notifPromotions,
      notifDigest: usersTable.notifDigest,
      notifTips: usersTable.notifTips,
      notifPostNudges: usersTable.notifPostNudges,
      quietHoursEnabled: usersTable.quietHoursEnabled,
      quietHoursFrom: usersTable.quietHoursFrom,
      quietHoursUntil: usersTable.quietHoursUntil,
    }).from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found." }); return; }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "GET /api/users/settings error");
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

// PUT /users/settings — save notification & quiet-hour preferences
router.put("/users/settings", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required." }); return; }
  try {
    const {
      notifEvents, notifBusiness, notifMessages, notifReviews,
      notifCommunity, notifPromotions, notifDigest, notifTips, notifPostNudges,
      quietHoursEnabled, quietHoursFrom, quietHoursUntil,
    } = req.body as Record<string, unknown>;

    const patch: Record<string, unknown> = {};
    if (typeof notifEvents === "boolean") patch.notifEvents = notifEvents;
    if (typeof notifBusiness === "boolean") patch.notifBusiness = notifBusiness;
    if (typeof notifMessages === "boolean") patch.notifMessages = notifMessages;
    if (typeof notifReviews === "boolean") patch.notifReviews = notifReviews;
    if (typeof notifCommunity === "boolean") patch.notifCommunity = notifCommunity;
    if (typeof notifPromotions === "boolean") patch.notifPromotions = notifPromotions;
    if (typeof notifDigest === "boolean") patch.notifDigest = notifDigest;
    if (typeof notifTips === "boolean") patch.notifTips = notifTips;
    if (typeof notifPostNudges === "boolean") patch.notifPostNudges = notifPostNudges;
    if (typeof quietHoursEnabled === "boolean") patch.quietHoursEnabled = quietHoursEnabled;
    if (typeof quietHoursFrom === "string") patch.quietHoursFrom = quietHoursFrom;
    if (typeof quietHoursUntil === "string") patch.quietHoursUntil = quietHoursUntil;

    if (Object.keys(patch).length === 0) { res.json({ ok: true }); return; }
    await db.update(usersTable).set(patch).where(eq(usersTable.id, req.user.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PUT /api/users/settings error");
    res.status(500).json({ error: "Failed to save settings." });
  }
});


// ─── Block / Unblock ────────────────────────────────────────────────────────

// POST /api/users/:id/block — block a user (Guideline 1.2 UGC safety)
router.post("/users/:id/block", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Authentication required" }); return; }
  const targetId = req.params.id;
  if (targetId === req.user.id) { res.status(400).json({ error: "Cannot block yourself" }); return; }
  try {
    await db.insert(userBlocksTable).values({
      blockerId: req.user.id,
      blockedId: targetId,
    }).onConflictDoNothing();
    // Also unfollow if following
    await db.delete(userFollowsTable).where(
      and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, targetId))
    );
    res.json({ ok: true, blocked: true });
  } catch (err) {
    req.log.error({ err }, "POST /api/users/:id/block error");
    res.status(500).json({ error: "Failed to block user" });
  }
});

// DELETE /api/users/:id/block — unblock a user
router.delete("/users/:id/block", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db.delete(userBlocksTable).where(
      and(eq(userBlocksTable.blockerId, req.user.id), eq(userBlocksTable.blockedId, req.params.id))
    );
    res.json({ ok: true, blocked: false });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/users/:id/block error");
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

export default router;
