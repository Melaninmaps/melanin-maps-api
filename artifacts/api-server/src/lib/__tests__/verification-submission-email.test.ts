import { describe, expect, it } from "vitest";
import { buildVerificationSubmissionAdminAlert } from "../email";

describe("buildVerificationSubmissionAdminAlert", () => {
  it("uses one configured admin recipient and a stable per-request idempotency key", () => {
    process.env.ADMIN_EMAILS = "reviews@example.com, second@example.com";
    const email = buildVerificationSubmissionAdminAlert({
      requestId: "request-123",
      businessName: "Ada's <Cafe>",
      businessType: "restaurant",
      ownerName: "Ada",
      submitterEmail: "ada@example.com",
      verificationLevel: "ownership",
      city: "Washington",
      state: "DC",
    });

    expect(email.to).toBe("reviews@example.com");
    expect(email.headers).toEqual({ "Idempotency-Key": "verification-submission:request-123" });
    expect(email.html).toContain("Ada&#39;s &lt;Cafe&gt;");
  });
});