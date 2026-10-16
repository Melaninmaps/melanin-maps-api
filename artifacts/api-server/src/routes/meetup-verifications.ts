import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import {
  db,
  memberConnections,
  meetupVerificationsTable,
  pool,
  userBlocksTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendPushToUser } from "../lib/pushNotifications";
import {
  MEETUP_RETENTION_MS,
  MEETUP_SAFETY_POLICY_VERSION,
  optionalSafeText,
  parseOptionalFutureDate,
  resolveMeetupEligibility,
  validateMeetingPlace,
  type MeetupAgeBand,
} from "../meetups/meetupSafetyPolicy";
import {
  buildMeetupIdentityTransparency,
  identityAcknowledgmentMatches,
  meetupIdentityStatusChangeNotice,
  type MeetupIdentityStatus,
} from "../meetups/meetupIdentityTransparency";

const router: IRouter = Router();
const MAX_MEETUP_NOTE_LENGTH = 500;
const MEETUP_MUTATION_WINDOW_MS = 10 * 60 * 1000;
const MEETUP_MUTATION_LIMIT = 12;
const meetupMutationAttempts = new Map<string, number[]>();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function requireAdmin(req: Request, res: Response): boolean {
  const role = (req.user as { role?: unknown } | undefined)?.role;
  if (role !== "admin") {
    res.status(403).json({ error: "Administrator access required" });
    return false;
  }
  return true;
}

