# P0 Owner Dashboard — Live Reproduction Evidence

**Date:** 2026-10-15  
**Environment:** authenticated founder browser session at `https://www.mappingwithmelanin.com`  
**Method:** non-mutating inspection only. No labels, claims, verification records, promotion checkout sessions, business records, or production data were changed.

## Observed owner context

- The authenticated member can open `https://www.mappingwithmelanin.com/business-dashboard`.
- The dashboard lists **Mapping With Melanin** (`c678e359-0000-4000-8000-000000000001`) as an owner-managed business.
- The same business is marked **Verified** and **suspended** in the dashboard.
- The Profile page does not expose the expected My Business entry for this member.

## Control results

| Control | Result | Evidence / interpretation |
| --- | --- | --- |
| Business selection | Rendered for Mapping With Melanin | Source needs query-selected multi-business support and authoritative relationship checks. |
| Overview / Promote / Global tabs | Working client-side | Each tab rendered its respective content through a non-mutating click. |
| View Public Listing | Working navigation | Opened `/businesses/c678e359-0000-4000-8000-000000000001`. |
| Edit Profile | **Broken navigation** | Opened `/for-business-owners?claim=c678e359-0000-4000-8000-000000000001`, which rendered the generic listing-submission page rather than an authorized editor. |
| Promote My Business | **Inconsistent eligibility UI** | The Promote tab rendered paid “Activate” actions while the dashboard simultaneously showed the business as `suspended`. No checkout action was started. |
| Apply for Verification | **Inconsistent status UI** | The dashboard offered the action while the same business was labeled Verified. No application was started. |
| Ownership designation input / remove / save | Data loaded and control rendered | No selection, removal, or save was performed because it would modify live owner-provided labels. Source/API authorization is being regression-tested with fixtures. |
| Business Voice Profile | **Read failure** | UI displayed “The service could not complete that request.” No profile save or draft request was attempted. Source route requires its backing table; deployment/migration state must be handled outside this no-migration repair. |
| Paid activation controls | Not activated | Checkout would create a pending promotion and enter payment flow, so it was deliberately not invoked. |

## Source-level status meaning

- `verified` is the verification badge state.
- `suspended` is the listing status shown by the dashboard.
- Promotion eligibility policy explicitly treats `suspended` as ineligible, but the deployed UI still renders activation actions. The repair must surface that policy before any checkout action.

## Boundaries retained

- No deployment, database migration, mobile build, paid provider activation, or production record change was performed.
- Browser testing remained limited to navigation and tab rendering that do not mutate production data.
