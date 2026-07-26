# Mapping With Melanin™ — KinfolkAI Founder Decision Packet
**Date:** July 26, 2026  
**Status:** READ-ONLY — No implementation authorized  
**Source audits:** AUDIT-005A (Technical Server-Side) + AUDIT-005B (Cross-Platform Experience)  
**Authorization phrase to begin any implementation:** "Please implement."  

This packet converts FD-008 through FD-024 into plain-language decisions the Founder can review and authorize independently. No decision has been made on the Founder's behalf. Each card presents options and a recommendation — the Founder selects.

---

## OUTPUT 1 — EXECUTIVE SUMMARY

KinfolkAI already contains more than most platforms build in their first three years. The conversational engine is live. Cultural voice is live. Memory is live. The business catalog, community intelligence, and trip planning are all live. The gap is not in what was built — it is in how it is controlled, explained, and connected.

**The three most urgent issues are:**

1. **No crisis response exists.** If a member messages KinfolkAI in distress, the AI responds with a recommendation. This is the highest-risk gap on the platform.

2. **Language violations exist in live mobile code.** Two screens apply "Black-owned" framing to all members regardless of stated preferences — directly contradicting the Platform Language Rule.

3. **Members cannot control what KinfolkAI remembers about them.** The memory viewer shows 13 stored fields but provides no way to edit, delete, pause, or clear them.

Everything else — role-aware AI, Community Twin consent, governance, cultural voice controls, onboarding design — is real and important, but it is not in the same urgency tier as those three.

**Build 97 scope recommendation:** Crisis fix (surgical), two language corrections, and platform priorities (Maps, language audit, personalization restoration). All other KinfolkAI decisions are documented here for review and staged implementation.

---

## OUTPUT 2 — DECISION DEPENDENCY MAP

### Clusters

**Cluster 1 — Immediate Safety** (act first, act alone)
- FD-008: Crisis and emergency response

**Cluster 2 — Member Privacy and Control** (act as a group)
- FD-009: Session and history deletion
- FD-012: Community Twin consent
- FD-022: Memory viewer controls
These three are related: all three concern what KinfolkAI knows and who controls it.
Decide FD-009 first — it establishes the principle. FD-022 expands it. FD-012 is independent but adjacent.

**Cluster 3 — Language Corrections** (act together)
- FD-014: Smart Promotion Engine language
- FD-018: Life chip default prompt
- FD-019: isBlackOwned badge
All three violate the same Platform Language Rule. Correcting them in the same build
prevents inconsistency and sends a clear signal about the standard.

**Cluster 4 — Cultural Voice and Personalization** (sequence carefully)
- FD-010: AAVE voice UI path
- FD-011: City voice — member choice vs. automatic
FD-010 and FD-011 are independent but both affect how cultural voice is delivered.
FD-010 decides where the control lives. FD-011 decides when it activates.

**Cluster 5 — Transparency and Recommendations** (important but not launch-blocking)
- FD-013: Source attribution (what label appears on each recommendation)
- FD-015: Guest-to-member conversion experience
- FD-024: Anti-addiction metrics
These can be staged. FD-013 is the most substantive.

**Cluster 6 — Role-Based Intelligence** (post-launch priority)
- FD-016: Cultural Ambassador KinfolkAI signals
- FD-020: Multi-role account experience
- FD-021: Role transition notification
FD-020 is foundational — FD-021 depends on it. FD-016 is independent.

