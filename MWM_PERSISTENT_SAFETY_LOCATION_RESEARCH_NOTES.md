# MWM Persistent Safety Location — Research Notes

## Platform and policy sources

- Apple Core Location authorization: https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services
  - When In Use is preferred for privacy and battery; Always enables certain relaunch/update behaviors but must be requested only when necessary.
  - iOS requires `NSLocationWhenInUseUsageDescription` and, for Always, `NSLocationAlwaysAndWhenInUseUsageDescription`.
  - Authorization must be checked again because a member can change it in system settings.
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
  - Consent, minimization, accessible withdrawal, retention/deletion disclosure, and direct relevance are required.
  - Location collection, transmission, and use require notice and consent; location APIs must be directly relevant to the app’s features.
- Android background location: https://developer.android.com/develop/sensors-and-location/location/background
  - Background access must be essential to a user-facing feature; Android 8+ may restrict background updates to only a few per hour.
  - Android 10+ requires assessing `ACCESS_BACKGROUND_LOCATION`; third-party SDK access is attributed to the app.
- Google Play background location policy: https://support.google.com/googleplay/android-developer/answer/9799150
  - Background location requires a core-functionality justification, prominent disclosure before runtime permission, declaration form, short demonstration video, and an in-app/store privacy policy.
  - A foreground service with location can still be reviewed as background location.
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
  - Background tasks require top-level `TaskManager.defineTask`, appropriate permissions, and iOS `location` background mode.
  - iOS Always maps to `requestBackgroundPermissionsAsync`; Android requires foreground and background permissions.
  - Location stops when the user terminates the app; Android does not automatically relaunch a terminated app for location/geofence events. Expo Go cannot validate background location; a development or acceptance build is required.

## Source observations before implementation

- Current `/safety/location-shares` is a distinct recipient-selected, foreground-only, 30-minute to 24-hour temporary sharing feature. It must remain separate.
- Current Family Impact consent has the `active_temporary_location_only` scope and reads only a matching active `location_shares` record. Persistent MWM Safety Location requires a separate scope and source of truth.
- Current mobile configuration contains a foreground location string only and does not declare a background location task or background permissions.
- No real collection, deployment, build, or live provider activation is authorized by the founder directive.
