import { Router, type IRouter } from "express";
import communityOrgsRouter from "./community-orgs";
import recurringEventsRouter from "./recurring-events-route";
import editSuggestionsRouter from "./edit-suggestions";
import tourCulturalSitesRouter from "./tour-cultural-sites";
import culturalPhrasesRouter from "./cultural-phrases";
import healthRouter from "./health";
import authRouter from "./auth";
import phoneAuthRouter from "./phone-auth";
import businessesRouter from "./businesses";
import travelRouter from "./travel";
import surveysRouter from "./surveys";
import savedPlacesRouter from "./saved-places";
import alertsRouter from "./alerts";
import moderationRouter from "./moderation";
import reviewsRouter from "./reviews";
import checkinsRouter from "./checkins";
import pointsRouter from "./points";
import eventRsvpsRouter from "./event-rsvps";
import pushTokenRouter from "./push-token";
import communityRouter from "./community";
import conversationsRouter from "./conversations";
import waitlistRouter from "./waitlist";
import contactRouter from "./contact";
import eventsRouter from "./events";
import usersRouter from "./users";
import groupsRouter from "./groups";
import adminRouter from "./admin";
import kinfolkRouter, { probeKinfolkAI } from "./kinfolk";
import wishlistRouter from "./wishlist";
import claimsRouter from "./claims";
import notificationsRouter from "./notifications";
import stripeRouter from "./stripe";
import adminUsersRouter from "./admin-users";
import adminTestersRouter from "./admin-testers";
import mapsRouter from "./maps";
import ogRouter from "./og";
import jobsRouter from "./jobs";
import impactRouter from "./impact";
import submitBusinessRouter from "./submit-business";
import billingRouter from "./billing";
import cronRouter from "./cron";
import referralsRouter from "./referrals";
import contentReportsRouter from "./content-reports";
import verificationRouter from "./verification";
import dealsRouter from "./deals";
import storiesRouter from "./stories";
import redemptionsRouter from "./redemptions";
import mentorshipRouter from "./mentorship";
import reportsRouter from "./reports";
import travelFlightsRouter from "./travel-flights";
import connectionsRouter from "./connections";
import familyRouter from "./family";
import safetyCheckinsRouter from "./safety-checkins";
import locationSharesRouter from "./location-shares";
import meetupVerificationsRouter from "./meetup-verifications";
import safetyTipsRouter from "./safety-tips";
import skipFeedbackRouter from "./skip-feedback";
import businessesAnalyticsRouter from "./businesses-analytics";
import promoteRouter from "./promote";
import postNudgeRouter from "./post-nudge";
import userSettingsRouter from "./user-settings";
import spaceReportsRouter from "./space-reports";
import connectRouter from "./connect";
import communitySpacesRouter from "./community-spaces";
import journalsRouter from "./journals";
import platePassesRouter from "./plate-passes";
import listsRouter from "./lists";
import challengeApplicationsRouter from "./challenge-applications";
import categoryWaitlistRouter from "./category-waitlist";
import businessNominationsRouter from "./business-nominations";
import businessIdentityRouter from "./business-identity";
import broadcastsRouter from "./broadcasts";
import communityHealthRouter from "./community-health";
import journalInsightsRouter from "./journal-insights";
import savedLocationsRouter from "./saved-locations";
import disputesRouter from "./disputes";
import docusignRouter from "./docusign";
import smartPathwaysRouter from "./smart-pathways";
import knowledgeRouter from "./knowledge";
import marketplaceFeesRouter from "./marketplace-fees";
import trustRouter from "./trust";
import journeysRouter from "./journeys";
import entityConnectionsRouter from "./entity-connections";
import passportRouter from "./passport";
import safetyHeatmapRouter from "./safety-heatmap";
import culturalSitesRouter from "./cultural-sites";
import sundownTownsRouter from "./sundown-towns";
import externalClicksRouter from "./external-clicks";
import monitorBuild97Router from "./monitor-build97";
import crashReportsRouter from "./crash-reports";
import signalsRouter from "./signals";
import smartSearchRouter from "./smart-search";
import notificationsHubRouter from "./notifications-hub";
import knowledgeChannelsRouter from "./knowledge-channels";
import { recommendRouter } from "./recommend";
import captionsRouter from "./captions";
import communityBoundariesRouter from "./community-boundaries";
import businessResponseRouter from "./business-response";
import businessImprovementRouter from "./business-improvement";
import communityAppreciationRouter from "./community-appreciation";
import circlesRouter from "./circles";
import communityRequestsRouter from "./community-requests";
import userAchievementsRouter from "./user-achievements";
import communitySaysRouter from "./community-says";
import communityChallengesNewRouter from "./community-challenges-new";
import followsRouter from "./follows";
import pinnedRouter from "./pinned";
import creatorProfilesRouter from "./creator-profiles";
import topicBriefsRouter from "./topic-briefs";
import knowledgeHubsRouter from "./knowledge-hubs";
import communityAlertsRouter from "./community-alerts";
import forYouRouter from "./for-you";
import knowledgeDeliveryRouter from "./knowledge-delivery";
import businessInsightsRouter from "./business-insights";
import globalRecommendationsRouter from "./global-recommendations";
import officerWatchRouter from "./officer-watch";
import wellnessRouter from "./wellness";
import kinfolkTasksRouter from "./kinfolk-tasks";
import featuredVideoRouter from "./featured-video";
import hubBadgesRouter from "./hub-badges";
import collectionsRouter from "./collections";
import roadmapsRouter from "./roadmaps";
import guidesRouter from "./guides";
import travelPlannerRouter from "./travel-planner";
import smartFillRouter from "./smart-fill";
import wrappedRouter from "./wrapped";
import archiveRouter from "./archive";
import revenuecatRouter from "./revenuecat";
import kinfolkIntelligenceRouter from "./kinfolk-intelligence";
import hiddenGemsRouter from "./hidden-gems";
import trustedSafetyShareRouter from "./trusted-safety-share";
import safetyExperienceRouter from "./safety-experience";
import resourcesRouter from "./resources";
import marketplaceRouter from "./marketplace";
import wellnessTrackerRouter from "./wellness-tracker";
import financialHubRouter from "./financial-hub";
import directionsRouter from "./directions";
import recommendedSpotsRouter from "./recommended-spots";
import previewRouter from "./preview";
import vibesRouter from "./vibes";
import hashtagsRouter from "./hashtags";
import communityPlacesRouter from "./community-places";
import communityImpactRouter from "./community-impact";
import showLoveRouter from "./show-love";
import membershipFamilyRouter from "./membership-family";
import legalRouter from "./legal";
import businessMembershipInfoRouter from "./business-membership-info";
import dbProbeRouter from "./db-probe";
import readyzRouter from "./readyz";
import poolStatsRouter from "./pool-stats";
import membershipRouter from "./membership";
import cityLaunchRouter from "./city-launch";
import tourGuideAdminRouter from "./tour-guide-admin";
import citiesRouter from "./cities";
import feedbackRouter from "./feedback";
import universalSearchRouter from "./universal-search";
import knowledgeGraphRouter from "./knowledge-graph";
import testerReportRouter from "./tester-report";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// ── Operational / health — no auth required ─────────────────────────────────
router.use(healthRouter);
router.use(dbProbeRouter);
router.use("/internal", readyzRouter);
router.use(poolStatsRouter);

