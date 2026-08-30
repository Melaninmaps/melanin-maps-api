# Combined Community and Kinfolk Release — Start Here

This package restores **post comments**, adds **What’s Happening** to Community, and implements **Kinfolk conversational research v1** on the website and iOS/Android app. It is based on repaired release commit `3f56c1a27487c6060cfb3a1275baba5e70bd87b6` and assigns the new candidate identifiers **iOS 104** and **Android 79**.

> Do not apply this work to `release/task-373-rc`. Create an isolated branch so the earlier gated candidate remains recoverable.

| Step | Replit action | Required result |
|---|---|---|
| 1 | Fetch `release/task-373-rc` and create `feature/community-kinfolk-combined-v1` from `3f56c1a27487c6060cfb3a1275baba5e70bd87b6`. | Branch and base SHA match exactly. |
| 2 | Apply `combined-community-kinfolk.patch` with `git apply --3way --check` and then `git apply --3way`. | No rejected hunks and no release-branch modification. |
| 3 | Run `node replit/combined-release/validate-combined-release.mjs`. | All **29** contracts pass. |
| 4 | Run `bash replit/combined-release/run-combined-release-gates.sh --precommit`. | Every gate passes; database-backed tests use a valid approved test `DATABASE_URL`. |
| 5 | Review migration `artifacts/api-server/migrations/20260829_community_comments_happening_v2.sql` against staging and take a database backup. | Additive/idempotent migration accepted. |
| 6 | Review the complete diff, commit intended source and generated DB declarations, and ensure the tree is clean. | One auditable feature commit. |
| 7 | Run `bash replit/combined-release/run-combined-release-gates.sh --release`. | Clean-tree, iOS prebuild, and Android prebuild pass. |
| 8 | Build signed candidates with Expo-managed remote credentials and automatic submission off. | IPA and AAB identify the exact new commit, iOS 104, Android 79. |

## Direct Replit build without GitHub

GitHub is **not required by EAS Build**. If Replit permits authenticated shell commands and `EXPO_TOKEN` is available through its secret manager, it may upload the clean committed workspace directly:

```bash
cd artifacts/mobile
pnpm exec eas build --platform ios --profile production --non-interactive
pnpm exec eas build --platform android --profile production --non-interactive
```

These are build-only commands. Do **not** add `--auto-submit`, do not run `eas submit`, and do not restore local credential files. The build detail must show the exact clean feature commit. If the Replit environment prohibits EAS CLI, use Expo **Build from GitHub** after pushing the same reviewed feature commit.

## Database and privacy requirements

The migration is additive, but it changes comment authorization, story moderation, and private Kinfolk memory. Apply it first to an approved test/staging database. Kinfolk memories are created only with explicit consent; sensitive memories are recalled only for related conversations and are never used as cross-member community intelligence.

## Acceptance journeys

| Journey | Required evidence |
|---|---|
| Comments | Everyone, followers/connections, comments-off, private post, blocked users, delete, report, notification, and reload. |
| What’s Happening | Submit local/state/national/global item, moderation, verified source, For You/Latest ranking, local-first order, confirm, report, linked discussion, and diversity guard. |
| Kinfolk | Eclipse/general question, current researched answer with citations, insufficient-source fallback, image question, health-image safety, all voice modes, remember/view/forget, and sensitive-memory relevance. |
| Native stability | Cold launch, every tab, offline/slow network, denied media permissions, expired session, background/foreground, force-close/relaunch, image/video persistence, and crash reporting. |

The work is **NO-GO** until the release evidence packet contains passing database/API, web, mobile, prebuild, signed-artifact, and physical-device results.
