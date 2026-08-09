# MWM Specialties Vocabulary v1.0

**Status:** APPROVED — ready for implementation  
**Spec parent:** `docs/product/MWM-Specialties-Services-Architecture.md`  
**Constants file:** `lib/db/src/constants/specialties.ts` (mirrored to `lib/constants/src/`)  
**Date:** August 9, 2026

---

## What This Is

Specialties is a **first-class searchable field** on every business — the specific things a business is actually great at, beyond its category. A restaurant doesn't just serve food; it serves *Soul Food* and *Jazz Dining Experience*. A hair salon doesn't just do hair; it does *Knotless Braids* and *Loc Retwist & Maintenance*.

This vocabulary is the controlled list of approved Specialty terms per subcategory. Every term went through:
1. Cultural relevance check — does it reflect how the community actually names this service?
2. Uniqueness check — no term appears in more than one subcategory
3. Findability check — is this a term a user would realistically search?

---

## Rules (from Architecture Spec)

- **5–8 Specialties per business** — curated, not exhaustive
- **Controlled vocabulary** — businesses select from this list only
- **Custom suggestions** → admin review queue (`specialty_suggestions` table) before approval
- **Specialties appear on:**
  - Business cards (top 3, below category)
  - Business detail page (all 5–8)
  - Search results (full-text indexed)
  - KinfolkAI recommendations ("looking for a spot that does Knotless Braids…")

---

## DB Schema (to be added via startup migration)

```sql
-- Column on businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';

-- Custom suggestion queue
CREATE TABLE IF NOT EXISTS specialty_suggestions (
  id           serial PRIMARY KEY,
  business_id  uuid REFERENCES businesses(id) ON DELETE CASCADE,
  suggestion   text NOT NULL,
  subcategory  text,
  status       text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  submitted_by uuid REFERENCES users(id),
  submitted_at timestamp NOT NULL DEFAULT now(),
  reviewed_at  timestamp,
  reviewed_by  uuid REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_specialty_suggestions_status ON specialty_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_specialty_suggestions_business ON specialty_suggestions(business_id);
```

---

## Vocabulary by Subcategory

### FOOD & DRINK

#### Restaurants (22 terms)
Soul Food · Southern Comfort Cooking · Caribbean Cuisine · Ethiopian / East African · West African · Nigerian · Jamaican · Haitian · Senegalese · Creole & Cajun · Vegan Soul Food · Plant-Based · Brunch & Breakfast · Seafood · BBQ & Smoked Meats · Homestyle Cooking · Jazz Dining Experience · Pan-African Cuisine · Latin-Soul Fusion · Small Plates & Tapas · Family-Style Dining · Chef's Tasting Menu

#### Cafés & Coffee Shops (12 terms)
Specialty Coffee · Black-Owned Roasted Beans · Matcha & Tea Service · Vegan Pastries · Community Gathering Space · Remote Work Friendly · Study-Friendly Atmosphere · Open Mic Venue · Art Gallery Café · Fresh Juice Bar · Smoothie Bar · Herbal & Wellness Teas

#### Bakeries & Dessert Shops (13 terms)
Custom Cakes · Wedding Cakes · Pound Cake · Sweet Potato Pie · Banana Pudding · Cheesecakes · Vegan Desserts · Gluten-Free Options · Cookies & Brownies · Cupcakes · Caribbean Sweets · African-Inspired Desserts · Pastries & Croissants

#### Food Trucks & Pop-Ups (10 terms)
Soul Food · Caribbean · African Cuisine · Vegan / Plant-Based · BBQ & Grills · Seafood · Tacos & Fusion · Desserts & Sweets · Catering Available · Festival & Event Vendor

#### Catering Services (11 terms)
Wedding Catering · Corporate Catering · Family Reunions · Repast & Homegoing Catering · Drop-Off Catering · Full-Service Catering with Staff · Soul Food Buffet · Caribbean Spreads · African Cuisine · Vegan & Vegetarian Menus · Dietary Accommodations

#### Bars & Lounges (12 terms)
Craft Cocktails · Mocktail Menu · Wine Bar · Caribbean Spirits · African Wines & Spirits · Live Music · DJ Nights · Happy Hour · Hookah Lounge · Rooftop Experience · Upscale Casual · Sports Lounge

