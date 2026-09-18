# Greater Philadelphia Hispanic Chamber of Commerce member-profile source pass

| Measure | Result |
|---|---:|
| Discovery endpoint | `https://www.philahispanicchamber.org/membership-directory` |
| Profile/detail endpoint pattern | `https://www.philahispanicchamber.org/membership-directory/corporate/{member-id}` |
| Public member profiles discovered | 272 |
| Public profile endpoints retrieved | 263 |
| Profile retrieval failures | 9 |
| Detail profiles with a direct external destination link | 193 |
| Retained: `business` | 14 |
| Retained: `regulated_review` | 5 |
| Retained: `online_business` | 0 |
| Total retained | 19 |
| Held or excluded | 253 |
| Existing consolidated exact same-business/same-location records excluded | 0 |

## Exclusions and limits

| Exclusion or limitation | Count |
|---|---:|
| Directory records held/excluded because no profile-level direct customer destination, no policy-compliant physical-address evidence, an agency/government/chamber identity, or non-prioritized out-of-area evidence | 244 |
| Public member detail endpoints not retrieved after bounded HTTP retries | 9 |
| Exact existing same-business/same-location consolidated matches | 0 |
| Rate-limiting response status (`429`) observed | 0 |

The directory was retrieved through public HTTP. Public member detail pages expose a direct `/membership-directory/corporate/{member-id}` endpoint behind each **More Info** view. Profile-level contact fields are commonly displayed as “Available to Members”; retained records therefore require the linked, direct official customer website to publish both a numbered physical street address and customer-facing service/offering evidence. Customer-site requests had 25 non-200 or inaccessible outcomes among 190 HTTP requests; those outcomes were not retained absent compliant evidence. Regulated health and accounting records are classified as `regulated_review`. Ownership designations are empty; chamber membership was not used as ownership evidence.

**Research-only; not published.**
