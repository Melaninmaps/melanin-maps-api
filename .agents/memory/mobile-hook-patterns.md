---
name: Mobile auth + color hook pattern
description: Which hooks exist for auth tokens and theme colors in the mobile app — two commonly wrong imports.
---

## The Rule

`useSession` and `useColorScheme` do **NOT** exist in `artifacts/mobile/hooks/`.

Importing either causes a Metro bundle failure that only surfaces at OTA export time — not at TypeScript compile time.

## Correct patterns

**Auth token:**
```typescript
import * as SecureStore from "expo-secure-store";
const token = Platform.OS !== "web"
  ? await SecureStore.getItemAsync("auth_session_token")
  : null;
```

**Theme colors:**
```typescript
import { useColors } from "@/hooks/useColors";
const colors = useColors();
// Available keys: background, card, border, foreground, mutedForeground,
// muted, input, primary, primaryForeground, secondary, secondaryForeground,
// accent, destructive, success, radius, tint, text, ...
// NOTE: the faded text key is mutedForeground, NOT muted.
```

**isDark (when needed separately):**
```typescript
import { useTheme } from "@/contexts/ThemeContext";
const { isDark } = useTheme();
```

**Why:** The hooks directory only contains domain-specific hooks (useBusinesses, useKinfolk, etc.). Theme and auth are provided through ThemeContext / expo-secure-store respectively.

**How to apply:** Any new mobile screen that needs the session token or dark/light colors must use these patterns. Always check `artifacts/mobile/hooks/` listing before importing a hook — absence from directory = Metro crash at OTA.
