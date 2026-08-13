# Kinfolk Conflicting Public Consensus Audit Guide

## Purpose

Kinfolk must not turn different cultural, demographic, professional, geographic, or generational perspectives into a made-up single majority. It must also not guess which perspective a member wants because of their name, profile photo, location, language, or prior searches.

> **Kinfolk reports evidence-backed perspectives; it does not assign a member to a demographic or use demographic assumptions to select a winner.**

## The four permitted consensus states

| State | When it applies | Required response shape |
| --- | --- | --- |
| `broad_consensus` | At least two independent credible sources support the same conclusion and no material attributable contrary evidence exists. | Direct conclusion; label it as broad cultural/public consensus; explain evidence; include nuance. |
| `segmented_consensus` | Credible attributable sources show different conclusions among different documented audiences, regions, professions, or communities. | Say there is no one single consensus; describe each perspective and source scope side by side; do not pick a universal winner. |
| `contested` | Independent credible sources materially disagree without a stable attributable pattern. | Say the issue is contested; summarize the strongest documented positions fairly. |
| `insufficient_evidence` | Evidence is too thin, stale, duplicated, irrelevant, or non-independent. | Do not manufacture a view; say the evidence does not establish a reliable consensus. |

## What counts as an attributable perspective

Kinfolk may state a perspective only when the source itself identifies its audience, method, geography, or professional scope. Acceptable examples include a named award body, a dated nationally published critic review, a transparent survey sample, a scholarly article, or a documented industry/artist statement.

Kinfolk must not use unsupported phrasing such as “Black people think,” “Latinos prefer,” “women agree,” “young people say,” or “the diaspora believes.” Those are not source categories. If a reputable source documents a specific community’s position, Kinfolk must name the publisher, date, method/scope, and limitation in the response.

## Read-only audit procedure

For every opinion/consensus diagnostic prompt, Replit must export a redacted evidence ledger before any model call. Each row must include the canonical subject, publisher, publication date, source tier, independence key, quoted/structured claim, source-reported audience scope, and relevance decision.

| Audit field | Required rule |
| --- | --- |
| Canonical subject | All sources must concern the same person, work, event, or comparison. |
| Publisher independence | Multiple syndicated copies of one story count as one publisher. |
| Source tier | Official, institutional, reputable, or peer-reviewed only; social posts are not consensus evidence. |
| Audience scope | Must be explicitly stated by the source; blank if not stated. |
| Freshness | Time-sensitive consensus must use current sources; outdated evidence must be labeled or excluded. |
| Contradictions | Must remain visible in the ledger; they may not be discarded merely to produce a clearer answer. |
| Member data | Must not be present in the ledger except an explicit, current-request preference that changes tone or language—not conclusion. |

## Example: Kendrick versus Drake

A valid audit may observe broad public/critical/cultural outcome signals from independent reporting, awards, chart/performance records, and publicly documented cultural reach. It may then conclude that Kendrick is widely regarded as having won **if** those sources support that conclusion.

If credible, attributable source groups diverge—for example, documented professional critics versus a transparent fan survey—the response must say so:

> “There is not one single consensus across every documented audience. Several critics and public-outcome sources point toward Kendrick, while the cited fan survey favored Drake. That makes the best supported answer a split perspective rather than a universal winner.”

The answer does not say which view applies to the member unless the member explicitly asks to compare a named source or community. Even then, the result is source-contextualized; it is not an identity inference.

## Example: a health question is never consensus analysis

A question about diabetes uses `high_consequence_evidence`, not the conflicting-consensus framework. Kinfolk uses authoritative medical evidence and may explain where professional guidance differs, but it must not describe medical choices as popularity contests or infer what is right for a member from demographics.

## Required regression tests

1. Two independent sources support the same result; answer returns `broad_consensus` and a qualifier.
2. Two source-attributed audiences diverge; answer returns `segmented_consensus` and does not announce a universal winner.
3. Sources disagree but no audience scope is documented; answer returns `contested`.
4. Only duplicate/syndicated/social sources exist; answer returns `insufficient_evidence`.
5. Changing a member’s self-described cultural interest or language changes vocabulary or source expansion only—not consensus state.
6. A member’s name, profile location, or previous sensitive searches cannot alter consensus state or evidence selection.
7. `Show less` preserves consensus-state label and source count; `Show more` expands only validated evidence.
