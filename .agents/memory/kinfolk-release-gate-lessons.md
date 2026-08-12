---
name: KinfolkAI release gate — lessons from Manus audits Aug 11-12 2026
description: What each Manus audit round caught, root causes, and permanent rules for KinfolkAI changes.
---

# KinfolkAI Release Gate — Manus Audit Lessons

## What Manus catches that static checks miss

Bundle grep + health probe do NOT prove:
- Active route wiring (a fix can be in the bundle but not reached by the live handler)
- DB migration existence (kinfolk_delivery_profiles may not exist in Railway prod DB)
- Browser hydration state (React state initialized from default before async load resolves)
- aria-pressed attribute value after page reload

This is why `code presence ≠ feature behavior`. Manus runs authenticated end-to-end.

## Round 1 failures (pre-9f8dd7ca)

Railway was caching the build at echo token `intent-router-v1-1786477870`. All source
file changes were ignored. The lesson: **echo token is MANDATORY on every push**.

## Round 2 failures (9f8dd7ca)

Three bugs, all isolated to the new legal-regulated code path:

### Bug A: `recommendations.length` TypeError → HTTP 500
- `recommendations` is typed `Record<string,unknown>|null`, not an array
- `.length` on a null or plain object throws TypeError on every `legal_regulated` request
- All three Thailand prompts returned 500 with no error in the response body
- Fix: use a single deterministic provenance string per intent class, no `.length` access

### Bug B: classifier order — culture_entertainment after business_discovery
- `classifyIntent` checked `BUSINESS_DISCOVERY_SIGNALS || hasDestination` BEFORE
  `CULTURE_ENTERTAINMENT_SIGNALS`
- "Who is the best rapper from Philadelphia?" → hasDestination → `business_discovery`
- Manus spec requires `intentClass` to match `/culture_entertainment|general_knowledge/`
- Fix: move CULTURE_ENTERTAINMENT check above BUSINESS_DISCOVERY in priority ladder

### Bug C: UI hydration — Detailed reverts to Conversational after hard refresh
- Root cause: response-style buttons in `PreferencesPanel` used `local.communicationStyle`
  (a copy of the `prefs` state object). `local` is initialized from `prefs` at mount time.
- Even after `loadPrefs` resolved with `responseStyle: "detailed"`, the buttons might
  show Conversational because of copy-state lag or because the prop/state update cycle
  raced with React's commit phase.
- Also: `aria-pressed={local.communicationStyle === o.id}` where o.id was "friendly" for
  Conversational — this mismatched the expected testid `kinfolk-response-style-conversational`
  (which Manus built from a "friendly"→"conversational" ternary that added more indirection).

## Round 3 fix — permanent pattern for response-style selectors

**Never tie a preference selector to a copy-in-local-state of prefs.communicationStyle.**

Use a dedicated top-level state:
```tsx
const [selectedResponseStyle, setSelectedResponseStyle] = useState<ResponseStyle>('conversational');
const [preferencesHydrated, setPreferencesHydrated] = useState(false);
```

After loadPrefs resolves, call:
```tsx
setSelectedResponseStyle(resolveResponseStyle({ responseStyle: d.responseStyle, deliveryProfile: d.deliveryProfile, preferences: { communicationStyle: raw.communicationStyle } }));
setPreferencesHydrated(true);
```

`resolveResponseStyle` precedence: `responseStyle` (new field) → `deliveryProfile.detailLevel/tonePreference` → legacy `communicationStyle`.

Selector buttons must:
- Use `RESPONSE_STYLE_OPTIONS` with ids matching `ResponseStyle` type (conversational, not friendly)
- `aria-pressed={selectedResponseStyle === option.id}` — NOT `local.communicationStyle`
- `disabled={!preferencesHydrated}` — prevents default-state flash and lets Playwright wait
- `data-testid="kinfolk-response-style-{option.id}"` as static string (not ternary)

**Why:** Manus's E2E test checks `aria-pressed="true"` on the Detailed button after a hard
reload. If the button uses copy-in-local-state, it briefly shows the wrong state until the
async loadPrefs resolves. Playwright retries but can race the assertion.

## Permanent release gate checks before any KinfolkAI change

See Manus's `MWM_Kinfolk_Authenticated_Release_Gate.spec.ts` in the project root.
Required testids: kinfolk-chat-input, kinfolk-send, kinfolk-provenance-note,
kinfolk-save-taste-profile, kinfolk-response-style-{conversational|concise|detailed|professional}.

Static checks (SHA, bundle grep, /health) are SUPPORTING EVIDENCE ONLY, never approval.
Authenticated E2E is the release gate.

## TRAVEL_POLICY_OVERRIDE / LEGAL_SIGNALS sync rule

Both regexes must be updated together:
- `artifacts/api-server/src/kinfolk/intent-router.ts` → `LEGAL_SIGNALS`
- `artifacts/api-server/src/routes/kinfolk.ts` → `TRAVEL_POLICY_OVERRIDE`

They drifted on Aug 11 2026 when LEGAL_SIGNALS was extended but the override was not.
"Thailand extension documents for staying longer" missed because "extension documents"
was only in LEGAL_SIGNALS but not TRAVEL_POLICY_OVERRIDE (the post-classification guard).
