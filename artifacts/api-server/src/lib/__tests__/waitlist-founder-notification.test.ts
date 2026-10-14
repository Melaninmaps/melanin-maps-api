import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildWaitlistFounderRegistrationAlert,
  configuredWaitlistFounderNotificationRecipient,
} from "../email";

describe("waitlist founder registration notification", () => {
  it("uses only an explicit, valid dedicated recipient configuration", () => {
    expect(configuredWaitlistFounderNotificationRecipient({
      FOUNDER_WAITLIST_NOTIFICATION_EMAIL: " Founder@Example.com ",
    })).toBe("founder@example.com");
    expect(configuredWaitlistFounderNotificationRecipient({
      ADMIN_EMAILS: "admin@example.com",
    })).toBeNull();
    expect(configuredWaitlistFounderNotificationRecipient({
      FOUNDER_WAITLIST_NOTIFICATION_EMAIL: "one@example.com,two@example.com",
    })).toBeNull();
  });

  it("builds a minimal, escaped alert with a non-identifying idempotency header", () => {
    const email = buildWaitlistFounderRegistrationAlert("founder@example.com", {
      registrationId: "c909d4fd-4987-4f7f-8be6-1f942b2672d7",
      email: "New<Member>@Example.com",
      city: "Brooklyn <North>",
      submittedAt: new Date("2026-10-14T00:00:00.000Z"),
    });

    expect(email.to).toBe("founder@example.com");
    expect(email.subject).toBe("New waitlist registration");
    expect(email.html).toContain("new&lt;member&gt;@example.com");
    expect(email.html).toContain("Brooklyn &lt;North&gt;");
    expect(email.html).toContain("2026-10-14T00:00:00.000Z");
    expect(email.headers?.["Idempotency-Key"]).toBe("waitlist-founder-registration:c909d4fd-4987-4f7f-8be6-1f942b2672d7");
    expect(email.headers?.["Idempotency-Key"]).not.toContain("example.com");
  });

  it("fires only after a newly created primary registration and keeps failures private", () => {
    const route = readFileSync(
      fileURLToPath(new URL("../../routes/waitlist.ts", import.meta.url)),
      "utf8",
    );
    const publicWaitlistHandler = route.slice(
      route.indexOf('router.post("/waitlist"'),
      route.indexOf('router.get("/waitlist/count"'),
    );

    expect(publicWaitlistHandler).toContain(".onConflictDoNothing()");
    expect(publicWaitlistHandler).toContain("if (created && entryId) {\n      sendWaitlistFounderRegistrationAlert");
    expect(publicWaitlistHandler).toContain("WAITLIST_FOUNDER_NOTIFICATION_FAILED");
    expect(publicWaitlistHandler).toContain("family entries intentionally do not multiply the alert");
    expect(publicWaitlistHandler).not.toContain("FOUNDER_WAITLIST_NOTIFICATION_EMAIL");
    expect(publicWaitlistHandler).not.toContain("ADMIN_EMAILS");
    expect(publicWaitlistHandler).not.toContain("email: cleanEmail },\n          \"Founder waitlist registration notification failed\"");
  });
});
