---
name: Repeated Requests — Tracking Policy
description: PERMANENT RULE. Any time the founder says "I asked this before", "asking again", "I already told you", "still not working", "how many times", or any phrase indicating a prior unresolved request — STOP, check this folder, log it, and treat it as the highest priority item in the session.
---

## The Rule

When the founder uses any of these signals:
- "I asked this before"
- "I'm asking again"
- "I already told you"
- "still not working"
- "how many times"
- "again"
- "you said it was fixed"
- Any variant implying this is a repeat

**Immediately:**
1. Say so honestly — acknowledge it is a repeat before doing anything else
2. Check this folder for prior notes
3. Log it here with the date, what was asked, and what was done
4. Do NOT claim it's fixed until it is visually or functionally verified
5. Do NOT add it to a task queue and move on — fix it in the current session

## Log of Repeated Requests

| Date | Topic | Prior attempts | Current status |
|---|---|---|---|
| Aug 13 2026 | Shawn Hill Homes search returns no results | Multiple sessions — code comment showed a prior fix attempt that was incomplete; second fix today applied to wrong file | Fixed Aug 13 2026 in universal-search.ts: named_business skips geo filter; server-side gate uses prefix match. Needs Railway redeploy to be live in production. |

## What NOT to do
- Do not say "I'll note that for next time" and move on
- Do not assume a code change = a fix without verifying the runtime behavior
- Do not claim a deploy fixed something without checking Railway logs or the live endpoint
