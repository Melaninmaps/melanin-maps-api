import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, savedPlacesTable, reviewsTable, businessProfileViewsTable, businessSkipFeedbackTable, businessClickEventsTable } from "@workspace/db";
import { and, avg, count, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { requireMembership } from "../middleware/requireMembership";
import { storage } from "../storage";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface Suggestion {
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  body: string;
}

interface Trend {
  day: string;
  count: number;
}

interface Clicks30d {
  tiktok: number;
  instagram: number;
  youtube: number;
  facebook: number;
  pinterest: number;
  website: number;
  phoneCalls: number;
  directions: number;
}

interface AnalyticsResponse {
  tier: "navigator" | "trailblazer";
  business: { id: string; name: string; category: string; city: string };
  metrics: {
    saves: number;
    reviews: number;
    avgRating: number;
    views30d: number;
    skipFeedbackCount: number;
  };
  benchmarks: {
    peerCount: number;
    categoryAvgSaves: number;
    categoryAvgReviews: number;
    categoryAvgRating: number;
    categoryAvgViews30d: number;
  };
  suggestions: Suggestion[];
  engagementScore: number;
  trend?: Trend[];
  savesVsPeersPct: number;
  reviewsVsPeersPct: number;
  ratingVsPeersPct: number;
  viewsVsPeersPct: number;
  clicks30d: Clicks30d;
}

function computeEngagementScore(
  metrics: AnalyticsResponse["metrics"],
  benchmarks: AnalyticsResponse["benchmarks"],
  business: { website?: string | null; phone?: string | null; hours?: string | null; photos: string[]; verified: boolean; confidenceScore: number },
): number {
  const safeDiv = (n: number, d: number) => (d === 0 ? 0.5 : Math.min(n / d, 2));

  const savesScore = safeDiv(metrics.saves, benchmarks.categoryAvgSaves) * 25;
  const reviewsScore = safeDiv(metrics.reviews, benchmarks.categoryAvgReviews) * 20;
  const ratingScore = (metrics.avgRating / 5) * 20;
  const viewsScore = safeDiv(metrics.views30d, benchmarks.categoryAvgViews30d) * 15;

  const hasWebsite = business.website ? 1 : 0;
  const hasPhone = business.phone ? 1 : 0;
  const hasHours = business.hours ? 1 : 0;
  const hasPhotos = business.photos.length > 0 ? 1 : 0;
  const isVerified = business.verified ? 1 : 0;
  const completeness = ((hasWebsite + hasPhone + hasHours + hasPhotos + isVerified) / 5) * 20;

  const raw = Math.min(savesScore + reviewsScore + ratingScore + viewsScore + completeness, 100);
  return Math.round(raw);
}

function buildSuggestions(
  metrics: AnalyticsResponse["metrics"],
  benchmarks: AnalyticsResponse["benchmarks"],
  business: {
    website?: string | null;
    phone?: string | null;
    hours?: string | null;
    photos: string[];
    verified: boolean;
    confidenceScore: number;
    safetyRating?: string | null;
    description: string;
  },
  tier: "navigator" | "trailblazer",
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (business.photos.length === 0) {
    suggestions.push({
      priority: "high",
      icon: "camera",
      title: "Add photos",
      body: "Listings with photos get significantly more profile views. Show customers what makes your space unique.",
    });
  }

  if (!business.website) {
    suggestions.push({
      priority: "high",
      icon: "globe",
      title: "Add your website",
      body: "Customers want to learn more before they visit. A website link converts browsers into buyers.",
    });
  }

  if (!business.phone) {
    suggestions.push({
      priority: "high",
      icon: "phone",
      title: "Add a phone number",
      body: "Many customers prefer to call ahead. Missing contact info is a common reason people move on.",
    });
  }

  if (!business.hours) {
    suggestions.push({
      priority: "high",
      icon: "clock",
      title: "Add business hours",
      body: "Customers won't visit if they don't know when you're open. Hours are one of the first things people check.",
    });
  }

  if (!business.verified) {
    suggestions.push({
      priority: "high",
      icon: "shield",
      title: "Get verified",
      body: "Verified businesses see higher click-through rates. Verification builds trust with the community.",
    });
  }

  const peerRating = benchmarks.categoryAvgRating;
  if (peerRating > 0 && metrics.avgRating > 0 && metrics.avgRating < peerRating - 0.3) {
    suggestions.push({
      priority: "high",
      icon: "star",
      title: "Your rating is below the category average",
      body: `Similar businesses in your area average ${peerRating.toFixed(1)}★. Responding to reviews and encouraging satisfied customers to leave feedback can help close the gap.`,
    });
  }

  if (benchmarks.peerCount >= 3 && metrics.reviews < benchmarks.categoryAvgReviews * 0.5) {
    suggestions.push({
      priority: "medium",
      icon: "message-square",
      title: "Encourage more reviews",
      body: `Comparable businesses average ${Math.round(benchmarks.categoryAvgReviews)} reviews. Ask satisfied customers to share their experience — it's the fastest way to grow your profile.`,
    });
  }

  if (benchmarks.peerCount >= 3 && metrics.saves < benchmarks.categoryAvgSaves * 0.5) {
    suggestions.push({
      priority: "medium",
      icon: "bookmark",
      title: "Low saves compared to peers",
      body: `Businesses in your category average ${Math.round(benchmarks.categoryAvgSaves)} saves. Saves drive repeat visits — ensure your listing has a compelling description and photos.`,
    });
  }

  if (business.confidenceScore < 60) {
    suggestions.push({
      priority: "medium",
      icon: "award",
      title: "Improve your confidence score",
      body: `Your confidence score (${business.confidenceScore}) is below our recommended threshold. Complete your profile and get community engagement to raise it.`,
    });
  }

  if (!business.safetyRating) {
    suggestions.push({
      priority: "low",
      icon: "shield-off",
      title: "No community safety rating yet",
      body: "Encourage customers to complete safety surveys for your location. A strong safety rating builds trust with new visitors.",
    });
  }

  if (metrics.skipFeedbackCount > 0) {
    suggestions.push({
      priority: tier === "trailblazer" ? "medium" : "low",
      icon: "mail",
      title: `${metrics.skipFeedbackCount} private feedback note${metrics.skipFeedbackCount > 1 ? "s" : ""} received`,
      body: "Community members have left constructive notes after skipping your listing. Review them in your Messages to identify quick improvements.",
    });
  }

  return tier === "navigator" ? suggestions.slice(0, 4) : suggestions;
}

function pctVsPeers(value: number, peerAvg: number): number {
  if (peerAvg === 0) return 100;
  return Math.round((value / peerAvg) * 100);
}

router.get(
  "/businesses/mine/analytics",
  requireMembership("navigator"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id as string;

      const user = await storage.getUser(userId);
      const tier: "navigator" | "trailblazer" =
        user?.memberType === "trailblazer" ||
        user?.memberType === "founding" ||
        user?.memberType === "beta"
          ? "trailblazer"
          : "navigator";

      const [business] = await db
        .select()
        .from(businessesTable)
        .where(eq(businessesTable.submittedById, userId))
        .limit(1);

      if (!business) {
        res.status(404).json({ error: "No business found for your account." });
        return;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [savesRow] = await db
        .select({ count: count() })
        .from(savedPlacesTable)
        .where(eq(savedPlacesTable.businessId, business.id));

      const [reviewRow] = await db
        .select({ count: count(), avgRating: avg(reviewsTable.rating) })
        .from(reviewsTable)
        .where(eq(reviewsTable.businessId, business.id));

      const [viewRow] = await db
        .select({ count: count() })
        .from(businessProfileViewsTable)
        .where(
          and(
            eq(businessProfileViewsTable.businessId, business.id),
            gt(businessProfileViewsTable.viewedAt, thirtyDaysAgo),
          ),
        );

      const [skipRow] = await db
        .select({ count: count() })
        .from(businessSkipFeedbackTable)
        .where(eq(businessSkipFeedbackTable.businessId, business.id));

      const clickRows = await db
        .select({ clickType: businessClickEventsTable.clickType, cnt: count() })
        .from(businessClickEventsTable)
        .where(and(eq(businessClickEventsTable.businessId, business.id), gt(businessClickEventsTable.clickedAt, thirtyDaysAgo)))
        .groupBy(businessClickEventsTable.clickType);
      const clickMap: Record<string, number> = {};
      for (const row of clickRows) clickMap[row.clickType] = Number(row.cnt);

      const peers = await db
        .select({
          id: businessesTable.id,
          reviewCount: businessesTable.reviewCount,
          rating: businessesTable.rating,
        })
        .from(businessesTable)
        .where(
          and(
            eq(businessesTable.category, business.category),
            eq(businessesTable.city, business.city),
            ne(businessesTable.id, business.id),
            eq(businessesTable.status, "active"),
          ),
        );

      const peerIds = peers.map((p) => p.id);

      let peerSavesData: { businessId: string; saveCount: number }[] = [];
      let peerViewsData: { businessId: string; viewCount: number }[] = [];

      if (peerIds.length > 0) {
        const allPeerSaves = await db
          .select({ businessId: savedPlacesTable.businessId, count: count() })
          .from(savedPlacesTable)
          .where(inArray(savedPlacesTable.businessId, peerIds))
          .groupBy(savedPlacesTable.businessId);
        peerSavesData = allPeerSaves.map((r) => ({ businessId: r.businessId, saveCount: Number(r.count) }));

        const allPeerViews = await db
          .select({ businessId: businessProfileViewsTable.businessId, count: count() })
          .from(businessProfileViewsTable)
          .where(
            and(
              inArray(businessProfileViewsTable.businessId, peerIds),
              gt(businessProfileViewsTable.viewedAt, thirtyDaysAgo),
            ),
          )
          .groupBy(businessProfileViewsTable.businessId);
        peerViewsData = allPeerViews.map((r) => ({ businessId: r.businessId, viewCount: Number(r.count) }));
      }

      const peerSavesMap = new Map(peerSavesData.map((r) => [r.businessId, r.saveCount]));
      const peerViewsMap = new Map(peerViewsData.map((r) => [r.businessId, r.viewCount]));

      const peerCount = peers.length;
      const categoryAvgSaves = peerCount === 0 ? 0 : peerIds.reduce((s, id) => s + (peerSavesMap.get(id) ?? 0), 0) / peerCount;
      const categoryAvgReviews = peerCount === 0 ? 0 : peers.reduce((s, p) => s + p.reviewCount, 0) / peerCount;
      const categoryAvgRating = peerCount === 0 ? 0 : peers.reduce((s, p) => s + Number(p.rating), 0) / peerCount;
      const categoryAvgViews30d = peerCount === 0 ? 0 : peerIds.reduce((s, id) => s + (peerViewsMap.get(id) ?? 0), 0) / peerCount;

      const metrics = {
        saves: savesRow?.count ?? 0,
        reviews: reviewRow?.count ?? 0,
        avgRating: Number(reviewRow?.avgRating ?? business.rating ?? 0),
        views30d: viewRow?.count ?? 0,
        skipFeedbackCount: skipRow?.count ?? 0,
      };

      const benchmarks = {
        peerCount,
        categoryAvgSaves: Math.round(categoryAvgSaves * 10) / 10,
        categoryAvgReviews: Math.round(categoryAvgReviews * 10) / 10,
        categoryAvgRating: Math.round(categoryAvgRating * 100) / 100,
        categoryAvgViews30d: Math.round(categoryAvgViews30d * 10) / 10,
      };

      const suggestions = buildSuggestions(metrics, benchmarks, {
        website: business.website,
        phone: business.phone,
        hours: business.hours,
        photos: business.photos,
        verified: business.verified,
        confidenceScore: business.confidenceScore,
        safetyRating: business.safetyRating,
        description: business.description,
      }, tier);

      const engagementScore = computeEngagementScore(metrics, benchmarks, {
        website: business.website,
        phone: business.phone,
        hours: business.hours,
        photos: business.photos,
        verified: business.verified,
        confidenceScore: business.confidenceScore,
      });

      let trend: Trend[] | undefined;
      if (tier === "trailblazer") {
        const rows = await db
          .select({
            day: sql<string>`DATE(${businessProfileViewsTable.viewedAt})`,
            count: count(),
          })
          .from(businessProfileViewsTable)
          .where(
            and(
              eq(businessProfileViewsTable.businessId, business.id),
              gt(businessProfileViewsTable.viewedAt, sevenDaysAgo),
            ),
          )
          .groupBy(sql`DATE(${businessProfileViewsTable.viewedAt})`);

        const trendMap = new Map(rows.map((r) => [r.day, r.count]));
        trend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          trend.push({ day: key, count: trendMap.get(key) ?? 0 });
        }
      }

      const response: AnalyticsResponse = {
        tier,
        business: { id: business.id, name: business.name, category: business.category, city: business.city },
        metrics,
        benchmarks,
        suggestions,
        engagementScore,
        trend,
        savesVsPeersPct: pctVsPeers(metrics.saves, benchmarks.categoryAvgSaves),
        reviewsVsPeersPct: pctVsPeers(metrics.reviews, benchmarks.categoryAvgReviews),
        ratingVsPeersPct: pctVsPeers(metrics.avgRating, benchmarks.categoryAvgRating),
        viewsVsPeersPct: pctVsPeers(metrics.views30d, benchmarks.categoryAvgViews30d),
        clicks30d: {
          tiktok: clickMap["tiktok_visit"] ?? 0,
          instagram: clickMap["instagram_visit"] ?? 0,
          youtube: clickMap["youtube_visit"] ?? 0,
          facebook: clickMap["facebook_visit"] ?? 0,
          pinterest: clickMap["pinterest_visit"] ?? 0,
          website: clickMap["website_visit"] ?? 0,
          phoneCalls: clickMap["phone_call"] ?? 0,
          directions: clickMap["directions"] ?? 0,
        },
      };

      logger.info({ businessId: business.id, tier, engagementScore }, "[analytics] served");
      res.json(response);
    } catch (err) {
      req.log.error({ err }, "GET /businesses/mine/analytics error");
      res.status(500).json({ error: "Failed to load analytics." });
    }
  },
);

export default router;
