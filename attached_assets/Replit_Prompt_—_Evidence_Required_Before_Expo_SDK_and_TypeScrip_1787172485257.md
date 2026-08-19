# Replit Prompt — Evidence Required Before Expo SDK and TypeScript Remediation

## Owner direction

Do **not** change code, dependencies, lockfiles, native configuration, EAS configuration, signing, build profiles, release state, or submission settings yet.

The current report says there are **25 Expo SDK dependency mismatches** and **29 TypeScript errors**, but it does not include the actual diagnostics. A count is not enough to produce safe code changes. I need the exact output so every correction can be tied to one file, one dependency, or one source contract.

This is a read-only evidence collection request. It is **not** approval to run automatic Expo repair, `expo install`, `expo upgrade`, `expo lint`, `pnpm add`, `npm install`, `pod install`, `expo prebuild`, EAS build, TestFlight upload, or App Store submission.

## First: preserve workspace integrity

Run and return the complete output of:

```bash
git status --short
git diff --name-only
git diff --stat
git diff -- package.json pnpm-lock.yaml yarn.lock package-lock.json .eslintrc* eslint.config.*
```

The prior lint operation attempted automatic configuration. Do not keep, revert, delete, install, or edit anything from that side effect. Report its exact diff first.

## Required dependency evidence — no changes

Run only the following read-only inspection commands. Redirect output to text files if it is long, then attach those files without truncation.

```bash
node --version
pnpm --version
cat package.json

# Select the lockfile that actually exists; do not generate one.
test -f pnpm-lock.yaml && sed -n '1,260p' pnpm-lock.yaml
test -f yarn.lock && sed -n '1,260p' yarn.lock
test -f package-lock.json && sed -n '1,260p' package-lock.json

pnpm exec expo-doctor --json
pnpm exec expo config --type public --json
pnpm list --depth 0
```

If a command proposes to install a package, update a lockfile, configure ESLint, create native folders, or otherwise modify the workspace, stop at the prompt and report it. Do not accept it.

For every Expo Doctor mismatch, return a row using this format:

| Package | Installed version | Expo SDK expected version | Dependency type | Native/runtime relevant? | Proposed correction | Why it is needed |
|---|---:|---:|---|---|---|---|

Do not propose a bulk upgrade. Do not modify package versions until this table is reviewed.

## Required TypeScript evidence — no changes

Run:

```bash
pnpm exec tsc --noEmit --pretty false
```

Attach the complete output, not a summary. If the output is long, save it as `mobile-typescript-errors.txt` and attach it.

For every error, produce this table:

| # | File and line | TypeScript error | Error code | Affected runtime path | Classification | Minimum proposed fix |
|---:|---|---|---|---|---|---|

Use only these classifications:

```text
native-launch-risk
route-or-navigation-risk
API/data-contract-risk
map-or-native-module-risk
waitlist-flow-risk
Kinfolk-flow-risk
test-only
unreachable/dead-code candidate
unknown-until-crash-stack
```

Do not fix the errors during this request.

## Required mobile configuration inventory

Attach the current contents of the following files **only if they exist**. Do not generate replacements.

```text
app.json
app.config.js
app.config.ts
eas.json
babel.config.js
metro.config.js
tsconfig.json
expo-env.d.ts
app/_layout.tsx
app/(tabs)/_layout.tsx
components/ui/icon-symbol.tsx
package.json
```

Also provide a file list for every direct import of these native/runtime-sensitive modules:

```text
react-native-maps
react-native-reanimated
react-native-worklets
react-native-gesture-handler
expo-router
expo-notifications
expo-audio
expo-video
expo-image
expo-splash-screen
expo-secure-store
```

For each import, return:

| Module | Importing file | iOS execution path | Android execution path | Web guard present? | Potential startup path? |
|---|---|---|---|---|---|

## Required build identity

For the iOS build Apple reviewed and the latest iOS build 102, return:

| Build number | Bundle identifier | EAS build ID | EAS timestamp | Git SHA | Expo SDK | React Native | Build profile | Matched to Apple review? |
|---:|---|---|---|---|---|---|---|---|

A blank/unknown Apple-review match must remain blank/unknown. Do not assume build 102 is the reviewed binary.

## Explicit exclusions

Do not run or change:

```text
expo lint
expo install
expo upgrade
pnpm add/remove/update
npm install
pod install
expo prebuild
expo run:ios
expo run:android
eas build
eas submit
eas update
App Store Connect/TestFlight submission
source code
package.json
lockfiles
native iOS/Android folders
```

## Required reply

Return the evidence as attachments plus a short index. End with this exact statement:

> `No Expo SDK, TypeScript, source, lockfile, native configuration, build, or submission change has been made. The iOS release remains blocked pending a reviewed file-by-file remediation plan and matched Apple crash evidence.`

Once this evidence is attached here, Manus will produce the exact surgical code and a separate owner-approval release gate. Do not make any repair based only on the counts `25` and `29`.
