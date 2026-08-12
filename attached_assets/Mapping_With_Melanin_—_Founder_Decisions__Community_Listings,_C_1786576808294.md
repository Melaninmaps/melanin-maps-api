# Mapping With Melanin — Founder Decisions: Community Listings, Claims, Verification, Outreach, and Owner Editing

**Status:** Finalized product policy for Replit implementation planning. This document updates the prior read-only design. It does **not** authorize data changes, outbound business contact, or automatic owner claims.

## The governing principle

Mapping With Melanin is a community-powered discovery platform. Every signed-in member may help surface a legitimate business, independent provider, creator, entrepreneur, professional, organization, or informal community service provider. A business does not need to be incorporated, licensed, or already on MWM to be listed. The platform must never invent facts, claim a provider is verified when it is not, or let a community contributor control someone else’s listing.

> **Community addition, ownership control, MWM verification, and owner outreach are four separate processes.**

---

# 1. Founder decisions and implementation policy

| Founder question | Final policy | Required implementation rule |
| --- | --- | --- |
| 1. Publication after community submission | Kinfolk may perform a bounded background search of public sources to enrich/validate a proposed listing. A listing with one matching public source may publish as community-added and unverified; an unmatched/ambiguous listing enters a curator queue. | No invented facts. Store the public source and only populate fields supported by that source. |
| 2. Who may suggest listings | **Every signed-in member** may suggest a business/service/provider. | A contributor ID is retained for audit and abuse controls, but never grants profile management. |
| 3. Sufficient public source | One matching public source is sufficient. **Instagram alone is acceptable** for an independent provider, creator, or community entrepreneur when it identifies the name, service/category, and city/service area. | For every category, Instagram is evidence of public presence—not MWM verification, licensure, ownership control, or safety. |
| 4. Sensitive categories | Sensitive/regulated categories remain discoverable if a legitimate source identifies them, but display a neutral heightened-caution disclosure when MWM has not verified the provider. | Do not suppress real providers merely for lacking MWM verification. Do not present them as credentialed, licensed, medically safe, legally qualified, financially endorsed, or vetted. |
| 5. Public badge language | Use the exact state copy in Section 3. | State labels must be composable so no one label implies another. |
| 6. Owner-control evidence and SLA | Use the inclusive, channel-control evidence standard in Section 4. Initial standard SLA is one business day for straightforward claims and up to three business days when disputed or insufficient. | Claims are free, manually approved, and never create verification. |
| 7. Owner outreach | **No business receives notification in release 1.** Store possible public outreach channels as drafts only. | No automatic email, contact-form submission, DM, Messenger contact, or notification. A later founder-approved release is required before sending. |
| 8. Owner editing | Use the field-by-field policy in Section 5. Owner information is distinct from community information. | Owners never delete or alter community reviews, safety data, community tags, feedback, or votes. |

---

# 2. Kinfolk-assisted community listing flow

## 2.1 Member intake

Every signed-in member sees **Add a Business, Service, or Provider**. Required member input is intentionally minimal:

| Input | Requirement |
| --- | --- |
| Public name | Required. The real public business/provider name. |
| Category/service | Required. Selectable from business, independent provider, creator, professional, organization, or community service categories. |
| City or service area | Required. A street address is optional. |
| Source link | Required. Official site, public Instagram/social account, booking page, public directory, or public community reference. |
| Optional description/contact | Accepted only when publicly supported; otherwise blank. |

The member must attest: **“I am submitting publicly available information about a real provider. I understand this does not make me the owner, manager, or verifier of this listing.”**

## 2.2 Kinfolk background research boundary

Kinfolk may run an asynchronous public-information check after submission. It may:

- fetch or inspect the submitted public source;
- search a narrow name + city/service-area query across approved public sources;
- normalize public name, category, city/service area, public website, public social handle, and public description;
- detect likely duplicate listings;
- create a source/provenance record for every retained fact;
- return a confidence outcome: `matched`, `ambiguous`, or `not_matched`.

Kinfolk may **not**:

- invent an address, phone number, email, license, ownership designation, service, hours, rating, review, credential, map coordinate, or social account;
- use private personal data or a private account as provenance;
- claim that a business is verified, licensed, insured, incorporated, or safe;
- send owner outreach;
- auto-claim the record for the contributor or anyone else.

## 2.3 Publication rule

| Kinfolk/source result | Publication state | Public presentation |
| --- | --- | --- |
| One clearly matching public source | `live` | Community Added · Unclaimed · Not Verified by MWM |
| Multiple matching sources | `live` | Same label; higher internal confidence only, not a public verification badge |
| Ambiguous identity, probable duplicate, conflicting location, or insufficient source | `pending_review` | Not public until curator resolves it |
| High-risk record with a matching public source | `live` with caution disclosure | Community Added · Unclaimed · Not Verified by MWM + sensitive-category disclosure |

