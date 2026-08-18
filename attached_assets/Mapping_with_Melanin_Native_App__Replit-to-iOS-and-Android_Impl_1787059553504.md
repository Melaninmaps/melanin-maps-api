# Mapping with Melanin Native App: Replit-to-iOS-and-Android Implementation

## What this package is

This is an **Expo React Native** implementation package for a single Mapping with Melanin app that runs on both iOS and Android. It does not wrap the website in a browser. It calls the existing MWM API and carries forward the corrected product rules from the web release.

The mobile application must be an additional client of the same backend—not a second source of truth. Location search, Library topics, Kinfolk memory, community evidence, canonical cultural-site records, business details, and safety logic remain controlled by the API/database fixes already prepared for the website.

## Mobile product parity contract

| Website capability | Native implementation | Non-negotiable rule |
|---|---|---|
| Location-first map/directory | `DiscoverScreen` and `/api/map/local-business-search` | Return the two closest eligible local results within 5 miles. Do not insert distant fallbacks. |
| Map pins | `react-native-maps` markers built from the same `results` array as the list | Never render global/unrelated pins or zoom to a national view for a local query. |
| Manual area and device location | `useMemberLocation` and `/api/location/resolve` | Location is foreground-only, member initiated, and has clear denied/error/manual states. |
| Living Library | `LibraryScreen` and `/api/library/topics` | Show seeded foundational topics, readable descriptions, and gold-outline subject icons. |
| Kinfolk | `KinfolkScreen` and `/api/kinfolk/chat` | Preserve `KINFOLK_BUSY` question state; use diaspora-first research and never infer identity. |
| Voice questions | `expo-audio` → `/api/kinfolk/voice` | The member controls stop. Show real permission/capture/transcription failures; do not show a fake length error. |
| Cultural-site links | Expo Router `cultural-sites/[id]` | Resolve canonical UUID records and keep website URLs refresh-safe. |

## 1. Place this package in the Replit repository

Create a `mobile/` directory at the same repository root as the website/API, then copy this package into it. The server API remains in the existing API service. Do **not** copy server business rules into the app as a second implementation.

```text
repository/
  api-server/
  web-client/
  mobile/                 ← this package
    app/
    src/
    app.json
    eas.json
    package.json
```

Install packages from `mobile/`:

```bash
pnpm install
npx expo install expo-location expo-audio expo-secure-store react-native-maps
```

## 2. Configure Replit Secrets and application configuration

In Replit Secrets, set only non-user-specific build values:

```text
EXPO_TOKEN=<Expo automation token, if Replit triggers cloud builds>
EXPO_PUBLIC_API_BASE_URL=https://api.melaninmaps.com
```

Do not put a member access token, Apple password, personal location, OpenAI key, or production database URL in the mobile app or in `app.json`.

Replace these values before a production build:

```text
app.json → ios.bundleIdentifier: com.mappingwithmelanin.app
app.json → android.package: com.mappingwithmelanin.app
app.json → extra.eas.projectId: <EAS project ID>
```

The identifiers must be owned/available in the Apple and Google developer accounts. Keep the production API base URL server-side controlled in `app.json`/build configuration; native clients must never contain privileged keys.

## 3. Configure the API before mobile testing

The existing production API must expose these routes and honor `X-Client-Surface: native` without changing the product rules:

```text
GET  /api/map/local-business-search?query=&latitude=&longitude=&radiusMiles=&limit=2
POST /api/location/resolve
GET  /api/library/topics
GET  /api/cultural-sites/:id
POST /api/kinfolk/chat
POST /api/kinfolk/voice
```

The required database/API stabilization packages must be installed first:

1. schema compatibility and dynamic tags;
2. canonical slugs and cultural-site routing;
3. local two-result map search;
4. Living Library foundation and diaspora-first Kinfolk memory;
5. community-vibe evidence aggregation.

Native work must wait if API release verification reports a schema mismatch such as `column "slug" does not exist`.

## 4. Development workflow in Replit

Start the Expo development server:

```bash
pnpm start
```

Use a physical iOS/Android device via the approved Expo development build flow. Test location on a physical device whenever possible. Simulator/emulator location must be explicitly set before location tests. The app asks for **foreground** location only after the member presses `Use my location`; it never requests background location.

## 5. Build configuration

Initialize the cloud build project once:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Create internal test builds first:

```bash
pnpm build:preview
```

After the preview acceptance checklist passes, create production binaries:

```bash
pnpm build:production
```

Submit only after human approval:

```bash
pnpm submit:ios
pnpm submit:android
```

Cloud builds are the right path for a Replit-maintained project: iOS binaries can be compiled on cloud macOS runners and Android binaries on cloud Linux runners; signing credentials can be managed by the build service or supplied by the organization. [1]

## 6. Required deep-link setup

The app defines the custom scheme `mwm://` and receives canonical web cultural-site links such as:

```text
https://mappingwithmelanin.com/cultural-sites/<id>/<slug>
```

Deploy these two domain-verification files from the **web domain**, not the API domain.

`https://mappingwithmelanin.com/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "details": [{
      "appIDs": ["<APPLE_TEAM_ID>.com.mappingwithmelanin.app"],
      "components": [{"/": "/cultural-sites/*"}]
    }]
  }
}
```

`https://mappingwithmelanin.com/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mappingwithmelanin.app",
    "sha256_cert_fingerprints": ["<ANDROID_SIGNING_CERT_SHA256>"]
  }
}]
```

The values must match the real Apple Team ID and Android production signing certificate. Universal Links and Android App Links use these domain-controlled files to open a particular in-app route when the app is installed. [2]

## 7. Native acceptance checklist

Do not submit to stores until all of the following are true:

| Test | Required result |
|---|---|
| Charlotte + `bookstore` | Exactly the two qualifying local bookstores appear as both cards and pins. Philadelphia/Boston/Raleigh do not appear. |
| Member selects wider radius | The app asks only after local results are insufficient; it never expands silently. |
| Location permission denied | Visible manual city/neighborhood option; no stalled control. |
| Living Library fresh install | Foundation topics are readable and nonblank; Housing, Education, and Trades are present. |
| Kinfolk + `heart disease` | The API research plan begins with `Black women heart disease`, without writing identity to member memory. |
| Kinfolk voice | Member can start and stop recording; permission, empty-recording, upload, and transcription failures show specific messages. |
| Cultural-site web URL | Opens native content when app installed; opens website otherwise. |
| Queue saturation | `KINFOLK_BUSY` keeps the typed question for retry. |

## 8. Replit operating rule

The mobile app duplicates **capability and experience**, not unverified web code. Every new mobile feature must first use the stable API contract, obey the same memory/privacy/location rules, and pass the native acceptance tests. Replit must not reintroduce generic emoji, invisible input text, global map fallback, blank Library cards, static Community Vibes, or client-invented cultural-site URLs.

## References

[1]: https://docs.expo.dev/build/introduction/ "Expo — EAS Build"

[2]: https://docs.expo.dev/linking/overview/ "Expo — Linking, Universal Links, and Android App Links"
