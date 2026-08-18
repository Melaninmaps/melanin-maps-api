# Mapping with Melanin Mobile Parity Memory

The iOS and Android app is a native Expo React Native client for the existing MWM API. It is not a webview and must never duplicate backend business logic or maintain a second database model.

## Mandatory parity rules

1. Local search is server-authoritative: default to 5 miles and at most two results. Both list cards and map pins must come from the same response. Never inject national/global results or automatically expand to a farther city.
2. Location is member initiated and foreground-only. Give clear states for locating, success, denied permission, disabled service, and manual city/neighborhood fallback.
3. Use the same seeded Living Library foundations, topic icons, Kinfolk research-memory policy, Community Vibes evidence, and canonical cultural-site records as the website.
4. Kinfolk applies the diaspora-first retrieval lens, preserves `KINFOLK_BUSY` questions for retry, and never infers identity from search terms. Sensitive context is optional; someone-else context stays temporary unless explicitly saved.
5. Native voice recording uses `expo-audio`; the member controls stop. Show capture/transcription stage errors, not generic length errors.
6. Canonical web cultural-site URLs must open the same native record through Universal Links and Android App Links. Use stable IDs; readable slugs can be corrected.
7. Use polished subject-specific gold-outline icons, not colorful or cartoon emoji. The feather is a brand-level mark, not a universal topic icon.
8. Text entered into all native inputs must be visibly readable. Do not inherit dark-surface colors into light input fields.

Every preview build must run the native acceptance checklist from README.md before a production build or store submission.
