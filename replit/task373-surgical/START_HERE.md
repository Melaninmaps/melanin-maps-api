# Start Here in Replit

Extract this folder at the repository root as `replit/task373-surgical/`, then paste:

```bash
cd "$REPL_HOME" 2>/dev/null || cd /home/runner/workspace

git status --short
git switch -c release/task-373-rc 2>/dev/null || git switch release/task-373-rc

node replit/task373-surgical/apply-task373-surgical.mjs "$PWD"
node replit/task373-surgical/apply-native-community-video.mjs "$PWD"
pnpm --filter @workspace/mobile exec expo install expo-video
bash replit/task373-surgical/restore-task373-test-deps.sh "$PWD"

git diff --check
git diff -- artifacts/mobile pnpm-lock.yaml

node replit/task373-surgical/validate-task373-surgical.mjs "$PWD"
node replit/task373-surgical/create-task373-evidence-template.mjs "$PWD"
bash replit/task373-surgical/run-task373-code-gates.sh "$PWD" --precommit
```

If a guarded patch reports a conflict, **do not force it**. The core script automatically restores earlier edits. Give Replit Agent the error and have it manually integrate only the named repair into the current file, then rerun the validator.

Next, fix every `FAIL` in the generated code-gate CSV. Commit intended source only, confirm a clean tree, and run:

```bash
bash replit/task373-surgical/run-task373-code-gates.sh "$PWD" --release
```

Build signed candidates only when that result is `GO_FOR_SIGNED_BUILD_AND_DEVICE_TESTING`:

```bash
pnpm --filter @workspace/mobile run build:candidate:ios
pnpm --filter @workspace/mobile run build:candidate:android
```

These commands do not submit the apps. Test the exact builds through TestFlight and Google Play internal testing and complete all 72 device rows. Overall release status stays **NO-GO** until the native evidence packet is independently verified.
