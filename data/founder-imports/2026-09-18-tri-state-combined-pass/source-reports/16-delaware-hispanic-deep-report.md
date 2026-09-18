# Delaware Hispanic Deep Source Pass

**Scope.** This expansion pass searched the Delaware Hispanic Chamber of Commerce, ¡DALE!/La Plaza Delaware, Delaware Hispanic Products & Services Guide, local public reporting, and first-party customer-facing sites for Hispanic/Latino business sources across Wilmington, Newark, Dover, and Sussex County. The output is a research expansion, not a claim that any listing is currently live.

## Results

The candidate file contains **11 substantiated physical commercial candidates**: Wilmington (4), Newark (4), and Georgetown/Sussex County (3). Categories are restaurants/food businesses. Every physical candidate has a name, street address, city/state/country, category, source URL, and at least one official website or social destination. No ownership identity was inferred from a chamber or directory listing. No online-only candidate was retained.

| Area | Records | Notes |
|---|---:|---|
| Wilmington | 4 | Santa Fe, Del Pez, El Pique, Mexican Post |
| Newark | 4 | Santa Fe, Del Pez, Casa Kahlo, El Pique |
| Sussex County / Georgetown | 3 | Caruso’s, Jalapeño, Maudy’s |
| Dover | 0 | No Dover listing met the full evidence standard in accessible pages reviewed |

## Sources searched

1. [Delaware Hispanic Chamber member directory](https://www.hchamber.org/member-directory) — accessible page exposed chamber contact information and navigation but did not render individual member records in the text extraction. It was therefore used as a source lead, not as evidence for a business candidate.
2. [Delaware Hispanic Chamber home](https://www.hchamber.org/) and [Bilingual Business Resource Center](https://www.hchamber.org/bilingual-business-resource-center) — reviewed for directory/resource context; no individual business record with a complete official destination was extracted.
3. [DALE Delaware business directory](https://daledelaware.org/en/business-directory/) — accessible index exposed many member names and some service descriptions, but individual hash-detail pages returned the same index rather than the selected record. Names without complete address plus official customer destination were excluded.
4. [Delaware Hispanic Products & Services Guide directory](https://docu.team/directory.php?association=797&cname=84356&search=&alpha=d) — accessible page returned the platform privacy/navigation content and no usable complete business records in the fetched view.
5. [La Plaza Delaware](https://laplazadelaware.org/) — verified the organization’s role supporting Latino-owned and operated businesses in Kent and Sussex Counties and its connection to DALE; no individual candidate with a complete listing was extracted from the home page.
6. [WDEL/COAST TV: Latino Small Business Tour in Georgetown](https://www.wdel.com/business/latino-small-business-tour-highlights-entrepreneurs-stories-in-georgetown/article_a8170fa0-a112-45a1-8498-f632fdd29bbc.html) — named Caruso’s Pizza & Pasta, Jalapeño Restaurant, Maudy’s Hispanic Cuisine, and Georgetown Mini Market. The three retained businesses were separately checked against official sites/social pages; Georgetown Mini Market was excluded because a complete official customer-facing destination was not verified.
7. First-party sites: [Santa Fe Mexican Grill](https://www.santafemexicangrill.com/), [Del Pez](https://www.delpezmexicanpub.com/), [Casa Kahlo](https://casakahlomexican.com/), [El Pique](https://el-pique.com/), [Mexican Post](http://www.mexicanpostde.com/), and [Caruso’s Pizza](https://www.getcarusospizza.com/).
8. Official social/customer pages: [Maudy’s Facebook](https://www.facebook.com/MaudysHispanicCuisine/) and [Jalapeño Facebook](https://www.facebook.com/jalapenogt/).

## Exclusions and evidence decisions

The chamber member directory was not treated as proof of ownership: membership alone is not ownership evidence. DALE member names such as construction, cleaning, landscaping, beauty, professional, and food businesses were not imported where the accessible page did not provide a complete physical address and an official customer destination. The Delaware Hispanic Products & Services Guide was excluded for this pass because the accessible page exposed platform privacy text rather than individual records. Georgetown Mini Market was excluded because the reporting page named it but an official customer-facing website or social destination with complete details was not verified. Search-result snippets, generic Google pages, Yelp, TripAdvisor, and directory home pages were not used as official customer destinations.

Health, legal, financial, childcare, and other regulated services were not retained in this pass. Houses of worship and community resources were not imported because no complete candidate record with the required destination evidence was established. No map coordinates were added.

## Gaps and limitations

The Hispanic Chamber directory and DALE directory appear to rely on dynamic or hash-routed content that did not expose individual records through the text fetcher. The Products & Services Guide similarly did not render usable individual listings in the accessible page. The requested Dover coverage therefore remains a gap: although chamber and public-resource pages were searched, no Dover business met all required evidence fields during this pass. The resulting set is intentionally conservative and should be treated as a queue for later manual verification, not as a census of Delaware Hispanic businesses.

## Candidate-file integrity

The JSONL file uses sequential `sourceRow` values 1–11 and the requested field contract. `ownershipDesignations` is empty and `ownershipEvidence` is null unless a source explicitly supported an identity designation; no such designation was inferred. Each `notes` value is a JSON string containing the evidence rationale.

**Access date:** 2026-09-18.
