# Build 113 / 83: Requirements-to-Proof Release Protocol

**Purpose.** This protocol prevents the next Mapping With Melanin release from being treated as complete merely because a pull request was merged or a build command finished. It converts the product requirements into explicit evidence. A requirement is **not verified** until its named proof exists. A requirement that needs a live service, a physical device, or real members remains visibly open until that evidence is recorded.

**Scope lock.** This release is additive. It must preserve authentication, temporary-password and tester prompts, waitlist behavior, accounts and sessions, profile images, reviews, comments, posts, DMs, circles, saves, follows, blocks, business-owner flows, payment routes, Library links and sources, Kinfolk citations and feedback, map search, approved public media, and every existing record. The only previously approved removal is the crowded map shortcut strip; typed search and every underlying category remain available. No data, post, comment, review, video, listing, or user record may be deleted or hidden outside the existing report, moderation, or administrator workflow.

**Current native identifiers.** The next source must use **iOS 1.1.9 (build 113)** and **Android 1.1.7 (versionCode 83)**. Build 111/81 is superseded. Build 112/82 is already consumed or started and must not be reused. A website/API change is not a native build. A native binary is not a Railway deployment. Directory staging is not directory publication.

> **Release verdict rule:** There is no truthful “zero possibility of regression” promise for software that has not been exercised in its production environment and on physical devices. The substitute for hope is a hard **no-evidence, no-release** gate. Any missing, failing, or ambiguous proof produces **NO GO**. It is never silently converted into a pass.

## 1. The four evidence layers

Every requirement below must be tracked in a dated Build 113/83 evidence record. The evidence has four layers.

| Layer | What it proves | What it cannot prove | Required result |
|---|---|---|---|
| **Source and contract** | The exact GitHub SHA contains the intended additive code and tests. | That Railway or an installed app is serving it. | Clean SHA, reviewed diff, typechecks, focused regression suites. |
| **Built artifact** | The web bundle, API bundle, and native prebuild are generated from that SHA. | That a provider accepted or activated the artifact. | Successful production builds, static-asset parity, iOS/Android prebuild guards. |
| **Live runtime** | Railway is running the exact API/web source and public safe routes respond. | Device-only behavior such as microphone permission. | `/api/version` identity match, health/readiness, web assets, safe user-flow results. |
| **Physical experience** | A real person can complete device-specific and cross-client tasks. | How the app will perform for every future user or network. | Recorded iPhone, iPad, Android phone, Android tablet/Chromebook, and browser results. |

The result column in the evidence record may contain only **PASS**, **FAIL**, **BLOCKED**, or **NOT RUN**. “Looks right,” “probably,” “merged,” “deployed successfully,” and “Replit said so” are not result values.

## 2. Requirements traceability matrix

The matrix is the release contract. Replit must attach a link, terminal output reference, screenshot reference, or test-account receipt for every completed row. A row that lists two proofs needs both, not either/or.