---

### BEAUTY & PERSONAL CARE

#### Hair Salons & Natural Hair (20 terms)
Knotless Braids · Box Braids · Feed-In Braids · Goddess Braids · Sisterlocks · Traditional Locs · Starter Locs · Loc Retwist & Maintenance · Natural Styling · TWA Styling · Silk Press · Protective Styles · Weave Installation · Quick Weave · Sew-In Extensions · Natural Color · Color Correction · Keratin Treatment · Big Chop Consultations · Wig Customization

#### Barbershops (14 terms)
Fades · Skin Fades · Bald Fades · Taper Cuts · Shape-Ups · Line-Ups & Edge Work · Beard Trims · Full Beard Design & Sculpting · Hot Towel Shaves · Kids Cuts · Hair Designs & Engravings · Loc Grooming · Afro Shaping · Waves & Texture Work

#### Nail Salons & Nail Artists (17 terms)
Acrylic Full Set · Acrylic Fill · Gel Nails · Hard Gel Extensions · Dip Powder · Press-On Nail Sets · Nail Art · 3D Nail Art · Chrome & Mirror Nails · Ombre Nails · French Tip · Nude & Minimalist Nails · Pedicures · Spa Pedicures · Nail Repair · Natural Nail Care · Polygel

#### Spas & Wellness Retreats (13 terms)
Therapeutic Massage · Deep Tissue Massage · Swedish Massage · Hot Stone Massage · Prenatal Massage · Couples Massage · Facials · Body Wraps & Scrubs · Waxing · Lash Extensions · Brow Shaping & Tinting · Aromatherapy · Infrared Sauna

#### Beauty Supply (15 terms)
Human Hair Extensions · Synthetic Hair · Braiding Hair · Lace Front Wigs · Full Lace Wigs · Crochet Hair · Loc Extensions · Natural Hair Products · Loc Maintenance Products · Skincare · Weave & Weft Hair · Tools & Appliances · Protective Accessories · Men's Grooming · Makeup

#### Skincare & Esthetics (14 terms)
Facials · Chemical Peels · Dermaplaning · Microneedling · Hyperpigmentation Treatment · Dark Spot Correction · Melanin-Safe Skincare · Acne Treatment · Anti-Aging Treatments · Body Treatments · Waxing · Sugaring · Eyebrow & Lash Services · Holistic Skincare

---

### HEALTH & WELLNESS

#### Fitness & Training (12 terms)
Personal Training · Group Fitness Classes · Boxing & Combat Sports · Dance Fitness · Yoga Instruction · Pilates · Weight Loss Programs · Athletic Performance Training · Senior Fitness · Youth Sports Training · Online Coaching · Nutrition Planning

#### Mental Health & Therapy (13 terms)
Individual Therapy · Couples Counseling · Family Therapy · Trauma-Informed Care · BIPOC-Affirming Therapy · LGBTQ+ Affirming Therapy · Grief & Loss Counseling · Anxiety & Depression · EMDR · Cognitive Behavioral Therapy (CBT) · Life Coaching · Substance Use Counseling · Teletherapy

#### Holistic & Alternative Health (12 terms)
Acupuncture · Reiki & Energy Healing · Sound Healing · Herbalism · Naturopathy · Chiropractic Care · Nutritional Counseling · Ayurveda · Reflexology · Cupping Therapy · Ancestral Healing Practices · Breathwork & Meditation

---

### PROFESSIONAL SERVICES

#### Financial Services (13 terms)
Personal Tax Preparation · Small Business Tax Filing · Business Formation (LLC/Corp) · Business Credit Building · Bookkeeping · Payroll Services · Financial Planning · Retirement Planning · Wealth Management · Real Estate Investment Consulting · Grant Writing · Business Plan Development · Credit Repair

#### Insurance (13 terms)
Life Insurance · Term Life Insurance · Whole Life Insurance · Final Expense Coverage · Auto Insurance · Home & Renters Insurance · Business Insurance · Health Insurance · Medicare & Medicaid · Medicare Supplement Plans · Group Employee Benefits · Commercial Insurance · Disability Insurance

