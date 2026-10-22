export function isCommunityVerificationIsolatedTest(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  return environment.COMMUNITY_VERIFICATION_ISOLATED_TEST === "true";
}