| ID | Product requirement | Automated/source proof | Live or physical proof | Release state before evidence |
|---|---|---|---|---|
| P-01 | No unrequested feature or data removal. | Clean source SHA; additive diff review; no destructive migration or reset command; preservation suites pass. | Compare current production data paths for profile, review, comment, post, media, save, and business detail. | **Open** |
| P-02 | Web and mobile use the same API records for profile images, reviews, comments, posts, and approved media. | Shared route and cross-client parity tests. | Create a disposable test record in one client; read it in the other; clean up through the normal moderation/admin process. | **Open** |
| P-03 | Community opens with navigation, composer, and actual feed content immediately visible; no blank gap. | `community-feed-recovery.test.ts` and mobile typecheck. | Fresh binary screenshot on iPhone and Android shows header → tabs → compose/feed with retained content. | **Open** |
| P-04 | Community posts, comments, and media are preserved unless reported/moderated. | Feed schema guard and moderation-policy regression suites. | Existing account confirms a prior post, comment, and approved media still appear on web and mobile. | **Open** |
| P-05 | Public social video contribution reaches moderation and, only after approval, the matching listing. | Social contribution route/UI tests. | Disposable URL submission → admin queue → approval → public listing section; reject/pending item remains nonpublic. | **Open** |
| K-01 | Kinfolk is a general assistant with adaptive short/long answers, sources, and article summarization. | Kinfolk routing, cultural-consensus, citation, summary, and response-feedback suites. | Live prompts covering a short factual answer, a longer planning answer, and “summarize this article”; sources open safely. | **Open** |
| K-02 | Kinfolk distinguishes facts, sourced current claims, and collective/cultural opinion. | `collective-opinion-policy` and evidence-routing suites. | Ask an opinion question such as best Spider-Man/Wu-Tang rapper and a factual current-events question; answer labels uncertainty and sources appropriately. | **Open** |
| K-03 | Kinfolk recognizes cultural language without inventing facts or overriding a direct request. | Intent-router, cultural-consensus, English-query recovery, and ambiguity-policy suites. | Test named cultural examples and an intentionally misspelled query; verify clarification rather than a confident wrong answer. | **Open** |
| K-04 | Big Cousin/Professor is discoverable, selected mode persists, and companion memory is explicit and separately forgettable. | Mode, profile settings, memory consent, and forget-control tests. | Set mode and companion on one fresh account; relaunch; verify persistence; forget companion and confirm primary memory remains intact. | **Open** |
| K-05 | Voice works safely: permission feedback, recording state, stop, transcript prefill only, no accidental send, TTS remains available. | Audio-mode, capture state, and voice UI regression suites; iOS/Android prebuild guards. | Physical device matrix: allow; deny/retry; Settings-enable; record/stop; offline/transcription failure; leave/background during capture; listen response. | **Open — physical device required** |
| L-01 | Living Library is not an empty list. It seeds governed starter topics idempotently. | Library seed, repository, research route, and writer tests. | Production topics/list/search endpoints return meaningful material after the deployed API starts. | **Open** |
| L-02 | An unknown Library search performs governed first research, explains the wait, returns a structured long-form briefing and sources, then safely reuses eligible general research. | Library research/reuse/verification tests and source-governance policy. | Search a safe uncovered topic twice; first result shows research state and explanation; subsequent result is retained only when vetted. | **Open** |
| L-03 | Library supports English misspellings and ambiguity safely without guessing material facts. | Library spelling-recovery and client correction tests. | Search an intentional misspelling; accept or decline the explicit correction; confirm no silent wrong substitution. | **Open** |
| L-04 | High-stakes Library material is informational, reputable-source governed, and not personal medical, legal, or financial advice. | Writer and high-stakes policy suites. | Test a health query and inspect source links, safety language, connected next topics, and absence of diagnosis/prescription. | **Open** |
| M-01 | Map retains typed city, HBCU, market, service, business, and historical-context search after shortcut-strip removal. | Map locality/search/clean-surface suites. | Test each search on web and native builds; verify results/pins and selected historical control. | **Open** |
| M-02 | Every pin with an MWM profile opens the internal MWM detail route; no fake profile is created for an unprofiled record. | Map profile-navigation tests. | Tap verified claimed, unclaimed, non-minority-owned, and cultural pins; verify correct existing MWM routes. | **Open** |
| M-03 | “Around you” groups real local results by need without hiding data, overriding direct search, or inferring protected identity. | `map-discovery` and web/mobile map-card suites. | Use 5/10/25-mile controls and focus categories; verify count, reset, pin filter, and a direct typed search restores search authority. | **Open** |
| M-04 | Maps work in phone portrait, iPad split view, Android tablet, Chromebook, and browser desktop widths. | iPad multitasking config test, Android adaptive layout plugin test, mobile wide-overlay test, web responsive review. | Screenshot pass at iPhone, iPad portrait/landscape, Android phone/tablet or Chromebook, and Chrome desktop/narrow viewport. | **Open — device/simulator required** |
| D-01 | Directory candidates are not called searchable/live until publication receipts prove it. | Manifest checksum preflight and publication-worker tests. | Protected summary/receipts confirm counts for staged, held, deduplicated, published, and failed rows. | **Open — infrastructure and ingress required** |
| D-02 | Publication uses a separate review database, signed ingress, automatic reconciliation, and exactly one worker. | Review database config, service authorization, worker concurrency, duplicate-mapping, and fail-closed tests. | Review DB differs from live DB; signed package ingress succeeds; worker stays off until receipts/reconciliation are clean; one worker turns on only at approval. | **Open** |
| D-03 | Newly published businesses work in website search, mobile search, both maps, listing detail, Kinfolk card, and pin-to-detail navigation. | Search/map/Kinfolk card contract suites. | Sample published record across all seven paths; retain receipt IDs and result screenshots. | **Open** |
| A-01 | Alerts are default-off, consented, source-linked, and fail closed. | Consent, source, dedupe, and alert routing suites. | Member opt-in/out on web and mobile; CPSC/CDC item source opens; disabled source stays absent. | **Open** |
| B-01 | Native membership/promotion paths go to the website flow without claiming blanket store-policy approval. | Route tests and static navigation review. | Tapping each eligible path opens the intended website screen; no purchase occurs during smoke testing. | **Open** |
| X-01 | Deployed API and web are the exact source under test. | Build identity compilation test, static asset parity, release artifact verifier. | `/api/version` has final `railway_sha` and `built_from_sha`; `/healthz`, `/readyz`, `/kinfolk/health`, website document/assets all pass. | **Open** |
| X-02 | Native build provenance is exact. | App version/build policy, EAS project/account identity, clean commit check, build logs. | EAS build IDs point to the final SHA; iOS upload/processing separately confirmed; Android AAB completion separately confirmed. | **Open** |
| X-03 | Authentication, password reset, tester prompts, waitlist, back/swipe escape paths, and safe error/retry states persist. | Auth/navigation/error-recovery suites, production smoke gate. | Fresh/new and returning account tests; reset route; retry a recoverable failure; test every changed screen has back/swipe/close escape. | **Open** |

