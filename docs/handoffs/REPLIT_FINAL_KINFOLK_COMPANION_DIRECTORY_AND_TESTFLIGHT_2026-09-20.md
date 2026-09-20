# Replit Final Execution Order: Kinfolk Companion Context, Directory Publication, and Native Release

**Purpose.** Complete the next release without removing or replacing any working behavior. This is an additive, surgical source update. Preserve the current authentication and temporary-password flows, accounts and sessions, approval and tester access, waitlist and administration, Community posts and approved media, profile images, comments, reviews, DMs, circles, saves, follows, blocks, business-owner functions, Kinfolk sources and feedback, Library, payment surfaces, and all existing content. Nothing in this work authorizes deleting content, business records, user data, or history.

A merged source change, a deployed website/API, a directory publication receipt, an iOS TestFlight upload, and an Android AAB are separate outcomes. Report them separately.

## Release identifiers and exact source

The prior completed release used **iOS 1.1.9 (111)** and **Android 1.1.7 (81)**. The committed `artifacts/mobile/app.json` already declares the next increment-only identifiers:

| Platform | Version | Next identifier |
| --- | --- | --- |
| iOS | 1.1.9 | Build **112** |
| Android | 1.1.7 | Version code **82** |

Do not reuse 111 or 81. Do not change the versions again unless App Store Connect or Play rejects these exact next identifiers as already used. Build from a clean, exact `origin/main` **after the companion-context pull request is merged**. Never build from a local patched or dirty checkout.

```bash
git fetch origin --prune
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
```

The status command must print no source changes before deployment or EAS work begins. Record the resulting commit SHA in the deployment and native-build report.

## Surgical Kinfolk companion update already in source

No product rewrite is required. The merged source provides the exact implementation below.

1. **Explanation of local selections.** Kinfolk business cards retain the existing “Why it surfaced” explanation and now preserve the ranking match reasons through the server-authoritative enforcement path. The live request has materially higher priority than stored tastes.
2. **Current request always wins.** A saved preference or companion note may only refine relevant results. It cannot override an explicit present request. For example, a saved note that a person prefers quiet brunches cannot replace a request for a steakhouse.
3. **Private companion context is opt-in.** Kinfolk offers a note only after two activity-oriented questions about the same companion, such as a member repeatedly asking about plans with Mom. The offer does not save anything automatically.
4. **Companion context is separate.** The save action posts an explicit `consent: true` request to the existing private-memory route with `purpose: "companion_context"`. It does not modify the member profile, taste profile, general preferences, Community, Library, or any other person’s data.
5. **Narrow use.** A companion note is supplied to Kinfolk only when the same named companion is mentioned in the current request. The prompt explicitly states that the current request is authoritative and private notes are context—not instructions.
6. **Forget companion.** Both web and mobile memory managers label companion notes clearly and expose an explicit `Forget companion <name>` control. Existing reset and forget controls remain unchanged.
7. **Cross-client parity.** The offer and save card appear in the web Kinfolk page, the compact mobile Kinfolk widget, and the mobile Kinfolk travel screen. Existing direct business-detail navigation, source links, citations, voice, feedback, and all prior Kinfolk capabilities remain present.
8. **Visible mobile tone controls.** The compact mobile Kinfolk header now has a Tune control that opens the existing Kinfolk settings screen. Members can choose Big Cousin, Professor, Business Manager, or Best Friend and retain their existing communication, humor, and emoji settings. This is a visible entry point to existing preferences, not a replacement of any profile or voice setting.
9. **Cultural-reference clarification and consensus.** A generic question such as “Who won the beef?” is treated as a culturally legible music/public-figure conflict question. Kinfolk asks which conflict the member means—using examples such as Kendrick vs. Drake or Nicki vs. Cardi—rather than giving a generic dictionary-style response or inventing a winner. For the specifically named 2024 Kendrick Lamar/Drake battle, Kinfolk returns a direct cultural-consensus answer: it marks “Kendrick won” as a broad public and cultural consensus rather than an objective fact; distinguishes the supporting factual measures (Billboard No. 1 debut, 70.9 million first-week U.S. streams, and five 2025 GRAMMY awards for “Not Like Us,” alongside the cited “Family Matters” comparison); states that Drake's overall commercial standing is a separate question; and treats diss-track allegations as allegations rather than verified facts. The answer includes the Recording Academy and Billboard source links, plus optional “What is Kendrick/Drake working on right now?” follow-ups that deliberately route to current research.
10. **Visible voice-input failure states.** The microphone now clearly shows Listening and transcription status. If system microphone permission is off or recording cannot start, the member receives a specific action message instead of a silent non-response. The member can review the transcript before tapping Send; microphone input does not silently submit a message.

The production runtime must retain the existing private-memory configuration. Confirm the established server-side `KINFOLK_PRIVATE_MEMORY_ENABLED=true` setting is present only if private Kinfolk memory is already approved for production. Do not add a client key, expose a token, or weaken the fail-closed memory guard. If the existing memory feature is intentionally off, the companion card correctly returns a private-memory-disabled error rather than storing anything.

## Required release validation

Run these commands from the clean merged SHA. Do not bypass any failure; fix only the reported issue and rerun the affected gate.

