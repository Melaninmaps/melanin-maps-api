# DC Chamber Minority-Owned Business Source Report

## Source and method

This pass used exactly one source family: the **DC Chamber of Commerce Member Directory**, minority-owned business category: <https://members.dcchamber.org/directory/category/minority-owned-business>. The category page was opened and inspected. It displayed “20 of 22 Results,” listing businesses in Washington, DC and nearby Maryland, with numbered addresses and linked websites for many entries. The page’s visible pagination was `1 2 20`; page 2 was requested at <https://members.dcchamber.org/directory/category/minority-owned-business?page=2> and returned the same visible result set, so no additional distinct page-2 records were assumed.

Individual public profile pages inspected were:

1. [Fort Myer Construction Corporation](https://members.dcchamber.org/directory/category/minority-owned-business/fort-myer-construction-corporation-146), which published its name, 2237 33rd St., NE, Washington, DC 20018, phone `(202) 636-9535`, website `www.fortmyer.com`, and related categories including Minority Owned Business and Construction Companies - General Contractors/Developers.
2. [Broughton Construction Company, LLC](https://members.dcchamber.org/directory/category/minority-owned-business/broughton-construction-company,-llc-7063), which published its name, 4832 Nannie Helen Burroughs Ave., NE, Washington, DC 20019, phone `(202) 589-0066`, website `www.broughtonconstruction.com`, and related categories including Construction, Contractors-Government, Facility Management, General Contractors, and Minority Owned Business.

The linked [Fort Myer official website](https://www.fortmyer.com) was also opened and inspected. It publicly stated service terms including street and highway construction, bridges and structures, utilities, electrical, design-build, asphalt supply and paving, site improvements, snow and ice removal services, and 24/7 emergency response. It also published the same Washington address and telephone number and an official Facebook link. The Broughton official website link could not be reached by the inspection tool because hostname resolution failed; that row was therefore held rather than promoted.

## Output counts and controls

Candidate rows: **1**. Held rows: **1**. No production database was written and no form was submitted. The directory category label was retained as source context only; no ownership designation was added because a directory category is not proof of an individual business owner identity.

The candidate has a numbered street address, city, state, country, direct official website, and practical services stated by that official website. The held row retains factual directory fields but is excluded from candidates because its linked direct destination was not verified as reachable at collection time.

## Limitation

This source family exposed only a directory category snapshot (“20 of 22 Results”) and the attempted page-2 URL returned the same content; the pass therefore cannot establish that all 22 underlying records were independently accessible or current. Directory membership and the “Minority Owned Business” category do not establish owner identity or ownership eligibility.
