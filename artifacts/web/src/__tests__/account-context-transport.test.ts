import { describe, expect, it } from "vitest";
import {
  accountContextHeaderValue,
  setAccountContextForTransport,
} from "@/lib/account-context-transport";

describe("account context transport", () => {
  it("defaults to the personal workspace", () => {
    setAccountContextForTransport({ kind: "personal" });
    expect(accountContextHeaderValue()).toBe("personal");
  });

  it("uses only an opaque selected business ID in a business request header", () => {
    setAccountContextForTransport({ kind: "business", businessId: "business_123" });
    expect(accountContextHeaderValue()).toBe("business:business_123");
  });

  it("does not persist an admin selection after an explicit reset", () => {
    setAccountContextForTransport({ kind: "admin" });
    expect(accountContextHeaderValue()).toBe("admin");
    setAccountContextForTransport({ kind: "personal" });
    expect(accountContextHeaderValue()).toBe("personal");
  });
});
