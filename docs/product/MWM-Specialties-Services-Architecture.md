# MAPPING WITH MELANIN™
## SPECIALTIES + SERVICES — FIRST-CLASS FIELD ARCHITECTURE

**STATUS:** Founder-approved decision. Locked architecture.  
**GATE:** Add Specialties + Services to pending master-update list. Do NOT touch the spreadsheet yet. Build vocabulary category by category, then make ONE consolidated master update + ONE controlled Replit handoff.

---

## LOCKED DECISION: SPECIALTIES IS A DISTINCT FIRST-CLASS FIELD

Specialties should NOT be buried as more subcategories. The clean hierarchy is:

> **Category → Subcategory → Specialties → Services**

---

## WHAT EACH LAYER ANSWERS

| Layer | Question It Answers | Who Provides It |
|---|---|---|
| **Category** | What broad type of business is this? | Platform taxonomy |
| **Subcategory** | What specifically are you? | Business selects |
| **Specialties** | What are you particularly good at? | Business selects (controlled list) |
| **Services** | What can I actually book/hire them to do? | Business selects |
| **Ownership / Identity** | Who owns / runs this? | Business + verification |
| **The Vibe** | What does being there feel like? | Community taps |
| **THE REAL** | What does the community trust them for? | Community taps |
| **What Stands Out?** | What did Kinfolk consistently notice? | Community taps |
| **What Locals Are Saying** | Kinfolk localization layer | Community voice |
| **Written Community Context** | Narrative layer | Community |

**The critical distinction:**
- Specialties come primarily FROM THE BUSINESS — "we specialize in tax law"
- THE REAL comes FROM THE COMMUNITY — they cannot award themselves "Explained Everything Perfectly"

---

## EXAMPLES

| Category | Subcategory | Specialties | Services |
|---|---|---|---|
| Legal & Government Services | Attorneys & Law Firms | Tax Law, Estate Planning, Immigration, Family Law, Criminal Defense | Consultations, Document Review, Court Representation |
| Beauty & Personal Care | Hair Salons / Stylists | Alopecia Care, Natural Hair, Silk Press, Locs, Protective Styles | Wash & Go, Trim, Braids, Silk Press |
| Beauty & Personal Care | Tattoo Artists & Studios | Cover-Ups, Fine Line, Black & Grey, Color, Dark-Skin Tattooing, Scar Camouflage | Consultations, Custom Tattoos, Touch-Ups |
| Health & Wellness | OB-GYN & Women's Health | Fibroids, Endometriosis, High-Risk Pregnancy, Menopause, Fertility | Consultations, Annual Exams, Procedures |
| Financial & Business Services | Accountants & Tax Professionals | Small Business Tax, Personal Tax, Tax Resolution, Nonprofit Accounting | Tax Filing, Bookkeeping, Payroll, Business Formation |
| Home & Property Services | Real Estate Agents & Brokers | First-Time Buyers, Investment Properties, Relocation, Luxury, VA Buyers | Buyer Representation, Seller Representation, Market Analysis |

---

## SPECIALTIES ARE SEARCHABLE

This is the key product value: someone shouldn't have to know the exact category hierarchy.

**Search: "alopecia"**
→ Hair Salons & Stylists → Specialty: Alopecia Care

**Search: "cover up tattoo"**
→ Tattoo Artists & Studios → Specialty: Cover-Ups

**Search: "tax attorney"**
→ Attorneys & Law Firms → Specialty: Tax Law

**Kinfolk query: "I need a Black hairstylist who works with alopecia."**
→ Combines: service + specialty + ownership + location + community experience

---

## RULES

**1. Specialties use a controlled, subcategory-specific list**
Not uncontrolled free text. Businesses select from curated options per subcategory.

**2. Custom specialty additions go to admin review**
Allow "+ Add a specialty we missed" but suggestions go into a review queue before becoming system-wide options. Otherwise we end up with:
- Tax Attorney / Tax Law / Taxes / Tax Lawyer / IRS Attorney

**3. Multiple specialties allowed — 5 to 8 initially**

**4. Specialties ≠ Services**
- Specialty: what they're expert at ("Alopecia Care")
- Service: what you can actually book ("Wash & Go, Trim, Braids")

**5. Display prominently**
```
Specializes in:
Alopecia Care · Natural Hair · Protective Styles · Silk Press
```

---

## IMPLEMENTATION NOTES (FOR WHEN AUTHORIZED)

**Schema additions needed:**
- `specialties` JSONB string[] on `businesses` table (business-provided, subcategory-gated controlled list)
- `services` JSONB string[] on `businesses` table or `business_identity` (business-provided, bookable/hireable list)
- Specialty → subcategory mapping table for controlled vocabulary enforcement
- Admin review queue for custom specialty suggestions

**Search integration:**
- GET /businesses should accept `specialty` as a filter param
- Kinfolk system prompt should include business specialties when recommending
- Library/browse should be able to filter by specialty

**Do NOT implement until:**
1. Vocabulary is built category by category across all subcategories
2. Single consolidated master workbook update is complete
3. Single controlled Replit handoff document is prepared

---

## PENDING VOCABULARY TO BUILD (in progress)

Beauty supply ✅ (see MWM-Beauty-Supply-Vocabulary.md)  
Travel Agents ✅ (see MWM-Business-Vocabulary-Delta-Additions.md)  
Accountants / Tax ✅  
Insurance ✅  
Hair Salons (alopecia, natural, locs, protective styles) — pending  
Tattoo Artists (cover-ups, dark skin, fine line) — pending  
OB-GYN & Women's Health — pending  
Attorneys — pending  
Real Estate — pending  
And remaining subcategories...
