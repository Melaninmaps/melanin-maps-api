# Mapping With Melanin™ — Business Placeholder Image System
**Priority:** HIGH — Must be implemented before any new businesses are surfaced to users  
**Source:** MWM_Replit_Business_Placeholder_Image_Instructions_1786168571119.pdf

---

## The Problem

Bulk-seeded businesses do not have owner-uploaded photos. The placeholder strategy must be:
1. **Culturally respectful** — NEVER assign stereotypical images based on cuisine, ownership ethnicity, or neighborhood
2. **Premium and intentional** — Should feel designed, not broken
3. **Incentivizing** — Makes business owners WANT to claim their page and upload their own photo
4. **Consistent** — Every unclaimed business gets the same treatment regardless of category or ownership

---

## The Solution: Branded Placeholder Card + Category Icon

### Visual Hierarchy
```
┌─────────────────────────────────────────┐
│                                         │
│         [Category Icon - centered]      │
│         (neutral, monochrome/gold)      │
│                                         │
│         ─── Business Name ───           │
│                                         │
│     "Claim this business to add         │
│      your photo & story"                │
│                                         │
│         [MWM watermark - subtle]        │
│                                         │
└─────────────────────────────────────────┘
```

### Design Specifications

| Element | Specification |
|---|---|
| Background | MWM brand gradient (warm cream → soft gold) or solid warm neutral (#FAF7F2) |
| Category Icon | Centered, 48-64px, monochrome gold (#C8960C) or dark charcoal (#2D2D2D) |
| Business Name | Centered below icon, bold, 16-18px, dark charcoal |
| CTA Text | "Claim this business to add your photo & story" — 12px, muted gray |
| MWM Watermark | Bottom corner, very subtle, 8px opacity 30% |
| Border/Card | Soft rounded corners (12px), subtle shadow |
| Aspect Ratio | 16:9 for list cards, 1:1 for map pin previews |

---

## Category Icon Mapping

Use NEUTRAL, non-stereotypical icons. These represent SERVICE TYPE only — never culture, cuisine origin, or ownership ethnicity. Use SVG icons (NOT emoji). Clean line-art style, monochrome gold or charcoal.

| Main Category | Icon Description | What NOT to use |
|---|---|---|
| Food & Drink | Simple utensils (fork & knife) | NOT a taco, NOT fried chicken, NOT chopsticks |
| Beauty & Personal Care | Scissors | Universal beauty symbol |
| Health & Wellness | Heart/care symbol | — |
| Shopping & Retail | Shopping bag | Neutral retail bag |
| Travel & Hospitality | Suitcase | Travel symbol |
| Arts, Culture & Entertainment | Theater masks | Performance/arts |
| Professional Services | Briefcase | Professional symbol |
| Home & Property Services | House | Home symbol |
| Automotive & Transportation | Car/vehicle | Vehicle symbol |
| Events & Celebrations | Party/celebration symbol | — |
| Education & Learning | Books | Learning symbol |
| Children & Family | Baby/family | Family symbol |
| Community & Nonprofit | Handshake | Community symbol |
| Faith & Spirituality | Dove | NOT a cross, NOT a crescent, NOT a star |
| Media & Creative Services | Clapperboard | Creative/media |
| Sports & Recreation | Ball/activity | Activity symbol |
| Pets & Animal Services | Paw print | Animal care |
| Technology & Digital Services | Laptop | Tech symbol |
| Financial & Business Services | Chart | Finance symbol |
| Legal & Government Services | Scales of justice | Justice/legal |
| Agriculture & Specialty Producers | Seedling | Growth/farming |
| Other Services | Star | General quality |

---

## Absolute Rules

### ❌ NEVER DO:
1. NEVER assign a food image based on cuisine type (no tacos for Mexican, no jollof for Nigerian, no soul food for Black-owned)
2. NEVER assign a cultural image based on ownership ethnicity
3. NEVER use AI-generated placeholder photos of food, people, or storefronts
4. NEVER use stock photos of any kind
5. NEVER use the same generic photo for multiple businesses
6. NEVER pull images from Google, Yelp, or any third-party source without explicit owner permission
7. NEVER assign different placeholder styles based on ownership designation
8. NEVER use religious symbols as category icons for faith businesses (use the neutral dove)

### ✅ ALWAYS DO:
1. ALWAYS use the same branded placeholder system for ALL unclaimed businesses regardless of category, ethnicity, or location
2. ALWAYS display the business name on the placeholder (makes it feel intentional, not broken)
3. ALWAYS include the claim CTA — this drives business owner engagement
4. ALWAYS use the category icon matching the business's Main Category
5. ALWAYS make the placeholder look premium — this represents the MWM brand

---

## When Photos DO Appear

| Source | When It Shows |
|---|---|
| Owner uploads after claiming | Immediately upon approval |
| Community member submits a photo | After moderation review |
| Cultural ambassador posts content | After moderation review |
| Founder manually adds during tour | Immediately (admin privilege) |

**Photo moderation rules:**
- No photos of people without their consent
- No photos that could identify a reporter (safety)
- Business exterior/interior photos are always safe
- Food photos are safe when submitted by the person who visited
- Owner-uploaded photos get priority placement over community photos

---

## Implementation Checklist

- [ ] Create SVG icon set for all 22 categories (monochrome, two sizes: 48px and 64px)
- [ ] Build the placeholder card component (React Native for mobile, React for web)
- [ ] Ensure placeholder renders at both 16:9 (list view) and 1:1 (map pin preview) aspect ratios
- [ ] Add `has_owner_photo` boolean field to businesses table (default: false)
- [ ] When `has_owner_photo = false`, render placeholder card instead of image
- [ ] When business is claimed and owner uploads photo, set `has_owner_photo = true`
- [ ] Placeholder card: `<BusinessPlaceholder category={mainCategory} name={businessName} />`
- [ ] Test that ALL 22 category icons render correctly
- [ ] Verify no cultural stereotyping in any placeholder across all seeded businesses

---

## Verification Test

After implementation, provide screenshots showing:
1. A Food & Drink business placeholder (should show fork & knife, NOT food)
2. A Beauty business placeholder (should show scissors)
3. A Faith business placeholder (should show dove, NOT a cross)
4. A Health business placeholder (should show heart)
5. All should look identical in style, differing ONLY in the category icon and business name

**The test passes when:** A person looking at any placeholder cannot determine the ethnicity of the business owner or the cultural origin of the business from the placeholder image alone.

---

## Why This Matters

> "When I first used Replit, they used an image of a taco for Hispanic. We need to be culturally sensitive." — Founder

MWM serves 91+ ownership designations across the entire diaspora. A placeholder system that assigns images based on assumptions is reductive, stereotyping, and disrespectful.

The branded placeholder says: "We know you're here. We respect you. Your space is ready when you are."

---

## Component API

```tsx
// Both mobile (React Native) and web (React)
<BusinessPlaceholder
  category={mainCategory}   // string — one of the 22 main categories
  name={businessName}       // string — displayed below icon
  aspectRatio="16:9"        // "16:9" (list) | "1:1" (map pin preview)
/>
```