// ── Auth flows — no auth required (these create sessions) ──────────────────
router.use(authRouter);
router.use(phoneAuthRouter);

// ── Truly public — accessible without an account ───────────────────────────
// Only routes that MUST work for unauthenticated visitors belong here.
// When in doubt, put routes AFTER the member wall.
router.use(waitlistRouter);       // public waitlist signup form
router.use(contactRouter);        // public contact form
router.use(cronRouter);           // CRON_SECRET-protected background jobs (no session)
router.use(ogRouter);             // social media link previews (no session for crawlers)
router.use(legalRouter);          // legal docs (public)
router.use(previewRouter);        // approved-tester preview mode
router.use(externalClicksRouter); // anonymous outbound click tracking
router.use(crashReportsRouter);   // anonymous crash reports from app clients
router.use(monitorBuild97Router); // internal health monitoring endpoint
router.use(feedbackRouter);       // in-app feedback (submitted before session check)
router.use(impactRouter);         // public platform stats (homepage "Growing Every Day" section)

// ── Public KinfolkAI health probe — must be before the member wall ────────────
// /api/kinfolk/health is polled by uptime monitors (UptimeRobot, Railway health
// checks) and the mobile app before showing the KinfolkAI chat UI.
// It probes the real OpenAI connection (cached 5 min) and returns ok/503.
// Safe to expose publicly: no user data, no platform data, no session required.
router.get("/kinfolk/health", async (_req, res) => {
  if (!process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] || !process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"]) {
    return void res.status(503).json({ ok: false, reason: "AI env vars not configured" });
  }
  const { ok, reason } = await probeKinfolkAI();
  if (!ok) return void res.status(503).json({ ok: false, reason: reason ?? "AI connection failed" });
  res.json({ ok: true });
});

// ── Member wall — ALL platform data requires an authenticated session ───────
// MWM serves communities that face real harm. Business locations, HBCU records,
// sundown-town data, and safety intelligence must never be readable by
// unauthenticated callers. Returns 401 — never an empty result set.
// Established: 2026-08-10. Supersedes previous public-discovery architecture.
router.use(requireAuth);

// ── Everything below requires authentication ────────────────────────────────

// Tester direct-to-founder issue reports
router.use(testerReportRouter);

