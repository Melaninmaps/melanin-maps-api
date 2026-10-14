import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../community-opportunities.ts", import.meta.url)),
  "utf8",
);
const index = readFileSync(
  fileURLToPath(new URL("../index.ts", import.meta.url)),
  "utf8",
);
const communityRetrieval = readFileSync(
  fileURLToPath(new URL("../../kinfolk/community-hashtag-context.ts", import.meta.url)),
  "utf8",
);

describe("community opportunity flywheel contract", () => {
  it("uses thresholded aggregate topics and explicit participant consent", () => {
    expect(route).toContain("kinfolk_community_need_insights");
    expect(route).toContain("notification_opt_in");
    expect(route).toContain('router.put("/community-opportunities/participation"');
    expect(route).toContain("Only broad topics are used for matching");
    expect(route).toContain("communityNeedTopicLabel");
  });

  it("prepares matches without exposing member content or delivering notifications", () => {
    expect(route).toContain("notificationDelivery: \"not_sent\"");
    expect(route).toContain("notificationPrepared: false");
    expect(route).toContain("member conversations are never shared");
    expect(route).not.toContain("feedback.note");
    expect(route).not.toContain("private_memory");
  });

  it("requires approved ownership to create an opportunity from an aggregate insight", () => {
    expect(route).toContain("hasApprovedOwnerLink");
    expect(route).toContain("Approved business owner access is required");
    expect(route).toContain("status = 'active'");
  });

  it("links fulfillment only to the matched participant's own public Community content", () => {
    expect(route).toContain('router.post("/community-opportunities/:opportunityId/accept"');
    expect(route).toContain('router.post("/community-opportunities/:opportunityId/fulfill"');
    expect(route).toContain("author_id = $2 AND visibility = 'public'");
    expect(route).toContain("retrievalEligibility: \"public_community_content_only\"");
    expect(route).toContain('router.delete("/community-opportunities/:opportunityId/fulfillment"');
    expect(route).toContain("retrievalEligibility: \"withdrawn\"");
  });

  it("registers the workflow with the authenticated API router", () => {
    expect(index).toContain('import communityOpportunitiesRouter from "./community-opportunities"');
    expect(index).toContain("router.use(communityOpportunitiesRouter)");
  });

  it("retrieves only fulfilled public Community content for a matched broad topic", () => {
    expect(communityRetrieval).toContain("community_opportunity_fulfillments");
    expect(communityRetrieval).toContain("community_opportunities");
    expect(communityRetrieval).toContain("fulfillment.status = 'published'");
    expect(communityRetrieval).toContain("opportunity.status = 'fulfilled'");
    expect(communityRetrieval).not.toContain("community_opportunity_participation");
  });
});
