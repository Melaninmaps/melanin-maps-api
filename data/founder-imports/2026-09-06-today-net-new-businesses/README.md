# September 6 Cumulative Founder Business Handoff

This bundle contains the founder-provided workbook `MWM_TODAY_NET_NEW_BUSINESSES_BUILD022_NYC_LARGE_CUMULATIVE_2026-09-06.xlsx`. Its SHA-256 digest is locked in `SHA256SUMS`.

The workbook's `QA_SUMMARY` identifies `MANUS_TODAY_NET_NEW` as the cumulative handoff tab. That tab contains **3,367 unique business candidates**. The `BUILD_022_NYC_LARGE` tab contains **170 rows**, all of which are already present in the cumulative tab, so it is not imported separately.

The governed manifest contains exactly 3,367 rows. It routes **2,857 ordinary businesses** to founder-authorized searchable publication, **459 regulated or licensed services** to regulated review, and **51 rows without a confirmed reachable public link** to manual review. Every row has a supplied U.S. street address. No row supplied latitude or longitude.

A bounded reachability audit checked 899 unique direct, social, and evidence URLs. It found at least one reachable direct or evidence link for 3,309 candidates. The other 58 include 51 manual-review rows and seven regulated-review rows. HTTP 401, 403, 405, and 429 responses are treated as reachable because they commonly indicate a live site that blocks automated clients rather than a dead browser link.

The official U.S. Census batch geocoder processed all 3,367 supplied addresses. The strict local validator accepted 2,542 exact address matches and held 825 unmatched or inconsistent results. Of the accepted matches, **2,170 belong to ordinary publication-eligible businesses**. Accepted coordinates are described as interpolated address-range coordinates, not rooftop coordinates and not Mapping With Melanin verification.

All writes are limited to the isolated local directory staging environment by the existing staging guard. Publication creates or reconciles `live_unclaimed`, unverified listings. Regulated and missing-link rows remain nonpublic. Existing pins are never overwritten. No production, Railway, EAS, TestFlight, Apple, Google Play, or store action belongs to this batch.
