# Source report: Greater Philadelphia Hispanic Chamber directory

## Source and traversal

The source family was the public Greater Philadelphia Hispanic Chamber of Commerce website and its Glueup-powered public membership directory. I opened the chamber homepage at <https://www.philahispanicchamber.org/> and the public directory landing/category URL at <https://www.philahispanicchamber.org/membership-directory> (which redirects to <https://www.philahispanicchamber.org/membership-directory/corporate>). The directory category page exposed 273 distinct public detail links, all in the range/pattern `https://www.philahispanicchamber.org/membership-directory/corporate/{member-id}#page-member-ajax`; 264 detail pages returned a parseable member name. Representative detail pages independently opened were [The Association of Mexican Business Owners](https://www.philahispanicchamber.org/membership-directory/corporate/3718910) and [ALL BUSINESS](https://www.philahispanicchamber.org/membership-directory/corporate/3440981). The public sitemap at <https://www.philahispanicchamber.org/sitemap.xml> contained only the homepage and did not enumerate member records.

## Results

Candidate counts: **0 total; 0 physical business; 0 online business; 0 community_resource; 0 cultural_place; 0 held**. The candidate JSONL is intentionally empty because no retained record met the task's mandatory combination of an exact public street address and an independently opened current official business/site/social destination.

The 264 parseable detail pages displayed member names and, where present, broad NAICS/category labels and member contacts. However, the public detail pages did not publish the member's exact street address. The directory's visible “Company Website Address,” email, phone, LinkedIn, Instagram, and Facebook fields were frequently rendered as “Available to Members,” rather than public values. Links such as `aemphilly.org` on the Association of Mexican Business Owners page and `Www.allbusinessphl.com` on ALL BUSINESS appeared as publicly visible destinations, but the directory still supplied no exact street address for either record. I did not convert the chamber's own address (141 E. Hunting Park Ave., Philadelphia, PA 19124) into a member address.

## Coverage and omissions

The pass covered the full publicly exposed corporate directory category rather than only the homepage or search-result snippets. The directory page exposed no separately public faith, community-resource, cultural-place, library, mutual-aid, food-support, family/parent-support, elder/disability-support, education/training, funeral, shelter, civic-support, or local-nonprofit directory category during this traversal. Such records therefore could not be added under the requested `community_resource` or `cultural_place` kinds. The directory's public member pages are access-limited for key contact fields (“Available to Members”), and no public pagination/detail response inspected supplied exact member premises. No coordinates were inferred and no source record was invented. The file contains no rows and therefore no ownership, regulated-profession, language, hours, specialty, or service claims.

## Source status

`sourceStatus` would be `blocked_public_fields` for prospective records: the directory itself is publicly reachable and names are visible, but exact addresses and/or public official destinations are not sufficiently exposed to satisfy retention requirements. No live data or production system was accessed or modified.