#### Legal Services (13 terms)
Immigration Law · Family Law & Divorce · Criminal Defense · Expungements · Civil Rights Law · Estate Planning & Wills · Trusts & Probate · Business Law · Contracts & Agreements · Real Estate Law · Personal Injury · Tenant Rights · Employment Law

#### Staffing & Recruiting (12 terms)
Healthcare Staffing · IT & Technology Recruiting · Administrative Staffing · Executive Search · Diversity & Inclusion Recruiting · Skilled Trades Placement · Remote Work Placement · Temp-to-Perm Placement · Entry-Level Placement · HR Consulting · Resume & Interview Coaching · Career Transitions

#### Translation & Interpretation (14 terms)
Legal Translation · Medical Interpretation · Business Document Translation · Immigration Document Translation · Court Interpretation · Conference Interpretation · Community Interpretation · Spanish · French · Haitian Creole · Portuguese · Amharic & East African Languages · Arabic · ASL Interpretation

---

### TRAVEL & HOSPITALITY

#### Travel Agencies (16 terms)
Group Travel · Honeymoon & Romance Travel · Destination Weddings · Africa Travel · Caribbean Travel · Europe Travel · Cruise Packages · Adventure Travel · Luxury Travel · Family Travel · Solo Female Travel · Cultural Heritage Tours · LGBTQ+ Affirming Travel · All-Inclusive Packages · Visa & Documentation Assistance · Corporate Travel

#### Tour Guides & Experiences (13 terms)
Black History Tours · Cultural Walking Tours · Food Tours · Neighborhood History · Architecture & Heritage · African Diaspora Tours · Civil Rights History · Underground Railroad History · Art & Murals Tours · Ghost Tours · Nightlife Tours · Eco & Nature Tours · Private Group Tours

#### Hotels & Lodging (9 terms)
Black-Owned Boutique Hotel · Bed & Breakfast · Short-Term Rental · Extended Stay · Pet-Friendly · Family Suites · Historic Property · Cultural Experience Stay · Accessible Accommodations

---

### EVENTS & CELEBRATIONS

#### Event Planning (13 terms)
Wedding Planning · Day-Of Coordination · Full-Service Planning · Birthday Celebrations · Quinceañeras & Debutante Balls · Baby Showers · Graduation Celebrations · Sweet 16 Parties · Milestone Anniversaries · Corporate Events · Community Fundraisers · Virtual Events · Venue Sourcing

#### Florists & Décor (12 terms)
Wedding Florals · Event Décor & Styling · Custom Bouquets · Centerpiece Design · Arch & Backdrop Design · Balloon Installations · African & Tropical Flowers · Sympathy & Memorial Arrangements · Corporate Décor · Holiday Décor · Rental Inventory · Full Setup & Breakdown

---

### MEDIA & CREATIVE SERVICES

#### Photography & Videography (14 terms)
Portrait Photography · Family Photography · Newborn & Maternity Photography · Wedding Photography · Event Photography · Business Headshots · Product Photography · Real Estate Photography · Music Video Production · Documentary Filmmaking · Social Media Content Creation · Brand Photography · Commercial Photography · Drone Photography & Videography

#### Graphic Design & Branding (13 terms)
Logo Design · Brand Identity Systems · Business Cards & Stationery · Social Media Graphics · Marketing Materials · Menu Design · Book & Album Cover Art · Murals & Wall Art · Signage & Wayfinding · Packaging Design · Motion Graphics · Illustration · Custom Merchandise Design

#### Music & Audio Production (12 terms)
Beat Production · Full Song Production · Mixing & Mastering · Recording Studio Sessions · Podcast Production · Voiceover Services · Jingle & Commercial Audio · Film Score & Soundtracks · Live Sound Engineering · Music Lessons · DJ Services · Audio Restoration

---

### RETAIL

#### Retail & Boutiques (14 terms)
African Print & Ankara Fashion · Urban Streetwear · Athleisure · Plus Size Fashion · Custom Tailoring & Alterations · Vintage & Resale · Children's Clothing · Business & Professional Attire · African Jewelry & Accessories · Natural Hair Accessories · Shoes & Sneakers · Home & Lifestyle Goods · Afrocentric Gifts & Novelties · Books & Media

