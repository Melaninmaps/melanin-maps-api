# Immediate Community Business Intake and Founder Review

## What ships first

This release gives community members a simple way to add a business from the website or a social-media link. Every submission enters a **pending founder review queue**. It does not appear on the public map, Directory, Kinfolk recommendations, Community Vibes, or search until the founder approves it.

The first release is intentionally simple and review-first. Community members provide the business name, what it does, owner/founder information if the owner chooses to share it, city/state, basic contact/social links, specialties, and community tags. The founder reviews each item, approves it for publication, asks for more information, or declines it. The audit log preserves the decision history.

## 1. Apply the database migration

Run:

```bash
pnpm db:migrate
```

This applies `db/migrations/20260818_08_community_business_submissions.sql`. It adds a separate submission queue and does not alter existing approved business records.

## 2. Register API routes

At API startup, create the repository and register:

```ts
const submissions = new SubmissionRepository(pool);
registerSubmissionRoutes(app, submissions, approvedBusinessPublisher);
```

`approvedBusinessPublisher.publishFromSubmission(submissionId, reviewerId)` is the only project-specific adapter. It must:

1. Read the pending submission.
2. Create or update the **canonical business record** using the existing production business schema.
3. Generate the official server-side slug and location fields.
4. Set the business’s public listing status to approved.
5. Return the published business UUID.

Do not let the browser publish a business directly. Do not expose pending submissions through directory, map, search, Kinfolk, or public business APIs.

## 3. Mount the website form and founder queue

Add these routes to the web client:

```tsx
<Route path="/submit-business" element={<BusinessSubmissionForm />} />
<Route path="/founder/business-submissions" element={<BusinessSubmissionReviewQueue />} />
```

Add **Share a Business** / **Put Your People On** links in the Directory, Map, Business page, Community page, footer, and navigation. The founder route must be protected by the existing founder/admin role guard.

## 4. Immediate social-media path

No external social API is required for the first release. Use one shareable web form that records its source:

```text
Instagram bio: https://mappingwithmelanin.com/submit-business?source=instagram&campaign=bio
Facebook post: https://mappingwithmelanin.com/submit-business?source=facebook&campaign=community-post
TikTok bio: https://mappingwithmelanin.com/submit-business?source=tiktok&campaign=bio
QR flyer: https://mappingwithmelanin.com/submit-business?source=qr&campaign=flyer
```

Use the copy in `socialIntakeLinks.ts`. Social comments and direct messages can be answered with the same form link. Do not attempt to automatically scrape DMs or publish social suggestions without the form and founder review. Direct platform integration can be considered later, once the review workflow is stable.

## 5. Founder review workflow

The founder sees all pending submissions at `/founder/business-submissions`.

| Decision | Result |
|---|---|
| **Approve and publish** | Creates/updates the official business record and makes it eligible for the relevant local Directory/Map/Kinfolk flows. |
| **Request more information** | Keeps it out of public results and preserves the review note. |
| **Decline** | Keeps it out of public results and records the decision. |

For now, review every entry. Do not turn on automatic publication until the founder has confirmed that intake quality, fraud handling, and category/tag standards are consistent.

## 6. Required tests before launch

1. Submit a business through `/submit-business`.
2. Confirm it appears in the founder queue with status `pending_review`.
3. Confirm it does **not** appear in public search, local map pins, directory, or Kinfolk results.
4. Approve the item as founder and confirm the canonical business record receives a valid slug and location.
5. Confirm it appears only for eligible local searches after approval.
6. Test all social links and confirm `source` / `source_campaign` are saved.
7. Confirm a non-founder receives 403 from `/api/founder/business-submissions`.

## Browser connection note

The screen shown in your screenshot is a **My Browser settings page**, not a new browser tab for Mapping with Melanin. The “Learn more” link is documentation; it does not connect a session by itself. The visible spinner means the settings view did not finish loading.

When the connection works, open the relevant MWM page in your normal browser, then use the session’s browser-connection prompt to authorize that already-open page/session. Look for a direct **Connect/Authorize** action, not Learn More. If settings stays on a spinner, close it and retry from the actual MWM page; if it still does not offer Connect/Authorize, it is a connection-interface issue rather than something you are doing wrong. The audit can also continue with the dedicated audit account in a separate browser session; it does not require your personal founder browser session for ordinary member-flow testing.
