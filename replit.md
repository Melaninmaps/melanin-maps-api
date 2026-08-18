# Mapping With Melanin™

Community discovery, travel, and business platform celebrating Black culture — find Black-owned businesses, get community safety intel, and plan journeys with confidence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run test:e2e` — run Playwright end-to-end tests (Firefox, requires dev server running)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) — `artifacts/mobile`
- API: Express 5 — `artifacts/api-server`
- DB: PostgreSQL + Drizzle ORM — `lib/db`
- Auth: OIDC via `expo-auth-session`, token in SecureStore as `auth_session_token`, `Authorization: Bearer` header pattern
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- DB schema source of truth: `lib/db/src/schema/` (businesses, users, surveys, saved-places)
- API routes: `artifacts/api-server/src/routes/` — all prefixed `/api`
- Mobile screens: `artifacts/mobile/app/` — Expo Router file-based routing
- Shared color tokens: `artifacts/mobile/constants/colors.ts`
- Feature hooks: `artifacts/mobile/hooks/` (useBusinesses, useFavorites, useAuth, useColors, etc.)

## Architecture decisions

- Static BUSINESSES array always seeds `useBusinesses` so home screen never flashes empty while API loads
- `useFavorites` syncs to `/api/saved-places` when auth token present; AsyncStorage serves as local cache / unauthenticated fallback
- First-launch onboarding: `OnboardingChecker` in root layout checks `@melanin_maps_onboarding_complete` AsyncStorage key and redirects to `/onboarding` if unset
- Cookie consent banner suppressed on `/onboarding`, `/login`, `/signup` via `usePathname` check
- DB changes use `pnpm --filter @workspace/db run push` (no migrations, push workflow)

## Product

- **Discover** — search and filter Black-owned businesses by category, confidence score, verification, and price
- **Map** — full-screen map with business pins, neighborhood safety overlay
- **Safety Surveys** — community-powered neighborhood safety reports (persisted to `neighborhood_surveys` table)
- **Business Profiles** — hero images, safety stats, reviews, map pin, call/share/save actions
- **Profile** — auth state, saved businesses, settings, membership
- **Events & Community** — event listings, community feed

## Community Intelligence Rule (Permanent)

**Never use "Community Safety" as a product term.** The product term is **Community Intelligence**.

Community Intelligence = community-sourced context for informed choices. It describes moderated shared experiences about arrival, access, atmosphere, practical conditions, business experience, events, and verified local resources.

**Prohibited:** Implying or calculating that a location is unsafe because it has minority residents, is predominantly minority, has a particular race/ethnicity, is diverse, or lacks diversity. Demographic composition is NOT a safety signal and must never be an input to map pins, recommendations, rankings, labels, filters, Kinfolk responses, or neighborhood scores. Search terms are not identity disclosure.

**Use:** Community Intelligence · Community-sourced context · Community-sourced insight · Shared local experience · Practical local context · What community members have shared.

**Avoid:** Community Safety · safety score · safe/unsafe neighborhood labels · diverse/less-diverse as risk proxy · blanket neighborhood judgments.

Emergency help remains accurately labeled as emergency help (pointing to official emergency services or official alerts). It is separate from Community Intelligence and must never be rebranded as Community Intelligence.

## Mobile Parity Rules (Permanent)

The native iOS/Android app is a client of the same MWM API — not a second source of truth. These 8 rules are non-negotiable:

1. **Local search is server-authoritative:** 5-mile default, ≤2 results, same response drives both list cards and map pins. Never inject national/global results or auto-expand to a farther city.
2. **Location is member-initiated and foreground-only.** Show clear states: locating · success · denied · disabled · manual fallback. Never request background location.
3. Use the same seeded Living Library foundations, topic icons, Kinfolk research-memory policy, Community Vibes evidence, and canonical cultural-site records as the website.
4. **Kinfolk applies the diaspora-first lens**, preserves `KINFOLK_BUSY` for retry, and never infers identity from search terms. Sensitive context is optional; someone-else context stays temporary.
5. **Voice recording uses `expo-audio`; the member controls stop.** Show stage-specific errors (permission / capture / transcription) — never a fake length error.
6. Canonical web cultural-site URLs open the same native record via Universal Links / Android App Links. Use stable IDs.
7. **Polished gold-outline subject-specific icons, not colorful or cartoon emoji.** The feather is a brand mark, not a topic icon.
8. **All native input text must be visibly readable.** Never inherit dark-surface colors into light input fields.

Every preview build must pass the native acceptance checklist (see `.agents/memory/mobile-parity-rules.md`) before promoting to production.

## Platform Language Rule (Permanent)

Mapping With Melanin™ serves minority communities, the global melanated diaspora, and other underrepresented communities. Do not use "Black-owned" as the automatic generic default. Use specific demographic language only when supported by user intent, preferences, verified identity, or the cultural subject.

Use "Black" when:
- the user specifically requests it;
- verified business identity supports it;
- the subject is specifically Black history or culture;
- the user selected that preference.

Generic language should use terms such as: minority-owned business, community business, culturally relevant place, heritage site, local favorite, neighborhood recommendation.

**Celebrate specificity without assuming it.**

This rule applies to: placeholders, sample prompts, onboarding, search suggestions, KinfolkAI responses, seeded content, notifications, and any copy generated by the platform or its agents.

## Implementation Rule (Permanent)

Do not infer additional product decisions. Implement only the approved behavior.
If implementation requires a product decision that has not been explicitly made, stop and ask instead of guessing.
Do not expand scope. Do not simplify requirements. Do not replace approved language with developer-generated alternatives.

## Product Intent Rule (Permanent)

When implementing user-facing changes, do not optimize for literal wording changes. Optimize for the underlying product intent.

Before approving any copy, UI, seed data, ranking, placeholder, prompt, notification, or onboarding text, ask:

1. Does this represent the mission?
2. Does this create the intended emotional experience?
3. Would a first-time user understand what Mapping With Melanin™ stands for?
4. Am I merely changing words, or am I improving the experience?
5. Is this still unintentionally centering one community when the product is intended to welcome many?
6. Would the founder likely say, "Yes — that's exactly what I meant," even if those weren't her exact words?

If the answer to any of these is uncertain, stop and explain the tradeoffs instead of making the most literal interpretation.

When a user gives direction, assume they are describing the desired user experience, not dictating the exact implementation. If there is a better implementation that achieves the same mission, explain it and recommend it — do not follow words literally at the expense of intent.

The implementation should satisfy the **intent**, not merely the **sentence**.

## Authentication Freeze (Active until public launch)

Authentication is a protected subsystem. Until public launch:
- **Do not** redesign or refactor authentication architecture
- **Do not** change session handling, Better Auth config, token format, refresh logic, or login flow without explicit approval
- **Do not** introduce new auth features unless a confirmed defect requires them
- **Only** implement narrowly scoped surgical fixes for reproducible, diagnosed bugs
- Every auth fix requires a regression plan covering: Email login, Phone login, Apple Sign-In, Logout, Session restore, Session expiration, Password reset, Multi-account switching

Approved surgical fixes: logout race condition (LB-008), misleading error messages, request timeouts, reproducible diagnosed login bugs.

## User preferences

- **Response format:** All substantive responses (plans, documents, dashboards, proposals) must be provided in a copyable text box (markdown code block) so they can be copied and shared directly with advisors.
- Custom domain: **mappingwithmelanin.com**
- EAS builds: user runs `eas build` from the Replit shell, always from inside `artifacts/mobile/` directory (e.g. `cd artifacts/mobile && eas build --platform ios --profile production`)
- Multi-step tasks: give one step at a time and wait for the user to share a screenshot confirming completion before moving to the next step
- Slide decks: if the user sends emojis in a message, translate them to gold outlined SVG line-art icons (fill:none, stroke:#CA922B, rounded caps) — never use literal emoji characters in any slide
- Slide decks: do not auto-export/download a PDF after every edit — only export when the user explicitly asks for a download
- Release naming: every build communicated to testers must include a human name + platform version + build number. Format: "Everyone should now be testing **[Release Name]** (iOS Build [N] / Android Version [V] Build [N])." Use a progression like: Founding Beta 1, Founding Beta 2, Community Beta 1, Launch Candidate 1, etc.
- Creative approval gate: ALL presentation, branding, copy, and design discussions are brainstorming only until the user explicitly says "Please implement" or "Please build this." Do not create, modify, or replace any slides, copy, layouts, or visual design without that explicit trigger phrase.

## Permanent Release Gates (Effective Immediately)

A build is NOT ready to recommend until ALL of the following are confirmed against Railway production, not dev:

### Before submitting to EAS
1. `pnpm run typecheck` — zero errors
2. POST `https://www.mappingwithmelanin.com/api/auth/login-email` with a real test account → HTTP 200 + token in < 2 seconds
3. GET `https://www.mappingwithmelanin.com/api/businesses?limit=3` → HTTP 200 in < 2 seconds

