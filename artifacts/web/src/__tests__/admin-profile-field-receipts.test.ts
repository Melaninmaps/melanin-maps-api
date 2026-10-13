import { describe, expect, it } from "vitest";
import {
  addAdminProfileFieldReceipt,
  ADMIN_PROFILE_FIELD_RECEIPT_OPTIONS,
  newAdminProfileFieldReceipt,
} from "../lib/adminProfileFieldReceipts";

describe("admin profile field receipt presets", () => {
  it("creates a receipt for the exact public field selected", () => {
    const address = newAdminProfileFieldReceipt("address");
    const phone = newAdminProfileFieldReceipt("phone");
    const facebook = newAdminProfileFieldReceipt("facebook");

    expect(address.field).toBe("address");
    expect(phone.field).toBe("phone");
    expect(facebook.field).toBe("facebook");
    expect(address.confidence).toBe("high");
    expect(facebook.identityMatch).toBe(false);
  });

  it("prevents duplicate receipts for a single public field in one save", () => {
    const withAddress = addAdminProfileFieldReceipt([], "address");
    const stillOneAddress = addAdminProfileFieldReceipt(withAddress, "address");
    const withPhone = addAdminProfileFieldReceipt(stillOneAddress, "phone");

    expect(stillOneAddress).toHaveLength(1);
    expect(withPhone.map((receipt) => receipt.field)).toEqual(["address", "phone"]);
  });

  it("exposes every controlled receipt field to the editor", () => {
    expect(ADMIN_PROFILE_FIELD_RECEIPT_OPTIONS.map((option) => option.value)).toEqual([
      "identity", "description", "category", "hours", "price_range", "phone", "address",
      "website", "instagram", "tiktok", "facebook", "service_tags", "ownership",
    ]);
  });
});
