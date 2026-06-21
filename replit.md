# Mapping With Melanin™

Community discovery, travel, and business platform celebrating Black culture — find Black-owned businesses, get community safety intel, and plan journeys with confidence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
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

## User preferences

- Custom domain: **www.melaninmaps.com** — already forwarding from melanin-discovery-hub.replit.app.

## Gotchas

- API server runs on port **8080** (not 5000) — `artifact.toml` maps it to the `/api` proxy path
- `useNativeDriver` warnings on web are expected (native module not present in Expo web)
- mockup-sandbox has a pre-existing TypeScript SVG ref type error — do not attempt to fix it
- `pnpm run typecheck` builds libs first, then leaf packages — use this as the canonical check, not editor LSP state

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
