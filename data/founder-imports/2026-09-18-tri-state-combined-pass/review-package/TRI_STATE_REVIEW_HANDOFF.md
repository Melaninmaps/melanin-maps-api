# Combined Tri-State Source-Backed Directory Review Package

**Status:** Review only. This package has not been staged to any database, published to the website, made visible in iOS or Android, added to the map, or supplied to live Kinfolk recommendations.

The package preserves 1442 consolidated research candidates from the original tri-state review package plus the second deep source pass. It contains 1336 structurally valid review candidates and holds 106 records outside staging because they lack a usable customer-facing official destination after normalization. This is an evidence boundary, not a closure decision.

## Review composition

| Queue | Candidates |
|---|---:|
| Commercial business | 984 |
| Online-only business | 38 |
| Regulated review | 120 |
| Community resource | 116 |
| Cultural place | 76 |
| **Review candidates** | **1336** |
| Held for missing/invalid destination | 106 |

## Automated destination check

The review manifest contains 1260 distinct current destinations. The automated check returned 1126 reachable responses, 71 non-success responses requiring review, 56 network failures, 7 timeouts, and 0 destinations that were not in the prior health report. A record enters the **needs-research** queue if any selected destination is not confirmed reachable. It is not removed or described as closed.

## Approval boundary

A founder/admin reviewer must reconcile duplicates against the live directory and approve individual commercial businesses. The protected importer then geocodes the published street address server-side before a commercial map pin exists. Regulated candidates require authority or licensing review. Community resources and cultural places follow their separate queues and must not become commercial map pins. Online-only businesses may be searchable after approval but must remain mapless.

## Package integrity

The review manifest SHA-256 is d3566f2c0ea10b3751c56e6eab5bd324e86e3ebaf0ffd663600007437fca3a51. Do not edit the review manifest after this package is built. If a candidate changes, rebuild the package and rerun destination verification.

## Source context

The collection draws from public chamber directories and community sources, including the [African American Chamber of Commerce of PA, NJ & DE][1], the [Statewide Hispanic Chamber of Commerce of New Jersey][2], the [Delaware Hispanic Chamber of Commerce][3], and the [Greater Philadelphia Hispanic Chamber of Commerce][4]. Chamber membership is not an ownership designation. Ownership or cultural designations appear only where a source expressly supports them.

## References

[1]: https://membership.aachamber.com/list "African American Chamber of Commerce of PA, NJ & DE member directory"
[2]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Link directory"
[3]: https://www.hchamber.org/member-directory "Delaware Hispanic Chamber of Commerce member directory"
[4]: https://www.philahispanicchamber.org/membership-directory "Greater Philadelphia Hispanic Chamber of Commerce membership directory"
