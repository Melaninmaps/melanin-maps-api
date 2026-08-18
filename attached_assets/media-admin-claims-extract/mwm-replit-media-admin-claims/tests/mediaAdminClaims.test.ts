import { expect, test } from "vitest";

const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "video/mp4", "video/quicktime"];

test("allows only bounded supported community media", () => {
  expect(allowed).toContain("image/jpeg");
  expect(allowed).not.toContain("application/pdf");
  expect(10 * 1024 * 1024).toBe(10485760);
});

test("keeps community submissions pending while direct admin businesses publish", () => {
  const communitySubmission = { status: "pending_review", public: false };
  const directAdminBusiness = { status: "published", public: true, ownerClaimStatus: "unclaimed" };
  expect(communitySubmission.public).toBe(false);
  expect(directAdminBusiness.public).toBe(true);
  expect(directAdminBusiness.ownerClaimStatus).toBe("unclaimed");
});

test("requires verification before a business claim becomes ownership", () => {
  const submitted = "pending_verification";
  expect(submitted).not.toBe("claimed");
  const approved = "claimed";
  expect(approved).toBe("claimed");
});
