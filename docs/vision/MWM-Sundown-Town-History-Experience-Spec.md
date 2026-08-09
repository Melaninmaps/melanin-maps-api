# MWM Sundown Town History Experience — Strategic Specification
*Source: Founder strategic document, August 9, 2026*
*Status: READ-ONLY. Audit complete. NO implementation until authorized.*

## Permanent Product Principle

> **Visibility is a preference. History is not.**

A member can say "don't clutter my everyday map with these markers." They should never have to say "never tell me this information."

---

## Three Separate Concepts (Must Not Be Conflated)

### 1. Historical Record
Turning a map layer OFF must NEVER:
- delete the record
- change the record
- remove it from historical search
- remove it from KinfolkAI's knowledge
- remove it from route/travel intelligence
- imply that the history is no longer relevant

### 2. Map Display Preference
A member should decide whether sundown-town markers appear on their everyday map.
OFF = hidden from map view. NOT "never tell me about this history."

### 3. Contextual Travel Safety
Separate from map-layer visibility. Even when the layer is OFF, Mapping With Melanin should surface relevant verified information when a trip, route, destination, overnight stop, or relocation search intersects with a place where that history is materially relevant.

---

## Required Distinctions (Non-Negotiable)

The UI must clearly distinguish:

| Type | Label | Source |
|---|---|---|
| Historically documented | HISTORICALLY DOCUMENTED | Academic / archival records |
| Current community experience | COMMUNITY EXPERIENCE | Member reports |
| Current safety information | COMMUNITY SAFETY DATA | Safety reports |
| Active safety warning | ACTIVE ALERT | Verified current incident |

Historical designation alone must NEVER automatically become a current danger warning.

---

## Required Historical Place Experience

When a user taps a sundown-town marker they should learn:
- WHAT HAPPENED HERE?
- WHY IS THIS LOCATION IN THE HISTORICAL DATASET?
- WHAT PERIOD OF HISTORY DOES THIS REFER TO?
- WHAT VERIFIED SOURCES SUPPORT THE DESIGNATION?
- WHAT SHOULD I UNDERSTAND ABOUT THIS HISTORY TODAY?

The experience must NOT merely be: dark map shading, triangle, warning symbol, ON/OFF toggle.

---

## Required Warning Preferences Architecture (Future)

```
SHOW HISTORICAL SUNDOWN LOCATIONS ON MAP        ON / OFF
HISTORICAL CONTEXT DURING TRIP PLANNING         ON / OFF
ROUTE HISTORY NOTICES                           ON / OFF
CURRENT SAFETY ALERTS                           governed by Safety system
URGENT SAFETY ALERTS                            mandatory / critical safety policy
```

---

## Visual Language Requirement

Historical information should not look like an unexplained danger zone.
Current treatment (🚫 emoji + dark heatmap) conflates historical record with active danger signal.
Must be redesigned to clearly communicate: "This is documented history" vs "This is a current alert."

---

## Source Integrity

All sundown town records must carry:
- Source name and URL
- Number of records from that source
- Whether citation is user-visible
- Last verified/updated date

Primary academic source: James W. Loewen, *Sundown Towns* (2005); Tougaloo College NSF Database.

---

## KinfolkAI Requirement

KinfolkAI must distinguish historical information from current safety claims.

Eventually a user should be able to ask:
- "Is there any important history I should know along this route?"
- "Tell me about the history of this town."
- "Are there any places along my trip I should know about?"

And receive historically accurate, source-cited, temporally-qualified responses.

---

## Audit Status: COMPLETE (August 9, 2026)
See session notes for full audit findings. Implementation requires separate authorization.
