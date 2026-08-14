---
name: KinfolkAI recommendations TDZ fix
description: let recommendations declared after recsAlreadyHaveBusinesses reference — TDZ crash for no_entity queries
---

## Rule
`let recommendations` must be declared BEFORE the nudge section (`recsAlreadyHaveBusinesses` at ~line 2653).
It is currently hoisted above the outer `try` block, initialized to `null`, and reassigned after the AI response parse.

## Why
JavaScript temporal dead zone: `let`/`const` are hoisted but not initialized until the declaration line is reached.
`recsAlreadyHaveBusinesses` referenced `recommendations` while `chatStage = "session_read"` (before the declaration).
Any query whose `contextResolution.responseMode = "no_entity"` (i.e., no short-circuit return before the nudge section) hit the TDZ.
Named-entity queries that trigger `needs_clarification` short-circuit before the nudge section — so they appeared to "work".

## How to apply
If `recommendations` is ever moved or re-declared, ensure it is initialized before **any** reference to `recsAlreadyHaveBusinesses`.
Confirmed fixed Aug 14 2026 by hoisting `let recommendations: Record<string, unknown> | null = null;` above the outer `try`.
