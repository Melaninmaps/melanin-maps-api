# Kinfolk Factual Research and Source Summaries Release Handoff

**Status:** Code complete and validated locally. This document describes a pending GitHub merge and deployment; it is **not** evidence that the website, API, iOS app, or Android app has been released.

## Purpose

This release corrects the reported Kinfolk failures without removing the current source-links experience. Kinfolk continues to provide the ordinary conversational answer, current-source citations, follow-up questions, recommendation cards, and external article links. The release adds two capabilities: a more disciplined current-affairs response policy and a direct **Summarize with Kinfolk** action for each cited article.

## Current affairs and community perspectives

For public affairs, Kinfolk is instructed to distinguish **verified facts**, **a speaker's claim or interpretation**, and **material items that are not yet confirmed**. It must not manufacture false balance and may not treat a politician's unsupported statement as a fact.

When a member explicitly asks for perspectives from a named community or public-facing group, the current web-research layer is asked to provide a compact range of directly attributed, on-record perspectives where reliable sources support them. It must not say that an entire community has one view, profile the member, or infer a speaker's identity. This is an editorial and evidence rule, not a personalized political feed.

The updated current-language router recognizes concise custody/release wording such as **“Is Durk coming home?”** as a current-information request. It routes the request to cited live research rather than answering from static model recall. The general conversational prompt also preserves the selected Big Cousin tone, while the visible internal **Staff demo · Quality conversation** label is removed from member conversations.

## Article summary action

Every safe external source citation keeps its original clickable link. On the website and both native chat surfaces, a separate **Summarize with Kinfolk** action sends a narrowly scoped request containing the exact linked URL and title.

Kinfolk will only summarize that article after live research returns a citation matching the requested source URL. If it cannot retrieve cited content for the exact linked article, it replies that it cannot summarize the article rather than summarizing a similar story from memory. The linked article content is not saved as profile memory by this action.

## Scope safeguards

This release does not alter authentication, login, password resets, tester access, accounts, waitlist writes, waitlist records, directory publication records, or existing source links. It does not change the business-directory database schema.

## Validation completed

The following checks passed in the release worktree:

| Area | Check | Result |
|---|---|---|
| API | TypeScript typecheck | Passed |
| Web | TypeScript typecheck | Passed |
| Mobile | TypeScript typecheck | Passed |
| Kinfolk API | Current research, evidence runtime, identity/evidence policy, semantic planner, general chat, and web-search citation tests | 116 tests passed |
| Web UI | Kinfolk chat presentation tests | 12 tests passed |
| Repository | `git diff --check` | Passed |

## Deployment and build requirements

1. Merge the corresponding GitHub pull request, then deploy the exact resulting `main` commit to the **full API service** at `api.melaninmaps.com`.
2. Verify `/api/version` reports the new commit rather than an earlier artifact, then verify `/api/healthz`, `/api/readyz`, and `/api/kinfolk/health` return healthy responses.
3. Test a current fact-check request, an explicitly requested community-perspectives request, a concise custody-status request, and the **Summarize with Kinfolk** action using a cited news article.
4. The website action becomes available after the website/API deployment. The mobile action requires the next **both-platform production build** (iOS and Android) from the merged commit. A new API deployment alone cannot add a native button to already-installed app binaries.
