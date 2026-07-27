---
name: Mapping with Melanin — project overview
description: Key architecture decisions, pitfalls, and conventions for this project.
---

# Mapping with Melanin

## App identity
- Brand name: **Mapping with Melanin** (was "Melanin Maps" — fully renamed)
- Logo: `artifacts/mobile/assets/images/logo-transparent.png` (background removed for use on terracotta header)
- Color palette: terracotta `#C4622D`, amber `#D4873A`, cream `#FBF7F0`

## Stack
- Mobile: Expo SDK 54, expo-router v6, React Native 0.81.5
- API: Express 5, port 8080, proxy path `/api`
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OIDC/PKCE) via `openid-client` v6
- AI: OpenAI via Replit AI Integrations proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`)

## Key files
- Mobile auth provider: `artifacts/mobile/lib/auth.tsx` (AuthProvider + useAuth hook)
- Auth wrapped in `_layout.tsx` around `QueryClientProvider`
- API auth routes: `artifacts/api-server/src/routes/auth.ts`
- Auth middleware: `artifacts/api-server/src/middlewares/authMiddleware.ts`
- Travel AI route: `artifacts/api-server/src/routes/travel.ts` — POST `/api/travel/recommendations`

## Mobile platform file pairs (react-native-maps web bundling)
- Any file importing `react-native-maps` MUST have `.native.tsx` / `.tsx` platform extension pairs
- Metro scans all `app/` files — screen-level `.web.tsx` is not enough

## react-native-maps
- Version 1.18.0 cannot be imported at file level on web
- Use `.native.tsx` / `.tsx` pairs for MapView and any component that imports it

## Auth flow
- Mobile: `expo-auth-session` PKCE → POST `/api/mobile-auth/token-exchange` → token stored in `expo-secure-store`
- Token used as `Authorization: Bearer <token>` header
- Profile screen shows sign-in card (unauthenticated) or real user info (authenticated)

## Platform padding pattern
```ts
const topPad = Platform.OS === "web" ? 67 : insets.top;
const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
```

## openid-client v6 (NOT v5)
- Uses functional API: `client.discovery()`, `client.authorizationCodeGrant()`
- Do NOT use `new Issuer()` — that is v5 API

## Codegen
- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- Do NOT change `info.title` in openapi.yaml — it controls generated filenames

**Why:** Several of these aren't obvious from the code and caused multi-attempt debugging in prior sessions.
