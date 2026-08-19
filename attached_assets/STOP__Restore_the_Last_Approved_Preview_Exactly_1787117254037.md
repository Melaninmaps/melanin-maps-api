# STOP: Restore the Last Approved Preview Exactly

## Owner instruction

> **Restore the last approved public preview exactly as it was before the unapproved change. Do not redesign, simplify, modernize, reword, re-route, add controls, remove controls, alter animation, alter layout, or change any other website/mobile feature. This is a preview-only restoration.**

The approved version must be identified from Git history or the last owner-approved deployment screenshot—not guessed from a newer package, a design interpretation, or a current implementation.

## Scope lock

For this restoration, the **only** paths allowed to change are the existing preview implementation and its directly required route/style/test files. Do not modify navigation, footer, Library, Map, Businesses, Kinfolk, mobile, server APIs, database migrations, copy outside Preview, app-wide CSS, or deployment configuration.

Before changing anything, set the approved source commit:

```bash
export GOOD_PREVIEW_SHA="<the Git commit from the last owner-approved preview>"
```

Do not substitute a production API SHA, a Replit deployment identifier, or a guessed commit. Use `git log --all --decorate -- client/src/features/preview app/preview src/routes` and compare the prior preview visually in Replit before selecting the commit.

## Surgical restoration procedure

1. Preserve a recovery pointer before changing the working tree.

```bash
git status --short
git branch backup-before-preview-restore-$(date +%Y%m%d-%H%M%S)
git show --stat "$GOOD_PREVIEW_SHA"
```

2. Identify the precise preview files present in the approved commit.

```bash
git ls-tree -r --name-only "$GOOD_PREVIEW_SHA" | grep -E '(^|/)(preview|Preview|tour|Tour)' > /tmp/approved-preview-files.txt
cat /tmp/approved-preview-files.txt
```

3. Restore **only** those approved preview files. For every selected path, review it first and restore it one by one; never use `git restore .` or `git checkout .`.

```bash
git diff "$GOOD_PREVIEW_SHA" -- client/src/features/preview
# For each approved preview file:
git restore --source="$GOOD_PREVIEW_SHA" -- client/src/features/preview/<approved-file>
```

If the preview route is separate, restore only its existing route declaration from the same commit. Do not replace the global router.

4. Delete only new preview files that did not exist in the approved version and are shown by the diff as unapproved additions. Do not delete files outside the preview directory.

```bash
git diff --name-status "$GOOD_PREVIEW_SHA" -- client/src/features/preview
# Remove only explicit unapproved preview additions after reviewing each path.
```

5. Verify the scope. This command is a hard gate: it must show only preview paths and directly associated preview tests.

```bash
git diff --name-only "$GOOD_PREVIEW_SHA"
```

If any unrelated path appears, stop. Revert that unrelated path before continuing.

6. Run the existing preview tests and manually compare the restored result at the same viewport as the approved reference. Do not add or remove visitor-facing behavior during this step.

7. Commit with a restoration-only message.

```bash
git add client/src/features/preview <only-the-existing-preview-route-and-tests-if-restored>
git commit -m "restore: last owner-approved public preview exactly"
```

## Permanent `replit.md` rule — copy exactly

```md
# MWM Change-Control Rule — Non-Negotiable

1. Make changes only that the owner explicitly requested. A request to fix one behavior is not permission to redesign, refactor, remove, add, restyle, rename, relocate, or alter any adjacent experience.
2. Before editing, write a change manifest containing: the owner-requested outcome, exact allowed file paths, exact prohibited file paths, and acceptance checks. If the scope is ambiguous, ask; do not infer.
3. Never alter a previously approved screen, preview, route, animation, layout, copy, navigation, footer, API, schema, or mobile flow unless the owner explicitly names it.
4. For a restoration request, first restore the exact last owner-approved Git version. Do not create a replacement based on interpretation.
5. Before deployment, run `git diff --name-only <baseline>` and stop if any path outside the approved manifest changed.
6. Do not expose implementation, QA, route, QR, version, deployment, or debug language in public UI.
7. A visible regression is a failed release check even if the code compiles.
```

## Release gate

Do not deploy until all of the following are true.

| Check | Required result |
|---|---|
| Visual comparison | The preview matches the last owner-approved version at the reference desktop and mobile sizes. |
| Scope diff | Only declared preview files changed. |
| Public copy | No implementation/debug/QR/version language is newly exposed. |
| Route | The existing QR route resolves as it did in the approved version. |
| Owner sign-off | The owner sees and approves the restored preview before deployment. |

If any condition fails, do not deploy. Preserve the current working branch and request clarification rather than changing another part of the product.
