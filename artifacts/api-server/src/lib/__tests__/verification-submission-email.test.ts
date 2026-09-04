import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

  it("persists a unique client retry key and does not return 503 after durable acceptance", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../../routes/verification.ts", import.meta.url)),
      "utf8",
    );
    const schema = readFileSync(
      fileURLToPath(new URL("../../../../../lib/db/src/schema/verification-requests.ts", import.meta.url)),
      "utf8",
    );
    expect(route).toContain('req.get("Idempotency-Key")');
    expect(route).toContain(".onConflictDoNothing().returning()");
    expect(route).toContain('notificationStatus: "failed"');
    expect(route).toContain('if (notificationStatus !== "sent")');
    expect(route.match(/sendVerificationSubmissionAdminAlert\(/g)).toHaveLength(2);
    expect(route).not.toContain('res.status(503).json({\n        error: "Verification request was received');
    expect(schema).toContain('idempotencyKey: varchar("idempotency_key"');
    expect(schema).toContain('notificationStatus: varchar("notification_status"');
    expect(schema).toContain('unique("verification_requests_submitter_idempotency_unique").on(table.submitterId, table.idempotencyKey)');
  });
});
