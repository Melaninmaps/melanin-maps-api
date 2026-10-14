import { Router, type IRouter, type Request, type Response } from "express";
import { db, meetupVerificationsTable as baseMeetupVerificationsTable, usersTable } from "@workspace/db";
import { memberConnections } from "@workspace/db/schema";
import { and, desc, eq, gt, isNotNull, isNull, lt, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  assertActiveMeetup,
  assertVerifiedParticipant,
  MeetupPolicyError,
  normalizeVerifiedMeetupRequest,
  toPrivacyMinimizedMeetup,
} from "./meetup-verification-policy";
import { MeetupPrivateDetailsUnavailableError, openMeetupVenue, sealMeetupVenue } from "./meetup-private-details";
import { blockMemberAndCleanupRelationships, usersAreBlocked } from "../social/profileRelationshipAccess";

const router: IRouter = Router();

// The API project reference uses checked-in declaration output. Keep this
// bridge local until the normal, separately approved schema declaration build
// is run; at runtime the workspace source model supplies these columns.
const meetupVerificationsTable = baseMeetupVerificationsTable as typeof baseMeetupVerificationsTable & {
  scheduledAt: typeof baseMeetupVerificationsTable.expiresAt;
  organizerApprovedAt: typeof baseMeetupVerificationsTable.confirmedAt;
  partnerApprovedAt: typeof baseMeetupVerificationsTable.confirmedAt;
  correctedAt: typeof baseMeetupVerificationsTable.confirmedAt;
  cancelledAt: typeof baseMeetupVerificationsTable.confirmedAt;
  cancelledById: typeof baseMeetupVerificationsTable.safetyWatcherId;
  cancellationReason: typeof baseMeetupVerificationsTable.clearCode;
};

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function parseId(value: string, res: Response): number | null {
  const id = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid meetup ID", code: "INVALID_MEETUP_ID" });
    return null;
  }
  return id;
}

function policyError(res: Response, error: unknown): boolean {
  if (error instanceof MeetupPolicyError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof MeetupPrivateDetailsUnavailableError) {
    res.status(503).json({ error: "Private meetup details are unavailable right now.", code: "MEETUP_PRIVATE_DETAILS_UNAVAILABLE" });
    return true;
  }
  return false;
}

function redactedMeetupDetails() {
  return {
    location: null,
    note: null,
    clearCode: null,
    safetyWatcherId: null,
    safetyWatcherEmail: null,
    arrivalCheckAt: null,
    arrivalCheckedAt: null,
    arrivalCheckStatus: null,
    arrivalAlertSentAt: null,
    homeCheckAt: null,
    homeCheckedAt: null,
    homeCheckStatus: null,
    homeAlertSentAt: null,
    safetyFriendName: null,
    safetyFriendEmail: null,
  };
}

async function requireAcceptedUnblockedConnection(userId: string, partnerId: string): Promise<number> {
  if (await usersAreBlocked(userId, partnerId)) {
    throw new MeetupPolicyError("MEETUP_PARTNER_UNAVAILABLE", "This member is unavailable for meetup verification", 404);
  }
  const [connection] = await db
    .select({ id: memberConnections.id })
    .from(memberConnections)
    .where(and(
      eq(memberConnections.status, "accepted"),
      or(
        and(eq(memberConnections.requesterId, userId), eq(memberConnections.recipientId, partnerId)),
        and(eq(memberConnections.requesterId, partnerId), eq(memberConnections.recipientId, userId)),
      ),
    ))
    .limit(1);
  if (!connection) {
    throw new MeetupPolicyError("MEETUP_CONNECTION_REQUIRED", "An accepted connection is required for meetup verification", 403);
  }
  return connection.id;
}

function responseFor(
  verification: Parameters<typeof toPrivacyMinimizedMeetup>[0],
  userId: string,
) {
  // Stored values are encrypted and are only opened for a participant response.
  // Invalid, legacy plaintext, or unavailable key data stays redacted.
  return toPrivacyMinimizedMeetup({
    ...verification,
    location: openMeetupVenue(verification.location),
  }, userId);
}

const initiatorUser = alias(usersTable, "initiator_user");
const partnerUser = alias(usersTable, "partner_user");

