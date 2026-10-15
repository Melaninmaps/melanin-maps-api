# Member / Business Owner Account Context — Source-Only Completion Handoff

**Status:** Source implementation complete and integration-ready; **not deployed, not migrated, not released, and not founder-accepted in production.**

**Branch:** `feature/member-business-owner-web-completion-20261014`
**Source commit:** `d9c1e1d2` — `feat: add member and business account contexts`
**Scope boundary:** Persistent, authenticated **Personal**, **Business**, and **Admin** workspace selection for the Web application. This account-context commit adds no schema migration, provider activation, live account connection, production-data write, mobile build, or deployment. The rebased feature branch also retains the separate source-only claim-lifecycle migration at `50c2fd7b`; it remains review-only and has not run anywhere.

## Founder acceptance and task closure — 2026-10-14

| Closure item | Recorded state |
|---|---|
| Source implementation | **COMPLETE** |
| Focused validation | **PASSED** — the reconciled API total is **18 tests** across the four listed account-context/privacy suites after the claim-lifecycle rebase. |
| Integration | **PENDING** |
| Live Web verification | **PENDING** |
| Native parity | **NOT INCLUDED** |
| Founder acceptance in the live application | **PENDING** |

This independent task is closed. Preserve this branch, its source commits, the review-only claim-lifecycle migration, and its privacy regressions. Reopen only for a genuine regression identified during the final coordinated integration.

## What is implemented

### 1. Server-authorized account context

- `X-MWM-Account-Context` accepts `personal`, `business:<id>`, or `admin`.
- The server resolves every non-personal selection from the active authenticated session, not from browser state:
  - Business contexts require an approved, unrevealed `business_owner_links` relationship with role `owner` or `manager`.
  - Admin context requires existing named-admin authorization.
  - Unknown, malformed, revoked, or unrelated business identifiers are denied.
- `GET /api/users/me/account-contexts` exposes only the authenticated member's approved business workspaces and whether Admin is available. It exposes no claimant contact data, review evidence, or other private member data.

### 2. Account switcher and context boundaries

- The global Web navigation has a keyboard-accessible workspace switcher with **Personal**, each authorized **Business**, and **Admin** context.
- The selection is intentionally held in memory for the current application session and safely resets to Personal on refresh, sign-out, revoked access, or failed context discovery. This prevents stale privileged workspace state from persisting across changes in authorization.
- The active workspace is shared by Profile, Business Dashboard, and Kinfolk pages. Switching updates visible context and clears Kinfolk state before another request can reuse it.

### 3. Personal workspace

- Member-owned profile contact and home-area controls are self-only through the authenticated profile API.
- Phone input is validated and checked for a conflicting account before it is saved; the API never returns it to public profile reads.
- Home city/state remain self-only profile data. Public member profile routes already select explicit safe fields rather than the home area.
- Public authored-content responses now preserve response shape while returning `null` instead of a member's saved home area for:
  - Collections
  - Global recommendations
  - Guides
  - Knowledge-hub expert cards
  - Knowledge-hub creator cards
- Internal location matching continues to use a member's home area only within its authorized server-side purpose. It is not serialized to a public creator card.

### 4. Business workspace

- Business Dashboard selection is synchronized with the authorized Business workspace.
- The selected-business profile editor uses server-scoped `GET/PATCH /api/businesses/mine/managed/:businessId` routes and sends the matching context header.
- The server requires the selected header context to match the requested business, in addition to existing owner/manager authorization. A header cannot be used to select another business.
- The editor is limited to ordinary business profile fields. It explicitly does **not** alter ownership approval, verification, publication, eligibility, map coordinates, or another business.

### 5. Kinfolk isolation

- Kinfolk resolves the active context on each request.
- Non-Personal contexts receive no Personal conversation history, preferences, private memories, Journey/Connected Apps context, active Journey data, preferred-name memory, private location fallback, image-review input, personal media action, personal feedback write, or Personal session persistence.
- Non-Personal Kinfolk requests are marked `Cache-Control: no-store`.
- Only stateless `POST /api/kinfolk/chat` is available outside Personal; history, preferences, memory controls, and other Personal Kinfolk endpoints fail closed.
- The Business context may supply only the server-authorized selected business identity for applicable general business guidance. It cannot access another member's data or Personal Kinfolk state.

