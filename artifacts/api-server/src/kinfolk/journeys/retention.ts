import { JourneyActionError } from "./domain";

export type JourneyDeletionPlan = Readonly<{
  revokeConnections: boolean;
  deleteImports: boolean;
  deleteSensitiveItemPayloads: boolean;
  removeCollaborators: boolean;
  auditEvent: "journey_delete_requested" | "journey_retention_expired";
}>;

export function getJourneyDeletionPlan(
  reason: "member_delete" | "retention_expired",
): JourneyDeletionPlan {
  return {
    // Connections belong to the member, not one Journey. Deleting a single
    // Journey must not silently disconnect calendar/mail access that another
    // private Journey could still use; the member disconnects it explicitly.
    revokeConnections: false,
    deleteImports: true,
    deleteSensitiveItemPayloads: true,
    removeCollaborators: true,
    auditEvent:
      reason === "member_delete"
        ? "journey_delete_requested"
        : "journey_retention_expired",
  };
}

export function assertJourneyOwner(input: {
  ownerUserId: string;
  actorUserId: string;
}): void {
  if (input.ownerUserId !== input.actorUserId) {
    throw new JourneyActionError(
      "This Journey is private to its owner.",
      404,
      "JOURNEY_NOT_FOUND",
    );
  }
}

/**
 * A remote provider revocation may fail after local access is removed. The caller
 * must persist `disconnect_pending`, retry safely, and never restore local token access.
 */
export function nextDisconnectStatus(input: {
  remoteRevocationSucceeded: boolean;
}): "revoked" | "disconnect_pending" {
  return input.remoteRevocationSucceeded ? "revoked" : "disconnect_pending";
}

export function retentionExpiryFor(input: {
  policy:
    | "delete_after_trip"
    | "keep_until_deleted"
    | "keep_until_member_changes_it";
  journeyEndDate?: string | null;
}): Date | null {
  if (input.policy !== "delete_after_trip") return null;
  if (!input.journeyEndDate) {
    throw new JourneyActionError(
      "An end date is required for automatic deletion 30 days after a Journey ends.",
      400,
      "JOURNEY_INVALID",
    );
  }
  const end = new Date(`${input.journeyEndDate}T23:59:59.999Z`);
  if (!Number.isFinite(end.getTime())) {
    throw new JourneyActionError(
      "Journey end date is invalid for automatic deletion.",
      400,
      "JOURNEY_INVALID",
    );
  }
  end.setUTCDate(end.getUTCDate() + 30);
  return end;
}
