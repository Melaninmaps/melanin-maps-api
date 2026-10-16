# Kinfolk Four-Persona Implementation Handoff — 2026-10-15

## Status

**SOURCE COMPLETE / READY FOR CUMULATIVE INTEGRATION / AWAITING RELEASE AUTHORIZATION**

This handoff covers a focused Kinfolk source correction only. No deployment, migration, production-data change, account change, browser operation, or mobile build was performed.

## Implemented behavior

### One shared four-persona contract

`artifacts/api-server/src/kinfolk/conversation-mode.ts` now owns a structured presentation contract for all persisted Kinfolk voices:

| Persisted mode | Member-facing voice | Distinct response behavior |
|---|---|---|
| `community` | Just Big Cousin | Plain-language answer, real-life implication, and one sensible next move. Avoids academic framing, a manager-style plan, and long checklists. |
| `professor` | Professor | Direct answer followed by visible **What / Why or How / So What** teaching logic, evidence distinctions, and historical context. |
| `business_manager` | Business Manager | Objective or recommendation first; then priorities, options or trade-offs, risks, and an executable next action. Personal situations retain a humane acknowledgment. |
| `best_friend` | Best Friend | Natural response to the member’s current feeling or curiosity; candid conversational support; two or three most helpful thoughts rather than a roadmap or exhaustive checklist unless the member explicitly asks for one. |

The shared persona contract explicitly changes **presentation only**—structure, cadence, depth, examples, emotional responsiveness, and follow-up behavior. It does **not** alter factual standards, safety, privacy, consent, memory, directory/tool access, or the answer to the member’s current request.

### Prompt precedence correction

The full Kinfolk prompt previously stated that every answer should sound like a Big Cousin. That generic statement has been made voice-neutral and now defers to the selected Kinfolk Voice. The selected persona instruction remains later in prompt assembly, so it is the authoritative ordinary-response presentation contract.

The lean general-chat path and the full contextual path use the same shared conversation-mode builder.

### Historical context safeguard

Every persona now receives the same historical-context rule for questions involving enslavement, resistance, political violence, or legacy: preserve systems of power, reasons for resistance, retaliation and consequences for affected Black communities, and material historical debate. Do not reduce the topic to a casualty count or blur fact with interpretation.

### Cross-platform persistence correction

The native `useKinfolk` hook no longer injects `voiceMode: "community"` when a caller did not explicitly request a temporary conversational style. It now omits the mode, allowing the API’s existing saved-preference logic to apply the member’s persisted selection. Explicit per-turn mode requests still override only that request; the server remains the persistence authority.

Web and native settings, existing preference API behavior, text-to-speech labels, and voice-delivery provider identities remain unchanged.

## Required acceptance questions covered

The response matrix used one fresh context per voice for every question:

1. Who was Nat Turner, and why is he still important today?
2. I have $500 saved and owe $1,200 on my credit card. What should I do?
3. My boss keeps taking credit for my work. How should I handle it?
4. I’m moving to Houston and don’t know anybody. Where should I start?
5. My 15-year-old says they don’t fit in at school. What should I say?
6. I want to start a cleaning business with $1,000. Is that realistic?

### Sample: history question

> **Big Cousin:** “Nat Turner was an enslaved Black preacher and leader who organized and carried out a violent slave rebellion in Southampton County, Virginia, in August 1831… Why he matters today is bigger than the rebellion itself: it exposed the fear slavery created, the violence used to preserve it, and the determination of enslaved people to resist it.”

> **Professor:** “Nat Turner was an enslaved Black preacher and insurrection leader in Southampton County, Virginia, who led a violent slave rebellion in August 1831… **Why / how it mattered:** the revolt exposed a core contradiction in slavery… **So what:** Turner remains important because the event is a lens on resistance, state power, historical memory, and debates about violence and liberation.”

> **Business Manager:** “Answer first: Nat Turner was an enslaved Black preacher in Southampton County, Virginia, who led a large, armed slave rebellion in August 1831… **Priority:** Give a concise factual summary, then explain short- and long-term impact… **Recommended takeaway:** Treat Turner as central to understanding how slavery produced resistance…”

> **Best Friend:** “Nat Turner was an enslaved Black preacher in Southampton County, Virginia, who led a violent uprising… Why he still matters is complicated and worth sitting with: his story asks us to face the brutality of slavery, the ways people resisted it, and the costs that resistance could bring to whole communities.”

