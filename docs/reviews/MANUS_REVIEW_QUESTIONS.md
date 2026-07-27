# Manus Review Questions — Mapping With Melanin™ Build 97
**Date:** July 27, 2026
**From:** Founder
**To:** Manus (Senior Engineering Reviewer)

Please answer each question directly, using the evidence in this review package. Where you cannot determine an answer from the package, state what additional information you need and how to obtain it.

---

1. **What were the actual root causes of the Apple rejections?**
   Specifically: Was the Build 96 rejection caused entirely by DB pool exhaustion, or were there additional contributing factors? Could the absence of a pre-seeded reviewer account have triggered a secondary rejection even if the DB had been stable?

2. **Is the StripeSync pool-leak correction technically complete?**
   Review `artifacts/api-server/src/stripeClient.ts`. Is the promise-based singleton pattern race-condition safe? Are there any other code paths (e.g., `webhookHandlers.ts`, other route files) where `new StripeSync()` or `new pg.Pool()` could be instantiated outside these singletons?

3. **Is the application pool increase from 5 to 8 justified?**
   Review `lib/db/src/index.ts`. Given one Railway replica, 30 expected testers, and Apple review traffic: is `max:8` correctly sized? Too conservative? Too aggressive?

4. **Is the Stripe pool maximum of 2 appropriate?**
   StripeSync now uses `max:2`. Is this sufficient for webhook throughput? Is it low enough to prevent pool exhaustion recurrence?

5. **Is the undrained startup migration pool a release blocker?**
   `runMigrations({ databaseUrl })` from `stripe-replit-sync` creates a pool that is not explicitly closed. Given it runs once at startup and connections are eventually closed by Postgres idle timeout: is this acceptable for production release, or must it be fixed before Build 97?

6. **Are the retry conditions safe and sufficient?**
   Review `artifacts/api-server/src/lib/db-retry.ts`. Are the 5 covered routes the right set? Is the 500ms delay and single retry appropriate? Are there idempotency risks in any of the retried operations?

7. **Can Railway production support Apple review plus approximately 30 mixed-platform testers?**
   Given 10 max connections (8 app + 2 Stripe), one replica, and the retry helper: is the architecture sound for this concurrency level? What is the maximum safe concurrent request count?

8. **What production load/stability evidence is still required?**
   The load test was run against Replit/local Postgres, not Railway production. Is local load testing sufficient, or must we run the load test against Railway production before submission? What specific evidence would give you confidence?

9. **Are iPhone and iPad configurations review-ready?**
   Review `docs/reviews/native/IOS_CONFIG.md` and `artifacts/mobile/app.json`. Is the iPad support configuration (`supportsTablet: true`, all four orientations) correct for Apple's iPad review device (iPad Air 11-inch M3, iPadOS 26.5.2)?

10. **Are Android phone and tablet configurations testing-ready?**
    Review `docs/reviews/native/ANDROID_CONFIG.md`. Is `minSdkVersion: 26`, `targetSdkVersion: 36`, `compileSdkVersion: 36` correct? Is large-screen/tablet support adequately declared?

11. **Is the proposed Build 97 scope too broad?**
    The founder wants Maps, Heritage, Historical Sundown Towns, Community, KinfolkAI, and full auth in one submission. Is this too many moving parts for an approval build? Which items introduce rejection risk if left incomplete or imperfect?

12. **Can Maps safely ship?**
    The app uses Google Maps JS API (web) and `react-native-maps` (mobile). Key risks: `withRnMapsPodfileFix` plugin, `StyleSheet.absoluteFillObject` fix, Google Maps API key in EAS env. Are these adequately addressed?

13. **Can Heritage places safely ship?**
    Heritage places (cultural sites) are visible on the map with dedicated pins and a detail screen. Data is in the `cultural_sites` table. Is there any content or permission risk in shipping this feature?

14. **Can Historical Sundown Towns safely ship?**
    **This feature is NOT fully built.** Data has NOT been imported to the production database. The `sundown` category exists in the `reports`, `businesses`, and `directions` tables, but dedicated UI and data import are not confirmed complete. Please assess: given this state, should Historical Sundown Towns be (a) shipped as documented historical reference with proper sourcing, (b) hidden behind a flag, or (c) deferred entirely?

