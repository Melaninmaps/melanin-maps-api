import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { communityNeedTopicLabel } from "../kinfolk/community-need-feedback";
import {
  resolveVerifiedMinorityFlywheelOwner,
  VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
} from "../businesses/verifiedMinorityFlywheelEligibility";

const router: IRouter = Router();

/**
 * Community-need insights are private to an approved owner of a currently
 * verified minority business. This route intentionally does not recognize the
 * platform-admin role as a bypass: an administrator without an active owner
 * link receives the same 403 as any other non-owner. Returned rows contain
 * aggregate counts and a broad selected topic only — never member, account,
 * message, session, transcript, or note.
 */
router.get("/businesses/:id/kinfolk-community-needs", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  const businessId = String(req.params.id ?? "").trim();
  if (!businessId) return void res.status(400).json({ error: "businessId is required" });

  try {
    const access = await resolveVerifiedMinorityFlywheelOwner(pool, {
      businessId,
      userId: req.user.id,
    });
    if (access.kind === "not_owner") {
      return void res.status(403).json({ error: "Approved business owner access is required" });
    }
    if (access.kind === "ineligible") {
      return void res.status(403).json({
        error: VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
        code: "VERIFIED_MINORITY_FLYWHEEL_ELIGIBILITY_REQUIRED",
      });
    }

    const insights = await pool.query<{
      id: string;
      topic_key: string;
      member_count: number;
      threshold: number;
      first_reached_at: string;
      last_observed_at: string;
    }>(
      `SELECT id, topic_key, member_count, threshold, first_reached_at, last_observed_at
         FROM kinfolk_community_need_insights
        WHERE business_id = $1
          AND status = 'active'
        ORDER BY first_reached_at DESC`,
      [businessId],
    );

    res.json({
      insights: insights.rows.flatMap((insight) => {
        const topicLabel = communityNeedTopicLabel(insight.topic_key);
        if (!topicLabel) return [];
        return [{
          id: insight.id,
          topicKey: insight.topic_key,
          topicLabel,
          memberCount: Number(insight.member_count),
          threshold: Number(insight.threshold),
          firstReachedAt: insight.first_reached_at,
          lastObservedAt: insight.last_observed_at,
        }];
      }),
    });
  } catch (error) {
    req.log.error({ error }, "Failed to read private Kinfolk community needs");
    res.status(500).json({ error: "Could not load private community needs" });
  }
});

export default router;
