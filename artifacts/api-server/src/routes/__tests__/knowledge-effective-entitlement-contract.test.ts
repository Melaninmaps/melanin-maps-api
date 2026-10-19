import { readFileSync } from "node:fs";
import { describe, expect, it, beforeEach, vi } from "vitest";

const { poolQuery, storageGetUser } = vi.hoisted(() => ({
  poolQuery: vi.fn(),
  storageGetUser: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

vi.mock("../../storage", () => ({
  storage: { getUser: storageGetUser },
}));

import { getUserTier } from "../../middleware/requireMembership";

const knowledgeSource = readFileSync(
  new URL("../knowledge.ts", import.meta.url),
  "utf8",
);

const premiumArticleHandler = knowledgeSource.slice(
  knowledgeSource.indexOf('router.get("/knowledge/articles/:id"'),
  knowledgeSource.indexOf('router.get("/knowledge/experts"'),
);

const freePersonalUser = {
  id: "member-1",
  memberType: "free",
  stripeSubscriptionId: null,
  trialEndsAt: null,
};

describe("knowledge effective entitlement contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageGetUser.mockResolvedValue(freePersonalUser);
  });

  it("delegates premium article access to the canonical effective tier resolver while retaining the locked preview branch", () => {
    expect(knowledgeSource).toContain('import { getUserTier } from "../middleware/requireMembership";');
    expect(premiumArticleHandler).toContain("const tier = await getUserTier(userId);");
    expect(premiumArticleHandler).toContain('if (tier === "free")');
    expect(premiumArticleHandler).toContain("content: article.content.slice(0, 400) + \"…\"");
    expect(premiumArticleHandler).not.toContain("stripeSubscriptionId");
    expect(premiumArticleHandler).not.toContain("trialEndsAt");
    expect(premiumArticleHandler).not.toContain('memberType === "founding"');
    expect(premiumArticleHandler).not.toContain('memberType === "beta"');
  });

  it("admits the existing approved active business-owner tier without a knowledge-route-specific grant", async () => {
    poolQuery.mockResolvedValue({
      rows: [{ business_status: "premium", founding_business: false }],
    });

    await expect(getUserTier("member-1")).resolves.toBe("legacy_member");
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining("bol.revoked_at IS NULL"),
      ["member-1"],
    );
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining("b.status = 'active'"),
      ["member-1"],
    );
  });

  it("keeps a revoked or unavailable business grant at the canonical free tier", async () => {
    poolQuery.mockResolvedValue({ rows: [] });

    await expect(getUserTier("member-1")).resolves.toBe("free");
  });
});