function numericId(value: unknown): number | null {
  const id = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function serializedVerification<T extends { clearCode?: string | null }>(verification: T) {
  return { ...verification, hasClearCode: Boolean(verification.clearCode), clearCode: undefined };
}

function serializedMeetupWithIdentity(
  verification: Record<string, unknown> & { clearCode?: string | null },
  viewerId: string,
) {
  const initiatorIdentity = buildMeetupIdentityTransparency({
    identityVerified: verification.initiatorIdentityVerified as boolean | null | undefined,
    identityVerifiedAt: verification.initiatorIdentityVerifiedAt as Date | string | null | undefined,
    memberSince: verification.initiatorMemberSince as Date | string | null | undefined,
  });
  const partnerIdentity = buildMeetupIdentityTransparency({
    identityVerified: verification.partnerIdentityVerified as boolean | null | undefined,
    identityVerifiedAt: verification.partnerIdentityVerifiedAt as Date | string | null | undefined,
    memberSince: verification.partnerMemberSince as Date | string | null | undefined,
  });
  const viewerIsInitiator = verification.initiatorId === viewerId;
  const counterpartIdentity = viewerIsInitiator ? partnerIdentity : initiatorIdentity;
  const acknowledgedCounterpartStatus = viewerIsInitiator
    ? verification.initiatorIdentityStatusAcknowledged
    : verification.partnerIdentityStatusAcknowledged;
  const identityStatusChange = verification.status === "confirmed"
    ? meetupIdentityStatusChangeNotice(acknowledgedCounterpartStatus, counterpartIdentity.status)
    : { changed: false, notice: null };
  const {
    initiatorIdentityVerified: _initiatorIdentityVerified,
    initiatorIdentityVerifiedAt: _initiatorIdentityVerifiedAt,
    initiatorMemberSince: _initiatorMemberSince,
    partnerIdentityVerified: _partnerIdentityVerified,
    partnerIdentityVerifiedAt: _partnerIdentityVerifiedAt,
    partnerMemberSince: _partnerMemberSince,
    initiatorIdentityStatusAcknowledged: _initiatorIdentityStatusAcknowledged,
    partnerIdentityStatusAcknowledged: _partnerIdentityStatusAcknowledged,
    ...publicVerification
  } = verification;
  return {
    ...serializedVerification(publicVerification),
    initiatorIdentity,
    partnerIdentity,
    counterpartIdentity,
    counterpartIdentityStatusChanged: identityStatusChange.changed,
    counterpartIdentityStatusChangeNotice: identityStatusChange.notice,
  };
}

function invalidRequest(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "Invalid meetup request.";
  res.status(400).json({ error: message });
}

function allowMeetupMutation(userId: string, res: Response): boolean {
  const now = Date.now();
  const recent = (meetupMutationAttempts.get(userId) ?? [])
    .filter((time) => time > now - MEETUP_MUTATION_WINDOW_MS);
  if (recent.length >= MEETUP_MUTATION_LIMIT) {
    res.status(429).json({ error: "Too many meetup changes. Please wait a few minutes and try again." });
    return false;
  }
  recent.push(now);
  meetupMutationAttempts.set(userId, recent);
  return true;
}

const initiatorUser = alias(usersTable, "initiator_user");
const partnerUser = alias(usersTable, "partner_user");
const watcherUser = alias(usersTable, "watcher_user");

type TrustedSafetyContact = {
  id: string;
  contactUserId: string;
  contactName: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
};

async function getMeetupEligibility(userId: string) {
  const result = await pool.query<{
    age_band: MeetupAgeBand | null;
  }>(
    `SELECT COALESCE(uaa.age_band, 'unknown') AS age_band
       FROM users u
       LEFT JOIN user_age_assurance uaa ON uaa.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  const row = result.rows[0] ?? { age_band: "unknown" as const };
  return resolveMeetupEligibility(row.age_band ?? "unknown");
}

async function getMeetupIdentityTransparency(userId: string) {
  const [user] = await db
    .select({
      identityVerified: usersTable.identityVerified,
      identityVerifiedAt: usersTable.identityVerifiedAt,
      memberSince: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return buildMeetupIdentityTransparency({
    identityVerified: user?.identityVerified,
    identityVerifiedAt: user?.identityVerifiedAt,
    memberSince: user?.memberSince,
  });
}

async function getTrustedSafetyContacts(ownerId: string): Promise<TrustedSafetyContact[]> {
  const result = await pool.query<{
    id: string;
    contact_user_id: string;
    contact_name: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }>(
    `SELECT tss.id, tss.contact_user_id, tss.contact_name,
            u.first_name, u.last_name, u.username
       FROM trusted_safety_shares tss
       JOIN users u ON u.id = tss.contact_user_id
      WHERE tss.owner_id = $1
        AND tss.contact_type = 'mwm_user'
        AND tss.contact_user_id IS NOT NULL
        AND tss.owner_enabled = true
        AND tss.contact_accepted = true
        AND tss.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks ub
           WHERE (ub.blocker_id = $1 AND ub.blocked_id = tss.contact_user_id)
              OR (ub.blocker_id = tss.contact_user_id AND ub.blocked_id = $1)
        )
      ORDER BY tss.contact_name ASC`,
    [ownerId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    contactUserId: row.contact_user_id,
    contactName: row.contact_name,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
  }));
}

async function requireAcceptedConnection(
  userId: string,
  partnerId: string,
  connectionId: number,
): Promise<boolean> {
  const [connection] = await db
    .select({ id: memberConnections.id })
    .from(memberConnections)
    .where(and(
      eq(memberConnections.id, connectionId),
      eq(memberConnections.status, "accepted"),
      or(
        and(eq(memberConnections.requesterId, userId), eq(memberConnections.recipientId, partnerId)),
        and(eq(memberConnections.requesterId, partnerId), eq(memberConnections.recipientId, userId)),
      ),
    ))
    .limit(1);
  return Boolean(connection);
}

async function usersAreBlocked(firstUserId: string, secondUserId: string): Promise<boolean> {
  const [block] = await db
    .select({ id: userBlocksTable.id })
    .from(userBlocksTable)
    .where(or(
      and(eq(userBlocksTable.blockerId, firstUserId), eq(userBlocksTable.blockedId, secondUserId)),
      and(eq(userBlocksTable.blockerId, secondUserId), eq(userBlocksTable.blockedId, firstUserId)),
    ))
    .limit(1);
  return Boolean(block);
}

async function usersHaveActiveMeetupSafetyReport(firstUserId: string, secondUserId: string): Promise<boolean> {
  const result = await pool.query<{ restricted: boolean }>(
    `SELECT EXISTS(
       SELECT 1
         FROM meetup_member_safety_reports
        WHERE status = 'active'
          AND (
            (reporter_user_id = $1 AND reported_user_id = $2)
            OR (reporter_user_id = $2 AND reported_user_id = $1)
          )
     ) AS restricted`,
    [firstUserId, secondUserId],
  );
  return Boolean(result.rows[0]?.restricted);
}

async function meetupRestrictedBetween(firstUserId: string, secondUserId: string): Promise<boolean> {
  const [blocked, reported] = await Promise.all([
    usersAreBlocked(firstUserId, secondUserId),
    usersHaveActiveMeetupSafetyReport(firstUserId, secondUserId),
  ]);
  return blocked || reported;
}

async function displayName(userId: string): Promise<string> {
  const [user] = await db
    .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "A community member";
}

// GET /meetups/eligibility — a narrow, privacy-preserving gate for every client.
router.get("/meetups/eligibility", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const eligibility = await getMeetupEligibility(userId);
    res.json({ ...eligibility, policyVersion: MEETUP_SAFETY_POLICY_VERSION });
  } catch (err) {
    req.log.error({ err }, "GET /meetups/eligibility error");
    res.status(500).json({ error: "Failed to evaluate meetup eligibility" });
  }
});

// GET /meetups/trusted-contacts — only contacts that have already accepted a
// separate Safety Hub share. No ad-hoc phone number or email collection.
router.get("/meetups/trusted-contacts", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const contacts = await getTrustedSafetyContacts(userId);
    res.json({ contacts });
  } catch (err) {
    req.log.error({ err }, "GET /meetups/trusted-contacts error");
    res.status(500).json({ error: "Failed to load trusted contacts" });
  }
});

// GET /meetups — list only the current member's retained, non-cleared records.
router.get("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const verifications = await db
      .select({
        id: meetupVerificationsTable.id,
        initiatorId: meetupVerificationsTable.initiatorId,
        partnerId: meetupVerificationsTable.partnerId,
        connectionId: meetupVerificationsTable.connectionId,
        city: meetupVerificationsTable.city,
        venueName: meetupVerificationsTable.location,
        scheduledFor: meetupVerificationsTable.scheduledFor,
        note: meetupVerificationsTable.note,
        status: meetupVerificationsTable.status,
        initiatedAt: meetupVerificationsTable.initiatedAt,
        confirmedAt: meetupVerificationsTable.confirmedAt,
        declinedAt: meetupVerificationsTable.declinedAt,
        rescheduleRequestedAt: meetupVerificationsTable.rescheduleRequestedAt,
        rescheduleNote: meetupVerificationsTable.rescheduleNote,
        expiresAt: meetupVerificationsTable.expiresAt,
        clearCode: meetupVerificationsTable.clearCode,
        safetyWatcherId: meetupVerificationsTable.safetyWatcherId,
        arrivalCheckAt: meetupVerificationsTable.arrivalCheckAt,
        arrivalCheckedAt: meetupVerificationsTable.arrivalCheckedAt,
        arrivalCheckStatus: meetupVerificationsTable.arrivalCheckStatus,
        homeCheckAt: meetupVerificationsTable.homeCheckAt,
        homeCheckedAt: meetupVerificationsTable.homeCheckedAt,
        homeCheckStatus: meetupVerificationsTable.homeCheckStatus,
        initiatorFirstName: initiatorUser.firstName,
        initiatorLastName: initiatorUser.lastName,
        initiatorUsername: initiatorUser.username,
        initiatorIdentityVerified: initiatorUser.identityVerified,
        initiatorIdentityVerifiedAt: initiatorUser.identityVerifiedAt,
        initiatorMemberSince: initiatorUser.createdAt,
        initiatorIdentityStatusAcknowledged: meetupVerificationsTable.initiatorIdentityStatusAcknowledged,
        partnerFirstName: partnerUser.firstName,
        partnerLastName: partnerUser.lastName,
        partnerUsername: partnerUser.username,
        partnerIdentityVerified: partnerUser.identityVerified,
        partnerIdentityVerifiedAt: partnerUser.identityVerifiedAt,
        partnerMemberSince: partnerUser.createdAt,
        partnerIdentityStatusAcknowledged: meetupVerificationsTable.partnerIdentityStatusAcknowledged,
        watcherFirstName: watcherUser.firstName,
        watcherLastName: watcherUser.lastName,
        watcherUsername: watcherUser.username,
      })
      .from(meetupVerificationsTable)
      .leftJoin(initiatorUser, eq(initiatorUser.id, meetupVerificationsTable.initiatorId))
      .leftJoin(partnerUser, eq(partnerUser.id, meetupVerificationsTable.partnerId))
      .leftJoin(watcherUser, eq(watcherUser.id, meetupVerificationsTable.safetyWatcherId))
      .where(and(
        or(eq(meetupVerificationsTable.initiatorId, userId), eq(meetupVerificationsTable.partnerId, userId)),
        isNull(meetupVerificationsTable.clearedAt),
        gt(meetupVerificationsTable.expiresAt, new Date()),
      ))
      .orderBy(desc(meetupVerificationsTable.initiatedAt))
      .limit(50);

    res.json({ verifications: verifications.map((verification) => serializedMeetupWithIdentity(verification, userId)) });
  } catch (err) {
    req.log.error({ err }, "GET /meetups error");
    res.status(500).json({ error: "Failed to load meetups" });
  }
});

// GET /meetups/partner-check — an informational identity signal, never a gate.
router.get("/meetups/partner-check", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const { partnerId, connectionId: rawConnectionId } = req.query;
  const connectionId = numericId(rawConnectionId);
  if (!partnerId || typeof partnerId !== "string" || !connectionId) {
    res.status(400).json({ error: "partnerId and accepted connectionId are required" });
    return;
  }
  try {
    if (!await requireAcceptedConnection(userId, partnerId, connectionId)) {
      res.status(403).json({ error: "Meetup Verification is available only to accepted connections." });
      return;
    }
    if (await meetupRestrictedBetween(userId, partnerId)) {
      res.status(403).json({ error: "Meetup Verification is unavailable for this connection." });
      return;
    }
    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        identityVerified: usersTable.identityVerified,
        identityVerifiedAt: usersTable.identityVerifiedAt,
        memberSince: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, partnerId))
      .limit(1);
    if (!user) { res.status(404).json({ error: "Connection is unavailable" }); return; }
    const identity = buildMeetupIdentityTransparency(user);
    res.json({
      displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Community Member",
      identity,
      message: identity.message,
    });
  } catch (err) {
    req.log.error({ err }, "GET /meetups/partner-check error");
    res.status(500).json({ error: "Failed to check connection" });
  }
});

// POST /meetups — create a consent-first request. No exact address, coordinate,
// ad-hoc phone number, or ad-hoc email is accepted in this flow.
router.post("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  try {
    const {
      partnerId,
      connectionId: rawConnectionId,
      city: rawCity,
      venueName: rawVenueName,
      scheduledFor: rawScheduledFor,
      note: rawNote,
      clearCode: rawClearCode,
      trustedSafetyContactId,
      arrivalCheckAt: rawArrivalCheckAt,
      homeCheckAt: rawHomeCheckAt,
      acknowledgedSafetyNotice,
      acknowledgedPartnerIdentityStatus,
    } = req.body as Record<string, unknown>;

    if (typeof partnerId !== "string" || !partnerId.trim()) {
      res.status(400).json({ error: "partnerId is required" }); return;
    }
    const normalizedPartnerId = partnerId.trim();
    const connectionId = numericId(rawConnectionId);
    if (!connectionId) { res.status(400).json({ error: "An accepted connection is required." }); return; }
    if (normalizedPartnerId === userId) { res.status(400).json({ error: "You cannot request a meetup with yourself." }); return; }
    if (acknowledgedSafetyNotice !== true) { res.status(400).json({ error: "Acknowledge the safety notice before sending a request." }); return; }

    const [initiatorEligibility, partnerEligibility] = await Promise.all([
      getMeetupEligibility(userId),
      getMeetupEligibility(normalizedPartnerId),
    ]);
    if (!initiatorEligibility.allowed) { res.status(403).json({ error: initiatorEligibility.message, code: initiatorEligibility.code }); return; }
    if (!partnerEligibility.allowed) { res.status(403).json({ error: "This connection is not currently eligible for Meetup Verification." }); return; }
    if (!await requireAcceptedConnection(userId, normalizedPartnerId, connectionId)) {
      res.status(403).json({ error: "Meetup Verification is available only to accepted connections." }); return;
    }
    if (await meetupRestrictedBetween(userId, normalizedPartnerId)) {
      res.status(403).json({ error: "Meetup Verification is unavailable for this connection." }); return;
    }
    const partnerIdentity = await getMeetupIdentityTransparency(normalizedPartnerId);
    if (!identityAcknowledgmentMatches(acknowledgedPartnerIdentityStatus, partnerIdentity.status)) {
      res.status(409).json({
        error: "Review and acknowledge the connection's current identity-verification status before sending a meetup request.",
        identity: partnerIdentity,
      });
      return;
    }

    const city = optionalSafeText(rawCity, "City", 120);
    const venueName = optionalSafeText(rawVenueName, "Public venue or area", 120);
    const note = optionalSafeText(rawNote, "Note", MAX_MEETUP_NOTE_LENGTH);
    validateMeetingPlace(city, venueName);
    validateMeetingPlace(null, note);
    const scheduledFor = parseOptionalFutureDate(rawScheduledFor, "Meeting time");
    const arrivalCheckAt = parseOptionalFutureDate(rawArrivalCheckAt, "Arrival check-in time");
    const homeCheckAt = parseOptionalFutureDate(rawHomeCheckAt, "Home check-in time");
    if (arrivalCheckAt && homeCheckAt && homeCheckAt <= arrivalCheckAt) {
      res.status(400).json({ error: "Home check-in must be after the arrival check-in." }); return;
    }
    const clearCode = optionalSafeText(rawClearCode, "Clear code", 100);
    // New clear codes are stored as hashes. The early-clear handler retains a
    // narrow legacy comparison only for records created before this policy.
    const clearCodeHash = clearCode ? await bcrypt.hash(clearCode, 10) : null;

    let safetyWatcherId: string | null = null;
    if (trustedSafetyContactId !== undefined && trustedSafetyContactId !== null && trustedSafetyContactId !== "") {
      if (typeof trustedSafetyContactId !== "string") { res.status(400).json({ error: "Invalid trusted contact." }); return; }
      const contact = (await getTrustedSafetyContacts(userId)).find((item) => item.id === trustedSafetyContactId);
      if (!contact || contact.contactUserId === normalizedPartnerId) {
        res.status(400).json({ error: "Choose an existing, accepted trusted contact who is not your meetup partner." }); return;
      }
      safetyWatcherId = contact.contactUserId;
    }

    const now = new Date();
    const retentionDeleteAt = new Date(now.getTime() + MEETUP_RETENTION_MS);
    const [verification] = await db.insert(meetupVerificationsTable).values({
      initiatorId: userId,
      partnerId: normalizedPartnerId,
      connectionId,
      city,
      location: venueName,
      scheduledFor,
      note,
      status: "pending",
      initiatedAt: now,
      expiresAt: retentionDeleteAt,
      retentionDeleteAt,
      clearCode: clearCodeHash,
      safetyWatcherId,
      arrivalCheckAt,
      arrivalCheckStatus: arrivalCheckAt ? "pending" : null,
      homeCheckAt,
      homeCheckStatus: homeCheckAt ? "pending" : null,
      consentAcknowledgedAt: now,
      initiatorIdentityAcknowledgedAt: now,
      initiatorIdentityStatusAcknowledged: partnerIdentity.status,
      policyVersion: MEETUP_SAFETY_POLICY_VERSION,
    }).returning();
    if (!verification) {
      throw new Error("Meetup request could not be created.");
    }

    const initiatorName = await displayName(userId);
    void sendPushToUser(normalizedPartnerId, {
      title: "Meetup Verification request",
      body: `${initiatorName} sent you a meetup request. Review the details and choose your response.`,
      data: { screen: "member-connections", meetupId: verification.id, type: "meetup_request" },
    });
    if (safetyWatcherId) {
      void sendPushToUser(safetyWatcherId, {
        title: "Trusted-contact check-in planned",
        body: `${initiatorName} selected you for a meetup check-in. You will be notified only if a scheduled check-in is missed.`,
        data: { screen: "safety-hub", meetupId: verification.id, type: "meetup_trusted_contact" },
      });
    }

    const initiatorIdentity = await getMeetupIdentityTransparency(userId);
    res.status(201).json({
      verification: Object.assign(
        serializedVerification(verification as { clearCode?: string | null }),
        {
        initiatorIdentity,
        partnerIdentity,
        counterpartIdentity: partnerIdentity,
        counterpartIdentityStatusChanged: false,
        counterpartIdentityStatusChangeNotice: null,
        },
      ),
    });
  } catch (err) {
    if (err instanceof Error && /must be|street address|future|valid date-time/.test(err.message)) {
      invalidRequest(res, err); return;
    }
    req.log.error({ err }, "POST /meetups error");
    res.status(500).json({ error: "Failed to create meetup verification" });
  }
});

async function loadMeetupForParticipant(id: number, userId: string) {
  const [verification] = await db.select().from(meetupVerificationsTable)
    .where(and(
      eq(meetupVerificationsTable.id, id),
      or(eq(meetupVerificationsTable.initiatorId, userId), eq(meetupVerificationsTable.partnerId, userId)),
      isNull(meetupVerificationsTable.clearedAt),
      gt(meetupVerificationsTable.expiresAt, new Date()),
    ))
    .limit(1);
  return verification;
}

// PATCH /meetups/:id/respond — partner accepts, declines, or requests a reschedule.
router.patch("/meetups/:id/respond", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification || verification.partnerId !== userId) { res.status(404).json({ error: "Meetup request not found" }); return; }
    const action = req.body?.action;
    if (action !== "confirm" && action !== "decline" && action !== "request_reschedule") {
      res.status(400).json({ error: "Choose confirm, decline, or request_reschedule." }); return;
    }
    if (!["pending", "reschedule_requested"].includes(verification.status)) {
      res.status(409).json({ error: "This meetup request can no longer be changed." }); return;
    }

    const now = new Date();
    let update: Partial<typeof meetupVerificationsTable.$inferInsert>;
    let notificationBody: string;
    if (action === "confirm") {
      const initiatorIdentity = await getMeetupIdentityTransparency(verification.initiatorId);
      if (!identityAcknowledgmentMatches(req.body?.acknowledgedPartnerIdentityStatus, initiatorIdentity.status)) {
        res.status(409).json({
          error: "Review and acknowledge the requester's current identity-verification status before confirming.",
          identity: initiatorIdentity,
        });
        return;
      }
      update = {
        status: "confirmed",
        confirmedAt: now,
        partnerIdentityAcknowledgedAt: now,
        partnerIdentityStatusAcknowledged: initiatorIdentity.status,
      };
      notificationBody = "confirmed your meetup request.";
    } else if (action === "decline") {
      update = { status: "declined", declinedAt: now };
      notificationBody = "declined your meetup request.";
    } else {
      const rescheduleNote = optionalSafeText(req.body?.rescheduleNote, "Reschedule note", 300);
      update = { status: "reschedule_requested", rescheduleRequestedAt: now, rescheduleNote };
      notificationBody = "asked to reschedule your meetup request.";
    }
    const [updated] = await db.update(meetupVerificationsTable).set(update)
      .where(eq(meetupVerificationsTable.id, id)).returning();
    const partnerName = await displayName(userId);
    void sendPushToUser(verification.initiatorId, {
      title: "Meetup Verification update",
      body: `${partnerName} ${notificationBody}`,
      data: { screen: "member-connections", meetupId: id, type: "meetup_response" },
    });
    res.json({ verification: serializedVerification(updated) });
  } catch (err) {
    if (err instanceof Error && /must be/.test(err.message)) { invalidRequest(res, err); return; }
    req.log.error({ err }, "PATCH /meetups/:id/respond error");
    res.status(500).json({ error: "Failed to update meetup request" });
  }
});

// Backward-compatible confirmation endpoint. New clients use /respond so that
// they can also decline or request a reschedule.
router.patch("/meetups/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification || verification.partnerId !== userId) { res.status(404).json({ error: "Meetup request not found" }); return; }
    if (!["pending", "reschedule_requested"].includes(verification.status)) {
      res.status(409).json({ error: "This meetup request can no longer be confirmed." }); return;
    }
    const initiatorIdentity = await getMeetupIdentityTransparency(verification.initiatorId);
    if (!identityAcknowledgmentMatches(req.body?.acknowledgedPartnerIdentityStatus, initiatorIdentity.status)) {
      res.status(409).json({
        error: "Review and acknowledge the requester's current identity-verification status before confirming.",
        identity: initiatorIdentity,
      });
      return;
    }
    const [updated] = await db.update(meetupVerificationsTable)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        partnerIdentityAcknowledgedAt: new Date(),
        partnerIdentityStatusAcknowledged: initiatorIdentity.status,
      })
      .where(eq(meetupVerificationsTable.id, id))
      .returning();
    const partnerName = await displayName(userId);
    void sendPushToUser(verification.initiatorId, {
      title: "Meetup Verification update",
      body: `${partnerName} confirmed your meetup request.`,
      data: { screen: "member-connections", meetupId: id, type: "meetup_response" },
    });
    res.json({ verification: serializedVerification(updated) });
  } catch (err) {
    req.log.error({ err }, "PATCH /meetups/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm meetup request" });
  }
});

// PATCH /meetups/:id/reschedule — the initiator publishes a new optional city,
// public venue, and time after a reschedule request. It does not change consent.
router.patch("/meetups/:id/reschedule", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification || verification.initiatorId !== userId) { res.status(404).json({ error: "Meetup request not found" }); return; }
    if (verification.status !== "reschedule_requested") { res.status(409).json({ error: "A reschedule has not been requested." }); return; }
    const city = optionalSafeText(req.body?.city, "City", 120);
    const venueName = optionalSafeText(req.body?.venueName, "Public venue or area", 120);
    const scheduledFor = parseOptionalFutureDate(req.body?.scheduledFor, "Meeting time");
    validateMeetingPlace(city, venueName);
    const [updated] = await db.update(meetupVerificationsTable).set({
      city,
      location: venueName,
      scheduledFor,
      status: "pending",
      rescheduleRequestedAt: null,
      rescheduleNote: null,
      confirmedAt: null,
    }).where(eq(meetupVerificationsTable.id, id)).returning();
    const initiatorName = await displayName(userId);
    void sendPushToUser(verification.partnerId, {
      title: "Updated meetup request",
      body: `${initiatorName} shared updated meetup details for your review.`,
      data: { screen: "member-connections", meetupId: id, type: "meetup_rescheduled" },
    });
    res.json({ verification: serializedVerification(updated) });
  } catch (err) {
    if (err instanceof Error && /must be|street address|future|valid date-time/.test(err.message)) { invalidRequest(res, err); return; }
    req.log.error({ err }, "PATCH /meetups/:id/reschedule error");
    res.status(500).json({ error: "Failed to reschedule meetup request" });
  }
});

// PATCH /meetups/:id/cancel — either participant can revoke their consent.
router.patch("/meetups/:id/cancel", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification) { res.status(404).json({ error: "Meetup request not found" }); return; }
    if (["cancelled", "declined", "cleared"].includes(verification.status)) {
      res.status(409).json({ error: "This meetup request has already ended." }); return;
    }
    const [updated] = await db.update(meetupVerificationsTable)
      .set({ status: "cancelled", clearedAt: new Date() })
      .where(eq(meetupVerificationsTable.id, id))
      .returning();
    const otherUserId = verification.initiatorId === userId ? verification.partnerId : verification.initiatorId;
    const actorName = await displayName(userId);
    void sendPushToUser(otherUserId, {
      title: "Meetup Verification cancelled",
      body: `${actorName} cancelled this meetup request.`,
      data: { screen: "member-connections", meetupId: id, type: "meetup_cancelled" },
    });
    res.json({ verification: serializedVerification(updated) });
  } catch (err) {
    req.log.error({ err }, "PATCH /meetups/:id/cancel error");
    res.status(500).json({ error: "Failed to cancel meetup request" });
  }
});

async function recordCheckin(req: Request, res: Response, field: "arrival" | "home") {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification || verification.initiatorId !== userId) { res.status(404).json({ error: "Meetup record not found" }); return; }
    const checkAt = field === "arrival" ? verification.arrivalCheckAt : verification.homeCheckAt;
    const checkStatus = field === "arrival" ? verification.arrivalCheckStatus : verification.homeCheckStatus;
    if (!checkAt) { res.status(400).json({ error: `No ${field} check-in was scheduled.` }); return; }
    if (checkStatus === "confirmed") { res.status(409).json({ error: `${field} check-in is already confirmed.` }); return; }
    const [updated] = await db.update(meetupVerificationsTable).set(
      field === "arrival"
        ? { arrivalCheckedAt: new Date(), arrivalCheckStatus: "confirmed" }
        : { homeCheckedAt: new Date(), homeCheckStatus: "confirmed" },
    ).where(eq(meetupVerificationsTable.id, id)).returning();
    res.json({ verification: serializedVerification(updated) });
  } catch (err) {
    req.log.error({ err }, "PATCH meetup check-in error");
    res.status(500).json({ error: "Failed to record check-in" });
  }
}

router.patch("/meetups/:id/arrival-checkin", (req, res) => recordCheckin(req, res, "arrival"));
router.patch("/meetups/:id/home-checkin", (req, res) => recordCheckin(req, res, "home"));

// DELETE /meetups/:id — the initiator may remove their retained record early.
router.delete("/meetups/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  if (!allowMeetupMutation(userId, res)) return;
  const id = numericId(req.params["id"]); if (!id) { res.status(400).json({ error: "Invalid meetup ID" }); return; }
  try {
    const verification = await loadMeetupForParticipant(id, userId);
    if (!verification || verification.initiatorId !== userId) {
      res.status(404).json({ error: "Meetup record not found" }); return;
    }
    const suppliedClearCode = typeof req.body?.clearCode === "string" ? req.body.clearCode.trim() : "";
    const clearCodeMatches = verification.clearCode
      ? verification.clearCode.startsWith("$2")
        ? await bcrypt.compare(suppliedClearCode, verification.clearCode)
        : suppliedClearCode === verification.clearCode
      : true;
    if (!clearCodeMatches) {
      res.status(400).json({ error: "The creator's clear code is required to remove this record early." }); return;
    }
    await db.update(meetupVerificationsTable)
      .set({ clearedAt: new Date(), status: "cleared" })
      .where(eq(meetupVerificationsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /meetups/:id error");
    res.status(500).json({ error: "Failed to clear meetup record" });
  }
});

// Explicitly retired: this v1 never introduces a new ad-hoc email recipient.
router.post("/meetups/:id/share", (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Use an existing accepted trusted contact in Safety Hub. New meetup requests do not collect ad-hoc email addresses.",
  });
});

// An authorized moderator may restrict a member pair after a manual safety
// review. Members never receive the report details; they only see that Meetup
// Verification is unavailable for that connection.
router.patch("/admin/meetups/safety-reports", async (req: Request, res: Response) => {
  const adminUserId = requireAuth(req, res); if (!adminUserId || !requireAdmin(req, res)) return;
  const { reporterUserId, reportedUserId, action } = req.body as Record<string, unknown>;
  if (typeof reporterUserId !== "string" || typeof reportedUserId !== "string" || reporterUserId === reportedUserId) {
    res.status(400).json({ error: "Two distinct member IDs are required." }); return;
  }
  if (action !== "restrict" && action !== "dismiss") {
    res.status(400).json({ error: "Choose restrict or dismiss." }); return;
  }
  try {
    if (action === "restrict") {
      await pool.query(
        `INSERT INTO meetup_member_safety_reports
          (reporter_user_id, reported_user_id, status, reviewed_by, reviewed_at)
         VALUES ($1, $2, 'active', $3, now())`,
        [reporterUserId, reportedUserId, adminUserId],
      );
    } else {
      await pool.query(
        `UPDATE meetup_member_safety_reports
            SET status = 'dismissed', reviewed_by = $3, reviewed_at = now()
          WHERE status = 'active'
            AND ((reporter_user_id = $1 AND reported_user_id = $2)
              OR (reporter_user_id = $2 AND reported_user_id = $1))`,
        [reporterUserId, reportedUserId, adminUserId],
      );
    }
    res.json({ ok: true, action });
  } catch (err) {
    req.log.error({ err }, "PATCH admin meetup safety report error");
    res.status(500).json({ error: "Failed to update meetup safety restriction" });
  }
});

export default router;