```bash
pnpm install --frozen-lockfile
pnpm run typecheck:libs
pnpm --dir artifacts/api-server run typecheck
pnpm --dir artifacts/web run typecheck
pnpm --dir artifacts/mobile run typecheck

pnpm --dir artifacts/api-server exec vitest run \
  src/kinfolk/__tests__/companion-context.test.ts \
  src/kinfolk/__tests__/cultural-conflict-clarification.test.ts \
  src/kinfolk/__tests__/cultural-consensus-answer.test.ts \
  src/kinfolk/__tests__/business-personalization.test.ts \
  src/kinfolk/__tests__/private-memory-runtime.test.ts \
  src/__tests__/kinfolk-recommendation-sheet-contract.test.ts
pnpm --dir artifacts/web exec vitest run src/__tests__/kinfolk-chat-presentation.test.ts
pnpm --dir artifacts/mobile exec vitest run __tests__/kinfolk-business-demo.test.ts

pnpm --dir artifacts/web run build
pnpm --dir artifacts/api-server run build
pnpm --dir artifacts/mobile run prebuild:ios
pnpm --dir artifacts/mobile run prebuild:android
```

Expected companion safety proof is **80 API tests, 13 web tests, and 9 mobile tests passing** for the focused suites. The website build must be synchronized into both committed runtime directories only from that successful build:

```bash
# Use a filesystem copy; preserve the exact build output in both runtime trees.
find web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a artifacts/web/dist/public/. web-static/
find artifacts/api-server/web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a artifacts/web/dist/public/. artifacts/api-server/web-static/
diff -qr web-static artifacts/api-server/web-static
```

Commit only source, tests, required declarations, and synchronized runtime assets. Do not commit arbitrary local build folders, credentials, `.env` files, source maps, or a changed generated build identity from a developer machine.

## Deploy website and API before native builds

Deploy the exact clean merged SHA through the normal Railway/GitHub deployment route. Then verify the running production identity and health before any directory worker or EAS build:

```bash
curl -fsS https://api.melaninmaps.com/api/version
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/readyz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
```

Confirm the API’s source identity matches the merged SHA and the website serves the matching synchronized asset version. Test, without changing any member data:

- A direct factual Kinfolk question still returns an answer and source links where applicable.
- “Who won the beef?” receives a Big Cousin/Professor-appropriate clarification naming music/public-figure conflict examples, not a generic dictionary reply. “Between Drake and Kendrick” receives the direct, source-linked cultural-consensus answer—without a false people/work disambiguation—and distinguishes fact from evaluative consensus.
- The compact mobile header's Tune control opens Kinfolk Settings, where Big Cousin and Professor are visible and selectable.
- Test microphone permission denial, recording start failure, recording start/stop, and transcription response. Every path must show a visible state or an actionable message; do not silently fail.
- A local business request shows a direct MWM detail card and its “Why it surfaced” reason.
- A repeated “with my mom” activity scenario offers, but does not automatically create, a private companion note.
- Save one test note only in an approved non-production/test account; confirm it is used only when Mom is mentioned, then use `Forget companion Mom`.
- Ask for a steakhouse after a brunch-oriented companion note; confirm the steakhouse request remains the priority.
- Confirm existing Community posts, comments, reviews, profile images, approved creator media, map search, and waitlist behavior remain present.

## Directory publication remains receipt-gated, not native-build-gated

The native binary is necessary for mobile UI changes, including companion notes and the optional alert controls. It is **not** necessary to make a receipt-published directory row searchable. Directory publication is a server/database operation and must use the protected review pipeline.

Use the merged review packages, including NYC and the multi-city inventory, only after a separate Railway Postgres service such as `directory-review-postgres` exists in the same project. Set its private service reference as `DIRECTORY_REVIEW_DATABASE_URL`. Keep the review database separate from the live business database. Do not paste or inspect database URLs, secrets, HMAC values, or service tokens.

With `DIRECTORY_REVIEW_ENABLED=0` and `DIRECTORY_PUBLICATION_WORKER_ENABLED=0`, deploy and validate the review database guard first. Then use the merged `scripts/ingest-signed-directory-review-manifest.mjs` with the current Bearer-plus-HMAC service authorization contract to stage only checksum-pinned manifests. The utility and runtime must preserve prior businesses and provenance, reconcile duplicates without deletion, hold incomplete or unreachable rows, constrain geocoding to approved physical records, and keep online services mapless.

The owner does not need to approve hundreds of rows individually. After a successful aggregate ingress and reconciliation receipt, enable exactly **one** publication worker only for the approved batch. Report the four distinct totals: **staged**, **automatically held**, **linked/deduplicated**, and **receipt-published**. Only receipt-published rows may be described as searchable in web search, mobile search, map details, or Kinfolk suggestions.

## Build and submit the final native release

Only after the source deployment, runtime verification, and release gates pass, build both platforms from that same clean SHA:

```bash
cd artifacts/mobile
npx eas build --platform ios --profile production --non-interactive
npx eas build --platform android --profile production-android --non-interactive
```

Verify that the iOS artifact reports **1.1.9 (112)** and Android reports **1.1.7 (82)**. Confirm the production API origin is `https://api.melaninmaps.com`, not a staging endpoint.

Submit the iOS build to TestFlight only after confirming that its build number is 112 and that the completed artifact came from the recorded SHA:

```bash
npx eas submit --platform ios --profile testflight-staging --latest --non-interactive
```

Build the Android AAB as required. **Do not submit Android to Play** unless the owner separately requests Play submission.

## Required final report

Use these exact separate statuses: **source merged**, **web/API deployed**, **directory staged**, **directory receipt-published**, **iOS build uploaded to TestFlight**, and **Android AAB built/uploaded/submitted**. Do not report a research package, source merge, EAS build, or an unreceipted review row as live directory availability.