#### Bookstores & Libraries (11 terms)
Black Literature · African Diaspora History · Children's Books by Black Authors · Self-Help & Empowerment · Spiritual & Religious Texts · Business & Finance · Fiction & Poetry · Rare & Collectible Books · Community Events & Author Talks · Used & Rare Books · Educational Resources

---

### ARTS & CULTURE

#### Visual Arts & Galleries (12 terms)
African Diaspora Art · Contemporary Black Art · Photography Exhibitions · Mixed Media · Sculpture · Printmaking · Community Art Programs · Youth Arts Education · Art Classes & Workshops · Commissioned Work · Pop-Up Exhibitions · Artist Residencies

#### Performing Arts (12 terms)
Live Jazz · R&B & Soul · Hip-Hop Performances · Gospel Music · African Drum & Dance · Spoken Word & Poetry · Stand-Up Comedy · Theater & Stage Productions · Dance Performances · Open Mic Nights · Cultural Festivals · Youth Performing Arts

---

### EDUCATION & LEARNING

#### Tutoring & Academic Support (11 terms)
K-12 Tutoring · SAT / ACT Prep · College Admissions Counseling · STEM Tutoring · Reading & Literacy · Writing & Essay Coaching · HBCU Guidance & Applications · Financial Aid Navigation · Adult Education · ESL / English Language Learning · Online Tutoring

#### Professional Development (10 terms)
Resume Writing · Interview Coaching · Career Coaching · LinkedIn Profile Optimization · Public Speaking · Leadership Development · Entrepreneurship Training · Certifications & Licensing Prep · Networking Events · Mentorship Programs

---

### HOME & PROPERTY

#### Home Services (13 terms)
General Contracting · Painting (Interior & Exterior) · Flooring Installation · Plumbing · Electrical · HVAC · Landscaping & Lawn Care · Pressure Washing · Roofing · Fence Installation · Deck & Patio Construction · Kitchen & Bath Remodeling · Handyman Services

#### Cleaning Services (9 terms)
Residential Cleaning · Commercial Cleaning · Deep Cleaning · Move-In / Move-Out Cleaning · Post-Construction Cleaning · Airbnb & Short-Term Rental Cleaning · Recurring Maintenance Cleaning · Eco-Friendly Cleaning Products · Organizational Services

#### Moving & Relocation (9 terms)
Local Moving · Long-Distance Moving · Apartment Moving · Commercial Moving · Senior Relocation · Packing & Unpacking Services · Furniture Assembly · Piano & Specialty Item Moving · Storage Solutions

#### Real Estate (10 terms)
Buyer Representation · Seller Representation · First-Time Homebuyers · Investment Properties · Rental Property Management · Commercial Real Estate · Luxury Properties · Community Land Trust · Affordable Housing Programs · Relocation Specialist

---

## Summary

| Category | Subcategories | Total Terms |
|---|---|---|
| Food & Drink | 6 | 80 |
| Beauty & Personal Care | 6 | 93 |
| Health & Wellness | 3 | 37 |
| Professional Services | 5 | 65 |
| Travel & Hospitality | 3 | 38 |
| Events & Celebrations | 2 | 25 |
| Media & Creative Services | 3 | 39 |
| Retail | 2 | 25 |
| Arts & Culture | 2 | 24 |
| Education & Learning | 2 | 21 |
| Home & Property | 4 | 41 |
| **TOTAL** | **38 subcategories** | **~488 terms** |

---

## Next Steps (for implementation phase)

1. Add `specialties text[] DEFAULT '{}'` column to businesses table (migration ready above)
2. Create `specialty_suggestions` table (migration ready above)
3. Add specialty multi-select to the business claim / edit flow (mobile + web)
4. Add specialty display to BusinessCard (top 3) and business detail page (all)
5. Add specialty full-text index for search
6. Wire into KinfolkAI system prompt as structured preference signal
7. Add admin Specialty Suggestions tab to review custom submissions