## 3. Mandatory execution sequence

### Step 1 — Freeze the exact source

1. Fetch `origin/main` and record the full SHA.
2. Reset the isolated release checkout to that SHA. The checkout must be clean before the gate begins.
3. Record the complete diff from the prior deployed SHA. Review every changed file against the preservation contract. A change outside the intended feature and generated-asset paths needs an explicit reason.
4. Do not create an EAS build from a branch, a stale checkout, a dirty tree, or an earlier merged SHA.

### Step 2 — Run the source gate

Run the committed command below. It performs locked dependency installation, library/API/web/mobile typechecks, focused regression suites, web/API production builds, static asset parity checks, iOS/Android prebuild guards, version checks, and whitespace checks.

```bash
bash scripts/run-build-113-83-requirements-gate.sh --prepare-static
```

This command may update the committed web static files after a successful web build. Inspect that generated static diff, commit it with the source change, then use a clean checkout of the committed final SHA to run:

```bash
bash scripts/run-build-113-83-requirements-gate.sh --verify-final
```

Any command failure is **NO GO**. Do not bypass it by building from the locally modified tree.

### Step 3 — Deploy API and website, then prove identity

Deploy the final clean SHA through the normal API/web service. GitHub merge and a green Railway card do not prove the public service uses the current compiled artifact. Record the full JSON from:

```bash
curl -fsS https://api.melaninmaps.com/api/version
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/readyz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
```

The `railway_sha` and `built_from_sha` must equal the frozen source SHA. Verify the public website’s HTML and bundled assets after the deployment. If identity is stale, deployment is incomplete even if the endpoint is healthy.

### Step 4 — Directory is a separate proof chain

The directory batch cannot be represented as live because it exists in Git or because a native binary was built. The existing isolated review database must be configured privately, with its URL distinct from the production business database. Keep the worker disabled while all checksum-pinned manifests stage and reconcile. Do not enter, copy, print, or request secrets.

