# EAS auto-submit reference

Official Expo documentation reviewed 2026-09-05: <https://docs.expo.dev/build/automate-submissions/>.

- `eas build -p ios --profile production --auto-submit` passes a successful build to EAS Submit using the matching submission profile.
- For iOS, the default submission destination is TestFlight. It does **not** submit the build for App Store review.
- `--auto-submit-with-profile=<profile-name>` selects a different submission profile when needed.
- Store metadata is not changed by EAS Submit.
- Android auto-submit behavior depends on the configured track and release status. The current Mapping With Melanin handoff will not auto-submit Android until its Play credential and review gates pass.
