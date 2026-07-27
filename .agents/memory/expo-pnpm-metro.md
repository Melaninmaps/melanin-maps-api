---
name: Expo pnpm monorepo Metro config
description: Required metro.config.js setup for Expo in a pnpm workspace — without this, packages like expo-document-picker, expo-local-authentication fail to resolve at bundle time.
---

## The Rule

`artifacts/mobile/metro.config.js` must include three things beyond the default:

```js
const projectRoot = __dirname;  // artifacts/mobile
const workspaceRoot = path.resolve(projectRoot, '../..');  // workspace root

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  assert: path.resolve(__dirname, 'mocks/assert.js'),
};
```

**Why:**
- pnpm stores packages in `node_modules/.pnpm/` and symlinks them into `artifacts/mobile/node_modules/`
- Metro can't follow those symlinks into the pnpm store unless the store is in `watchFolders`
- Without `watchFolders = [workspaceRoot]`: "Unable to resolve expo-document-picker" (and others)
- With `watchFolders` but without assert polyfill: `expo-notifications` → `@ide/backoff` → `require('assert')` fails because `assert` is a Node.js built-in not available in React Native
- `assert` polyfill lives at `artifacts/mobile/mocks/assert.js`

**How to apply:**
- Any time metro.config.js is reset or recreated, re-add all three settings
- If new Node.js built-ins appear (util, path, etc.), add them to `extraNodeModules` the same way
- The `ContactAccessButton` mock for `expo-contacts` is also required — see the `resolveRequest` hook in metro.config.js

**Packages that required this fix:**
- `expo-document-picker@14.0.8` (pnpm symlink issue)
- `expo-local-authentication@17.0.8` (same)
- `expo-contacts@15.0.11` (additional issue: TypeScript source as main, mocked via ContactAccessButton)
- `assert` built-in (via expo-notifications → @ide/backoff)