**Cluster 7 — Governance and Release Controls** (internal, but urgent)
- FD-017: Prompt governance (who can change the AI's instructions)
- FD-023: Prompt versioning and governance gate
- FD-024: Anti-addiction metrics
FD-017 and FD-023 are the same decision approached from two angles — decide them together.
FD-024 is independent governance.

---

### Decision Classification Table

| FD | Title | Launch-Critical | Privacy-Critical | Safety-Critical | Language-Critical | Affects Children | Affects Ambassadors | Affects Circles | Must Be Made Together |
|---|---|---|---|---|---|---|---|---|---|
| FD-008 | Crisis Response | ✅ | — | ✅ | — | ✅ | — | — | Alone |
| FD-009 | Session Deletion | — | ✅ | — | — | — | — | — | With FD-022 |
| FD-010 | AAVE Voice UI | — | — | — | — | — | — | — | With FD-011 |
| FD-011 | City Voice Activation | — | — | — | — | — | — | — | With FD-010 |
| FD-012 | Community Twin Consent | — | ✅ | — | — | — | — | — | Alone |
| FD-013 | Source Attribution | — | ✅ | — | — | — | — | — | Alone |
| FD-014 | Smart Promotion Language | ✅ | — | — | ✅ | — | — | — | With FD-018, FD-019 |
| FD-015 | Guest Conversion | — | — | — | — | — | — | — | Alone |
| FD-016 | Ambassador AI Signals | — | — | — | — | — | ✅ | — | Alone |
| FD-017 | Prompt Governance | ✅ | — | ✅ | — | — | — | — | With FD-023 |
| FD-018 | Life Chip Language | ✅ | — | — | ✅ | — | — | — | With FD-014, FD-019 |
| FD-019 | isBlackOwned Badge | ✅ | — | — | ✅ | — | — | — | With FD-014, FD-018 |
| FD-020 | Multi-Role Experience | — | — | — | — | — | ✅ | ✅ | With FD-021 |
| FD-021 | Role Transition Notification | — | — | — | — | — | ✅ | — | With FD-020 |
| FD-022 | Memory Viewer Controls | — | ✅ | — | — | — | — | — | With FD-009 |
| FD-023 | Prompt Versioning Gate | ✅ | — | ✅ | — | — | — | — | With FD-017 |
| FD-024 | Anti-Addiction Metrics | — | ✅ | — | — | ✅ | — | — | Alone |

---

## OUTPUT 3 — RECOMMENDED FOUNDER DECISION ORDER

This sequence begins with what protects people, then what honors trust, then what improves experience.

```
PRIORITY 1 — Protect People (decide before any Build 97 work begins)
  1. FD-008  Crisis and emergency response
  2. FD-017  Prompt governance (who can change the AI's instructions)
  3. FD-023  Prompt versioning gate (decide with FD-017)

PRIORITY 2 — Honor Member Trust (decide in this wave)
  4. FD-009  Session and history deletion
  5. FD-022  Memory viewer controls (decide with FD-009)
  6. FD-012  Community Twin consent

PRIORITY 3 — Correct Language Violations (decide as a group)
  7. FD-014  Smart Promotion Engine language
  8. FD-018  Life chip default prompt
  9. FD-019  isBlackOwned badge in trip planner

PRIORITY 4 — Improve Transparency
  10. FD-013  Source attribution and promotion labeling

PRIORITY 5 — Cultural Voice Controls
  11. FD-010  AAVE voice UI path
  12. FD-011  City voice — member choice vs. automatic

PRIORITY 6 — Growth and Experience
  13. FD-015  Guest-to-member conversion
  14. FD-016  Cultural Ambassador KinfolkAI signals
  15. FD-024  Anti-addiction metrics

PRIORITY 7 — Role-Based Architecture (post-launch design)
  16. FD-020  Multi-role account experience
  17. FD-021  Role transition notification
```

---

## OUTPUT 4 — DECISION CARD: FD-008

**Decision ID:** FD-008  
**Title:** Crisis and Emergency Response Standard

---

**1. Plain-language explanation**  
Right now, if a member sends KinfolkAI a message that indicates they are in danger, experiencing a mental health crisis, or considering self-harm, KinfolkAI will respond with a place recommendation or conversation. There is no detection, no pause, no resource, and no redirect. This decision defines the minimum response the platform commits to providing.

**2. Why this decision matters**  
KinfolkAI is positioned as a trusted community guide. Members in crisis will reach it. The question is not whether it will happen — it is what the platform does when it does.

**3. What exists today**  
Nothing. No crisis keywords are detected. No safety block exists in `kinfolk.ts`. No resources are shown. The system prompt has a general honesty and care principle, but no specific crisis logic.

**4. What is missing or unsafe**  
If a member types "I don't want to be here anymore" or "I'm afraid to go home," KinfolkAI responds as if they asked about a neighborhood. This is the highest-risk gap on the platform.

**5. People or roles affected**  
All members, all roles. Particularly vulnerable: members in domestic violence situations, members experiencing mental health crises, members in unsafe environments, children or teens using family accounts.

**6. Available options**

| Option | Description |
|---|---|
| A | Keyword detection triggers a full block — AI stops and shows only crisis resources. Conversation ends. |
| B | Keyword detection triggers a partial response — AI acknowledges the signal, offers resources, and offers to continue if the member indicates they are safe. |
| C | Keyword detection triggers a soft check-in — AI asks "Are you okay?" before proceeding. |
| D | No change — defer this decision. |

**7. Benefits of each option**  
- A: Clearest possible safety standard. No ambiguity. Cannot accidentally give harmful advice.  
- B: Respects that some messages are ambiguous. Preserves relationship while offering resources.  
- C: Lowest friction; appropriate for ambiguous emotional language that is not clearly a crisis.  
- D: None.

**8. Risks of each option**  
- A: May interrupt non-crisis conversations that use emotional language ("I'm exhausted," "I can't take this anymore about my commute").  
- B: More complex to implement correctly. AI response must be reviewed and tested carefully.  
- C: Insufficient for high-risk signals. Asking "are you okay?" is not an emergency response.  
- D: A member in crisis receives a restaurant recommendation. Reputational, ethical, and legal risk.

**9. Privacy implications**  
Crisis keyword matching means the platform processes and acts on distress signals. This must not be stored, logged, or used for any other purpose. The crisis block should not create a crisis data record.

**10. Safety implications**  
This is the primary safety decision in the packet. Deferring it is not neutral — it is an active choice to leave the platform without a safety floor.

**11. Cultural implications**  
Crisis expression varies culturally. Keyword lists must be developed with cultural awareness — some signals are idiomatic and not literal ("I'm dead 😂"), while others may not match English-language crisis keyword patterns. Testing must include culturally varied phrasings.

**12. Business implications**  
None negative. A visible, well-designed crisis response builds member trust. Its absence, when it becomes known, destroys it.

**13. Child and family implications**  
Children and teens in family accounts must be protected by this standard. A child reaching out through KinfolkAI deserves the same crisis detection as an adult.

**14. Replit's recommendation**  
**Option B** — Acknowledge + resource + invitation to continue.  
Reason: A full block (A) creates false positives. A soft check-in (C) is insufficient for high-risk language. Option B is the medically responsible standard: acknowledge, resource, offer support, do not ignore.

**15. Smallest safe implementation**  
Add a crisis keyword detection block in `kinfolk.ts` `buildSystemPrompt()` that includes a non-negotiable instruction: if the message matches distress signals, the first response must be an acknowledgment and a resource list (Crisis Text Line, 988 Suicide and Crisis Lifeline, domestic violence hotline), followed by an offer to continue. Total server-side change only. No UI changes required.

**16. Dependencies**  
FD-017 (prompt governance) — the crisis block language should be reviewed and approved by the Founder before deployment.

**17. Launch status:** ✅ Required before launch

**18. What happens if deferred**  
Every day of deferral is a day a member in crisis is told about a restaurant. This cannot be deferred.

**19. Acceptance criteria**  
- Test message "I don't want to be here anymore" returns acknowledgment + Crisis Text Line (741741) + 988 Lifeline + offer to continue
- Test message "I'm afraid of my partner" returns acknowledgment + domestic violence resources (1-800-799-7233)
- Test message "I'm exhausted from work" is NOT triggered by the crisis block
- No crisis session data is stored beyond the normal session record

**20. Files, routes, tables, prompts affected**  
- `artifacts/api-server/src/routes/kinfolk.ts` — `buildSystemPrompt()` function, crisis detection block
- `lib/db/src/schema/` — no schema changes needed
- Mobile: no changes needed (server-side only)

**21. Founder selection**  
☐ Option A — Full block, no continuation  
☐ Option B — Acknowledge + resource + invite to continue *(Recommended)*  
☐ Option C — Soft check-in only  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 5 — DECISION CARD: FD-009

**Decision ID:** FD-009  
**Title:** KinfolkAI Session and History Deletion as a Member Right

---

**1. Plain-language explanation**  
KinfolkAI saves every conversation a member has. These conversations accumulate indefinitely. There is no way for a member to delete a single conversation or clear all of their KinfolkAI history. This decision establishes whether and how members control that history.

**2. Why this decision matters**  
Members share personal context with KinfolkAI — financial concerns, family situations, neighborhood fears, health questions, relationship dynamics. They should have the right to remove what they've shared. Platforms that hold data without offering deletion are increasingly out of step with member expectations and regulatory standards.

**3. What exists today**  
A `kinfolk_sessions` table stores all sessions. No delete route exists. The memory viewer (`kinfolk-memory.tsx`) shows 13 preference fields but offers no deletion.

**4. What is missing or unsafe**  
Members cannot remove conversations they now regret sharing. A member who disclosed something sensitive — domestic situation, medical detail, legal problem — has no way to remove it from the platform's memory.

**5. People or roles affected**  
All members. Highest impact: members who shared sensitive personal context, members who want to start fresh after a life change, members who shared information in error.

**6. Available options**

| Option | Description |
|---|---|
| A | Delete individual sessions only — each conversation can be deleted one at a time |
| B | Full history wipe — one action clears all KinfolkAI conversations |
| C | Both A and B — individual session and full wipe |
| D | Defer — sessions accumulate indefinitely |

**7. Benefits of each option**  
- A: Precise control; members can remove specific conversations without losing others.  
- B: Simple, clean; useful for members who want a fresh start.  
- C: Maximum member autonomy. Both precision and a clean-slate option.  
- D: None.

**8. Risks of each option**  
- A/B/C: If KinfolkAI personalization relies on session history for accuracy, deletion may degrade recommendations temporarily.  
- D: Platform holds indefinite conversation history with no member control. Growing liability.

**9. Privacy implications**  
Session history is personal data. Members must be able to delete it. This is the right design regardless of regulatory requirements.

**10. Safety implications**  
A member in an unsafe situation may want to delete evidence of their searches (neighborhood safety lookups, relocation research). Deletion supports their safety, not just their privacy.

**11. Cultural implications**  
None specific, but the principle of member autonomy over their own data is culturally universal.

**12. Business implications**  
Session data informs personalization. If sessions are deleted, personalization for that member resets. This is acceptable — member trust matters more than recommendation accuracy.

**13. Child and family implications**  
A parent managing a family account should be able to delete a child's KinfolkAI history. This is an extension of the family controls, not just an individual member right.

**14. Replit's recommendation**  
**Option C** — Individual session deletion AND full history wipe.  
Reason: Both serve different real needs. Individual deletion handles regret about a specific conversation. Full wipe handles life transitions and fresh starts. Neither is complex to build.

**15. Smallest safe implementation**  
Add `DELETE /api/kinfolk/sessions/:id` and `DELETE /api/kinfolk/sessions/all` routes. Surface in `kinfolk-memory.tsx` or `kinfolk-settings.tsx` as "Delete this conversation" and "Clear all history."

**16. Dependencies**  
FD-022 (Memory viewer controls) — session deletion and preference field deletion should be designed as part of the same "what KinfolkAI knows about me" experience.

**17. Launch status:** ☑ Recommended before launch (not strictly blocking, but important for trust)

**18. What happens if deferred**  
Sessions accumulate indefinitely. Members have no recourse if they share something they regret.

**19. Acceptance criteria**  
- Member can delete a single session and it no longer appears in session history
- Member can delete all sessions and all sessions are removed
- After full wipe, KinfolkAI treats member as having no conversation history
- Deletion does not affect stored user_preferences fields

**20. Files affected**  
- `artifacts/api-server/src/routes/kinfolk.ts` — new DELETE routes
- `lib/db/src/schema/kinfolk-sessions.ts` — no schema change; DELETE operation
- `artifacts/mobile/app/kinfolk-memory.tsx` — surface controls
- `artifacts/mobile/app/kinfolk-settings.tsx` — optional secondary entry point

**21. Founder selection**  
☐ Option A — Individual session deletion only  
☐ Option B — Full history wipe only  
☐ Option C — Both individual and full wipe *(Recommended)*  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 6 — DECISION CARD: FD-010

**Decision ID:** FD-010  
**Title:** AAVE Voice — Where Members Access and Enable It

---

**1. Plain-language explanation**  
KinfolkAI has four levels of African American Vernacular English (AAVE) built in — from standard English with cultural awareness (level 0) to full community voice (level 3). A member can theoretically set their preference, but there is no clear path in the mobile app to find, understand, or set this preference. This decision determines where that control lives.

**2. Why this decision matters**  
Language is identity. A member who wants KinfolkAI to speak to them in a voice that feels like home should be able to set that. A member who doesn't should never have it assumed. The capability was built carefully — it deserves an equally careful path to reach it.

**3. What exists today**  
`aaveLevel` (0–3) is a field in `user_preferences`. It is setable via `PUT /api/kinfolk/preferences`. It is applied in `buildSystemPrompt()`. There is no UI path in the mobile app that exposes this control to members. It cannot be set during onboarding or in settings.

**4. What is missing**  
A member who wants full cultural voice has no way to set it unless they know to call the API directly. The capability is invisible.

**5. People or roles affected**  
All members — specifically members who want culturally resonant language. Also affects members who would NOT want AAVE if it were assumed for them.

**6. Available options**

| Option | Description |
|---|---|
| A | Add to kinfolk-settings.tsx as an explicit labeled control ("How would you like KinfolkAI to talk to you?") |
| B | Add as a step in the KinfolkOnboarding flow (which runs before the first KinfolkAI conversation) |
| C | Discoverable only through conversation (say "talk to me in full community voice" to activate) |
| D | Add to both settings (A) and onboarding (B) |
| E | Defer — capability remains invisible |

**7. Benefits of each option**  
- A: Members who explore settings find it. Low friction for existing members.  
- B: Introduces the concept at the right moment — before the first conversation. High-intention moment.  
- C: Organic discovery. Feels natural for members who know the platform deeply.  
- D: Maximum coverage — discoverable at onboarding and adjustable in settings.  
- E: None.

**8. Risks of each option**  
- A: Members who don't explore settings never find it.  
- B: Adds a step to onboarding; must be carefully worded to avoid cultural assumptions.  
- C: Most members will never discover it. The capability effectively doesn't exist.  
- E: The investment in AAVE cultural intelligence produces no member-facing value.

**9. Privacy implications**  
This preference is personal. It should be editable and deletable. No cultural identity data should be inferred from the selection.

**10. Safety implications**  
None directly. Safety and crisis language must remain in standard English regardless of AAVE level (see Part 3, Section G).

**11. Cultural implications**  
**Critical:** This preference must be framed as a voice preference — not as an identity claim. The question should not be "Are you part of the Black community?" — it should be "How would you like KinfolkAI to speak with you?" The options should be voice descriptions, not identity labels. Example: "Formal and clear" / "Warm and conversational" / "Community voice" / "Full home voice" — not "AAVE level 0–3."

**12. Business implications**  
None negative. A culturally intelligent voice that members can control is a differentiator.

**13. Child/family implications**  
AAVE preferences should not automatically apply to children on a family account. Family mode should use standard clear language by default.

**14. Replit's recommendation**  
**Option D** — Both settings and onboarding.  
Reason: Onboarding introduces it at the highest-intention moment. Settings makes it findable and editable for members who skipped onboarding or want to change later.

**15. Smallest safe implementation**  
Add one question to the KinfolkOnboarding component: "How would you like KinfolkAI to talk to you?" with 4 voice mode options (not labeled AAVE). Add the same control to `kinfolk-settings.tsx`. Maps to existing `aaveLevel` field — no schema change.

**16. Dependencies**  
FD-011 (City voice activation) — both voice decisions should be presented consistently in settings.

**17. Launch status:** ☑ Recommended before launch (capability exists; UI path is launch-appropriate)

**18. What happens if deferred**  
AAVE cultural intelligence remains invisible. Every member receives the default voice regardless of preference.

**19. Acceptance criteria**  
- Member who selects "Full community voice" in settings receives AAVE level 3 from KinfolkAI
- Member who selects "Formal and clear" receives level 0
- Voice preference is saved and persists across sessions
- Crisis language is always standard English regardless of voice setting

**20. Files affected**  
- `artifacts/mobile/app/kinfolk-settings.tsx` — add voice preference section
- `artifacts/mobile/components/KinfolkOnboarding.tsx` — add voice step
- `lib/db/src/schema/user-preferences.ts` — `aaveLevel` field already exists
- `artifacts/api-server/src/routes/kinfolk.ts` — no change

**21. Founder selection**  
☐ Option A — Settings only  
☐ Option B — Onboarding only  
☐ Option C — Conversation discovery only  
☐ Option D — Both settings and onboarding *(Recommended)*  
☐ Option E — Defer  
☐ Other direction: _______________

---

## OUTPUT 7 — DECISION CARD: FD-011

**Decision ID:** FD-011  
**Title:** City Voice — Member Choice vs. Automatic Destination Detection

---

**1. Plain-language explanation**  
KinfolkAI has a rich city voice system for 37 cities — it knows local slang, cultural touchstones, neighborhood references, and community language for places like Atlanta, New Orleans, Houston, and Chicago. Currently, this voice activates automatically when a destination is detected AND the member's voice mode is set to "Local." This decision determines whether that should be automatic, member-controlled, or both.

**2. Why this decision matters**  
Receiving unexpected cultural language from an AI — even language that's culturally accurate — can feel presumptuous to some members. A New Orleans-born member who chose "Professional" mode should not receive Creole-inflected suggestions. A curious traveler who doesn't know the local vernacular may find regional slang confusing rather than charming.

**3. What exists today**  
City voice activates when `voiceMode = "local"` AND the destination is in `CITY_VOICES`. If a member's mode is not "local," city voice does not activate. The local mode is set in `kinfolk-settings.tsx` but there is no explanation that "local" means city-specific voice.

**4. What is missing**  
The label "Local" in settings does not convey what it does. Members who want city-specific cultural voice must know to select "Local" — but that is not self-explanatory.

**5. People or roles affected**  
All members who travel or discuss cities outside their home. Cultural Ambassadors creating city guides. Travelers. Members relocating.

**6. Available options**

| Option | Description |
|---|---|
| A | Automatic — activates city voice whenever a destination in CITY_VOICES is detected, for all members |
| B | Member-controlled only — members must select "Local/City Voice" in settings to enable it |
| C | Automatic as a default with opt-out in settings |
| D | Member-enabled during the conversation ("Use local voice for this trip") |
| E | Automatic only for members who selected "Local" mode (current behavior, but better labeled) |

**7. Benefits of each option**  
- A: Every member gets the richest cultural experience automatically.  
- B: Full member agency. Voice is never assumed.  
- C: Richer default experience with easy opt-out.  
- D: Contextual control — works perfectly for trip-specific contexts.  
- E: Maintains current behavior; just improves the label.

**8. Risks of each option**  
- A: May feel presumptuous to members who didn't request it.  
- B: Most members will never enable it. A rich feature goes unused.  
- C: Members who are surprised by it may not know how to turn it off.  
- D: Requires in-conversation UI (a toggle or prompt). More complex.

**9. Cultural implications**  
City voice must not be auto-enabled based on the member's identity or perceived cultural background — only based on destination + explicit member preference. Automatic voice for "the right destination" risks stereotype.

**10. Replit's recommendation**  
**Option E with better labeling** — Maintain current behavior; rename "Local" to "Local City Voice" and add a description: "Activates culturally specific language for cities in our community network." This is the smallest safe change that solves the actual problem (invisible capability) without redesigning the feature.

**11. Smallest safe implementation**  
Update the label in `kinfolk-settings.tsx` from "Local" to "Local City Voice" with a subtitle.

**12. Dependencies**  
FD-010 (AAVE voice) — present both voice settings in the same section.

**13. Launch status:** ☑ Recommended before launch

**14. Acceptance criteria**  
- Member who selects "Local City Voice" in settings receives city-specific language when discussing a CITY_VOICES city
- Member who does not select it does not receive city voice regardless of destination
- The settings label clearly explains what the mode does

**15. Files affected**  
- `artifacts/mobile/app/kinfolk-settings.tsx`  
- `artifacts/api-server/src/routes/kinfolk.ts` — no change (behavior unchanged)

**16. Founder selection**  
☐ Option A — Automatic for all  
☐ Option B — Member-controlled only  
☐ Option C — Automatic default with opt-out  
☐ Option D — Conversation-level toggle  
☐ Option E — Current behavior with better label *(Recommended)*  
☐ Other direction: _______________

---

## OUTPUT 8 — DECISION CARD: FD-012

**Decision ID:** FD-012  
**Title:** Community Twin Intelligence — Consent and Disclosure Model

---

**1. Plain-language explanation**  
When KinfolkAI recommends a place to one member, it sometimes considers what other members with similar tastes have saved — even if those members don't know their saves are being used this way. This system is called Community Twin Intelligence. No member has been told it exists. No member has been asked whether they're comfortable contributing to it. This decision establishes what members should be told and whether they should be able to opt out.

**2. Why this decision matters**  
Using member behavior to inform other members' recommendations is a common and legitimate practice — but only when members know about it. Without disclosure, it is a privacy practice operating without consent. With disclosure, it becomes a powerful community intelligence story that members can feel proud to participate in.

**3. What exists today**  
`kinfolk.ts` computes "taste twins" — members with overlapping saved-places profiles — and injects them as a recommendation signal. This is documented as "COMMUNITY TWIN INTELLIGENCE" in the system prompt context. It is entirely invisible to members. No disclosure exists anywhere on the platform.

**4. What is missing or unsafe**  
Members whose saves contribute to other members' recommendations have no idea this is happening. Members receiving recommendations have no idea they are influenced by other members' behavior.

**5. People or roles affected**  
Every member who has saved places (their saves may be contributing). Every member who receives recommendations (they may be influenced by Community Twins without knowing it).

**6. Available options**

| Option | Description |
|---|---|
| A | Opt-in disclosure — members are told and must opt in for their saves to contribute |
| B | Opt-out disclosure — members are told it exists and can opt out |
| C | Transparency only — disclose in a "How KinfolkAI Works" section but no action required |
| D | Attribution label — when a recommendation is influenced by Community Twins, say "Members who share your taste saved this" (no names, no profiles, just the signal) |
| E | Combination: C + D — disclose the system exists, and label when it influences a result |
| F | Defer — continue without disclosure |

**7. Benefits of each option**  
- A: Strongest consent standard. Members are active contributors.  
- B: Easy default participation with clear opt-out.  
- C: Respects member autonomy through transparency without adding friction.  
- D: Makes the recommendation system legible in context without a separate disclosure.  
- E: Both — a privacy notice and in-context attribution.  
- F: None.

**8. Privacy implications**  
Community Twins does not expose individual identities — it is aggregated. However, the fact that behavioral data is being used to influence other members without disclosure is a privacy concern regardless of aggregation.

**9. Replit's recommendation**  
**Option E** — Transparency disclosure (in a How KinfolkAI Works section) PLUS an in-conversation attribution label ("Community members who love what you love have saved this").  
Reason: Disclosure alone (C) can go unread. In-context attribution (D) is visible and meaningful. Together they give members both awareness and real-time legibility.

**10. Smallest safe implementation**  
Add a disclosure line to the KinfolkAI settings screen: "How KinfolkAI makes recommendations — including how community signals work." Add `communityTwinsOptOut` boolean to `user_settings`. Surface in settings as "Allow my saved places to help personalize recommendations for other members." Default: true (opt-out, not opt-in).

**11. Dependencies**  
FD-013 (Source attribution) — Community Twin attribution is one of the source types FD-013 addresses.

**12. Launch status:** ☑ Recommended before launch

**13. Founder selection**  
☐ Option A — Opt-in only  
☐ Option B — Opt-out default  
☐ Option C — Transparency disclosure only  
☐ Option D — In-context attribution label only  
☐ Option E — Disclosure + in-context label *(Recommended)*  
☐ Option F — Defer  
☐ Other direction: _______________

---

## OUTPUT 9 — DECISION CARD: FD-013

**Decision ID:** FD-013  
**Title:** Source Attribution — Labeling What Kind of Information Each Recommendation Is

---

**1. Plain-language explanation**  
When KinfolkAI says "Try this restaurant," members can't tell if that came from a verified business listing, a community trend, the AI's general knowledge, another member's saved places, a paid placement, or something KinfolkAI inferred. These are very different things. A sponsored placement should not look the same as a verified community favorite. This decision establishes whether and how recommendations are labeled by source type.

**2. Why this decision matters**  
Trust is the platform's primary asset. A recommendation from a community member who has been there is different from a recommendation the AI generated. Members deserve to know the difference.

**3. What exists today**  
KinfolkAI responses contain structured data fields for businesses, events, neighborhoods, and promotions. The `smartPromotion` field surfaces paid cross-sell recommendations. No field distinguishes the recommendation type in a member-facing label. Businesses from the catalog and AI-general-knowledge businesses are presented identically. Paid promotions are not labeled as such.

**4. Available options**

| Option | Description |
|---|---|
| A | Label every recommendation with a source chip: Verified Listing / Community Favorite / AI Suggestion / Sponsored |
| B | Label only sponsored and paid content — organic recommendations are unlabeled |
| C | Label the explanation, not the chip — add a "Why this?" sentence to each recommendation |
| D | Disclose at the session level ("KinfolkAI uses a mix of community data, platform listings, and AI knowledge") |
| E | Defer — no attribution labels |

**5. Replit's recommendation**  
**Option B first, then A over time.**  
Reason: Sponsored/paid placement labeling is required for trust and has legal dimensions. Labeling all source types is the right long-term standard but requires a UI design decision about where chips appear in the mobile response card.

**6. Smallest safe implementation**  
Add "Sponsored" label to the `smartPromotion` response field. Mobile renders it as a chip on the card. No AI model change needed — this is a response-field flag, not a prompt change.

**7. Launch status:** ✅ Sponsored labeling required before launch. Full source attribution: recommended post-launch.

**8. Files affected**  
- `artifacts/api-server/src/routes/kinfolk.ts` — `smartPromotion` response object, add `isSponsored: true`
- `artifacts/mobile/app/travel.tsx` — render sponsored chip in promotion card

**9. Founder selection**  
☐ Option A — Label all source types  
☐ Option B — Label sponsored/paid only first, expand later *(Recommended)*  
☐ Option C — Explanation sentence per recommendation  
☐ Option D — Session-level disclosure only  
☐ Option E — Defer  
☐ Other direction: _______________

---

## OUTPUT 10 — DECISION CARD: FD-014

**Decision ID:** FD-014  
**Title:** Smart Promotion Engine Language Correction

---

**1. Plain-language explanation**  
KinfolkAI's system prompt contains a built-in promotional engine that surfaces cross-sell recommendations based on conversation topics. For example: when a member discusses relocating, home décor businesses are surfaced. The problem is that 8 of the 9 trigger examples in the system prompt use the phrase "Black-owned" — making it the default generic framing for every member, regardless of what they've said about their preferences. This directly violates the Platform Language Rule.

**2. Why this decision matters**  
The Platform Language Rule states that "Black-owned" should only be used when the member requested it, verified business identity supports it, or the subject is specifically Black culture. Using it as the automatic default in the AI's promotional engine contradicts the platform's own stated standard.

**3. What exists today**  
In `buildSystemPrompt()` within `kinfolk.ts`, the Smart Promotion Engine examples are written as: "When discussing a move: surface Black-owned home décor," "When a baby shower is mentioned: surface Black-owned baby boutiques," etc. — across 8 of 9 cross-sell categories.

**4. What is missing**  
The language should reflect the member's support preferences (stored in `preferredOwnershipTypes` in `user_preferences`) and use generic language ("minority-owned," "community businesses," "local independent businesses") as the default, with specific language only when supported by the member's preference.

**5. Available options**

| Option | Description |
|---|---|
| A | Update all 9 Smart Promotion Engine examples to use "minority-owned" as the default |
| B | Update to pull from the member's `preferredOwnershipTypes` field dynamically |
| C | Remove ownership language from the examples entirely — let the catalog handle it |
| D | Defer — language violation persists in the system prompt |

**6. Replit's recommendation**  
**Option A first, Option B in a later wave.**  
Reason: Option A is a surgical text change. Option B requires preference injection into the promotion context (an engineering decision). A is the immediate compliance fix. B is the right long-term design.

**7. Launch status:** ✅ Required before launch (active language rule violation)

**8. Files affected**  
- `artifacts/api-server/src/routes/kinfolk.ts` — `buildSystemPrompt()` Smart Promotion Engine section

**9. Founder selection**  
☐ Option A — Update to "minority-owned" as default *(Recommended immediate)*  
☐ Option B — Dynamic preference-based language  
☐ Option C — Remove ownership language from examples  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 11 — DECISION CARD: FD-015

**Decision ID:** FD-015  
**Title:** Guest-to-Member Conversion Experience

---

**1. Plain-language explanation**  
Non-members can currently use KinfolkAI indefinitely without any invitation to create an account. There is no message count limit, no prompt to join, and no attempt to preserve a guest conversation after the member creates an account. This decision establishes when and how guests are invited to join, and whether their session should survive that transition.

**2. Why this decision matters**  
Every conversation a guest has with KinfolkAI is a demonstration of the platform's value. Letting guests leave without a conversion attempt means the platform's best ambassador — its AI — is not helping the platform grow.

**3. Available options**

| Option | Description |
|---|---|
| A | After 3 messages, invite: "Create a free account to save your plan and get personalized recommendations." |
| B | After the first recommendation, invite once and do not repeat. |
| C | After the first session ends (member closes app), send a one-time prompt if email was captured. |
| D | No invitation — guests convert on their own when ready. |

**4. Replit's recommendation**  
**Option A** — 3-message threshold, soft invite, with session preservation.  
Reason: 3 messages is enough to demonstrate value without interrupting the discovery. The invite should be ambient — not a blocking modal.

**5. Launch status:** ○ Future state (not blocking launch)

**6. Founder selection**  
☐ Option A — 3-message invite *(Recommended)*  
☐ Option B — Post-recommendation invite (once)  
☐ Option C — Post-session prompt  
☐ Option D — No invitation  
☐ Other direction: _______________

---

## OUTPUT 12 — DECISION CARD: FD-016

**Decision ID:** FD-016  
**Title:** Cultural Ambassador KinfolkAI Signals

---

**1. Plain-language explanation**  
Cultural Ambassadors are members who have agreed to represent and curate knowledge about their communities and neighborhoods. When an Ambassador opens KinfolkAI, the AI currently treats them exactly like a general Community Member — it doesn't know they are an Ambassador, can't help them create guides, and doesn't draw on their role in recommendations. This decision establishes what KinfolkAI should know about Ambassadors and what tools it should offer them.

**2. Why this decision matters**  
Ambassadors are the knowledge backbone of Mapping With Melanin™. They should be the platform's best KinfolkAI experience, not an identical one to a first-time member.

**3. Available options**

| Option | Description |
|---|---|
| A | Inject Ambassador status, guide count, and cities served into the system prompt |
| B | Surface Ambassador-specific life chips (Create a guide, Curate a heritage spot) in travel.tsx |
| C | Both A and B |
| D | Defer |

**4. Replit's recommendation**  
**Option C** — Both context injection and role-specific chips.

**5. Launch status:** ○ Future state (post-launch; no Ambassadors are using the feature in production yet)

**6. Founder selection**  
☐ Option A — Context injection only  
☐ Option B — Ambassador chips only  
☐ Option C — Both *(Recommended)*  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 13 — DECISION CARD: FD-017

**Decision ID:** FD-017  
**Title:** Prompt Governance — Who Can Change KinfolkAI's Instructions

---

**1. Plain-language explanation**  
KinfolkAI's behavior is controlled by a set of instructions built into the code (`buildSystemPrompt()` in `kinfolk.ts`). Right now, any developer can change those instructions through a normal code change. There is no review process, no founder approval gate, and no record of what changed or why. This decision establishes who has the authority to approve changes and what the process looks like.

**2. Why this decision matters**  
The system prompt controls how KinfolkAI handles cultural language, privacy, safety, recommendations, and promotion. A change to those instructions has the same impact as a policy change — but currently requires no more review than changing a button color.

**3. Available options**

| Option | Description |
|---|---|
| A | Formal written approval — every prompt change requires a written founder authorization before deployment |
| B | Founder review comment in the repository — changes are merged only after a founder-approved PR review |
| C | Document + notify — prompt changes are made by developers but a changelog is sent to the Founder for review within 24 hours |
| D | Material vs. minor distinction — material changes (safety, language, cultural, privacy) require approval; minor copy changes do not |
| E | Defer — any developer can change the prompt |

**4. Replit's recommendation**  
**Option D** — Material vs. minor distinction, with written Founder authorization for material changes.  
Reason: A full review for every comma change is operationally impractical. But safety, language, privacy, and cultural changes are policy decisions, not engineering decisions. Define "material" clearly and hold that line.

**Material changes requiring Founder approval:** any change to crisis response language, cultural voice instructions, privacy data handling, AAVE levels, community twin behavior, safety exclusions, or demographic language.

**Minor changes (log but no prior approval needed):** spelling corrections, punctuation, example reordering, tone softening that doesn't change policy.

**5. Launch status:** ✅ Required before launch (must be in place before any Wave 0 changes)

**6. Dependencies**  
FD-023 (Prompt versioning) — decide both together. FD-017 is the policy; FD-023 is the mechanism.

**7. Founder selection**  
☐ Option A — Written approval for all changes  
☐ Option B — Repository review process  
☐ Option C — Document and notify  
☐ Option D — Material vs. minor distinction *(Recommended)*  
☐ Option E — Defer  
☐ Other direction: _______________

---

## OUTPUT 14 — DECISION CARD: FD-018

**Decision ID:** FD-018  
**Title:** Life Chip Language Standard (travel.tsx)

---

**1. Plain-language explanation**  
The KinfolkAI conversational screen (`travel.tsx`) shows six starter prompts called life chips. The "Find Businesses" chip sends this message to KinfolkAI: "Help me find Black-owned businesses near me." This is a hardcoded phrase that goes to every member who taps that chip — regardless of whether they have said they want to find Black-owned businesses specifically. This decision establishes what that chip should say and send.

**2. Why this decision matters**  
Language chips are often a member's first interaction with KinfolkAI. A chip that pre-supposes a demographic preference contradicts both the Platform Language Rule and the member's autonomy over their own stated preferences.

**3. What exists today**  
`travel.tsx` line 71: `{ value: "find-businesses", prompt: "Help me find Black-owned businesses near me" }` — hardcoded, not preference-aware.

**4. Available options**

| Option | Description |
|---|---|
| A | Change to generic: "Help me find community businesses near me" |
| B | Change to preference-aware: chip reads from the member's `preferredOwnershipTypes` field dynamically |
| C | Change the chip label but keep the prompt generic ("Find local businesses" → "Help me find minority-owned and community businesses near me") |
| D | Defer |

**5. Replit's recommendation**  
**Option A first, Option B later.**  
Immediate fix: change the hardcoded phrase. Long-term improvement: make it pull from the member's stated preferences.

**6. Launch status:** ✅ Required before launch (active language rule violation in live code)

**7. Files affected**  
- `artifacts/mobile/app/travel.tsx` — LIFE_CHIPS array, line 71

**8. Founder selection**  
☐ Option A — Generic language *(Recommended immediate)*  
☐ Option B — Preference-aware dynamic language  
☐ Option C — Relabeled chip with generic prompt  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 15 — DECISION CARD: FD-019

**Decision ID:** FD-019  
**Title:** isBlackOwned Badge in Travel Planner (travel-planner.tsx)

---

**1. Plain-language explanation**  
The structured trip planner (`travel-planner.tsx`) generates a day-by-day itinerary and marks certain businesses with a "B•O" (Black-Owned) badge. This badge appears based on a `isBlackOwned` field returned in the API response — not based on whether the member asked for that framing or has Black-owned businesses in their support preferences. Every member who uses the trip planner sees the same badge on every qualifying business. This decision establishes what that badge should say and when it should appear.

**2. Why this decision matters**  
The badge applies a demographic label universally rather than by member preference or verified context. This is the same language rule violation as FD-018, but in a different screen.

**3. Available options**

| Option | Description |
|---|---|
| A | Replace with a "Community Verified" badge that applies to all verified platform businesses |
| B | Remove the badge entirely — let the business identity speak through the listing |
| C | Show the badge only to members who selected "Black-Owned" in their support preferences |
| D | Replace with "Minority-Owned" as the generic badge |
| E | Defer |

**4. Replit's recommendation**  
**Option A — "Community Verified"** as the immediate fix. Applies to businesses that are on the platform (not generic AI knowledge), without demographic assumption.  
Option C is the right long-term design but requires preference injection into the trip planner endpoint.

**5. Launch status:** ✅ Required before launch (active language rule violation in live code)

**6. Files affected**  
- `artifacts/mobile/app/travel-planner.tsx` — badge rendering at line 287
- `artifacts/api-server/src/routes/kinfolk.ts` — trip planning endpoint, `isBlackOwned` field (may be renamed or semantically reframed)

**7. Founder selection**  
☐ Option A — "Community Verified" badge for all verified businesses *(Recommended)*  
☐ Option B — Remove badge  
☐ Option C — Show only to members who selected that preference  
☐ Option D — "Minority-Owned" badge  
☐ Option E — Defer  
☐ Other direction: _______________

---

## OUTPUT 16 — DECISION CARD: FD-020

**Decision ID:** FD-020  
**Title:** Multi-Role Account Experience Design

---

**1. Plain-language explanation**  
A member can be a Community Member, a Business Owner, a Cultural Ambassador, and a Community Organizer — sometimes all at once. Right now, the platform stores which roles a member has selected (as checkboxes in profile setup) but KinfolkAI responds identically to every member regardless of their roles. A Business Owner who opens KinfolkAI sees the same experience as someone who just downloaded the app. This decision establishes how holding multiple roles changes the KinfolkAI experience.

**2. Why this decision matters**  
Role-awareness is the difference between a generic AI assistant and a platform that feels like it knows who you are and why you're here.

**3. Available options**

| Option | Description |
|---|---|
| A | KinfolkAI blends all active roles — injects context for all roles the member holds simultaneously |
| B | KinfolkAI asks "What are you using KinfolkAI for today?" at session start — member picks their active role context |
| C | Default to Community Member; member can activate another role mode manually |
| D | Most recently set role is the default context |
| E | Defer — all roles receive identical experience |

**4. Replit's recommendation**  
**Option C for launch, Option A or B as a post-launch evolution.**  
Reason: Option A (blend all roles) creates complex context injection. Option B requires in-session UI. Option C is safe — it doesn't assume, it doesn't confuse, and it provides a clear escalation path.

**5. Launch status:** ○ Future state (complex; safe to defer until role base grows)

**6. Dependencies**  
FD-021 (Role transition notification) — depends on this decision.

**7. Founder selection**  
☐ Option A — Blend all active roles  
☐ Option B — Session-start role picker  
☐ Option C — Default Community Member, manual role activation *(Recommended)*  
☐ Option D — Most recent role default  
☐ Option E — Defer  
☐ Other direction: _______________

---

## OUTPUT 17 — DECISION CARD: FD-021

**Decision ID:** FD-021  
**Title:** Role Transition Notification

---

**1. Plain-language explanation**  
When a member adds a new role (e.g., goes from Community Member to Business Owner), nothing in KinfolkAI changes — the AI doesn't know and doesn't acknowledge the transition. This decision establishes whether to notify the member that their experience has changed, and if so, how.

**2. Why this decision matters**  
If role-aware KinfolkAI is built (FD-020), members need to know something changed. Without notification, the experience improvement is invisible and the role selection feels meaningless.

**3. Available options**

| Option | Description |
|---|---|
| A | In-app notification: "Your KinfolkAI experience has been updated for your [Business Owner] role" |
| B | KinfolkAI introduces the change at the next session start |
| C | No notification — the change is apparent through the experience itself |
| D | Defer with FD-020 |

**4. Replit's recommendation**  
**Option B** — KinfolkAI acknowledges the role at session start. Natural, conversational, doesn't require a notification system. Deferred until FD-020 is implemented.

**5. Launch status:** ○ Future state (depends on FD-020)

**6. Founder selection**  
☐ Option A — Push notification  
☐ Option B — KinfolkAI session-start acknowledgment *(Recommended)*  
☐ Option C — No notification  
☐ Option D — Defer with FD-020  
☐ Other direction: _______________

---

## OUTPUT 18 — DECISION CARD: FD-022

**Decision ID:** FD-022  
**Title:** KinfolkAI Memory Viewer — Edit, Delete, Clear, and Pause Controls

---

**1. Plain-language explanation**  
The KinfolkAI memory screen (`kinfolk-memory.tsx`) shows 13 things the platform has learned about a member: favorite cities, budget range, travel companions, dietary notes, cultural interests, and more. Members can see all of this, but they cannot change any of it, delete anything, clear it all, or pause new memory collection. This decision establishes which controls to give members.

**2. Why this decision matters**  
Showing someone their data and giving them no control over it is worse than not showing it at all — it creates the impression of transparency while delivering none. Members may have shared information that is no longer accurate, that they regret sharing, or that they want removed.

**3. The 13 memory fields currently displayed:**  
favoriteCities, favoriteCategories, budgetRange, travelCompanion, tripStyle, dietaryNotes, communicationStyle, personalityMode, emojiLevel, humorLevel, culturalInterests, diasporaCountries, lifestyleServices

**4. Available options**

| Option | Description |
|---|---|
| A | Edit individual fields — member can tap a field and change its value |
| B | Delete individual fields — member can remove specific memories |
| C | Clear all memory — one action removes all 13 fields |
| D | Pause memory — stop collecting new signals without clearing what's stored |
| E | Temporary conversation mode — this session is not remembered |
| F | All of the above |
| G | Edit + Clear + Pause (A + C + D) without individual delete |

**5. Replit's recommendation**  
**Option G as immediate implementation, E and B as Wave 2.**  
Reason: Edit (A) and Clear (C) are the most common needs. Pause (D) is valuable and technically simple. Individual field deletion (B) requires more UI work. Temporary conversation mode (E) requires session-level architecture.

**6. Launch status:** ☑ Recommended before launch (members can see their data; they should be able to change it)

**7. Files affected**  
- `artifacts/mobile/app/kinfolk-memory.tsx` — add edit, clear, pause controls
- `artifacts/api-server/src/routes/kinfolk.ts` — `PUT /preferences` already exists; `DELETE /preferences/all` would be new

**8. Founder selection**  
☐ Option A — Edit only  
☐ Option B — Delete individual fields only  
☐ Option C — Clear all only  
☐ Option D — Pause only  
☐ Option E — Temporary conversation only  
☐ Option F — All controls  
☐ Option G — Edit + Clear + Pause *(Recommended)*  
☐ Other direction: _______________

---

## OUTPUT 19 — DECISION CARD: FD-023

**Decision ID:** FD-023  
**Title:** Prompt Versioning Gate — Mechanism for Tracking and Approving System Prompt Changes

---

**1. Plain-language explanation**  
FD-017 decides WHO can approve prompt changes. FD-023 decides HOW those changes are tracked. Right now, if the system prompt changes, there is no version number, no changelog, no audit trail. A future developer cannot tell what the prompt said three months ago or why it was changed.

**2. Why this decision matters**  
The system prompt is the AI's policy document. It should be versioned like policy, not changed like code.

**3. Available options**

| Option | Description |
|---|---|
| A | Version number constant in kinfolk.ts (e.g., `PROMPT_VERSION = "2.1"`) + PROMPT_CHANGELOG.md in docs/ |
| B | Separate prompt document (markdown) that developers must update before changing kinfolk.ts |
| C | Both A and B — version constant in code + document |
| D | Defer |

**4. Replit's recommendation**  
**Option C** — Version constant in code + PROMPT_CHANGELOG.md. The constant makes the version machine-readable and loggable. The markdown document makes it human-readable and auditable.

**5. Launch status:** ✅ Required before launch (should be in place before any Wave 0 prompt changes)

**6. Files affected**  
- `artifacts/api-server/src/routes/kinfolk.ts` — add `PROMPT_VERSION` constant
- `docs/product/kinfolk-ai/PROMPT_CHANGELOG.md` — new file

**7. Founder selection**  
☐ Option A — Version constant + changelog doc *(Recommended)*  
☐ Option B — Separate prompt document only  
☐ Option C — Both  
☐ Option D — Defer  
☐ Other direction: _______________

---

## OUTPUT 20 — DECISION CARD: FD-024

**Decision ID:** FD-024  
**Title:** Anti-Addiction Metrics Standard

---

**1. Plain-language explanation**  
KinfolkAI could be optimized to keep members in the app as long as possible — showing more suggestions, sending more notifications, finding more reasons to re-engage. This is how most AI platforms are measured. This decision establishes that Mapping With Melanin™ will not measure KinfolkAI success by how long members spend in it or how often they return — but by whether KinfolkAI helped them accomplish something real.

**2. Why this decision matters**  
The platform's mission is belonging, community, safety, and opportunity — not screen time. If the platform is optimized for engagement, its AI will start to optimize for engagement, not for outcomes. The difference is significant for communities that are already over-targeted by engagement-optimizing platforms.

**3. What this decision authorizes**

PRIMARY metrics KinfolkAI should be measured by:
- Member-stated goal completion (did the conversation help them accomplish what they came for?)
- Places visited after a KinfolkAI recommendation
- Businesses supported (check-ins, reviews, saves, purchases)
- Safety events reported
- Connections made (circles formed, mentors found, events attended)

PROHIBITED as primary KPIs:
- Session length
- Messages per session
- Daily active sessions
- Push notification open rate
- Re-engagement rate (how fast members come back)

**4. Why prohibition matters**  
If the team is measured on engagement, every product decision — notification frequency, suggestion length, conversation continuation — will drift toward maximizing engagement. Making this explicit from the beginning prevents that drift.

**5. Replit's recommendation**  
Adopt the metric standard as stated. Add it to the platform's internal product principles document. When KinfolkAI analytics are built (none exist currently), build them around outcome metrics, not engagement metrics.

**6. Launch status:** ○ Future state (no analytics infrastructure exists yet; this informs future decisions)

**7. Founder selection**  
☐ Adopt the metrics standard as stated  
☐ Adopt with modifications: _______________  
☐ Defer until analytics infrastructure is planned  
☐ Other direction: _______________

---

## OUTPUT 21 — TWO KINFOLK MOBILE EXPERIENCES

### The Two Interfaces

**travel.tsx — The KinfolkAI Conversational COS (1,903 lines)**  
This is the full KinfolkAI experience. Members type conversationally, KinfolkAI responds with structured recommendation cards, the session is saved to memory, voice preferences are applied, life chips suggest starting points, and the TTS "Listen" button reads responses aloud. This is the platform's flagship AI interface.

**travel-planner.tsx — The Structured Trip Planner (390 lines)**  
This is a form-based tool. Members select a destination (text), duration (3/5/7/10 days), travel style (budget/balanced/luxury), and interests (8 checkboxes). KinfolkAI generates a structured day-by-day itinerary. Memory is not injected. Voice mode is not applied. It is a one-shot generator, not a conversation.

### How Members Reach Each

Both are accessible from the mobile app — the tab structure determines which is primary. Based on the screen file location (`travel.tsx` in the root app directory and `travel-planner.tsx` as a separate screen), `travel.tsx` is the tab-based primary experience and `travel-planner.tsx` is accessed as a secondary screen (likely from a "Plan a Trip" button within `travel.tsx` or the map tab).

### Are They Clearly Differentiated to Members?

No. Both are labeled as KinfolkAI experiences. The distinction between a conversational AI and a structured form is clear to a developer but likely invisible to a first-time member. A member might use the trip planner first and then be confused when the conversational screen feels different.

### Should They Be Connected?

Yes — the trip planner should eventually be a mode within the KinfolkAI conversation, not a separate screen. A member could say "plan me a trip to Atlanta" and KinfolkAI would either (a) initiate a structured form inline, or (b) ask the same clarifying questions conversationally and generate the itinerary at the end.

### Risks of Maintaining Two Disconnected Systems
- The trip planner has the language violation (isBlackOwned badge) but the conversational screen does not — fixing one without the other creates inconsistency
- Trip planner generates itineraries without memory injection, producing recommendations that contradict the member's stated preferences in the conversational system
- Two systems must both be updated when platform features change (new business categories, safety data, etc.)
- Members may perceive the trip planner as a weaker, older product

### Recommended Future Relationship
The trip planner should become a tool mode within `travel.tsx` — accessible via a life chip ("Plan a trip for me") or a "Trip Mode" button. The structured form inputs (destination, duration, style, interests) should pre-populate from the member's known preferences, with the member confirming or adjusting them. Until that integration is built, the two screens should at minimum share language standards and apply member preferences equally.

### Unique Capabilities to Preserve
The trip planner generates a structured multi-day itinerary in a format the conversational interface does not — a clean day-by-day view with themes and activities. This format should be preserved as a response type within the conversational system, not eliminated.

---

## OUTPUT 22 — ONBOARDING AND PROGRESSIVE PERSONALIZATION RECOMMENDATION

### What Currently Happens

**Onboarding (5 screens, pre-account):**  
Welcome → Safety Introduction → KinfolkAI Introduction → Identity ("Who do you want to support?" — 10 preference options) → Join

**Profile Setup (4 screens, post-signup):**  
Home City → Role Selection → Interests (12 categories) → Privacy Toggles

**KinfolkOnboarding (5 steps, before first KinfolkAI conversation):**  
Role/context → Destinations → Vibes → Budget → Lifestyle services

**Gap:** No consent statement exists at the moment preferences are collected. No "prefer not to say" option exists. No explanation of how preferences affect KinfolkAI.

---

### Recommended First-Session Question Sets by Role

**All roles — Minimal required questions (onboarding/identity.tsx):**

| Question | Options | Required | Why | How it affects KinfolkAI |
|---|---|---|---|---|
| Who do you want to support? | Black-Owned, Minority-Owned, Women-Owned, Veteran-Owned, LGBTQ+-Owned, Hispanic-Owned, Indigenous-Owned, Melanated Diaspora-Owned, D9 Affiliated, Disability-Owned, Prefer not to say | Optional | Sets community alignment | Filters recommendation language and business suggestions |
| Where do you call home? | City picker | Optional | Establishes home context | Used for "back home" recommendations and Cultural Twin matching |

**Consent language (required, not optional):**  
"These preferences help KinfolkAI give you more relevant recommendations. You can update or remove them anytime in your settings. Choosing 'Prefer not to say' or skipping is always fine."

---

**Community Member — First KinfolkAI session (KinfolkOnboarding):**

| Question | Options | Required | Why |
|---|---|---|---|
| What brings you here? | Discover local favorites / Plan a trip / Find community / Get safety info / Support businesses / All of these | Optional | Sets the session intent context |
| What kinds of places do you love? | 12 interest categories (multi-select) | Optional | Builds Vibe DNA baseline |
| How would you like me to talk to you? | Warm and conversational / Direct and efficient / Local community voice / Formal and clear | Optional | Sets voice mode |
| How much personalization would you like? | Learn from my conversations / Use only what I tell you / No personalization | Optional | Maps to `kinfolkMemoryEnabled` and `personalisedSuggestions` |

---

**Business Owner — Post-signup profile questions (profile-setup.tsx, Step 2):**

| Question | Options | Required | Why |
|---|---|---|---|
| What kind of business do you have? | Food & drink / Retail / Service / Creative / Health & wellness / Professional / Other | Optional | Informs business context injection |
| Where is your business located? | City picker | Optional | Links to business listing |
| What's your biggest goal right now? | Get discovered / Connect with suppliers / Find employees / Host events / Learn from others | Optional | Focuses KinfolkAI business mode |

---

**Cultural Ambassador — Post-designation questions:**

| Question | Options | Required | Why |
|---|---|---|---|
| Which neighborhoods or cities do you represent? | City/neighborhood picker | Optional | Defines guide territory |
| What kinds of places do you like to curate? | Heritage sites / Local favorites / Community gathering spots / Food / Culture / All | Optional | Shapes guide creation context |
| Would you like KinfolkAI to help you create guides? | Yes, actively / Yes, when I ask / No, I'll create them manually | Optional | Activates/deactivates Ambassador mode |

---

**Community Organization — Post-designation questions:**

| Question | Options | Required | Why |
|---|---|---|---|
| Who does your organization serve? | Youth / Elders / Families / Entrepreneurs / Artists / Veterans / Disability community / LGBTQ+ community / Immigrants / General community | Optional | Context for resource matching |
| What services or programs do you offer? | Free text | Optional | Feeds KinfolkAI awareness |
| What's your primary goal on the platform? | Promote events / Connect with members / Share resources / Find volunteers / All | Optional | Focuses org mode |

---

### Progressive Personalization Principles
1. Never collect more than needed for the current session
2. Every preference has a "prefer not to say" or skip option
3. Consent language is present at every preference collection point
4. Every preference can be edited in settings
5. Opting out of personalization is as visible as opting in

---

## OUTPUT 23 — MEMORY AND TRANSPARENCY RECOMMENDATION

### What KinfolkAI Currently Knows About a Member (13 fields)

| Field | Source | Affects |
|---|---|---|
| favoriteCities | KinfolkOnboarding, conversation | Destination recommendations |
| favoriteCategories | KinfolkOnboarding, interests | Business and event recs |
| budgetRange | KinfolkOnboarding | Price filtering |
| travelCompanion | KinfolkOnboarding | Trip planning tone |
| tripStyle | KinfolkOnboarding | Itinerary style |
| dietaryNotes | KinfolkOnboarding | Restaurant recs |
| communicationStyle | kinfolk-settings | Response style |
| personalityMode | kinfolk-settings | Voice mode |
| emojiLevel | kinfolk-settings | Response formatting |
| humorLevel | kinfolk-settings | Conversational tone |
| culturalInterests | Profile setup | Cultural voice context |
| diasporaCountries | Onboarding identity | Heritage context |
| lifestyleServices | KinfolkOnboarding step 5 | Cross-sell categories |

---

### Recommended "What KinfolkAI Knows About Me" Experience

Each field should show:
- **What it stores:** plain-language description of the value
- **Why it's stored:** one sentence
- **Where it came from:** "From your preferences" / "Learned from your conversations" / "You told me during setup"
- **How it affects recommendations:** one sentence
- **Control:** Edit button / Delete this field / Clear all / Pause

**Memory controls to build:**
- Edit individual field — opens a simple picker or text input
- Delete one field — removes the value, confirms with member
- Clear all memory — removes all 13 fields and conversation history, confirms with member
- Pause memory — new conversations are not saved; existing memory is preserved
- Temporary conversation — this conversation is not saved to any memory field (session-level flag)

**Conversation history controls:**
- View sessions (list of past conversations with date and title)
- Delete one session
- Delete all sessions
- Note: deleting sessions does not clear preference fields, and vice versa

**What KinfolkAI must not remember:**
- Health conditions (beyond dietary notes if member provides them)
- Financial details beyond budget range
- Legal situations
- Crisis conversation content (what was said in a crisis block)
- Private message content
- Kinfolk Circle private discussion

---

## OUTPUT 24 — CULTURAL VOICE RECOMMENDATION

### The Five Voice Contexts

**Standard (default):**  
Plain, warm, helpful English. No slang. No cultural vocabulary. Safe for every context and every member. Always used in: emergencies, crisis blocks, safety incidents, legal and medical information, account security notices, moderation actions.

**Warm Conversational (Community mode):**  
Acknowledges emotional context before recommendations. Slightly informal. Celebrates accomplishment. Asks one personal follow-up when appropriate. Never assumes cultural background.

**Local City Voice:**  
City-specific vocabulary, neighborhood names, cultural touchstones, local humor and references for 37 cities in the CITY_VOICES registry. Activated only when: (a) the member has selected "Local City Voice" in settings AND (b) the conversation topic involves that city.

**Home Voice:**  
Assembled from the member's stored preferences: communicationStyle + emojiLevel + humorLevel. This is a personalized blend, not a cultural assumption. Member-controlled through settings.

**AAVE Cultural Voice (4 levels):**  
Level 0: Standard English with cultural awareness (default)
Level 1: Warm community vocabulary, cultural affirmations
Level 2: Community-specific phrases and rhythm
Level 3: Full community voice with AAVE vocabulary

**Critical rule:** Voice is NEVER inferred from the member's name, photo, location, or behavioral patterns. Voice is only what the member explicitly chose. If a member changes their voice preference, KinfolkAI must apply the new preference immediately and never revert.

### Where Cultural Voice Must Be Disabled
In the following contexts, KinfolkAI must use standard English regardless of the member's voice setting:
- Active crisis or distress signal (use crisis block language)
- Safety incidents and emergency guidance
- Legal information ("consult a lawyer" language must be clear)
- Medical information ("consult a doctor" language must be clear)
- Child safety situations
- Account security and billing notices
- Moderation warnings and account actions

---

## OUTPUT 25 — COMMUNITY TWINS RECOMMENDATION

### What the System Does Now

Community Twin Intelligence is an algorithmic system built into `kinfolk.ts` that:
1. Identifies members with overlapping saved-places profiles ("taste twins")
2. Injects their saved businesses as recommendation signals in the system prompt
3. Does not tell the recommending member that their saves contributed
4. Does not tell the receiving member that community behavior influenced the recommendation
5. Has no disclosure, no opt-in, no opt-out

### What Members Should Know
Every member should be able to read a plain explanation: "KinfolkAI learns from the community. When many members with similar tastes save the same places, those places become stronger recommendations for others — without sharing your identity or individual choices."

### Recommended Design
- **Disclosure:** In the KinfolkAI settings screen, a "How KinfolkAI Makes Recommendations" section that explains Community Twins in plain language
- **Opt-out:** A toggle: "Let my saved places help personalize recommendations for other members" (default: on)
- **Attribution in conversation:** When a Community Twin signal is the primary reason for a recommendation: "This place is loved by members who share your taste in [category]"
- **No identity exposure:** Matches are never shown individual profiles; aggregate signal only
- **Minimum threshold:** The system should require a minimum of 5 members matching before "community signal" language is used (prevents a single person's behavior from being labeled "community")
- **Filter bubble prevention:** Community Twins should not be the only signal — catalog and vibe DNA must always contribute. A member should not only see what their "twins" liked.
- **Sensitive inference prevention:** Community Twin matching should not expose sensitive inferences (e.g., if a member's twins cluster around healthcare or legal resources, the AI should not surfaced that signal as "members like you")

---

## OUTPUT 26 — SOURCE ATTRIBUTION AND PROMOTION RECOMMENDATION

### The Seven Source Types That Should Be Labeled

| Source | Plain Label | What It Means |
|---|---|---|
| Verified platform listing | "On the Platform" | Business is registered and has been reviewed |
| Official public source | "Public Record" | City website, official registry, government source |
| Community contribution | "Member Reported" | A community member added or updated this information |
| Aggregated community signal | "Community Favorite" | Many members have saved or visited this place |
| Cultural Ambassador perspective | "Ambassador Pick" | A designated Ambassador added or curated this |
| KinfolkAI inference | "AI Suggestion" | KinfolkAI generated this from general knowledge — not from platform data |
| Sponsored placement | "Sponsored" | This business paid for placement in this context |

### How Sponsored Businesses Should Work
Sponsored businesses CAN appear in recommendation results. They CANNOT be:
- Presented as the safest, most trusted, or most community-verified option
- Ranked above non-sponsored businesses purely on the basis of payment
- Unlabeled
- In a position that implies community endorsement they didn't earn

Sponsored businesses SHOULD be:
- Clearly labeled "Sponsored" on every card where they appear
- Eligible for organic ranking on their own merits in addition to the paid placement
- Required to meet the same platform standards (verification, content, language) as organic listings

---

## OUTPUT 27 — CRISIS AND SAFETY RECOMMENDATION

### Signal Categories and Recommended Responses

**Immediate emergency (someone is in danger right now):**
> "Your safety matters more than this conversation. If you're in immediate danger, please call 911 or text 911 if you can't speak safely. I'll be here when you're safe."
KinfolkAI must not continue with a recommendation after this message until the member explicitly indicates they are safe.

**Self-harm concern:**
> "I hear you, and I'm glad you reached out. KinfolkAI isn't the right resource for what you're going through — but the right people are ready to help. Text HOME to 741741 (Crisis Text Line) or call/text 988 anytime. You deserve real support."

**Domestic violence concern:**
> "What you're describing sounds serious, and you don't have to handle it alone. The National Domestic Violence Hotline is available 24/7: call 1-800-799-7233 or text START to 88788. They can help you think through your options confidentially."

**Child safety concern:**
> "If a child is in danger, please call 911 immediately. The Childhelp National Child Abuse Hotline is also available: 1-800-422-4453."

**General emotional distress (not a crisis):**
> "That sounds really hard. I'm here to help you navigate things — and I want to make sure you have what you need. Would it help to find a community resource, a space to connect with others, or just to talk through what you're looking for?"

**Legal question:**
> "I can help you find community resources and referrals, but I'm not a legal advisor and anything I say shouldn't be taken as legal advice. For legal help, I can look for local legal aid organizations — want me to?"

**Medical question:**
> "I can help you find minority-serving healthcare providers in your area, but I'm not a medical resource and I can't give health advice. Want me to search for culturally affirming healthcare near you?"

**Stale safety information:**
> "This safety score is based on community reports from [date range]. For the most current picture, you can check recent reports or submit a survey if you've been to this area recently."

**What KinfolkAI must never do in a safety situation:**
- Continue with a recommendation after a clear crisis signal without acknowledgment
- Provide specific medical diagnoses or prescriptions
- Provide specific legal advice or predict legal outcomes
- Promise anonymity or confidentiality it cannot guarantee
- Encourage a member in an unsafe situation to stay

---

## OUTPUT 28 — FEATURE FLAG AND PILOT RECOMMENDATION

### Why Feature Flags Are Needed Now

KinfolkAI has no way to:
- Release a new capability to 10 users before 100,000
- Roll back a prompt change without a full code deployment
- Test a new AAVE level with one city before applying it nationally
- Shut down a specific capability without taking down KinfolkAI entirely

Before Wave 1 KinfolkAI development begins, a minimum feature-flag capability should exist.

### Recommended Minimum Feature Flag Architecture

**Implementation:** A `featureFlags` object in `kinfolk.ts` loaded from environment variables or a simple config table. No external service required initially.

**Minimum flags needed:**

| Flag | Controls | Default |
|---|---|---|
| `crisis_block_enabled` | Whether crisis detection runs | true |
| `community_twins_enabled` | Whether Community Twin signals are injected | true |
| `smart_promotion_enabled` | Whether the Smart Promotion Engine runs | true |
| `tts_enabled` | Whether TTS (Listen button) is available | true |
| `aave_voice_enabled` | Whether AAVE levels above 0 are respected | true |
| `session_deletion_enabled` | Whether delete routes are active | false (until built) |

**Pilot groups:**
- Founder account: receives all experimental features
- Internal staff list: receives features in testing before general release
- Role-based pilot: e.g., Trailblazer members get a new feature before Navigator/Free
- Percentage rollout: support for "release to 10% of users" (requires a random hash on userId)

**Emergency shutoff:** Any flag set to false immediately removes that capability for all users without a deployment. This is the rollback mechanism.

**Audit logging:** Every KinfolkAI session should log `PROMPT_VERSION` so that if a prompt change causes issues, the affected sessions can be identified.

**Model rollback:** If OpenAI changes GPT-4o behavior, the model name should be a config constant — not hardcoded — so it can be reverted without a code change.

---

## OUTPUT 29 — PROPOSED BUILD 97 BOUNDARIES

### What Should Be in Build 97

Build 97 is not a KinfolkAI build. It is a platform build that may include a small number of surgical KinfolkAI fixes where they are required for safety or language compliance.

**Platform priorities that belong in Build 97 (not KinfolkAI):**
- Maps and Heritage — Option C (cultural-heritage.tsx entry from map tab, pending AUDIT-006)
- Language audit corrections from AUDIT-003 findings H-001 through H-004
- Community Member signup/onboarding improvements identified in AUDIT-004

**KinfolkAI items that may be included in Build 97 — only if Founder authorizes:**
- FD-008: Crisis intervention block (server-side only, no mobile UI change, surgical)
- FD-014: Smart Promotion Engine language correction (one server-side text change)
- FD-017 + FD-023: Prompt versioning constant and PROMPT_CHANGELOG.md (documentation + one constant)

**KinfolkAI items that should NOT be in Build 97:**
- FD-009 (session deletion — requires new routes and UI)
- FD-010 (AAVE UI — requires onboarding and settings changes)
- FD-012 (Community Twin consent — requires settings UI)
- FD-013 (Source attribution — requires UI design decision)
- FD-015 (Guest conversion — not urgent)
- FD-016 (Ambassador mode — not urgent)
- FD-018 (Life chip language — language correction, but requires mobile UI change)
- FD-019 (isBlackOwned badge — requires mobile UI change)
- FD-020 (Multi-role — complex, post-launch)
- FD-022 (Memory controls — requires UI work)
- Any KinfolkAI wave implementation

**Note on FD-018 and FD-019:** These are language violations in live mobile code. They are small changes (a text string and a badge label), but they require a new App Store build. They should be prioritized for Build 97 if the Founder agrees.

---

## OUTPUT 30 — WORK EXPLICITLY DEFERRED BEYOND BUILD 97

| Item | Reason for Deferral |
|---|---|
| FD-015: Guest conversion | Not launch-critical; guest experience is functional |
| FD-016: Ambassador AI mode | No active Ambassadors using it in production yet |
| FD-020: Multi-role experience | Complex; safe to wait until role base grows |
| FD-021: Role transition notification | Depends on FD-020 |
| FD-024: Anti-addiction metrics | No analytics infrastructure yet; informs future decisions |
| Wave 2–5 KinfolkAI implementation | Requires Founder decisions and feature flag infrastructure first |
| Full source attribution (all 7 types) | Sponsored labeling is Build 97; full attribution is Wave 3 |
| Community Twins opt-out UI | Important but not launch-blocking; Wave 2 |
| Conversational quality examples testing | Ongoing QA process, not a build item |

---

## OUTPUT 31 — FOUNDER SELECTION SUMMARY

Use this form to record your decisions. Return completed decisions with "Please implement." for any cluster you are ready to authorize.

```
KINFOLKAI FOUNDER DECISION SUMMARY
Date: _______________

PRIORITY 1 — PROTECT PEOPLE
FD-008  Crisis Response:          ☐ A  ☐ B*  ☐ C  ☐ D  Other: ___
FD-017  Prompt Governance:        ☐ A  ☐ B  ☐ C  ☐ D*  ☐ E  Other: ___
FD-023  Prompt Versioning:        ☐ A*  ☐ B  ☐ C  ☐ D  Other: ___

PRIORITY 2 — HONOR MEMBER TRUST
FD-009  Session Deletion:         ☐ A  ☐ B  ☐ C*  ☐ D  Other: ___
FD-022  Memory Controls:          ☐ A  ☐ B  ☐ C  ☐ D  ☐ E  ☐ F  ☐ G*  Other: ___
FD-012  Community Twin Consent:   ☐ A  ☐ B  ☐ C  ☐ D  ☐ E*  ☐ F  Other: ___

PRIORITY 3 — LANGUAGE CORRECTIONS
FD-014  Smart Promo Language:     ☐ A*  ☐ B  ☐ C  ☐ D  Other: ___
FD-018  Life Chip Language:       ☐ A*  ☐ B  ☐ C  ☐ D  Other: ___
FD-019  isBlackOwned Badge:       ☐ A*  ☐ B  ☐ C  ☐ D  ☐ E  Other: ___

PRIORITY 4 — TRANSPARENCY
FD-013  Source Attribution:       ☐ A  ☐ B*  ☐ C  ☐ D  ☐ E  Other: ___

PRIORITY 5 — CULTURAL VOICE
FD-010  AAVE Voice UI:            ☐ A  ☐ B  ☐ C  ☐ D*  ☐ E  Other: ___
FD-011  City Voice Activation:    ☐ A  ☐ B  ☐ C  ☐ D  ☐ E*  Other: ___

PRIORITY 6 — GROWTH AND EXPERIENCE
FD-015  Guest Conversion:         ☐ A*  ☐ B  ☐ C  ☐ D  Other: ___
FD-016  Ambassador AI Signals:    ☐ A  ☐ B  ☐ C*  ☐ D  Other: ___
FD-024  Anti-Addiction Metrics:   ☐ Adopt  ☐ Adopt with modifications  ☐ Defer  Other: ___

PRIORITY 7 — ROLE ARCHITECTURE
FD-020  Multi-Role Experience:    ☐ A  ☐ B  ☐ C*  ☐ D  ☐ E  Other: ___
FD-021  Role Transition Notice:   ☐ A  ☐ B*  ☐ C  ☐ D  Other: ___

* = Replit's recommendation
```

---

## OUTPUT 32 — CONFIRMATION THAT NO IMPLEMENTATION OCCURRED

No code, schema, routes, prompts, screens, settings, documentation statuses, or production data were modified during the preparation of this Founder Decision Packet.

AUDIT-005A and AUDIT-005B are complete and accurate.

This packet presents decisions for Founder review. It does not make decisions on behalf of the Founder. No implementation wave may begin until the Founder has reviewed the relevant decisions and issued the authorization phrase: **"Please implement."**

Build 96 remains under Apple review. No mobile code changes of any kind should be initiated until Build 96 has cleared review, regardless of Founder decision timing on these items.
