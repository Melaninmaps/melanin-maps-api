---
name: Adaptive Depth — incomplete wiring
description: answerPlanId in kinfolk chat response is currently always null; kinfolk_answer_plans INSERT not yet wired into the chat handler.
---

# Adaptive Depth — Incomplete Wiring

**The rule:** `answerPlanId` returned by `/api/kinfolk/chat` is currently hardcoded to `null`.  
The `kinfolk_answer_plans` table was created in startup migrations (Aug 13 2026) but the INSERT
inside the chat handler was not implemented — the depth endpoint exists and records feedback,
but cannot look up the plan domain class without a real plan row.

**Why:** The full plan storage requires serialising the ConsensusAnswerPlan before responding,
which requires wiring `composeAudienceAwareAnswer()` into the chat path — that was deferred
to keep the session focused on the safety-critical P0 items.

**How to apply:**
1. After the `rawContent` parse block in `/api/kinfolk/chat`, derive `domainClass` from `intentClass`.
2. INSERT a `kinfolk_answer_plans` row with `expires_at = now() + interval '7 days'`.
3. Include the returned UUID as `answerPlanId` in the response JSON.
4. The depth PATCH endpoint already reads domain_class from this row — it will work once rows exist.

**Until this is done:** Show more / Show less buttons render in the UI but depth events are 404
(plan not found), so learning never fires. The UI optimistic update still works correctly for the user.
