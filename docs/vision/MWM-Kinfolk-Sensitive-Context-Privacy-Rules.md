# MAPPING WITH MELANIN™
## KINFOLK SENSITIVE-CONTEXT PRIVACY & PERMISSION RULES

**STATUS:** Founder-approved specification. Hard privacy rule — not a preference.  
**GATE:** Audit required before implementation. See Audit Requirements section at end.

---

## CORE PRINCIPLE

> **`Saved ≠ permission to personalize`**

A user's Library, saved topics, searches, health interests, life events, safety activity, and other sensitive information must NOT automatically become general Kinfolk recommendation context.

**Kinfolk must distinguish:**

| Permission State | Meaning |
|---|---|
| **Saved for me** | Member can find it later |
| **Use with Kinfolk** | Member explicitly permits Kinfolk to use it for relevant personalization |
| **Use only when I bring it up** | Kinfolk may use it inside that specific conversation/context, but not introduce it elsewhere |

---

## SENSITIVE TOPICS DEFAULT TO PRIVATE

Sensitive topics should default to:

> **"Saved privately — Kinfolk will not use this in unrelated suggestions."**

Examples include, but are not limited to:

health conditions · fertility · pregnancy · pregnancy loss · HIV/AIDS · sexual health · mental health · substance-use recovery · domestic violence · discrimination incidents · immigration/legal concerns · financial hardship · sexuality/gender-related resources · disability information · grief and other highly personal life circumstances

> Do not infer that a saved article means the member personally has the condition or circumstance.

---

## ASK AT THE MOMENT OF RELEVANCE

When appropriate, Kinfolk may ASK whether the member wants the topic to influence recommendations.

**Example:**

Member saves: **High Blood Pressure**

Kinfolk may offer:

> "Would you like me to keep this in mind when you ask for food or wellness recommendations?"
>
> - `Yes, use when relevant`
> - `Only when I bring it up`
> - `No — just keep it in my Library`

If the member chooses No, Kinfolk must not later say:

> ~~"Because of your blood pressure, here are heart-healthy restaurants."~~

---

## HIV/AIDS EXAMPLE

If a member saves HIV/AIDS information, Kinfolk must NOT spontaneously expose that context in:
- restaurant suggestions
- travel recommendations
- notifications
- homepage prompts
- business recommendations
- shared-device suggestions
- conversation starters
- "because you saved..." labels

unless the member has explicitly permitted that use.

Even when permission exists, Kinfolk should only use it in a context where it is actually relevant.

---

## NO CROSS-MIXING OF SENSITIVE CONTEXT

Sensitive information must not casually bleed into unrelated recommendation domains.

**Example:**

`HIV resource saved`

does NOT automatically become:
- travel profile
- restaurant profile
- dating profile
- community suggestions
- business discovery
- visible Kinfolk greeting

Permissions should be **purpose-specific**, not one blanket "personalize everything" switch.

---

## CONTEXTUAL PERMISSION MODEL

**Recommended internal permission states:**

```
private_saved
use_when_user_mentions
use_for_relevant_personalization
temporarily_use_in_this_conversation
do_not_use
```

The user should be able to change this at any time.

---

## SHARED-DEVICE / SOMEONE-HAS-MY-PHONE PROTECTION

Kinfolk must assume that another person may temporarily see or use a member's device.

Therefore sensitive saved information should NOT appear unexpectedly in:
- suggested prompts
- autocomplete
- home-screen recommendations
- push notifications
- notification previews
- recent-topic chips
- generic Kinfolk greetings
- "You may also like..." recommendations

unless the member has specifically permitted that level of visibility.

---

## KINFOLK SHOULD NEVER OUT THE USER TO THEMSELVES ON SCREEN

Avoid messages such as:
- ~~"Since you have HIV..."~~
- ~~"Because you experienced pregnancy loss..."~~
- ~~"Based on your fertility treatment..."~~

unless the member is actively discussing that subject and has permitted the context.

Prefer neutral language where appropriate:

