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
| Aug 13 2026 | Business count is 2,735 — same as last night; founder says prior session reported MORE websites/phones/hours but same total | Reported again after canonical dedup work was shipped — founder is questioning whether work is real | RESOLVED Aug 13 2026. Real finding: 91 Duke's Cafe duplicates in Horsham PA (seeding loop bug); 3 more LA duplicate pairs; 113 permanently_hidden records are AI-fabricated with no contact data; 101 of 102 phones are on permanently_hidden records not live listings. CSV of all 2,735 rows exported to businesses_export.csv for Manus audit. Tasks #320 and #321 proposed for cleanup. |

## What NOT to do
- Do not say "I'll note that for next time" and move on
- Do not assume a code change = a fix without verifying the runtime behavior
- Do not claim a deploy fixed something without checking Railway logs or the live endpoint
