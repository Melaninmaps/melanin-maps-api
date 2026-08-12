# Library Evidence Seeding Prompt — Category Coverage Audit

## Audit result

**Pass, after two corrections.** The revised Replit prompt explicitly covers all **256 enabled Library topics** across all 24 live categories.

The audit compared the live `/api/knowledge/topics?excludeType=collection` catalog with the full seeding prompt. Two categories were initially only implied rather than named: `community_culture` and `home`. The prompt was corrected to name both categories explicitly and assign them source standards.

## Covered category inventory

| Live category | Topic count | Explicit prompt coverage | Evidence standard |
|---|---:|---|---|
| business | 2 | Batch D | Government, professional body, official program, or public-service source |
| community | 6 | Batch D | Reputable institutional/public-service/archival/editorial source |
| community_culture | 1 | Batch D, explicitly added | Culture/community source standard |
| country | 66 | Batch C | Official tourism, government, or intergovernmental source |
| culture | 9 | Batch C | Museum, archive, university, or intergovernmental source |
| diaspora | 7 | Batch A then C | Museum, archive, university, or intergovernmental source |
| digital | 5 | Batch D | Topic-appropriate authoritative source under general governance rules |
| education | 3 | Batch B | University, government, or institutional source |
| employment | 4 | Batch B | Department of Labor, BLS, O*NET, workforce agency, or accredited institution |
| entertainment | 2 | Batch D | Reputable institutional, archival, or established editorial source |
| faith | 12 | Batch C | Academic, museum/archive, or official tradition/community source |
| family | 7 | Batch C | Reputable institutional/public-service/archival/editorial source |
| financial | 8 | Batch B | CFPB, IRS, SEC, FINRA, SBA, Federal Reserve, or state regulator source |
| geography | 3 | Batch C | Official destination, government, or intergovernmental source |
| health | 28 | Batch B | At least three sources, including two institutional/public-health sources |
| history | 2 | Batch C | Museum, archive, university, or intergovernmental source |
| home | 4 | Batch D, explicitly added | Home/housing public-service, government, or recognized aid source |
| housing | 1 | Batch B | HUD, fair-housing, housing agency, or recognized tenant/legal-aid source |
| legal | 9 | Batch B | At least three sources, including two official or recognized legal-aid sources |
| lifestyle | 2 | Batch D | Reputable institutional/public-service/archival/editorial source |
| recovery | 5 | Batch B | At least three sources, including two institutional/public-health sources |
| relocation | 2 | Batch B | Official destination, government, or intergovernmental source |
| skills_trades | 2 | Batch D | Government, professional body, official program, or public-service source |
| travel | 66 | Batch C | Official tourism, government, or intergovernmental source |

## Total confirmation

| Measure | Result |
|---|---:|
| Enabled Library topics in live catalog | 256 |
| Live categories | 24 |
| Categories explicitly covered by revised seed prompt | 24 |
| Remaining unassigned categories | 0 |

## Important limitation

This audit confirms **scope and source-governance coverage**, not that 256 topics have already been seeded. Completion still requires the production coverage manifest, live graph evidence for every topic, duplicate checks, and hard-refresh UI verification defined in `MWM_Library_Evidence_Seeding_Verification_Checklist.md`.
