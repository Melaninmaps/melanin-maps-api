# Shared API and Mobile Build Blocker Handoff

**Purpose:** Record the pre-existing dependency-closure failures discovered while validating Community Intelligence. These corrections belong to the shared build/release owner, not this individual Community Intelligence completion task.

## Observed typecheck results

| Workspace | Command | Result |
|---|---|---|
| API | `pnpm --filter @workspace/api-server exec tsc -p tsconfig.json --noEmit` | 14 errors in 6 files |
| Mobile | `pnpm --filter @workspace/mobile run typecheck` | 51 errors in 24 files |

The Community Intelligence policy/service/route files are not named by either full-typecheck output. Focused Community Intelligence and Journey tests remain the appropriate evidence for this isolated task.

## API: exact blocker ownership and minimal correction

| Affected source file(s) | Current issue | Minimal shared correction | Notes |
|---|---|---|---|
| `artifacts/api-server/src/lib/hotel-stay-ingestion.ts`, `src/lib/social-first-ingestion.ts`, `src/routes/identity-context.ts` | `zod` is imported directly but is absent from `artifacts/api-server/package.json`. Missing Zod types also cause the listed implicit-`any` and unknown-error cascades. | Add a direct compatible `zod` dependency to `artifacts/api-server/package.json`, regenerate the lockfile, reinstall, and rerun the API typecheck. Repair only residual explicit types after that rerun. | Do not rely on a transitive mobile dependency for server validation. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Type-only import from `openai/resources/chat/completions` is not declared by the API workspace. | Add a compatible direct `openai` development dependency (or move the exported type to the existing server integration package), regenerate the lockfile, and rerun. | This is a package-boundary correction; it is not Community Intelligence behavior. |
| `artifacts/api-server/src/scripts/seed-manus-cultural-sites.ts` | `dotenv` is imported but not declared by the API workspace. | Add a compatible direct `dotenv` development dependency, regenerate the lockfile, and rerun. | The script already uses the package; this task must not change seeding behavior. |
| `artifacts/api-server/src/routes/kinfolk-intelligence.ts` | The server imports `expo-secure-store`, a mobile-only package, but the import is unused. | Remove the unused import; do **not** add Expo Secure Store to the server dependency graph. Rerun the API typecheck. | This requires a narrow shared API correction because a native storage package is not a valid server runtime dependency. |

## Mobile: exact blocker ownership and minimal correction

`artifacts/mobile/package.json` does not declare `@workspace/constants`, although the mobile runtime imports it in 24 current files:

- `app/(tabs)/community.tsx`
- `app/business-owner/identity.tsx`
- `app/business-owner/vibe-tags.tsx`
- `app/business-search.tsx`
- `app/business/[id].tsx`
- `app/cultural-preference.tsx`
- `app/library-research.tsx`
- `app/list-business.tsx`
- `app/nominate-business.tsx`
- `app/social-video-preferences.tsx`
- `components/AIChatWidget.tsx`
- `components/BusinessCard.tsx`
- `components/BusinessExperienceCard.tsx`
- `components/CommunityPostCard.tsx`
- `components/FeaturedVideoCard.tsx`
- `components/FullMapView.tsx`
- `components/OwnershipDesignationPicker.tsx`
- `components/ScoreFilterPanel.tsx`
- `components/SupportLensDropdowns.tsx`
- `components/WriteReviewModal.tsx`
- `hooks/support-lens-request.ts`
- `hooks/useBusinesses.ts`
- `hooks/useKinfolk.ts`
- `hooks/useSocialVideoPreferences.ts`

**Minimal shared correction:** add `"@workspace/constants": "workspace:*"` to the mobile runtime `dependencies`, regenerate `pnpm-lock.yaml`, reinstall from the lockfile, and rerun `pnpm --filter @workspace/mobile run typecheck`.

Most listed mobile errors are downstream missing-module / lost-inference errors. The build owner must only fix any residual type errors after the direct workspace dependency is restored. This task intentionally does not alter the shared manifest, lockfile, business surfaces, map behavior, ownership rules, or native build configuration.

## Required verification after the shared fixes

1. Run the API and mobile typechecks from a clean lockfile install.
2. Run the existing focused Community Intelligence, Kinfolk chat, private Journey, Safety, discovery, owner, and Admin contracts affected by the shared packages.
3. Do not apply a production migration, activate a feature flag, or create a native release as part of dependency repair.