A physical public address is required only for a physical map pin. A service-area, mobile, online, or home-based provider may be searchable without a pin. The UI must say **Service area** rather than fabricating a location.

---

# 3. Exact public status and caution language

## 3.1 State badges

Use these exact labels. They may appear as separate chips; they must not be collapsed into one misleading “verified” status.

| Condition | Required public copy |
| --- | --- |
| Community-sourced, no owner accepted | **Community Added** |
| No approved owner-control relationship | **Unclaimed** |
| Approved profile owner, no MWM verification | **Claimed by Owner** |
| MWM verification was not requested or not granted | **Not Verified by Mapping With Melanin™** |
| MWM granted a specific designation | **Verified by Mapping With Melanin™** plus the exact designation, e.g., **Verified Black-Owned** or **Third-Party Certified** |
| Informal/non-corporate provider | **Independent Provider** or **Community Entrepreneur** |
| Owner self-declared identity/ownership designation not separately verified | **Owner-Provided** placed beside the specific designation, never styled as an MWM verification badge |
| Community/provider record is under a legitimate moderation review | **Listing Under Review**; no accusation or negative inference |

## 3.2 Sensitive-category caution disclosure

Apply this disclosure to high-impact categories when the provider is listed but not verified by MWM. Relevant examples include medical/wellness, legal, financial, real estate/housing, childcare/youth, transportation, recovery, safety/security, and any category designated by MWM policy.

> **Important:** This provider is listed from public community information and has not been verified by Mapping With Melanin™. For services affecting your health, legal status, finances, housing, safety, or a child’s care, use heightened caution and independently confirm credentials, licensing where applicable, pricing, availability, and suitability before engaging.

This is a platform-status disclosure. It does not accuse the provider of wrongdoing or imply that unverified means unsafe.

---

# 4. Free owner-claim policy, evidence threshold, and reviewer SLA

## 4.1 Claim is free

A real owner or authorized manager can claim a live, unclaimed listing **at no cost**. No subscription, payment, or business tier is required to submit or receive a basic approved ownership-control relationship.

Claiming establishes the ability to manage owner-designated profile fields. It does not create an MWM verification badge and it does not change community information.

## 4.2 Initial inclusive evidence threshold

A claimant must be a signed-in member and provide:

1. their name, role (`owner`, `co-owner`, `manager`, or `authorized representative`), and a contact email;
2. an ownership-control attestation;
3. one **public-channel control signal** that reasonably connects them to the listing; and
4. one claim-specific note when the relationship is not obvious from the public channel.

Accept any one of the following public-channel control signals:

| Signal | Example |
| --- | --- |
| Official site/domain | A confirmation link or one-time code delivered through a public business-domain email or placed on a public official website/contact channel. |
| Public social account | A one-time claim code acknowledged through the public Instagram, TikTok, Facebook, or other official business account listed as provenance. |
| Public booking/profile channel | A code or confirmation through a public booking page/account that clearly identifies the provider. |
| Manual reviewer reconciliation | A reviewer can match the claimant’s public identity to the business through the documented source and claim explanation. This is appropriate for independent providers without a domain, LLC, or formal storefront. |

No LLC, EIN, corporate registration, business license, storefront, or website is required merely to establish MWM profile control. However, documents or credentials may be requested later for category-specific **verification**, not universally for claims.

## 4.3 SLA and outcomes

| Claim condition | Initial reviewer target | Outcome |
| --- | --- | --- |
| Clear public-channel control signal, no conflict | **One business day** | Approve or request one specific missing item. |
| Ambiguous identity or incomplete evidence | **Up to three business days** | Request clarification, reject with reason, or hold pending. |
| Competing claim, active dispute, or safety/fraud flag | **Up to three business days; escalation if needed** | Do not auto-approve; set ownership dispute state and preserve both records. |

Owners see a privacy-safe status: **Submitted**, **More information requested**, **Approved**, **Not approved**, or **Ownership issue under review**. They never see another claimant’s private information.

---

# 5. Owner edit and moderation policy

Owner-controlled information and community intelligence must live in separate data paths. An owner can improve accuracy and make their business useful without erasing community experience.

## 5.1 Fields an approved owner may update immediately

These changes publish immediately after standard validation. The interface shows **Owner updated** and a last-updated timestamp.

