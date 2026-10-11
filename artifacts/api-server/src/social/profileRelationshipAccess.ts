import { and, eq, inArray, or, sql } from "drizzle-orm";
import {
  db,
  memberConnections,
  meetupVerificationsTable,
  trustedContactShares,
  userBlocksTable,
  userFollowsTable,
  usersTable,
} from "@workspace/db";

/**
 * Social privacy is bidirectional: if either member has blocked the other, no
 * relationship can be created, accepted, or revealed. Routes intentionally
 * return a neutral unavailable result rather than confirming who blocked whom.
 */
export async function usersAreBlocked(
  firstUserId: string | null | undefined,
  secondUserId: string | null | undefined,
): Promise<boolean> {
  if (!firstUserId || !secondUserId || firstUserId === secondUserId) return false;
  const [block] = await db
    .select({ id: userBlocksTable.id })
    .from(userBlocksTable)
    .where(
      or(
        and(
          eq(userBlocksTable.blockerId, firstUserId),
          eq(userBlocksTable.blockedId, secondUserId),
        ),
        and(
          eq(userBlocksTable.blockerId, secondUserId),
          eq(userBlocksTable.blockedId, firstUserId),
        ),
      ),
    )
    .limit(1);
  return Boolean(block);
}

export async function filterBlockedRelationships<T extends { id: string }>(
  viewerId: string | null | undefined,
  rows: readonly T[],
): Promise<T[]> {
  if (!viewerId || rows.length === 0) return [...rows];
  const visibility = await Promise.all(
    rows.map(async (row) => ({ row, blocked: await usersAreBlocked(viewerId, row.id) })),
  );
  return visibility.filter(({ blocked }) => !blocked).map(({ row }) => row);
}

export type BlockCleanupResult = Readonly<{
  targetFound: boolean;
  acceptedFollowCount: number;
  connectionCount: number;
}>;

/**
 * Blocking is the privacy boundary, not merely a profile-display preference.
 * It removes both directions of social relationships, revokes dependent
 * trusted-contact shares, and cancels/redacts any participant-only meetup in
 * one transaction before returning success.
 */
export async function blockMemberAndCleanupRelationships(
  blockerId: string,
  blockedId: string,
): Promise<BlockCleanupResult> {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, blockedId))
      .limit(1);
    if (!target) return { targetFound: false, acceptedFollowCount: 0, connectionCount: 0 };

    const relationPredicate = or(
      and(eq(userFollowsTable.followerId, blockerId), eq(userFollowsTable.followingId, blockedId)),
      and(eq(userFollowsTable.followerId, blockedId), eq(userFollowsTable.followingId, blockerId)),
    );
    const connectionPredicate = or(
      and(eq(memberConnections.requesterId, blockerId), eq(memberConnections.recipientId, blockedId)),
      and(eq(memberConnections.requesterId, blockedId), eq(memberConnections.recipientId, blockerId)),
    );
    const meetupPredicate = or(
      and(eq(meetupVerificationsTable.initiatorId, blockerId), eq(meetupVerificationsTable.partnerId, blockedId)),
      and(eq(meetupVerificationsTable.initiatorId, blockedId), eq(meetupVerificationsTable.partnerId, blockerId)),
    );
    const now = new Date();
    const [acceptedFollows, connections] = await Promise.all([
      tx
        .select({ followerId: userFollowsTable.followerId, followingId: userFollowsTable.followingId })
        .from(userFollowsTable)
        .where(and(relationPredicate, eq(userFollowsTable.status, "accepted"))),
      tx
        .select({ id: memberConnections.id })
        .from(memberConnections)
        .where(connectionPredicate),
    ]);

    await tx
      .insert(userBlocksTable)
      .values({ blockerId, blockedId })
      .onConflictDoNothing();

    await tx
      .update(meetupVerificationsTable)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelledById: blockerId,
        cancellationReason: "Relationship unavailable",
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
      })
      .where(and(meetupPredicate, or(
        eq(meetupVerificationsTable.status, "awaiting_partner"),
        eq(meetupVerificationsTable.status, "approved"),
      )));

    if (connections.length > 0) {
      await tx
        .update(trustedContactShares)
        .set({ status: "revoked", revokedAt: now })
        .where(inArray(trustedContactShares.connectionId, connections.map((connection) => connection.id)));
      await tx.delete(memberConnections).where(connectionPredicate);
    }

    await tx.delete(userFollowsTable).where(relationPredicate);
    for (const follow of acceptedFollows) {
      await tx
        .update(usersTable)
        .set({ followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)` })
        .where(eq(usersTable.id, follow.followerId));
      await tx
        .update(usersTable)
        .set({ followersCount: sql`GREATEST(${usersTable.followersCount} - 1, 0)` })
        .where(eq(usersTable.id, follow.followingId));
    }

    return {
      targetFound: true,
      acceptedFollowCount: acceptedFollows.length,
      connectionCount: connections.length,
    };
  });
}
