# Kinfolk Current Website & Social Verification

**Run:** 2026-10-15T14:17:29.224Z

**Scope:** 7,571 records from a retained Kinfolk Current catalog snapshot. This report is verification evidence and proposal material only. It does not write to production.

| Result | Count |
|---|---:|
| Records examined | 7,571 |
| Websites kept active | 3,047 |
| Websites confirmed inactive | 989 |
| Websites inconclusive | 2,216 |
| Websites missing | 1,319 |
| Active, matched social profiles | 587 |
| Inactive or removed social profiles | 6 |
| Social profiles inconclusive | 5,544 |
| Retained by active website | 3,047 |
| Retained by social-only evidence | 308 |
| Proposed for reversible Delete Review | 659 |
| Held for uncertainty | 3,557 |
| Website fields proposed for clearing | 44 |

## Evidence files

- Per-record evidence: `/home/ubuntu/mwm-kinfolk-nozip-map-restoration/docs/directory-operations/kinfolk-current-online-presence-2026-10-15/presence-verification.jsonl`
- Reversible website-clear proposals: `/home/ubuntu/mwm-kinfolk-nozip-map-restoration/docs/directory-operations/kinfolk-current-online-presence-2026-10-15/website-removal-proposals.json`
- Reversible Delete Review proposals: `/home/ubuntu/mwm-kinfolk-nozip-map-restoration/docs/directory-operations/kinfolk-current-online-presence-2026-10-15/delete-review-proposals.json`
- Machine-readable summary: `/home/ubuntu/mwm-kinfolk-nozip-map-restoration/docs/directory-operations/kinfolk-current-online-presence-2026-10-15/summary.json`
- Guarded apply manifest: `/home/ubuntu/mwm-kinfolk-nozip-map-restoration/docs/directory-operations/kinfolk-current-online-presence-2026-10-15/kinfolk-current-online-presence-apply-manifest.json`
- Complete compressed probe receipts: `complete-probe-receipts.tar.gz`
  (`sha256:a8607b2605178bc09c4352c4dc35c60bebc8b2ce873a0835dbf78752e6dbb3e3`)

**Exact apply-plan content fingerprint:**
`b6247028c68e02897c51750985b980373c4c13d4461788c74bb37be13b607f71`
**Apply-manifest file checksum:**
`sha256:77e1f0d0a53946c2d2ea0d7a3d3fdb6116fa8d7289b6b8838eac82bb556c10bc`

## Execution hardening

The apply endpoint accepts only the exact fingerprinted plan above; modified browser JSON and substitute manifests are rejected. Every action re-locks the current record, reconfirms the live Kinfolk Current scope, and verifies the recorded identity plus applicable stored links before acting.

`Kinfolk Current Delete Review` is a reversible public-discovery hold, not a deletion. Queued records are database-protected from permanent deletion and from lifecycle changes outside the dedicated apply/restore transaction. The dedicated restore returns the exact saved listing state and cancels any deletion hold in the same transaction.

## Execution boundary

The **44 social-preserving website removals** clear only a matching inactive
website value. They preserve the verified official social URL and do not alter
identity, ownership, Kinfolk eligibility, map eligibility, coordinates, or
listing visibility.

The **659 Delete Review proposals** are not permanent deletions. A guarded
execution moves only a still-current record whose website and every stored
social link still match the evidence into the separately labeled, reversible
**Kinfolk Current Delete Review** queue. That temporarily removes it from
public discovery while retaining the business, its profile, prior listing
state, source evidence, and an append-only audit trail. The exact prior
listing state can be restored without recreating the business.

Every action requires a fresh, locked production read. A missing business,
changed website, changed or newly added social URL, non-current record, or
existing review history is skipped without a write. No source or production
write has occurred from this report.