All four retained the same historical core: enslavement, resistance, retaliation, consequences for Black communities, and historical complexity.

### Sample: parenting question

> **Big Cousin:** “Start by listening first—calmly, fully, and without trying to fix things right away… After they’ve said what they need, offer one concrete, low-pressure option and one practical step.”

> **Professor:** “Start by listening without fixing… **Why this works:** Adolescents often want their feelings acknowledged before they can think about solutions; validation reduces shame and makes problem-solving more possible.”

> **Business Manager:** “**Objective:** Help your teen feel heard, reduce immediate distress, and open a path to practical support. **Priority—what to say right now:** Validate first… **Risk:** Overreacting can make them withdraw.”

> **Best Friend:** “That’s painful to hear—you’re already doing something important by asking how to respond. Start by creating space… Teens often need someone to witness their experience before advice feels useful.”

The required safety boundary remains intact: concern about bullying, withdrawal, self-harm, or escalating distress is surfaced as a support/escalation cue rather than minimized.

## Blind differentiation result

- **Response generation:** 24 fresh-context answers (six questions × four personas).
- **Blinded identification:** answers were randomized within each question and judged without persona labels against fixed presentation rubrics.
- **Result:** **22 / 24 correct — 91.7%**, above the required 80% threshold.
- The two misses were the intentionally adjacent Big Cousin and Best Friend presentations on the sensitive parenting question; all four answers remained judged as distinct and safety-compatible.

### Evaluation model boundary

The source tree’s sandbox fallback is `gpt-4o-mini`, which is not present in the live Manus proxy catalog available for this source-only validation. The live response matrix therefore used catalog-supported `gpt-5-mini` with the exact shared lean Kinfolk prompt and fresh persona context. No production-model configuration was changed. Before release, run the same six-question matrix through the actual deployment-configured Kinfolk model in the approved staging environment and record the outputs in the cumulative release evidence.

## Automated regression evidence

### API/server

```bash
cd artifacts/api-server
pnpm exec vitest run \
  src/kinfolk/__tests__/conversation-mode.test.ts \
  src/kinfolk/__tests__/persona-differentiation.test.ts \
  src/kinfolk/__tests__/lean-general-chat.test.ts \
  src/kinfolk/__tests__/voice-delivery.test.ts \
  src/kinfolk/__tests__/voice-personalization.test.ts \
  src/__tests__/kinfolk-server-voice-contract.test.ts \
  src/kinfolk/__tests__/kinfolk-chat-and-preferences.api.test.ts
pnpm typecheck
```

**Result:** 7 files passed, 45 tests passed; API typecheck passed.

### Native/mobile

```bash
cd artifacts/mobile
pnpm exec vitest run \
  __tests__/kinfolk-mode-persistence.test.ts \
  __tests__/kinfolk-preference-attainability.test.ts \
  __tests__/kinfolk-audit-repairs.test.ts
pnpm typecheck
```

**Result:** 3 files passed, 17 tests passed; native typecheck passed.

### Web

```bash
cd artifacts/web
pnpm exec vitest run \
  src/__tests__/kinfolk-audit-repairs.test.ts \
  src/__tests__/kinfolk-preference-attainability.test.ts
pnpm typecheck
```

**Result:** 2 files passed, 8 tests passed; web typecheck passed.

## Cumulative integration instructions

1. Confirm the source commit is not already present in the authoritative Kinfolk candidate.
2. Controlled cherry-pick or merge only; do not duplicate the shared contract or overwrite completed Directory, Map, owner-dashboard, taxonomy, Black-capitalization, or other Kinfolk repairs.
3. Preserve the existing saved preference API, enum values, temporary request override, TTS provider configuration, privacy/memory policies, and navigation.
4. Re-run the three focused test groups above after integration.
5. Re-run the six-question staging matrix against the deployment-configured model before release evidence is finalized.
6. Include the Web source in the next authorized deployment and native source in the next consolidated mobile build. Do **not** make a standalone mobile build for this change.

## Explicitly out of scope and untouched

- Database schema, migrations, and production data
- Saved preference data and enums
- Ownership, Directory, Map, taxonomy, and verification rules
- Authentication, subscriptions, permissions, memory/privacy behavior, and navigation
- Deployment configuration, runtime secrets, release state, production deployment, and mobile builds
