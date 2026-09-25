# Mapping With Melanin™ — Required Change-Control Process

## Non-negotiable process

Before making **any** change to this app, first verify that the requested change will not create regressions elsewhere.

Do **not** make broad refactors, redesigns, cleanup changes, dependency upgrades, database changes, navigation changes, authentication changes, or “helpful improvements” unless the founder explicitly requests them.

For every request, complete this process:

1. Identify the exact files, screens, APIs, database tables, and user flows that the request affects.
2. State what will **not** change. Unless explicitly requested, this includes:
   - users, passwords, login, authentication, sessions, or waitlist behavior;
   - existing business records, reviews, safety data, events, or Community content;
   - app navigation and unrelated screens;
   - existing styling, functionality, APIs, database schema, and integrations; and
   - Apple and Google Play release configuration.
3. Propose the smallest possible change that achieves only the requested result. Do not rewrite or replace an entire file when a targeted edit works.
4. Before deployment, test the changed feature and the related existing flows that could be affected. At minimum, verify:
   - the requested change works;
   - the app still opens normally;
   - login and account creation still work;
   - existing users can still access their accounts;
   - KinfolkAI™, business search, map/discovery, and profile flows still work if the change can touch them;
   - no user data, business data, or settings were changed, deleted, or reset; and
   - no new console, API, build, or runtime errors were introduced.
5. Do **not** deploy when any regression, uncertainty, failing test, missing environment variable, or out-of-scope change exists. Stop and report the blocker instead.
6. After testing, provide a short change report before asking for review: the exact change, exact files, what was intentionally not changed, tests and results, any known risk or limitation, Git commit hash, and deployment status.

If a request requires a broader refactor or could affect users, data, login, release settings, or another app feature, stop and obtain the founder's written approval first.

“It should work” is not verification. Do not call a change complete until it has been tested and the affected areas are confirmed.

## Implementation discipline

Before altering source code, inspect the current behavior and relevant tests; state the invariant; make the smallest surgical change; add/update a regression test for the reported failure; and run the relevant typechecks/tests plus the full release gate before shipping.

## Service and recommendation invariant

For Kinfolk and search, the member's current request is authoritative. Saved preferences may rank already-matching results; they must never replace the requested service, invent a match, or render an unrelated recommendation card. If the system cannot return a governed match, it must return no business card rather than a generic fallback.

## Preservation and evidence

Never delete or recreate member accounts, passwords, profiles, listings, media, posts, waitlist entries, or audit data to make a repair. Use reversible, audited state changes. Keep source/provenance receipts internally, but do not expose intake/reconciliation notes in member-facing or routine Admin inventory rows unless explicitly requested.

## Release proof layers

Keep source tests, PR/merge, ship commit, deployed API/static identity, authenticated web behavior, native artifact creation, and physical-device behavior distinct. A passing source gate does not prove browser or device behavior.