### After build installs on TestFlight / Play Console
4. Registration flow: new account created and reaches home screen
5. Logout → login cycle: logout, then re-login with same account → succeeds
6. Map renders: no blank/grey/spinning state
7. Businesses load: at least one card visible
8. KinfolkAI responds: message sent → AI reply received

### Before expanding beyond founder testing
9. Multicultural language audit: no "Black-owned" as default generic language anywhere
10. End-to-end screen recording: uninterrupted from fresh install → registration → login → map → businesses → KinfolkAI → profile

### Production verification definition
A feature is NOT verified by a dev DB or Replit environment result. Verification means HTTP 2xx confirmed against `https://www.mappingwithmelanin.com` with real data.

## Connection Pool / Deployment Rule (Permanent)

The API server has a graceful shutdown handler (SIGTERM → pool.end()) in `artifacts/api-server/src/index.ts`. This prevents connection pool exhaustion across Railway deployments.

Root cause of the July 21 login outage: 7 rapid deployments in 46 minutes without graceful shutdown leaked all 5 pg pool connections. Every Drizzle write timed out at connectionTimeoutMillis (10s). SELECT still worked because connections were acquired before exhaustion. Fix: graceful shutdown + Railway restart clears leaked connections. The production DB schema was in full sync throughout — schema gap was never the issue.

If login returns 500 in exactly ~10 seconds in future: trigger a Railway restart via the Railway API before investigating further. That clears any leaked pool.

## Gotchas

- API server runs on port **8080** (not 5000) — `artifact.toml` maps it to the `/api` proxy path
- `useNativeDriver` warnings on web are expected (native module not present in Expo web)
- mockup-sandbox has a pre-existing TypeScript SVG ref type error — do not attempt to fix it
- `pnpm run typecheck` builds libs first, then leaf packages — use this as the canonical check, not editor LSP state
- Railway production DB: `postgres.railway.internal:5432/railway` (Railway Postgres, not Neon — memory file was stale)
- Pool exhaustion pattern: if all DB write operations return 500 in ~10s but SELECT works, the pg pool is exhausted — restart Railway service via API, do not redeploy code first

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- For any SMS OTP / phone verification feature, always suggest Twilio Verify (not raw phone number + custom OTP logic)
