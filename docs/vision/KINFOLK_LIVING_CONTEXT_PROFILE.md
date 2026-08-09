# KinfolkAI — Living Context Profile Architecture

> **Status:** Approved vision. Awaiting "Please implement." authorization before any build begins.

---

## Core Philosophy

> **Kinfolk should remember the person, recognize the chapter, and never confuse the chapter with the whole person.**

New information should modify relevance, not erase history. Someone can move through major life chapters while remaining the same person with stable preferences, trusted businesses, and years of saved interests.

---

## First-Time Onboarding Questionnaire

Tap-based, skippable, ~2–3 minutes. 15 questions:

1. **What would you like Kinfolk to help you most right now?** (up to 3)  
   Find places near me · Travel planning · Food & dining · Beauty & hair · Health & wellness resources · Family & parenting · Community & culture · Events & nightlife · Professional services · Relocation · Business discovery · Shopping · Education · Safety information · Just exploring

2. **What kinds of places feel most like you?**  
   Chill · Grown & sexy · Family-friendly · Turn up · Creative · Romantic · Luxury · Neighborhood staple · Culturally rooted · Outdoors/adventure · Quiet & restorative · No preference yet

3. **Who are you usually planning for?** (multiple selections)  
   Just me · Partner/date · Friends · Family · Kids · Parents/elders · Coworkers/business · It changes

4. **When Kinfolk recommends something, what matters most?**  
   Culture/community connection · Safety/comfort · Price · Reviews from people I trust · Convenience · Quality · Accessibility · Atmosphere · Ownership · Family friendliness · Local favorites · Something new

5. **What price ranges should Kinfolk usually consider?**  
   Budget-friendly · Moderate · Treat myself · Luxury · Show me everything

6. **Are there communities or ownership types you especially like supporting?**  
   Use canonical ownership vocabulary. Multiple selections allowed. "No preference / show me everything" must be prominent. **User-selected only — never inferred.**

7. **What kinds of food do you enjoy?**  
   Broad cuisines first, then optional specifics. Also: Vegetarian · Vegan · Halal · Kosher · Gluten-conscious · Allergy-aware · No restrictions · Prefer not to say

8. **Anything you usually avoid when choosing food or experiences?**  
   Dietary restrictions, allergies, alcohol-centered environments, loud spaces, smoking, stairs, long waits, very late nights, etc. Optional.

9. **What does a good beauty or self-care recommendation need to understand about you?**  
   Hair · Skin · Nails · Barbering · Makeup · Spa/wellness · Tattoos/piercings · I'm not looking for beauty recommendations right now  
   If Hair selected, optional secondary: Natural hair · Locs · Braids/protective styles · Wigs · Relaxed hair · Alopecia/thinning support · Color-treated hair · Children's hair · Scalp care. **Not required during general onboarding.**

10. **Are there life topics you want Kinfolk to keep in mind?** (clearly labeled optional, editable anytime)  
    Travel · Dating/relationships · Wedding/anniversary · Parenting · Pregnancy/family building · Caregiving · Career/business · Moving/relocation · College/student life · Retirement · Grief/loss · Wellness goals · None right now

11. **How much should Kinfolk personalize?**  
    Keep it simple · Use what I save and tell you · Get very personalized over time

12. **How do you like recommendations delivered?**  
    Give me the best few · Give me options to compare · Surprise me sometimes · Stick close to what I already like

13. **How far are you usually willing to go for something worth it?**  
    Nearby only · 15 minutes · 30 minutes · 45+ minutes · If Kinfolk says it's worth the drive, I'll go

14. **Would you like Kinfolk to learn from what you save, tap, visit, and dismiss?**  
    Yes · Yes, but let me review what it learns · No, only use what I directly tell you  
    **The middle option is strongly recommended — offer it prominently.**

15. **Anything Kinfolk should know that these questions missed?**  
    Optional free text. Helper copy: *"Tell Kinfolk anything that would make recommendations feel more like they were made for you."*

---

## Three-Layer Memory Architecture

These three must **never be collapsed into a single "user profile."**

### Layer 1 — Stable Preferences
Changes infrequently. User-directed.
- Favorite cuisines, budget range
- Hair/beauty interests and needs
- Accessibility needs the user chooses to save
- Preferred environments and atmospheres
- Travel style and distance tolerance
- Owned/trusted community types

### Layer 2 — Current Chapter (Life Context)
Can change. Explicitly user-set. Does **not** overwrite history.
- Fertility/pregnancy journey
- College / student life
- Relocation
- Anniversary or special occasion coming up
- Caregiving
- Grieving / loss
- Training for a goal
- Career transition

**Rules:**
- New context modifies relevance — it does not erase earlier context
- Pregnancy loss: immediately stop cheerful pregnancy/baby nudges; surface grief/support/community resources only if user has indicated welcome. **Kinfolk must never infer a loss from searches, missed activity, or medical-looking behavior.**
- When a temporary context resolves, previously learned preferences naturally re-enter without Kinfolk needing to relearn them

### Layer 3 — Behavioral Evidence
Learned passively from user actions.
- Saves and dismissals
- Repeat searches
- Places visited
- Vibes tapped
- THE REAL tags trusted
- Categories repeatedly explored

---

## "What Kinfolk Knows About Me" Profile View

Users can open their profile and see/edit:

- **My Preferences**
- **My Current Chapter**
- **My Interests & Saved Topics**
- **My Beauty & Wellness Needs**
- **My Food Preferences**
- **My Travel Style**
- **My Accessibility Preferences**
- **What Kinfolk Has Learned**

**Rule: Changing one section must never wipe out another.**

---

## Life Chapter Example (Canonical)

| Chapter | What Kinfolk does |
|---|---|
| Fertility treatment | Weights relevant wellness/beauty resources user has saved |
| Pregnancy added | Pregnancy becomes active context; fertility history remains |
| Pregnancy loss | Stops cheerful nudges; surfaces grief/support only if welcomed; never deletes history |
| Later pregnancy | Understands this is not a first pregnancy; can offer gentler language and rainbow-baby resources if user welcomes |

Restaurant example:
- **Preference:** "I love sushi."
- **Current context:** "Some choices temporarily unsuitable."
- **History:** "Still one of my favorite cuisines."
When the temporary context changes, sushi re-enters recommendations without relearning.

---

## The Flywheel

1. Onboarding gives Kinfolk enough context to avoid being generic
2. Every save/tap/search improves relevance
3. Explicit profile updates provide stronger signals
4. Temporary life contexts reshape recommendations without rewriting the person's history
5. Community intelligence gives Kinfolk increasingly better things to recommend

---

*Captured from founder advisor session, August 9, 2026. No implementation until "Please implement." authorization.*
