# MWM Business Website + Digital Presence Audit — Full Specification
*Source: Founder strategic document, August 9, 2026*
*Status: Phase 1 (Inventory) authorized. No database modification until Phase 3 authorized by founder.*

## Core Rules (Non-Negotiable)

- DO NOT delete businesses
- DO NOT overwrite good existing data without evidence
- DO NOT modify test/demo businesses
- DO NOT invent websites
- DO NOT create duplicate businesses
- DO NOT mark closed solely because a website cannot be found

## Phased Execution

| Phase | Action | Authorization |
|---|---|---|
| 1 | Inventory and classify every real business | Pre-authorized |
| 2 | Research/validate websites and official digital presence | Pre-authorized |
| 3 | Produce proposed update table | Pre-authorized (output only) |
| STOP | Founder reviews results | Required before Phase 4 |
| 4 | Controlled bulk update | Founder authorization required |
| 5 | Post-update verification | After Phase 4 |

## Website Discovery — Source Priority

```
LEVEL 1 — Official business-owned website/domain
LEVEL 2 — Official social profile (Instagram, Facebook, TikTok, YouTube, LinkedIn)
LEVEL 3 — Authoritative organization page (museum, university, nonprofit)
LEVEL 4 — Government / tourism / historic source (NPS, state preservation, city tourism)
LEVEL 5 — Reputable third-party directory (only to confirm existence)
```

NOT acceptable: scraped directories, SEO spam, AI-generated directories, coupon sites, unverified blogs.

## Website Status Values

```
verified_official
official_social_only
authoritative_external_page
redirected_valid
temporarily_unavailable
domain_parked
wrong_business
not_found
needs_review
```

## Action Values Per Business Record

```
KEEP
ADD WEBSITE
UPDATE WEBSITE
ADD SOCIALS
FLAG FOR REVIEW
POSSIBLE DUPLICATE
HISTORIC/CLOSED — PRESERVE
NO DIGITAL PRESENCE FOUND
```

## Confidence Levels

```
HIGH   = official source + identity/location match → candidate for automatic update
MEDIUM = strong authoritative evidence but no business-owned site
LOW    = potential match requiring founder review → do NOT auto-modify
```

## Required Per-Record Audit Fields

```
Business ID | Business Name | City | State | Country | Tour Guide? Y/N
Current Website | Website Status | Proposed Official Website
Instagram | TikTok | Facebook | YouTube
Operating Status | Location Match Confidence
Duplicate Candidate? | Historic/Legacy? | Source Used | Action | Notes
```

## Operating Status Values

```
operating | temporarily_closed | seasonal | relocated | closed | historic_only | unknown
```

## Key Rules

### Location Matching Required
Name match alone is NOT enough. Confirm using: business name, city, state, address, phone, owner/founder, category, social handles.

### Historical / Cultural Businesses
If original business no longer operates — DO NOT DELETE. Reclassify as historic/legacy/former/museum. Best URL = official history/museum/NPS/historical society page.

### Ownership — Do Not Guess
Do NOT infer ownership from photos, names, neighborhood, cuisine, language, or appearance. Existing designations remain unless reliable evidence supports correction.

### Claim Status Unchanged
Website discovery = DIGITAL PRESENCE CONFIRMED. It does NOT mean: Business Claimed, Ownership Verified, Safe, MWM Recommended.

### Source Provenance
For every enriched field, capture: source_url, source_type, verified_at, verification_method.

### Data Protection Workflow

```
KEEP → UPDATE → ADD → FLAG
NOT destructive replacement
```

Never replace populated field with NULL because research failed.
Never downgrade an official website to a directory or social page.

## Schema Notes

Social media must use separate fields:
```
website_url | instagram_url | tiktok_url | facebook_url | youtube_url | linkedin_url
```

Do NOT put Instagram URL into website_url field.

## KinfolkAI Audit (Included)

Report whether these fields are currently available to KinfolkAI retrieval:
business website, official social profiles, description, category/subcategory, specialties, ownership, Vibes, THE REAL, location, Tour Guide relationships.

## Final Numbers Required

```
Total legitimate businesses audited:
Tour Guide businesses audited:
Official websites already valid:
Official websites newly found:
Broken existing websites:
Official social-only businesses:
Historic/closed businesses:
No digital presence found:
Possible duplicates:
Low-confidence records requiring founder review:
Test/demo businesses excluded:
```

STOP BEFORE DATABASE UPDATE.