// GET /meetups — participants receive only their own current, private venue and time window.
router.get("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const now = new Date();
    // Retention boundary: expiry clears all private meetup data while retaining
    // only the non-sensitive audit lifecycle record internally.
    await db
      .update(meetupVerificationsTable)
      .set({ ...redactedMeetupDetails(), clearedAt: now })
      .where(and(
        or(eq(meetupVerificationsTable.initiatorId, userId), eq(meetupVerificationsTable.partnerId, userId)),
        isNull(meetupVerificationsTable.clearedAt),
        lt(meetupVerificationsTable.expiresAt, now),
        or(
          isNotNull(meetupVerificationsTable.location),
          isNotNull(meetupVerificationsTable.note),
          isNotNull(meetupVerificationsTable.safetyWatcherId),
          isNotNull(meetupVerificationsTable.safetyWatcherEmail),
          isNotNull(meetupVerificationsTable.arrivalCheckAt),
          isNotNull(meetupVerificationsTable.homeCheckAt),
          isNotNull(meetupVerificationsTable.safetyFriendEmail),
        ),
      ));

    const verifications = await db
      .select({
        id: meetupVerificationsTable.id,
        initiatorId: meetupVerificationsTable.initiatorId,
        partnerId: meetupVerificationsTable.partnerId,
        location: meetupVerificationsTable.location,
        status: meetupVerificationsTable.status,
        initiatedAt: meetupVerificationsTable.initiatedAt,
        scheduledAt: meetupVerificationsTable.scheduledAt,
        expiresAt: meetupVerificationsTable.expiresAt,
        organizerApprovedAt: meetupVerificationsTable.organizerApprovedAt,
        partnerApprovedAt: meetupVerificationsTable.partnerApprovedAt,
        correctedAt: meetupVerificationsTable.correctedAt,
        cancelledAt: meetupVerificationsTable.cancelledAt,
        initiatorFirstName: initiatorUser.firstName,
        initiatorLastName: initiatorUser.lastName,
        initiatorUsername: initiatorUser.username,
        partnerFirstName: partnerUser.firstName,
        partnerLastName: partnerUser.lastName,
        partnerUsername: partnerUser.username,
      })
      .from(meetupVerificationsTable)
      .leftJoin(initiatorUser, eq(initiatorUser.id, meetupVerificationsTable.initiatorId))
      .leftJoin(partnerUser, eq(partnerUser.id, meetupVerificationsTable.partnerId))
      .where(and(
        or(
          eq(meetupVerificationsTable.initiatorId, userId),
          eq(meetupVerificationsTable.partnerId, userId),
        ),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .orderBy(desc(meetupVerificationsTable.initiatedAt))
      .limit(50);

    const visible = await Promise.all(verifications.map(async (verification) => {
      const counterpartId = verification.initiatorId === userId ? verification.partnerId : verification.initiatorId;
      if (await usersAreBlocked(userId, counterpartId)) return null;
      return responseFor(verification, userId);
    }));

    res.set("Cache-Control", "no-store").json({
      verifications: visible.filter((verification): verification is NonNullable<typeof verification> => verification !== null),
    });
  } catch (err) {
    req.log.error({ err }, "GET /meetups error");
    res.status(500).json({ error: "Failed to load meetups" });
  }
});

// GET /meetups/partner-check — eligibility only; it neither exposes an unconnected member nor makes a safety assessment.
router.get("/meetups/partner-check", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const { partnerId } = req.query;
  if (!partnerId || typeof partnerId !== "string") {
    res.status(400).json({ error: "partnerId required" });
    return;
  }
  try {
    await requireAcceptedUnblockedConnection(userId, partnerId);
    const [partner] = await db
      .select({ id: usersTable.id, identityVerified: usersTable.identityVerified })
      .from(usersTable)
      .where(eq(usersTable.id, partnerId))
      .limit(1);
    if (!partner) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.set("Cache-Control", "no-store").json({
      eligible: partner.identityVerified,
      identityVerified: partner.identityVerified,
      disclaimer: "Identity verification confirms only the account verification state; it does not assess a person or guarantee an outcome.",
    });
  } catch (err) {
    if (policyError(res, err)) return;
    req.log.error({ err }, "GET /meetups/partner-check error");
    res.status(500).json({ error: "Failed to check meetup eligibility" });
  }
});

