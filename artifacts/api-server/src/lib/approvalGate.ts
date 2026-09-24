/**
 * Platform access is closed by default during the controlled rollout.
 *
 * Set REQUIRE_APPROVAL=false only for an intentionally open environment, such as
 * a local development workspace. Production must opt out explicitly rather than
 * accidentally admitting every authenticated account when a secret is absent.
 */
export function isApprovalRequired(): boolean {
  return process.env.REQUIRE_APPROVAL !== "false";
}