15. **Are the data source, attribution, confidence labels, disclaimers, and presentation sufficient for Apple review and user safety?**
    KinfolkAI currently uses OpenAI GPT-4o (or equivalent) via Replit AI integration. Heritage data is from the `cultural_sites` table. Any Sundown Towns data that exists references historical sources. Do these meet Apple's content policy and user safety standards?

16. **Can basic KinfolkAI safely ship?**
    Review `docs/reviews/features/KINFOLKAI_BUILD_97_REVIEW.md`. The chatbot has live weather (Open-Meteo), multi-turn memory, tone/voice settings, and tier-based limits. Are there any hallucination, content policy, or Apple guideline risks?

17. **Does KinfolkAI correctly handle weather and current information?**
    KinfolkAI uses Open-Meteo (free, no API key required) for live weather. It does NOT have access to live news, current safety incidents, or real-time business hours. Does the system prompt adequately constrain KinfolkAI from inventing current information it cannot know?

18. **Does business language accurately support the diaspora and multiple minority communities?**
    The app uses `ownershipDesignations` and `diasporaCountries` fields rather than a universal "Black-owned" flag. "Black-owned" copy is only shown when verified or user-chosen. Is this implementation consistent with the community standards described in the platform vocabulary?

19. **Are there any remaining App Store Guideline 2.1 risks?**
    Beyond the DB fix: are there visible incomplete features (placeholder screens, stub data, broken flows) that Apple could cite under Guideline 2.1?

20. **Are there any remaining privacy or account-deletion risks?**
    Review `docs/reviews/PRIVACY_DATA_COLLECTION_SUMMARY.md`. Is the account deletion flow (`DELETE /api/auth/account`) complete? Does it remove all user data? Are there any GDPR/CCPA concerns with the current data collection?

21. **Are there any subscription/RevenueCat risks?**
    Review `docs/reviews/SUBSCRIPTION_REVIEW.md`. Are the RevenueCat product identifiers correctly configured in App Store Connect? Is there any Apple Guideline 3.1 risk (external payment references, web-only subscription paths)?

22. **Are there any UGC moderation risks?**
    Community posts, reviews, safety reports, and business nominations are all user-generated. Is the current moderation system (content reports, admin review) sufficient to prevent rejection under Apple's content guidelines?

23. **Are there any visible incomplete features that Apple could reject?**
    Please list any screen or flow that is visible in the app but non-functional, stub-filled, or partially implemented in a way Apple's reviewer could encounter.

24. **What exact items should be included in iOS Build 97?**
    Please provide a GO / CONDITIONAL GO / NO-GO recommendation for each major feature area: auth, maps, heritage, sundown towns, community, kinfolkai, subscriptions, business discovery.

25. **What exact items should be included in the Android build?**
    Should iOS and Android scope remain identical? Are there Android-specific risks (permissions, tablet support, SDK version) that argue for a more conservative Android scope?

26. **What should be deferred?**
    Which features or capabilities would you recommend hiding, flagging, or removing from Build 97 to reduce rejection risk?

27. **What must be fixed before building?**
    Beyond the Railway deploy + 12-hour stability window: are there any code changes required before `eas build` should be run?

28. **What must be tested after building but before submission?**
    Please provide a specific testing checklist for the period between `eas build` completion and `eas submit`.

29. **Would Manus declare GO, CONDITIONAL GO, or NO-GO for each platform?**

    | Platform | Manus Declaration | Conditions (if CONDITIONAL GO) |
    |----------|-------------------|--------------------------------|
    | Web | — | — |
    | iOS (iPhone) | — | — |
    | iOS (iPad) | — | — |
    | Android phone | — | — |
    | Android tablet | — | — |

30. **What is the fastest responsible path to testers and Apple approval?**
    Given the current state — fix implemented but not deployed, Railway unstable, 12-hour window not started, review account not created — what is the minimum set of steps and their sequence to reach a submittable state as quickly as possible without cutting safety corners?