// POST /meetups — a verified organizer explicitly approves sharing a private planned venue with one accepted connection.
router.post("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const request = normalizeVerifiedMeetupRequest(req.body as Record<string, unknown>);
    if (request.partnerId === userId) {
      res.status(400).json({ error: "Cannot create a meetup with yourself", code: "INVALID_PARTNER" });
      return;
    }
    const connectionId = await requireAcceptedUnblockedConnection(userId, request.partnerId);

    const participants = await db
      .select({ id: usersTable.id, identityVerified: usersTable.identityVerified })
      .from(usersTable)
      .where(or(eq(usersTable.id, userId), eq(usersTable.id, request.partnerId)));
    const organizer = participants.find((participant) => participant.id === userId);
    const partner = participants.find((participant) => participant.id === request.partnerId);
    assertVerifiedParticipant(organizer, "organizer");
    assertVerifiedParticipant(partner, "partner");

    const approvedAt = new Date();
    const [verification] = await db.insert(meetupVerificationsTable).values({
      initiatorId: userId,
      partnerId: request.partnerId,
      connectionId,
      location: sealMeetupVenue(request.venue),
      status: "awaiting_partner",
      initiatedAt: approvedAt,
      scheduledAt: request.scheduledAt,
      expiresAt: request.expiresAt,
      organizerApprovedAt: approvedAt,
      // No notes, coordinates, watcher/contact details, or automatic arrival/home check-ins are accepted or persisted.
    }).returning();

    res.status(201).set("Cache-Control", "no-store").json({
      verification: responseFor({
        ...verification,
        initiatorFirstName: null,
        initiatorLastName: null,
        initiatorUsername: null,
        partnerFirstName: null,
        partnerLastName: null,
        partnerUsername: null,
      }, userId),
    });
  } catch (err) {
    if (policyError(res, err)) return;
    req.log.error({ err }, "POST /meetups error");
    res.status(500).json({ error: "Failed to create meetup request" });
  }
});

// PATCH /meetups/:id — organizer corrections renew venue/time consent and reset partner approval.
router.patch("/meetups/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const id = parseId(req.params["id"] as string, res); if (!id) return;
  try {
    const [verification] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        eq(meetupVerificationsTable.initiatorId, userId),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);
    if (!verification) {
      res.status(404).json({ error: "Meetup request not found" });
      return;
    }
    assertActiveMeetup(verification);
    const connectionId = await requireAcceptedUnblockedConnection(userId, verification.partnerId);
    const corrected = normalizeVerifiedMeetupRequest({
      ...(req.body as Record<string, unknown>),
      partnerId: verification.partnerId,
    });
    const correctedAt = new Date();
    const [updated] = await db.update(meetupVerificationsTable)
      .set({
        ...redactedMeetupDetails(),
        connectionId,
        location: sealMeetupVenue(corrected.venue),
        scheduledAt: corrected.scheduledAt,
        expiresAt: corrected.expiresAt,
        status: "awaiting_partner",
        organizerApprovedAt: correctedAt,
        partnerApprovedAt: null,
        confirmedAt: null,
        correctedAt,
      })
      .where(and(eq(meetupVerificationsTable.id, id), gt(meetupVerificationsTable.expiresAt, correctedAt)))
      .returning();
    if (!updated) {
      res.status(409).json({ error: "Meetup request has expired", code: "MEETUP_EXPIRED" });
      return;
    }
    res.set("Cache-Control", "no-store").json({
      verification: responseFor({
        ...updated,
        initiatorFirstName: null,
        initiatorLastName: null,
        initiatorUsername: null,
        partnerFirstName: null,
        partnerLastName: null,
        partnerUsername: null,
      }, userId),
    });
  } catch (err) {
    if (policyError(res, err)) return;
    req.log.error({ err }, "PATCH /meetups/:id error");
    res.status(500).json({ error: "Failed to correct meetup request" });
  }
});

// PATCH /meetups/:id/confirm — the partner independently approves the planned private venue and time window.
router.patch("/meetups/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const id = parseId(req.params["id"] as string, res); if (!id) return;
  try {
    if ((req.body as { partnerApproval?: unknown }).partnerApproval !== true) {
      res.status(403).json({
        error: "The partner must explicitly approve this meetup request",
        code: "PARTNER_APPROVAL_REQUIRED",
      });
      return;
    }
    const [verification] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        eq(meetupVerificationsTable.partnerId, userId),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);
    if (!verification) {
      res.status(404).json({ error: "Meetup request not found" });
      return;
    }
    assertActiveMeetup(verification);
    if (verification.status !== "awaiting_partner" || !verification.organizerApprovedAt) {
      res.status(409).json({ error: "Meetup request is not awaiting partner approval", code: "INVALID_MEETUP_STATE" });
      return;
    }
    await requireAcceptedUnblockedConnection(userId, verification.initiatorId);

    const participants = await db
      .select({ id: usersTable.id, identityVerified: usersTable.identityVerified })
      .from(usersTable)
      .where(or(eq(usersTable.id, verification.initiatorId), eq(usersTable.id, userId)));
    assertVerifiedParticipant(participants.find((participant) => participant.id === verification.initiatorId), "organizer");
    assertVerifiedParticipant(participants.find((participant) => participant.id === userId), "partner");

    const approvedAt = new Date();
    const [updated] = await db.update(meetupVerificationsTable)
      .set({ status: "approved", partnerApprovedAt: approvedAt, confirmedAt: approvedAt })
      .where(and(
        eq(meetupVerificationsTable.id, id),
        eq(meetupVerificationsTable.status, "awaiting_partner"),
        gt(meetupVerificationsTable.expiresAt, approvedAt),
      ))
      .returning();
    if (!updated) {
      res.status(409).json({ error: "Meetup request is no longer available for approval", code: "INVALID_MEETUP_STATE" });
      return;
    }
    res.set("Cache-Control", "no-store").json({
      verification: responseFor({
        ...updated,
        initiatorFirstName: null,
        initiatorLastName: null,
        initiatorUsername: null,
        partnerFirstName: null,
        partnerLastName: null,
        partnerUsername: null,
      }, userId),
    });
  } catch (err) {
    if (policyError(res, err)) return;
    req.log.error({ err }, "PATCH /meetups/:id/confirm error");
    res.status(500).json({ error: "Failed to approve meetup request" });
  }
});

