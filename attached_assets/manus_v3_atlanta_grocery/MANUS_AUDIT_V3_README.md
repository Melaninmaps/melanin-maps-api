# MWM Audit Package v3 — Atlanta Black-Owned Grocery Stores

**Date:** August 14, 2026  
**Prepared by:** MWM Engineering  
**Audit scope:** 4 Black-owned grocery stores added to the Mapping With Melanin platform in Atlanta, GA  
**Previous audit:** Duplicate safety patch (v2) — all findings addressed and shipped  

---

## What Manus is Asked to Verify

The founder requested that we locate, research, and add **4 verified Black-owned grocery stores in Atlanta** to the MWM platform with full profiles. Your job is to confirm:

1. **All 4 stores appear in the platform** — searchable, on the map, accessible via their detail pages  
2. **Every website URL works** — clicking the URL opens the actual store's website (not 404, not a redirect to a competitor)  
3. **Profiles are as complete as possible** — name, address, phone (where published), website, description, ownership badge, coordinates  
4. **No duplicates** — only one listing per store; no phantom records leaking through  
5. **Black-owned designation is visible** — each store shows its community ownership badge  

---

## The 4 Stores

| # | Name | Address | Website | Phone |
|---|------|---------|---------|-------|
| 1 | Wadada Healthy Market & Juice Bar | 878 Ralph David Abernathy Blvd SW, Atlanta, GA 30310 | https://www.wadadaatl.com | (678) 974-7330 |
| 2 | Sevananda Natural Foods Market | 467 Moreland Ave NE, Atlanta, GA 30307 | https://sevananda.coop | (404) 681-2831 |
| 3 | Nourish + Bloom Market — Cascade | 2287 Cascade Rd, Atlanta, GA 30311 | https://www.nourishandbloommarket.com | None (autonomous store) |
| 4 | Goodr Community Market on Edgewood | 381 Edgewood Ave SE, Atlanta, GA 30312 | https://goodr.co | None (email: Info@goodr.co) |

### Why These 4?

All were selected after cross-referencing multiple directories (EatOkra, Storm's Mama, BuyBlack.org, Atlanta Voice, AJC), verifying active websites, and confirming Black ownership:

- **Wadada** — Atlanta's first Black woman-owned vegan health food market, founded 2019 by Jeanette Sellers. Featured by The Infatuation, The Atlanta Voice. Website confirmed live.
- **Sevananda** — Community-owned co-op operating since 1974, listed on EatOkra (Black-owned business directory), Atlanta's oldest natural foods market. Website confirmed live.
- **Nourish + Bloom — Cascade** — First AI-powered, frictionless, 24/7 autonomous grocery store in the US, Black-owned by Jilea & Jamie Hemmings. Cascade Heights location, open 2024. Featured in Bloomberg, AJC, Atlanta Voice. Website confirmed live.
- **Goodr Community Market on Edgewood** — Black woman-owned community grocery, founded by tech entrepreneur Jasmine Crowe-Houston. Opened July 2025 in Sweet Auburn District. Featured in Rolling Out, ATL Direct. Website confirmed live.

---

## Website URL Verification (Pre-Check by MWM Engineering)

Before shipping this package, we visited each URL and confirmed:

| URL | Status | What loads |
|-----|--------|------------|
| https://www.wadadaatl.com | ✅ Live | Wadada online store / order page |
| https://sevananda.coop | ✅ Live | Sevananda co-op homepage with store hours, location |
| https://www.nourishandbloommarket.com | ✅ Live | Nourish + Bloom market shop, bistro, locations |
| https://goodr.co | ✅ Live | Goodr organization homepage (operates the Edgewood Market) |

---

## Instructions for Manus

### Step 1 — Run the SQL Verification Queries

Use the file `MWM_Atlanta_Grocery_Verification_SQL.sql` in this package. Run all 8 queries against the MWM development database. Each query has a **PASS condition** — record your result.

### Step 2 — Verify the Web UI

Follow the step-by-step instructions in `MWM_Atlanta_Grocery_UX_Test_Protocol.md`. This covers:
- Finding each store via the Atlanta search
- Opening each store's detail page
- Clicking the website URL and confirming it loads
- Confirming the Black-owned ownership badge is visible

### Step 3 — Report Format

Return a findings report with:
- **SQL results** — pass/fail for each query with actual values
- **URL test results** — for each of the 4 stores: did the URL open the correct website?
- **Profile completeness score** — which fields are populated, which are missing
- **Any anomalies** — unexpected records, broken links, missing ownership badges, map pins off-location

---

## Database IDs (for SQL verification)

| Store | Database ID |
|-------|------------|
| Wadada Healthy Market & Juice Bar | c09df6ab-c5de-458a-b314-282fc90ec53d |
| Sevananda Natural Foods Market | c14dfa48-edd7-44f1-8d07-c8363289bd83 |
| Nourish + Bloom Market — Cascade | 4e6be83f-f5f0-4c11-a196-7cc9f465988d |
| Goodr Community Market on Edgewood | 71bf880e-8bce-4d45-8c97-5c7918fd4ec8 |

---

## What Changed Since v2

The v2 package covered the duplicate safety patch. In addition to those fixes (all shipped), this v3 package introduces the Atlanta grocery store additions. No previously audited records were modified.

---

## Contact

Engineering questions: mwm-dev team  
Content questions: founder