| Field group | Examples | Guardrail |
| --- | --- | --- |
| Contact and destinations | Official website, booking link, public email/phone, Instagram, TikTok, Facebook, other official public social links | Validate `http(s)`/approved handle format; warn before replacing an existing source-backed link. |
| Services and offerings | Service list, menu/offerings, availability notes, appointment model, accepted payment methods, concise business description | Trust/safety content filter; no prohibited/regulated claims without moderation. |
| Hours and availability | Regular hours, temporary closure, holiday hours, appointment-only status | Publishes as **Owner-provided hours** with timestamp. |
| Owner profile | Owner name, public bio, owner story, profile photo, approved public pronouns if offered | No claims of verification/credential are implied. |
| Accessibility and experience details | Parking, accessibility amenities, language capability, appointment rules, family/age suitability, environment tags | Must describe the owner’s own operation; no community content is overwritten. |

### Hours moderator rule

An owner may update hours immediately. A moderator may **confirm, correct, or request clarification** only when reliable public evidence conflicts with the change or a community report identifies a likely material error. The system must retain audit history, source/reason, moderator identity, and notify the owner. A moderator does not silently replace an owner’s hours.

## 5.2 Fields that require moderation before public publication

| Field group | Why moderation is required |
| --- | --- |
| Business legal/public name change or brand rename | Preserves search aliases, avoids identity hijacking, and prevents disappearance of community history. |
| Street address, map coordinate, service area, or location type | Prevents false pins and protects home-based/mobile providers. |
| Category/subcategory changes | Prevents misleading classification, particularly in sensitive categories. |
| Ownership identity designations | An owner may submit them, but public display is **Owner-Provided** unless MWM verification is separately granted. |
| License, credential, certification, insurance, regulated-service, health, legal, financial, or safety claims | Must follow category-specific review; an owner claim never proves them. |
| Public images/video that depict people, third-party logos, or potentially unsafe content | Rights, safety, and moderation review. |
| Promotional/featured placement, paid/sponsored language, broad outbound campaigns | Separate commercial/promotion policy. |
| Deactivation, business merge, parent/location relationship changes | Must preserve community records and avoid deleting a valid place. |

## 5.3 Fields an owner may never alter or suppress

| Community-controlled record | Owner boundary |
| --- | --- |
| Community reviews, comments, and ratings | Owner may respond through a moderated response feature; cannot edit, delete, or reorder them. |
| Community Vibes, Community Says, safety feedback, safety score, would-return-alone rate, recommendation rate | Owner cannot change, hide, reset, or manufacture them. |
| Community tags and community nominations | Owner cannot remove them. Owner may add a separately labeled **Owner-provided** tag. |
| Report/flag history and moderation record | Owner cannot view private reporter identity or change moderation evidence. |
| Verification decision and MWM verification designations | Owner may apply or appeal; cannot self-assign. |

---

# 6. Outbound links and owner traffic

MWM should help a visitor find the provider; it should not trap the provider’s traffic.

1. When a validated public owner/business URL exists, **Official website** or **Learn more** opens that external URL in a new tab using safe link handling.
2. When the external URL is absent or invalid, hide the external action; do not route to a blank page.
3. **Learn more on MWM** is a separate, clearly labeled internal detail-page action.
4. After an approved claim, the owner may manage validated external destinations according to the edit policy above.
5. A community-added public source may remain as provenance even after the owner updates the canonical website; owner updates do not erase historical source records.

---

# 7. Outreach rule for release 1

Release 1 stores only public-channel outreach drafts and source provenance. It sends **nothing**.

```text
outreach status default = draft
sending capability      = disabled
email / DM / contact form / Messenger = prohibited in release 1
```

A later release may permit founder-approved outbound invitations only after an explicit messaging policy, per-channel platform compliance review, rate limits, approval queue, opt-out system, message logs, and owner-contact provenance have been implemented.

---

# 8. Replit implementation order after founder approval

1. Repair the existing claim security defects first: one authoritative claim route, real admin authorization, transaction/row lock, and no claim-to-verified update.
2. Add the independent state and provenance model.
3. Move community contributor identity out of `submitted_by_id`; migrate owner control to approved owner links.
4. Update member community-add and owner-add flows; allow service area in place of a physical address.
5. Implement state-aware claim and badge UI.
6. Implement explicit-business verification submission and separate verification rendering.
7. Implement the owner-edit policy and immutable community-content boundary.
8. Store outreach drafts only; do not send.
9. Add audit tests: source provenance, contributor cannot edit, claim does not verify, sensitive disclosure, no false pin, no automatic outreach, and owner/community field boundaries.
10. Run independent live verification before expanding to Shawn Hill Homes or any new community-added records.

## Definition of done

A signed-in community member can suggest a real provider using legitimate public information; Kinfolk may enrich but cannot fabricate; eligible listings become discoverable without becoming verified; a later owner can claim profile control for free; MWM verification remains separate; sensitive listings are visible with neutral heightened-caution disclosure; no business is contacted in release 1; and owners improve their own information without changing community intelligence.