> "Would you like recommendations that take your saved health preferences into account?"

---

## TEMPORARY CONVERSATION PERMISSION

A member may want Kinfolk to know something for ONE conversation without permanently saving it.

**Example:**

> "I'm helping my sister who is pregnant."

Kinfolk must not conclude `user is pregnant` and must not permanently change the user's profile.

Offer: **"Use this for this conversation only"** where appropriate.

---

## RELATIONSHIP TO KINFOLK LIVING CONTEXT MODEL

The existing Kinfolk model:
- **Stable Preferences**
- **Current Chapter**
- **Behavioral Evidence**

Sensitive information adds a fourth requirement:

- **Permission Scope**

Therefore:

> **`Context + Permission = Personalization`**
>
> Context without permission is not enough.

---

## BEHAVIORAL EVIDENCE CANNOT OVERRIDE PRIVACY

Kinfolk may notice repeated behavior, but it must NOT use behavioral inference to create sensitive facts.

| Behavior | Must NOT become |
|---|---|
| repeated fertility searches | "trying to conceive" |
| HIV article saves | "has HIV" |
| cancer searches | "has cancer" |
| immigration-law searches | "undocumented" |
| LGBTQIA+ searches | LGBTQIA+ identity |
| grief resources | confirmed bereavement |

Kinfolk may recognize an **interest pattern**, but sensitive personal status requires explicit user disclosure before becoming personal context.

---

## PROFILE CONTROL

Add to: **What Kinfolk Knows About Me** → a section: **Private & Sensitive Context**

Each item should show:
- `Saved privately`
- `Kinfolk can use when relevant`
- `Only use when I bring it up`

with an **Edit** control.

Users should also have: **Clear from Kinfolk** — which removes personalization permission without necessarily deleting the Library item itself.

---

## FORGETTING / CHANGING CONTEXT

If a member changes permission or removes a sensitive context: stop using it immediately for future personalization. Do not erase unrelated historical preferences.

**Example:**

`fertility → pregnancy → pregnancy loss → later pregnancy`

should be represented as changing explicitly provided context with individual permission states — not one overwritten health label.

---

## NOTIFICATIONS

Sensitive context should default to:

**No sensitive text in notification previews.**

Even if a user allows relevant personalization, a notification should avoid exposing private context on a lock screen.

**Avoid:**
> ~~"3 new HIV resources near you"~~

**Safer:**
> "You have new saved-topic resources"

unless the user explicitly enables detailed sensitive notifications.

---

## LIBRARY SAVE UX

For ordinary topics (e.g., "Ghanaian history"): no interruption needed.

When a sensitive topic is saved, show a quiet permission sheet:

> **Saved to your Library ✓**
>
> **Should Kinfolk use this when it could help personalize your experience?**
>
> - `Yes, when relevant`
> - `Only when I mention it`
> - `No, keep this private`

That is enough. No giant privacy questionnaire.

---

## CORE ARCHITECTURE PRINCIPLE

> **Kinfolk can remember what you choose to share without assuming permission to repeat it.**

> **Sensitive information may be stored, retrieved, and personalized under different permissions. Access to one does not imply access to the others.**

This protects the exact situation: someone can have your phone, ask Kinfolk where to eat, and **nothing private about your health, fertility, sexuality, grief, legal situation, or other sensitive context should suddenly appear because it happened to exist in your Library.**

---

## AUDIT REQUIRED BEFORE IMPLEMENTATION

Replit should audit:
- Library saves
- Kinfolk preferences
- Kinfolk prompt construction
- conversation history
- profile context
- notifications
- recommendation engine
- behavioral-learning logic
- sensitive-topic storage

Return for each:

| Data Type | Currently Accessible to Kinfolk? | Automatically Used? | Visible in UI? | Appears in Notifications? | Permission Currently Exists? | Required Correction |
|---|---|---|---|---|---|---|

**Do not implement a blanket "Kinfolk can use my Library" permission.**

Permission must be granular enough to protect sensitive information.
