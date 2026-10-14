import { describe, expect, it } from "vitest";
import {
  claimVerificationEmailDeliveryEnabled,
  createOpaqueCode,
  emailDomainMatchesOfficialUrl,
  hashesMatch,
  hashPrivateCode,
  managerInvitationDeliveryEnabled,
  normalizePrivateEmail,
} from "../verification.js";

describe("member-business private verification helpers", () => {
  it("normalizes only valid private email contacts", () => {
    expect(normalizePrivateEmail(" Owner@Example.com ")).toBe("owner@example.com");
    expect(normalizePrivateEmail("not-an-email")).toBeNull();
  });

  it("creates opaque non-ambiguous codes and compares HMAC hashes safely", () => {
    const code = createOpaqueCode(10);
    expect(code).toMatch(/^[A-Z2-9]{10}$/);
    const hash = hashPrivateCode(code, "test-secret");
    expect(hashesMatch(hash, hashPrivateCode(code, "test-secret"))).toBe(true);
    expect(hashesMatch(hash, hashPrivateCode("ABCDEFG234", "test-secret"))).toBe(false);
  });

  it("requires explicit delivery gates and secrets", () => {
    expect(claimVerificationEmailDeliveryEnabled({})).toBe(false);
    expect(claimVerificationEmailDeliveryEnabled({ BUSINESS_CLAIM_VERIFICATION_ENABLED: "true", BUSINESS_CLAIM_EMAIL_VERIFICATION_ENABLED: "true", RESEND_API_KEY: "key", SESSION_SECRET: "secret" })).toBe(true);
    expect(managerInvitationDeliveryEnabled({})).toBe(false);
    expect(managerInvitationDeliveryEnabled({ BUSINESS_MANAGER_INVITATIONS_ENABLED: "true", BUSINESS_MANAGER_INVITATIONS_DELIVERY_ENABLED: "true", RESEND_API_KEY: "key", SESSION_SECRET: "secret" })).toBe(true);
  });

  it("accepts a business-domain contact only when it matches the official website domain", () => {
    expect(emailDomainMatchesOfficialUrl("owner@studio.example.com", "https://studio.example.com/contact")).toBe(true);
    expect(emailDomainMatchesOfficialUrl("owner@example.com", "https://studio.example.com")).toBe(true);
    expect(emailDomainMatchesOfficialUrl("owner@unrelated.example", "https://studio.example.com")).toBe(false);
  });
});