After every ingress receipt and duplicate/hold summary is clean, set **only** `DIRECTORY_PUBLICATION_WORKER_ENABLED=true` and `DIRECTORY_PUBLICATION_WORKER_CONCURRENCY=1`. Save the publication receipts. Then complete D-03 before saying that any package is searchable, mapped, or recommendable.

### Step 5 — Create artifacts only after source and runtime gates pass

1. Reconfirm EAS account and project identity without printing credentials.
2. Build iOS 113 and Android 83 from the frozen final SHA.
3. Record EAS URLs/build IDs/statuses.
4. Submit iOS only through the production TestFlight profile after the artifact succeeds. Do not claim “in TestFlight” until EAS/App Store Connect confirms it.
5. Build Android 83. Do not make a Play submission unless separately requested.

### Step 6 — Perform human acceptance before tester rollout

Use a dated test sheet with the exact device, OS, build number, account type, network condition, result, screenshot/video reference, and tester name or role. Test iPhone and Android phone at minimum. Add an iPad simulator or device before iOS submission. Test Android tablet or Chromebook before inviting Google testers. Test browser desktop and narrow width.

The required physical tests include login/retry, map location allow/deny/retry, direct business search, map focus/reset, pin-to-detail navigation, Community visual placement and retained data, Kinfolk settings/mode/memory, Kinfolk voice matrix, Library first-search and typo correction, public video moderation loop, and any affected payment handoff.

### Step 7 — Make an honest release verdict

A release cannot be called complete until the evidence record is complete. Use precisely one of these verdicts:

| Verdict | Meaning |
|---|---|
| **GO FOR FOUNDER DEVICE TESTING** | Source, artifact, and live runtime gates passed. Physical proof remains open. |
| **GO FOR LIMITED TESTER DISTRIBUTION** | Required physical tests passed on each target platform. Directory/flywheel capabilities are described only to the level their receipts demonstrate. |
| **NO GO — CORRECTION REQUIRED** | Any source, artifact, live, security, directory, or physical proof is missing or failed. |

## 4. What cannot truthfully be promised before use

The Community → content → business → creator flywheel can be implemented and instrumented now, but it cannot be proven to produce useful group-level recommendations until members create consented interactions and moderators process content. The correct pre-release proof is that the events, consent boundaries, moderation states, source provenance, ranking explanation, and safe fallbacks work. It is not a claim that the app has already learned a community.

Similarly, Kinfolk can be proven to preserve explicit-query precedence, use sources where facts matter, route cultural consensus as opinion, request clarification where an assumption could materially change the answer, and retain only explicit memory. It cannot be guaranteed to answer every ambiguous question perfectly. The release standard is that it must surface uncertainty rather than fabricate a confident answer, and that failures have a feedback/review path.

Directory candidates cannot be called “all searchable” until signed ingress, reconciliation, publication receipts, and the seven discovery-path samples pass. A build is not the publication mechanism.

## 5. Required evidence file

Create `docs/product/releases/BUILD_113_83_REQUIREMENTS_EVIDENCE.md` only after the final source SHA is known. It must include the SHA, native identifiers, each matrix ID, the status, the command or physical test used, a concise result, a date/time, and a link or file path to evidence. It must not contain credentials, database URLs, tokens, or secrets.

The evidence file is committed **after** all source application changes are reviewed. It must not be used to mask or silently amend source changes after review. If a code change is necessary, return to Step 1 and repeat the gate from the new SHA.

## 6. Replit instructions in one sentence

**Do not start EAS or call this release complete until every applicable P/K/L/M/D/A/B/X row has recorded proof at its correct layer; document all remaining rows as BLOCKED or NOT RUN rather than inferring a pass.**

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo Application Services Build introduction"
[2]: https://docs.expo.dev/submit/introduction/ "Expo Application Services Submit introduction"
[3]: https://docs.railway.com/deployments "Railway deployment documentation"
[4]: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/ "Apple App Store Connect upload builds documentation"