### 6. Cross-screen Personal-data hardening

- Profile redirects Business and Admin selections to their corresponding workspace before Personal profile, settings, contacts, private locations, temporary stays, memories, or Kinfolk preference components can mount. Its direct preference read is explicitly marked `personal`.
- Map and directory Support Lens controls load and save their member preference only in Personal workspace. They clear their local personalization state in Business or Admin workspace and do not expose preference-changing controls there.
- First-time Kinfolk onboarding renders only in Personal workspace and explicitly marks its preference save as `personal`.
- Travel captures the workspace key for each asynchronous Personal preference, session, and continuity load. A response that returns after a workspace switch is discarded before it can rehydrate Personal state.
- The nested production router behavior is regression-tested: the `/kinfolk` guard runs before separately registered private-place, temporary-stay, task, and app-level capability routes, so any explicit Business/Admin request receives a fail-closed 403 before those handlers run.

## Regression and type validation

| Area | Command / suite | Result |
|---|---|---|
| API context and privacy | `account-context-runtime`, `account-context-contract`, `member-business-owner-completion-contract`, `member-privacy-contract` | **18 tests passed** |
| Web context and profile UX | `account-context-switcher`, `member-business-owner-completion-ui`, `profile-settings-viewport`, `kinfolk-chat-presentation`, `support-lens-actions` | **38 tests passed** |
| Web map / Support Lens regression sweep | 10 focused map, search, viewport, profile-navigation, essential-services, and Support Lens suites | **60 tests passed** |
| API TypeScript | `pnpm run typecheck` | **Passed** |
| Web TypeScript | `pnpm exec tsc --noEmit -p tsconfig.json --incremental false` | **Passed** |
| Shared DB declarations | `pnpm exec tsc -b tsconfig.json` | **Passed** |
| Generated API client libraries | `pnpm run typecheck:libs` | **Passed** |
| Diff integrity | `git diff --check` | **Passed** |

After the concurrent claim-lifecycle source commit was rebased, the shared DB declarations were force-refreshed from the tracked schema before the API typecheck. The API typecheck then passed. No generated DB declaration artifact was committed because this account-context change has no DB source-schema change; the normal shared-declaration build remains the prerequisite for a clean checkout that runs API typing directly.

The authenticated production baseline from 2026-10-14 confirms the existing `/profile` route was usable but had no persistent account switcher. It is retained as read-only evidence only; this source-only branch has not changed production.

An independent final source review found no remaining workspace-isolation blocker. It confirmed that the aggregate Kinfolk router guards the later private-place, temporary-stay, task, and capability paths before their handlers receive an explicit Business/Admin request.

## Explicitly not done

- No production deployment, Railway configuration change, database migration, provider credential, OAuth configuration, live Connected App, member data import, account role change, business record update, or mobile build.
- No claim that the account switcher, context headers, or Business workspace has been live-browser accepted. That requires a separately authorized release and authenticated production verification.
- No global rework of unrelated public-content features or mobile account screens.

## Required next integration/release steps

1. Rebase or merge this bounded branch into the selected coordinated release branch without losing the existing Kinfolk/Journeys, Admin, map, Safety, referral, and tester work.
2. Re-run the listed suites after integration, including the privacy and context tests.
3. Inspect the final production artifact to ensure it contains only approved release work; do not deploy this branch wholesale if unrelated changes are present.
4. After explicit deployment authorization, verify in an authenticated Web browser:
   - Personal → Business → Personal switching with more than one permitted context where available;
   - rejection of a manually forged or revoked business context;
   - selected-business ordinary-profile save only for the selected authorized business;
   - no Personal Kinfolk history/settings/media/memory controls in Business or Admin;
   - no public home-area disclosure in the affected authored-content responses;
   - unchanged Personal profile save behavior.
5. If native parity is desired, plan it as a separate scoped implementation and build authorization; this handoff includes no mobile changes.

## Storage checkpoint

At source-validation completion, Sandbox free storage was **16 GiB** (70% used), which is above the standing 15 GiB warning threshold and 10 GiB hard floor.
