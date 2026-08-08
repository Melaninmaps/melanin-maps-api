---
name: OTA push preference
description: Founder's standing instruction — always push EAS OTA updates from Replit, never ask the user to run commands locally
---

# OTA Push — Always From Replit

## Rule
When an EAS OTA update needs to be pushed, **always do it from Replit**. Never ask the founder to run commands locally. This is a permanent standing instruction.

## Why
The founder does not have the repo cloned locally and should not need to. Replit is the source of truth.

## How to apply
- Use `eas update --channel production --message "..." --non-interactive` with a **300000ms timeout** (the full 5-minute max).
- Run it directly (not in background with nohup — that gets silently killed).
- The system-installed EAS CLI at `/nix/store/.../bin/eas` (version 14.7.1) works; do NOT use `npx eas-cli` (npm lock issues).
- Always `cd artifacts/mobile` first.
- If it fails, retry once before reporting failure.
