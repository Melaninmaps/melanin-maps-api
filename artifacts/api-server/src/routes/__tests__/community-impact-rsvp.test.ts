import { readFileSync } from "node:fs";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());
const dbSelect = vi.hoisted(() =>
  vi.fn(() => ({
    from: () => ({
      innerJoin: () => ({
        where: () => ({
          orderBy: async () => [],
        }),
      }),
    }),
  })),
);

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
  db: { select: dbSelect },
  businessOwnerLinksTable: {
    businessId: "business_id",
    role: "role",
    status: "status",
    userId: "user_id",
    createdAt: "created_at",
  },
  businessesTable: {
    id: "id",
    name: "name",
    category: "category",
    city: "city",
    state: "state",
    rating: "rating",
    imageUrl: "image_url",
    verified: "verified",
  },
  usersTable: {
    id: "id",
    firstName: "first_name",
    lastName: "last_name",
    bio: "bio",
    profileImageUrl: "profile_image_url",
    memberType: "member_type",
    isInfluencer: "is_influencer",
  },
}));

import communityImpactRouter from "../community-impact";

const profilePage = readFileSync(
  new URL("../../../../web/src/pages/profile.tsx", import.meta.url),
  "utf8",
);

function createApp() {
  const app = express();
  app.use((request: Request, _response: Response, next: NextFunction) => {
    (request as any).log = {
      error: vi.fn(),
    };
    next();
  });
  app.use("/api", communityImpactRouter);
  return app;
}

function count(countValue: number) {
  return { rows: [{ cnt: String(countValue) }] };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Community Impact RSVP visibility", () => {
  it("returns a member's current RSVP count without querying a nonexistent RSVP status column", async () => {
    poolQuery
      .mockResolvedValueOnce(count(2))
      .mockResolvedValueOnce(count(1))
      .mockResolvedValueOnce(count(3))
      .mockResolvedValueOnce(count(0))
      .mockResolvedValueOnce(count(0))
      .mockResolvedValueOnce(count(0))
      .mockResolvedValueOnce({ rows: [] });

    const response = await supertest(createApp()).get(
      "/api/community-impact/member-1",
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      stats: {
        reviewCount: 2,
        businessesReviewedCount: 1,
        eventsAttended: 3,
        communityPosts: 0,
        savedBusinesses: 0,
        referralsMade: 0,
        score: 13,
      },
      supportedBusinesses: [],
      ownedBusinesses: [],
    });

    const eventRsvpCall = poolQuery.mock.calls.find(([statement]) =>
      String(statement).includes("FROM event_rsvps"),
    );
    expect(eventRsvpCall).toBeDefined();
    expect(eventRsvpCall?.[0]).toContain("WHERE user_id = $1");
    expect(eventRsvpCall?.[0]).not.toMatch(/\bstatus\b/i);
    expect(eventRsvpCall?.[1]).toEqual(["member-1"]);
  });

  it("keeps the Community Impact card visible when existing activity is limited to RSVPs or referrals", () => {
    const impactStart = profilePage.indexOf("{/* ── My Community Impact");
    const impactSection = profilePage.slice(impactStart, impactStart + 2_000);

    expect(impactStart).toBeGreaterThan(-1);
    expect(impactSection).toContain("impact.eventsAttended > 0");
    expect(impactSection).toContain("impact.referralsMade > 0");
    expect(impactSection).toContain('label: "Events Attended"');
    expect(impactSection).toContain('label: "Members Referred"');
  });
});
