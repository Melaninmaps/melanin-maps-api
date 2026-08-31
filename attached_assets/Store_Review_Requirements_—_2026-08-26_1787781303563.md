# Store Review Requirements — 2026-08-26

## Apple

Apple states that submissions should be fully tested for crashes and bugs, backend services must be live during review, all links must work, and reviewers must receive full access through an active demo account or fully featured demo mode. App Review Guideline 2.1 says incomplete bundles and binaries that crash or exhibit obvious technical problems will be rejected. For apps with user-generated content, Guideline 1.2 requires filtering objectionable material, reporting, blocking abusive users, and published contact information.

Apple also permits expedited-review requests for critical bug fixes or an approaching event directly associated with the app, but the request should identify the event, date, association, and—when fixing a critical bug—the reproduction steps for the current version.

Sources:
- https://developer.apple.com/distribute/app-review/
- https://developer.apple.com/app-store/review/guidelines/

## Google Play

Google requires reviewer sign-in details that remain accessible, reusable, valid from any location, and free of expiring one-time-password or two-factor barriers. Instructions and credentials must provide access to all restricted functionality, including subscription-protected areas.

Source:
- https://support.google.com/googleplay/android-developer/answer/15748846?hl=en

## Additional Google Play gates for this app

Because Mapping With Melanin includes community posts, media, mentions, circles, and connections, Google Play's UGC policy requires clear terms accepted before upload, ongoing moderation, in-app reporting of content and users, and user-blocking functionality. Apple imposes similar UGC requirements for filtering, reporting, blocking, and published support contact information.

If users can create an account in the app, Google requires both an in-app account-deletion path and a web resource for requesting account and associated-data deletion. The Play Console Data safety answers must match the implemented behavior.

Google recommends uploading the release candidate to a test track, supplying test credentials, and reviewing the resulting pre-launch report across Android versions for stability, compatibility, security/privacy, accessibility, and layout issues.

Sources:
- https://support.google.com/googleplay/android-developer/answer/9876937?hl=en
- https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- https://play.google.com/console/about/pre-launchreports/