// POST /meetups/:id/cancel — either participant may end the request. Venue data is immediately redacted.
router.post("/meetups/:id/cancel", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const id = parseId(req.params["id"] as string, res); if (!id) return;
  try {
    const reason = typeof (req.body as { reason?: unknown }).reason === "string"
      ? (req.body as { reason: string }).reason.trim().slice(0, 240) || null
      : null;
    const [verification] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        or(eq(meetupVerificationsTable.initiatorId, userId), eq(meetupVerificationsTable.partnerId, userId)),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);
    if (!verification) {
      res.status(404).json({ error: "Meetup request not found" });
      return;
    }
    assertActiveMeetup(verification);
    const cancelledAt = new Date();
    const [updated] = await db.update(meetupVerificationsTable)
      .set({
        ...redactedMeetupDetails(),
        status: "cancelled",
        cancelledAt,
        cancelledById: userId,
        cancellationReason: reason,
      })
      .where(and(eq(meetupVerificationsTable.id, id), gt(meetupVerificationsTable.expiresAt, cancelledAt)))
      .returning();
    if (!updated) {
      res.status(409).json({ error: "Meetup request has expired", code: "MEETUP_EXPIRED" });
      return;
    }
    res.set("Cache-Control", "no-store").json({
      verification: responseFor({
        ...updated,
        initiatorFirstName: null,
        initiatorLastName: null,
        initiatorUsername: null,
        partnerFirstName: null,
        partnerLastName: null,
        partnerUsername: null,
      }, userId),
    });
  } catch (err) {
    if (policyError(res, err)) return;
    req.log.error({ err }, "POST /meetups/:id/cancel error");
    res.status(500).json({ error: "Failed to cancel meetup request" });
  }
});

// POST /meetups/:id/block — a block immediately cancels participant access, redacts private details, and removes the connection.
router.post("/meetups/:id/block", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  const id = parseId(req.params["id"] as string, res); if (!id) return;
  try {
    const [verification] = await db.select({
      initiatorId: meetupVerificationsTable.initiatorId,
      partnerId: meetupVerificationsTable.partnerId,
    }).from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        or(eq(meetupVerificationsTable.initiatorId, userId), eq(meetupVerificationsTable.partnerId, userId)),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);
    if (!verification) {
      res.status(404).json({ error: "Meetup request not found" });
      return;
    }
    const counterpartId = verification.initiatorId === userId ? verification.partnerId : verification.initiatorId;
    const result = await blockMemberAndCleanupRelationships(userId, counterpartId);
    if (!result.targetFound) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    res.set("Cache-Control", "no-store").json({ blocked: true });
  } catch (err) {
    req.log.error({ err }, "POST /meetups/:id/block error");
    res.status(500).json({ error: "Failed to block member" });
  }
});

// The former destructive clear endpoint remains retired: cancellation preserves a non-sensitive audit lifecycle.
router.delete("/meetups/:id", async (_req: Request, res: Response) => {
  res.status(405).json({ error: "Use POST /meetups/:id/cancel to cancel a meetup request", code: "CANCELLATION_REQUIRED" });
});

// Automatic meetup arrival/home tracking and third-party detail sharing remain retired. Members may choose a separate Safety Check-In with accepted trusted contacts.
router.patch("/meetups/:id/arrival-checkin", async (_req: Request, res: Response) => {
  res.status(410).json({ error: "Arrival check-ins are not part of the verified meetup workflow", code: "MEETUP_CHECKIN_RETIRED" });
});
router.patch("/meetups/:id/home-checkin", async (_req: Request, res: Response) => {
  res.status(410).json({ error: "Home check-ins are not part of the verified meetup workflow", code: "MEETUP_CHECKIN_RETIRED" });
});
router.post("/meetups/:id/share", async (_req: Request, res: Response) => {
  res.status(410).json({ error: "Third-party meetup sharing is not part of the verified meetup workflow", code: "MEETUP_SHARING_RETIRED" });
});

export default router;
