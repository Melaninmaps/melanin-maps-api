export type MeetupIdentityStatus = "verified" | "not_verified" | "unavailable";

export type MeetupIdentityTransparency = {
  status: MeetupIdentityStatus;
  memberSince: Date | string | null;
  verifiedAt: Date | string | null;
  message: string;
};

export function resolveMeetupIdentityStatus(
  identityVerified: boolean | null | undefined,
): MeetupIdentityStatus {
  if (identityVerified === true) return "verified";
  if (identityVerified === false) return "not_verified";
  return "unavailable";
}

export function identityStatusMessage(status: MeetupIdentityStatus): string {
  switch (status) {
    case "verified":
      return "Identity Verified. This is an informational signal and is not a guarantee of safety.";
    case "not_verified":
      return "Identity verification is not complete. This does not decide whether the member may participate and is not a safety judgment.";
    case "unavailable":
      return "Identity verification status is currently unavailable to confirm. This is not a safety judgment.";
  }
}

export function buildMeetupIdentityTransparency(input: {
  identityVerified: boolean | null | undefined;
  identityVerifiedAt?: Date | string | null;
  memberSince?: Date | string | null;
}): MeetupIdentityTransparency {
  const status = resolveMeetupIdentityStatus(input.identityVerified);
  return {
    status,
    memberSince: input.memberSince ?? null,
    // A date is meaningful only with a current verified signal. Never expose or
    // synthesize a completion date for a member who is not currently verified.
    verifiedAt: status === "verified" ? input.identityVerifiedAt ?? null : null,
    message: identityStatusMessage(status),
  };
}

export function identityAcknowledgmentMatches(
  acknowledgedStatus: unknown,
  currentStatus: MeetupIdentityStatus,
): boolean {
  return acknowledgedStatus === currentStatus;
}
