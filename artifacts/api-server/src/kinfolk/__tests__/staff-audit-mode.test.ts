import { describe, expect, it } from "vitest";
import {
  KINFOLK_STAFF_AUDIT_POLICY,
  resolveKinfolkStaffAuditPolicy,
} from "../staff-audit-mode";

describe("Kinfolk staff audit mode", () => {
  it("does not grant audit isolation unless an administrator requests it", () => {
    expect(resolveKinfolkStaffAuditPolicy({ requested: false, administrator: true })).toBeNull();
    expect(resolveKinfolkStaffAuditPolicy({ requested: true, administrator: false })).toBeNull();
    expect(resolveKinfolkStaffAuditPolicy({ requested: "true", administrator: true })).toBeNull();
  });

  it("uses an immutable no-memory and no-analytics server policy", () => {
    expect(resolveKinfolkStaffAuditPolicy({ requested: true, administrator: true }))
      .toBe(KINFOLK_STAFF_AUDIT_POLICY);
    expect(KINFOLK_STAFF_AUDIT_POLICY).toEqual({
      memoryRead: false,
      memoryWrite: false,
      analytics: false,
      ephemeralConversation: false,
    });
    expect(Object.isFrozen(KINFOLK_STAFF_AUDIT_POLICY)).toBe(true);
  });
});
