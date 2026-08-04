---
name: Font Scaling Fix — pending post-Apple-approval OTA
description: Global iOS Dynamic Type disable — deploy as FIRST OTA immediately after Apple approves Build 101. DO NOT deploy before approval.
---

# Font Scaling Fix

**Status:** PENDING — do not deploy until Apple approves Build 101.

## The Bug
The app has zero protection against iOS Dynamic Type / font scaling.
- No `allowFontScaling={false}` on any Text component
- No `Text.defaultProps` override
- No `maxFontSizeMultiplier` set anywhere

Users with text size above default (Settings → Accessibility → Display & Text Size → Larger Text) see overlapping/broken text throughout the app. Confirmed vulnerable areas:
- BusinessCard: 220px fixed width + fontSize 13 name + fontSize 11 location
- Discover page: fontSize 10-12 labels in fixed containers
- AI badges: fontSize 10
- Category dropdowns: fontSize 13-15

## The Fix (6 lines, one file only)

**File:** `artifacts/mobile/app/_layout.tsx`

**Where:** After the imports, BEFORE any component definitions.

```typescript
import { Text, TextInput } from 'react-native';

// Disable iOS Dynamic Type to prevent layout overflow
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;
```

## Deploy Instructions
- Push as OTA **only** (no EAS build needed)
- Deploy to BOTH iOS and Android branches
- Do NOT bundle with any other changes — solo OTA for this fix
- Trigger: founder says "Deploy the font scaling fix now"

## Why Not Now
Apple is actively reviewing. Any OTA push during review risks the reviewer seeing a mid-update state. Wait for approval confirmation first.
