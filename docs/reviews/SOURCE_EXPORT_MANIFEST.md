# Source Export Manifest
## Mapping With Melanin™ — Build 97 Manus Review Package
**Date:** July 27, 2026

---

## Git Information

| Field | Value |
|-------|-------|
| Repository | `https://github.com/Melaninmaps/melanin-maps-api` |
| Branch | `main` |
| HEAD commit (Replit) | `c9dad580fd18a3adbf90a5adbc909336fc4d370e` |
| HEAD commit message | "Add upload script and update API server logic and memory documentation" |
| GitHub remote status | Replit branch has commits ahead of GitHub remote (unrelated histories between Replit workspace and GitHub) |
| EAS submitted commit (Build 96) | **Not recorded** — not captured before submission |
| EAS submitted commit (Build 97) | **Not yet submitted** — build has not been run |

**Note on Git history:** The Replit workspace and the GitHub remote (`Melaninmaps/melanin-maps-api`) have divergent histories (unrelated histories error on `git pull`). This means the GitHub remote may have a different file state than the Replit workspace. The source of truth for Build 97 is the **Replit workspace** — this is where the EAS build will be run from.

---

## Monorepo Structure

```
workspace/
├── artifacts/
│   ├── api-server/          # Express 5 API server
│   │   ├── src/
│   │   │   ├── app.ts       # Express app + middleware
│   │   │   ├── index.ts     # Server entry + graceful shutdown
│   │   │   ├── routes/      # ~100+ route files
│   │   │   ├── lib/         # Auth, email, health monitor, retry, etc.
│   │   │   ├── middleware/  # requireAuth, requireMembership
│   │   │   ├── constants/   # membershipTiers.ts
│   │   │   └── stripeClient.ts  # StripeSync singleton (ROOT CAUSE FIX)
│   │   └── package.json
│   ├── mobile/              # Expo / React Native app
│   │   ├── app/             # Expo Router screens
│   │   ├── assets/          # Images, fonts
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   ├── hooks/           # Custom hooks
│   │   ├── plugins/         # Expo config plugins
│   │   ├── app.json         # Expo configuration (BUILD 97)
│   │   ├── eas.json         # EAS build/submit configuration
│   │   ├── babel.config.js  # Babel configuration
│   │   ├── metro.config.js  # Metro bundler configuration
│   │   └── package.json
│   ├── web/                 # React/Vite web app
│   ├── biz-deck/            # Slide deck artifact
│   ├── investor-deck/       # Slide deck artifact
│   ├── features-deck/       # Slide deck artifact
│   └── community-deck/      # Slide deck artifact
├── lib/
│   ├── db/                  # PostgreSQL schema + Drizzle ORM
│   │   ├── src/
│   │   │   ├── index.ts     # Pool singleton (max:8)
│   │   │   └── schema/      # ~100 schema files
│   │   └── migrations/      # Drizzle migration files
│   ├── api-client-react/    # Generated API client
│   ├── api-spec/            # OpenAPI spec
│   └── api-zod/             # Generated Zod schemas
├── scripts/                 # Utility scripts
├── docs/                    # All documentation
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root package.json
└── pnpm-lock.yaml           # Lockfile
```

---

## Files Excluded from Source Export / ZIP

The following are excluded from the review ZIP (confirmed by `.gitignore` and explicit exclusion):

| Category | Examples |
|----------|---------|
| `node_modules/` | All nested node_modules directories |
| Build outputs | `artifacts/*/dist/`, `artifacts/*/build/` |
| Caches | `.expo/`, `.pnpm-store/`, `.cache/` |
| iOS native build | `artifacts/mobile/ios/` (gitignored) |
| Android native build | `artifacts/mobile/android/` (gitignored) |
| Secret values | All `.env` files containing credentials |
| Private keys | `google-service-account.json`, `*.p8` files |
| Apple review credentials | Not in repository |
| Service account JSON | Not in repository |
| Production dumps | Not in repository |
| User data | Not in repository |
| Replit internal | `.replit`, `.upm/`, `.local/skills/` |

---

## Uncommitted Changes (as of July 27, 2026)

Based on `git status` at package preparation time:

| File | Status | Notes |
|------|--------|-------|
| `artifacts/api-server/src/app.ts` | Modified | Download endpoint added for review package delivery; should be removed before production |
| `.agents/memory/replit-ui-no-file-tree.md` | New | Agent memory file — not relevant to build |
| `scripts/src/upload-review-package.ts` | New | Utility script — not part of production code |

---

## Code Existing Only in Replit, Not Yet on GitHub

Due to the divergent git history between the Replit workspace and GitHub, the following changes may not be reflected on the GitHub remote:

- StripeSync singleton fix (`stripeClient.ts`)
- DB pool 5→8 + resilience config (`lib/db/src/index.ts`)
- DB retry helper (`lib/db-retry.ts`)
- Graceful shutdown `endStripeSyncPool()` (`index.ts`)
- Health monitor (`healthMonitor.ts`)
- Build number 96→97 (`app.json`)
- Duplicate Android permissions removed (`app.json`)
- Spurious iOS permissions removed (`Info.plist` — gitignored)
- This review package (`docs/reviews/`)

**The GitHub remote at `Melaninmaps/melanin-maps-api` may not reflect the full Build 97 state.** Manus should treat the Replit workspace as the authoritative source.

---

## Whether ZIP Can Install and Typecheck in a Clean Environment

| Check | Status |
|-------|--------|
| `pnpm install` | Expected to succeed — `pnpm-lock.yaml` present |
| TypeScript typecheck (`pnpm run typecheck`) | **Known pre-existing TS errors exist** (documented in project memory as "pre-existing TS errors list" from VC67 era). Build 97 did not introduce new TS errors; pre-existing errors were present before this work. |
| EAS build | Would succeed IF: valid Apple/Android credentials present, EAS project configured, EXPO_TOKEN set |
| Unit tests | Vitest configured in mobile; test coverage not confirmed |

**Pre-existing TypeScript errors:** These are documented in the Android VC67 build content memory file. They are pre-existing and do not affect runtime behavior. Manus should request the full `pnpm run typecheck` output from the founder.

---

## Source Code ZIP

**ZIP filename:** `mapping-with-melanin-build97-manus-review.zip`
**Expected location after packaging:** `docs/reviews/`

**Excluded from source ZIP (additional):**
- This review package itself (`docs/reviews/`)
- Agent memory files (`.agents/`)
- Replit configuration (`.replit`)
- Skills (`.local/skills/`)
