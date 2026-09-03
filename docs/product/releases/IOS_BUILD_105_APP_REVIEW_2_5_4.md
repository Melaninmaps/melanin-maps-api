# iOS Build 105 — App Review Guideline 2.5.4 Correction

**Author:** Manus AI

**Date:** September 3, 2026

**Reviewed build:** 104

**Corrected build:** 105

**Bundle identifier:** `com.melaninmaps.app`

**Scope:** Remove an unused persistent-background-audio declaration without removing Kinfolk microphone input or spoken replies.

## Root cause

Mapping With Melanin uses `expo-audio` for foreground Kinfolk microphone input and audio playback. Expo Audio 57 enables background playback in its config plugin by default. On iOS, that default adds `audio` to `UIBackgroundModes`, even when the application never requests persistent background playback.[1]

Apple correctly identified that build 104 did not expose a feature requiring continuous audible playback after the member leaves the application. Apple defines `UIBackgroundModes` as services that require the application to keep running in the background.[2]

## Correction

Build 105 explicitly configures:

```json
{
  "enableBackgroundPlayback": false,
  "enableBackgroundRecording": false
}
```

The foreground microphone usage description remains present. Kinfolk can still accept microphone input and speak responses while the app is active. The generated native `Info.plist` contains no `UIBackgroundModes` audio value.

## Relationship to the latest product work

No mobile source files changed between build 104 source commit `bf5f00dff43e916c67341549a4f3afc3b4185f16` and production commit `8007d928b5e00983bc85f9289f7fd220cd507a0b`. The recent Kinfolk discovery, Living Library research, Community feed, comment, voice-provider, and production-data repairs are server-side or website changes.

The mobile app already calls the same production API. It receives compatible backend improvements automatically. Website-only presentation changes do not become native screens automatically, but they are not part of Apple’s current rejection and should not be bundled into this compliance correction without a separate native-device test cycle.

## Validation gates

Before the build, the release must satisfy all of these checks:

| Gate | Required result |
|---|---|
| Expo introspected build number | `105` |
| Expo introspected bundle identifier | `com.melaninmaps.app` |
| Generated `UIBackgroundModes` | Does not contain `audio` |
| Native clean prebuild `Info.plist` | `UIBackgroundModes` audio key absent |
| Foreground microphone description | Present |
| Mobile tests | All pass |
| Mobile TypeScript | Pass |
| Git worktree | Clean |
| Signing source | Existing Expo-managed remote credentials |
| Automatic submission | Off |

The repository includes two release guards:

```bash
pnpm run verify:ios-review-config
pnpm run prebuild:ios
```

Both commands fail before an EAS build if persistent background audio returns.

## Replit build sequence

Run this only after fetching the corrected GitHub commit:

```bash
cd /home/runner/workspace
git fetch origin main
git checkout main
git pull --ff-only origin main
cd artifacts/mobile
pnpm install --frozen-lockfile
pnpm run prebuild:ios
pnpm run build:candidate:ios
```

`build:candidate:ios` starts an iOS production build with automatic submission off. It must report build 105 and use the existing remote certificate and provisioning profile. Do not revoke or replace either signing credential.

After EAS reports success, test these foreground features on a physical iPhone:

1. Open Kinfolk.
2. Tap the microphone, record a short question, and stop recording.
3. Confirm the transcript is sent.
4. Play or automatically hear Kinfolk’s response while the app remains open.
5. Return to the Home Screen and confirm audio does not continue as a persistent background player.

## App Store Connect response

Select the completed build 105 for the existing rejected version and resubmit it. Reply to App Review with this text:

> Hello App Review,
>
> Thank you for identifying this issue. Mapping With Melanin does not require persistent background audio. In build 105, we removed the `audio` value from `UIBackgroundModes`. Kinfolk microphone input and spoken responses operate only while the app is active. No persistent background-audio capability is declared in the corrected build.
>
> Please review build 105.

A background-audio screen recording is not needed because the app is not claiming that capability. A normal foreground microphone and spoken-response test may be documented in the review notes if desired.

## References

[1]: https://docs.expo.dev/versions/latest/sdk/audio/ "Expo Audio Configuration Documentation"

[2]: https://developer.apple.com/documentation/bundleresources/information-property-list/uibackgroundmodes "Apple UIBackgroundModes Documentation"
