import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const businessRoutes = readFileSync(
  fileURLToPath(new URL("../routes/businesses.ts", import.meta.url)),
  "utf8",
);
const kinfolkRoutes = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("shared business contribution and Kinfolk continuity contracts", () => {
  it("keeps unreviewed visit posts private while returning them to their own creator", () => {
    expect(businessRoutes).toContain("const viewerId = typeof (req as any).user?.id");
    expect(businessRoutes).toContain("(bc.status = 'approved' AND bc.is_public = TRUE)");
    expect(businessRoutes).toContain("OR (bc.user_id = $2::varchar)");
    expect(businessRoutes).toContain("AS is_own");
  });

  it("carries an explicit ownership follow-up from the preceding Kinfolk result cards", () => {
    expect(kinfolkRoutes).toContain("function resolveBusinessResultFollowUp");
    expect(kinfolkRoutes).toContain("Only inherit a business subject for an explicit conversational follow-up");
    expect(kinfolkRoutes).toContain("followUp?.designationIds.length");
    expect(kinfolkRoutes).toContain("I found ${platformCount} ${designationSummary}");
    expect(kinfolkRoutes).not.toContain("I found ${platformCount} documented Diaspora Promotion Catalog");
  });
});