// Membership / billing
router.use("/membership", membershipRouter);
router.use(stripeRouter);
router.use(billingRouter);
router.use(referralsRouter);
router.use(revenuecatRouter);
router.use(membershipFamilyRouter);

// Businesses
router.use(businessesRouter);
router.use(travelRouter);
router.use(surveysRouter);
router.use(savedPlacesRouter);
router.use(alertsRouter);
router.use(moderationRouter);
router.use(reviewsRouter);
router.use(checkinsRouter);
router.use(pointsRouter);
router.use(eventRsvpsRouter);
router.use(pushTokenRouter);
router.use(communityRouter);
router.use(conversationsRouter);
router.use(eventsRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(adminRouter);
router.use(kinfolkRouter);
router.use(kinfolkTasksRouter);
router.use(wishlistRouter);
router.use(claimsRouter);
router.use(notificationsRouter);
router.use(adminUsersRouter);
router.use(adminTestersRouter);
router.use(mapsRouter);
router.use(jobsRouter);
router.use(submitBusinessRouter);
router.use(contentReportsRouter);
router.use(verificationRouter);
router.use(dealsRouter);
router.use(storiesRouter);
router.use(redemptionsRouter);
router.use(mentorshipRouter);
router.use(reportsRouter);
router.use(travelFlightsRouter);
router.use(connectionsRouter);
router.use(familyRouter);
router.use(safetyCheckinsRouter);
router.use(locationSharesRouter);
router.use(meetupVerificationsRouter);
router.use(safetyTipsRouter);
router.use(skipFeedbackRouter);
router.use(businessesAnalyticsRouter);
router.use(promoteRouter);
router.use(postNudgeRouter);
router.use(userSettingsRouter);
router.use(spaceReportsRouter);
router.use(connectRouter);
router.use(communitySpacesRouter);
router.use(journalsRouter);
router.use(platePassesRouter);
router.use(listsRouter);
router.use(challengeApplicationsRouter);
router.use(categoryWaitlistRouter);
router.use(businessNominationsRouter);
router.use(businessIdentityRouter);
router.use(broadcastsRouter);
router.use(communityHealthRouter);
router.use(journalInsightsRouter);
router.use(savedLocationsRouter);
router.use(disputesRouter);
router.use(docusignRouter);
router.use(smartPathwaysRouter);
router.use(knowledgeRouter);
router.use(marketplaceFeesRouter);
router.use(trustRouter);
router.use(journeysRouter);
router.use(entityConnectionsRouter);
router.use(signalsRouter);
router.use(smartSearchRouter);
router.use(universalSearchRouter);
router.use(knowledgeGraphRouter);
router.use(notificationsHubRouter);
router.use(knowledgeChannelsRouter);
router.use(recommendRouter);
router.use(captionsRouter);
router.use(communityBoundariesRouter);
router.use(businessResponseRouter);
router.use(businessImprovementRouter);
router.use(communityAppreciationRouter);
router.use(circlesRouter);
router.use(communityRequestsRouter);
router.use(userAchievementsRouter);
router.use(communitySaysRouter);
router.use(communityChallengesNewRouter);
router.use(followsRouter);
router.use(pinnedRouter);
router.use(creatorProfilesRouter);
router.use(communityAlertsRouter);
router.use(knowledgeDeliveryRouter);
router.use(businessInsightsRouter);
router.use(topicBriefsRouter);
router.use(knowledgeHubsRouter);
router.use(forYouRouter);
router.use(globalRecommendationsRouter);
router.use(officerWatchRouter);
router.use(wellnessRouter);
router.use(featuredVideoRouter);
router.use(hubBadgesRouter);
router.use(collectionsRouter);
router.use(roadmapsRouter);
router.use(guidesRouter);
router.use(travelPlannerRouter);
router.use(smartFillRouter);
router.use(wrappedRouter);
router.use(archiveRouter);
router.use(kinfolkIntelligenceRouter);
router.use("/hidden-gems", hiddenGemsRouter);
router.use(resourcesRouter);
router.use(marketplaceRouter);
router.use(wellnessTrackerRouter);
router.use(financialHubRouter);
router.use(directionsRouter);
router.use(recommendedSpotsRouter);
router.use(vibesRouter);
router.use(hashtagsRouter);
router.use(communityPlacesRouter);
router.use(communityImpactRouter);
router.use(showLoveRouter);
router.use(businessMembershipInfoRouter);
router.use(cityLaunchRouter);
router.use(tourGuideAdminRouter);
router.use(citiesRouter);
router.use(communityOrgsRouter);
router.use(recurringEventsRouter);
router.use(editSuggestionsRouter);
router.use(tourCulturalSitesRouter);
router.use(culturalPhrasesRouter);
router.use(passportRouter);
router.use(safetyHeatmapRouter);
router.use(culturalSitesRouter);
router.use(sundownTownsRouter);
router.use(trustedSafetyShareRouter);
router.use(safetyExperienceRouter);

export default router;
