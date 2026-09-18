# Mid-Atlantic Public Agencies — Source Evidence Report

**Pass:** 20 — Mid-Atlantic public agencies

**Scope:** Official city, county, or state supplier-diversity and certified-business public search pages that expose individual DC, Baltimore, Richmond, or Hampton Roads businesses. The review prioritized government and economic-development sources and did not use generic Google pages, chamber social accounts, or database/API calls.

## Result summary

| Measure | Count |
|---|---:|
| Official agency directory sources reviewed | 4 |
| Individual business candidates extracted | 0 |
| Manual-review source candidates recorded | 4 |
| Physical commercial candidates | 0 |
| Online-only candidates | 0 |
| Regulated-service candidates | 0 |
| Cultural/community candidates | 0 |
| Sources with publicly described individual-level search capability | 4 |
| Sources with listing-level records transcribed in this pass | 0 |

No individual business was promoted into the inventory because the accessible agency pages exposed directory portals rather than static, directly extractable business records in this pass. This avoids inventing addresses, phones, ownership, websites, services, or map pins.

## Source findings

### District of Columbia DSLBD CBE Search

The [DC Department of Small and Local Business Development Find Certified Companies page](https://dslbd.dc.gov/service/find-certified-companies) states that DSLBD maintains a real-time database of active Certified Business Enterprises. It says each CBE profile includes contact information, a business description, and NIGP codes, and links to the [CBE Search Portal](https://dcdslbd.my.salesforce-sites.com/public). The page also provides an assisted-search form and warns that portal inclusion does not confirm a firm's ability to perform a particular job or contract.

**Accessibility limitation:** The public portal is a separate Salesforce application. The agency page itself contains no business-level listing table, and no individual profiles were transcribed during this pass. A future extraction pass should use the portal interactively, capture the record's published street address and official customer destination, and preserve the CBE designation exactly as shown.

### Maryland MDOT Office of Minority Business Enterprise

The [Maryland MDOT MBE page](https://mbe.mdot.maryland.gov/) describes an enhanced online directory with keyword search and links to the [Directory of Certified Firms](https://marylandmdbe.mdbecert.com/). The page identifies the relevant certification programs as MBE, DBE, ACDBE, and SBE and provides the OMBE contact phone. It also notes an agency transition effective October 1, 2025, so current program ownership and certification status should be checked at extraction time.

**Accessibility limitation:** The directory is a separate certification-management web application. The accessible MDOT page did not expose a static list of firms, and no individual records, addresses, phone numbers, or customer websites were transcribed. The Open Data search result was treated as a discovery lead rather than a listing source because this pass did not validate current row-level records there.

### Baltimore City MBE/WBE Directory

The [Baltimore City Mayor's Office of Small and Minority Business Advocacy & Development page](https://www.baltimorecity.gov/smbad) links directly to [Search MBE/WBE Directory](https://baltimorecity.diversitycompliance.com/). The city page states that the office supports minority- and women-owned businesses and that its duties include certification and maintaining directories. The page lists the office's public contact information.

**Accessibility limitation:** The city page does not publish a static business table; the linked directory is hosted on a separate Diversity Compliance application. No individual listing, street address, phone, official customer website, or service record was transcribed in this pass. Certification should not be treated as proof of current operations or service availability.

### Virginia SBSD SWaM & DBE Directory

The [Virginia Department of Small Business and Supplier Diversity directory page](https://sbsd.virginia.gov/directory/) states that its all-inclusive directory contains firms certified by the Commonwealth and includes SWaM and DBE firms. It explicitly lists Small, Women-owned, Minority-owned, Micro, Service Disabled Veteran-owned, ESO, DBE, and ACDBE designations. It says users can filter by certification type, NIGP code, NAICS code, city, ZIP code, company name, certification number, DBA, contact, address, state, phone, email, or website. The page links to the [directory application](https://directory.sbsd.virginia.gov/#/directory), making it relevant to both Richmond and Hampton Roads searches.

**Accessibility limitation:** The directory is a JavaScript application. The official explanatory page documents the available filters but does not expose individual firm records in the fetched HTML. No business-level records were transcribed. SBSD expressly cautions that directory inclusion is not confirmation or endorsement and that customers must conduct their own licensing and qualification due diligence.

## Exclusions and gaps

No business-level rows were added because the source pages did not provide a verified, directly extractable combination of business name, physical street address, city/state, category, source URL, and official customer-facing website or social destination. Agency social-media accounts were excluded as customer destinations. No chamber-only source was used because membership is not ownership evidence. No ownership identity, language, hours, accessibility, license, insurance, availability, or services were inferred.

The main gap is listing-level extraction from the four linked dynamic portals. A subsequent browser-based pass should search each portal by the target geographies (Washington, DC; Baltimore; Richmond; Norfolk, Virginia Beach, Chesapeake, Hampton, Newport News, Portsmouth, Suffolk, and adjacent Hampton Roads localities), capture only fields visibly published by the official directory, and independently verify each candidate's customer-facing website or social URL. Regulated businesses should be routed to `regulated_review` and not treated as approved providers solely because they appear in a supplier-diversity directory.

## Source URLs

1. https://dslbd.dc.gov/service/find-certified-companies
2. https://dcdslbd.my.salesforce-sites.com/public
3. https://mbe.mdot.maryland.gov/
4. https://marylandmdbe.mdbecert.com/
5. https://www.baltimorecity.gov/smbad
6. https://baltimorecity.diversitycompliance.com/
7. https://sbsd.virginia.gov/directory/
8. https://directory.sbsd.virginia.gov/#/directory

## Method note

Research was limited to official public-agency pages and their directly linked public directory portals. No database or API was called, and no directory listing was published. The JSONL file records four `manual_review` source candidates with source-level evidence and explicit accessibility limitations rather than fabricating individual businesses.
