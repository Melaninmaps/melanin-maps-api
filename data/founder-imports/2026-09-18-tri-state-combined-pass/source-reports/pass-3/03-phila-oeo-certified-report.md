# Philadelphia OEO Certified-Business Source Pass

## Conclusion

This pass found **no individual business candidates** that satisfy the required evidence standard. The City of Philadelphia Office of Economic Opportunity (OEO) provides a public certified-vendor search route, but its search actions are gated by a required certification selection and reCAPTCHA. The accessible page does not expose a result without completing that interaction. Philadelphia also links to a legacy OEO registry and to Pennsylvania Unified Certification Program portals, but their accessible HTML exposes portal shells rather than individual business records. Accordingly, the JSONL contains four `manual_review` records documenting source-level opportunities and limits, not map-ready businesses.

## Sources reviewed

The official OEO page says that OEO promotes fair access to City contracting opportunities and directs users to the **OEO Registry** for certification applications, renewals, and registry information [1]. Its certification-agencies section identifies NMSDC, WBEC PA-DE-NJ, WBENC, and the Pennsylvania Unified Certification Program among recognized certification channels [1]. The City’s certification-agencies publication explains that minority-, woman-, and disabled-owned businesses must use a recognized certification agency [2].

The current CCRS directory is a public search form titled **Certified Vendor Directory** [3]. It accepts certification type, business name or DBA, description, commodity code, contact person, location, and other filters. The page states that a certification type must be selected and that results can be downloaded to Excel after a search. It also explicitly requires the user to complete reCAPTCHA before the search actions become available. Because an individual result could not be reached through the accessible page, no business name, street address, or customer-facing business website was imported.

OpenDataPhilly describes the legacy `phila.mwdsbe.com` URL as the OEO Search App and separately links a registered MWD-owned-business CSV and API [4]. This pass did not call the linked API or database and did not publish or use a database extraction. The legacy portal itself returned a JavaScript-required shell and no individual record [5]. It therefore produced a manual-review record only.

The Pennsylvania Unified Certification Program states that its online DBE directory is updated in real time and contains the complete list of currently certified firms [6]. Its accessible portal page did not expose individual firm records without the interactive JavaScript workflow [6]. The linked Philadelphia International Airport supplier-diversity portal similarly identifies a certified-vendor directory but returned only a JavaScript-required portal shell in accessible HTML [7]. Neither source produced an importable business in this pass.

## Evidence and exclusion decisions

No physical commercial candidate was accepted because no source yielded, on an individually inspectable page, the required combination of business name, physical street address, Philadelphia-area locality, certification evidence, and a business-specific customer-facing website or social URL. No online-only candidate was accepted because none had an explicit online-only basis and official customer destination. No ownership designation was inferred from a directory’s general purpose, and no chamber, generic directory, personal profile, or shared portal URL was treated as a business destination.

The JSONL records are intentionally `manual_review`. They preserve the exact public source URLs and record the specific limitation that prevents individual evidence extraction. The pass did not use an API, database query, or bulk-download operation.

## References

[1]: https://www.phila.gov/departments/office-of-business-impact-and-economic-advancement/divisions/office-of-economic-opportunity/ "Office of Economic Opportunity — City of Philadelphia"

[2]: https://www.phila.gov/documents/certification-agencies-for-minority-women-disabled-owned-businesses/ "Certification agencies for minority, woman, disabled-owned businesses — City of Philadelphia"

[3]: https://phila.sbecompliance.com/FrontEnd/searchcertifieddirectory.asp "Certified Vendor Directory — City of Philadelphia CCRS"

[4]: https://opendataphilly.org/datasets/oeo-registry-of-certified-minoritywomendisable-owned-business-enterprises/ "OEO Registry of Certified Minority/Women/Disable Owned Business Enterprises — OpenDataPhilly"

[5]: https://phila.mwdsbe.com/ "City of Philadelphia OEO Registry legacy portal"

[6]: https://paucp.dbesystem.com/ "Pennsylvania Unified Certification Program"

[7]: https://phl.dbesystem.com/ "Philadelphia International Airport PHL Supplier Diversity Management System"
