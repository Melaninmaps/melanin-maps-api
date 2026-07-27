# Mapping With Melanin™
## Legacy Collection Architecture — v1.0

**Status:** CONCEPTUAL ARCHITECTURE LOCKED — Pending implementation authorization. No files renamed. No content moved. No builds.
**Last updated:** July 18, 2026

---

## The Official Umbrella

### Mapping With Melanin™ Legacy Collection

The enduring institutional body of work. Not one book. The entire archive.

The Constitution lives inside it. So does everything else.

```
Mapping With Melanin™ Legacy Collection
│
├── Volume I   — The Constitution
│              The enduring principles that govern Mapping With Melanin™.
├── Volume II  — Presentation System
├── Volume III — Living Archive
├── Volume IV  — Community Atlas
├── Volume V   — Legacy Editions
└── Volume VI  — Research & Insights  [RESERVED — not now]
```

---

## The Six Volumes

### Volume I — The Constitution
*The enduring principles that govern Mapping With Melanin™.*
*(replaces working title "Foundations Book")*

The living constitution of the company. Not presentation-specific. Not audience-specific. Not policies alone — philosophy.

Contains:
- Mission
- Vision
- Principles
- Storytelling Standards
- Collaboration Standards
- Design Philosophy
- Enduring Truths
- Four Foundations (Legacy · Community · Trust · Discovery)
- Decision Frameworks
- Institution Test
- The Generational Test
- Design Principles
- Community Trust Engine Framework (when ready)
- **What We Preserve** (future — see below)

**The three-sentence statement** (future placement TBD within Volume I):
> We build products that people use.
> We preserve stories that people remember.
> We build institutions that people inherit.

**What We Preserve** (future section — not today):
A declaration of what future leaders promise never to compromise:
- Trust over growth
- Community over engagement
- Authenticity over virality
- Belonging over popularity
- Listening over broadcasting
- Stewardship over ownership

This is different from values. It is what the institution refuses to lose.

---

### Volume II — Presentation System

All decks are chapters. All slides are canonical pages. Each canonical page has an identifier, version history, approval status, and audience metadata.

**Current chapters:**
- Experience Chapter (Canonical Pages 01–21)
- Investor Chapter
- Business Chapter
- Community Chapter
- Zoom Chapter
- Welcome Home Tour Chapter
- Team Chapter
- Features Chapter

*Additional chapters may be added as the system grows.*

---

### Volume III — Living Archive

- Tour
- Community History
- Photography
- Videos & Documentaries
- Press
- Launch
- Cities
- Stories

---

### Volume IV — Community Atlas

Community discovery, safety, belonging, mapping — documented as institutional record.

---

### Volume V — Legacy Editions
*(formerly "Legacy Collection" — renamed to avoid duplicating the umbrella name)*

The formal published expressions created from the broader Legacy Collection:

- Coffee table books
- City volumes
- Published documentary editions
- Letters to the Future
- Sounds of Home collections
- Historical publications
- Anniversary editions
- To the Next Steward

"Legacy Editions" is preferred because it naturally supports multiple books, films, albums, exhibitions, and future volumes.

---

### Volume VI — Research & Insights
**RESERVED — not built now. Space held for future institutional knowledge.**

- Community research
- Survey findings
- Annual reports
- Travel trends
- Belonging studies
- Safety studies
- Economic impact
- Academic partnerships
- White papers

---

## The Two Registries

### Chapter Registry

Tracks complete presentation chapters within Volume II.

| Chapter | Status |
|---------|--------|
| Experience Chapter | Active — Canonical Pages 01–21 |
| Investor Chapter | Active |
| Business Chapter | Active |
| Community Chapter | Active |
| Zoom Chapter | Planned |
| Welcome Home Tour Chapter | Planned |
| Team Chapter | Planned |
| Features Chapter | Active |

---

### Page Registry (Canonical Pages)

Every page in the registry is a **Canonical Page** — the master approved version from which all adaptations derive.

The term "Canonical Page" (not just "page") reinforces the propagation model: this is the source. Everything else is derived from it.

**Canonical Page identifier format:**
```
MWM-[CHAPTER]-P[##]-V[#]

Examples:
MWM-EXP-P01-V1    Experience Chapter, Canonical Page 01, Version 1
MWM-INV-P05-V2    Investor Chapter, Canonical Page 05, Version 2
MWM-BIZ-P09-V1    Business Chapter, Canonical Page 09, Version 1
```

A canonical page entry records:
- Page identifier
- Source chapter
- Current version
- Approval status
- Confidentiality level
- Audiences it has been adapted for
- Chapters it appears in
- Shared components it references
- Last modified date
- Owner
- Dependencies (e.g., references Mission from the Constitution)

A canonical page may appear:
- exactly as approved
- as an audience adaptation
- as a related concept
- in multiple chapters
- in print
- in a video
- on the website
- in onboarding
- in a future documentary

The medium changes. The canonical page doesn't.

---

## The Legacy Collection Index & Manifest

**Purpose:**
> The Legacy Collection Index exists so that every idea, decision, story, presentation, asset, and principle has one authoritative place to live, one history to preserve, and one path to be discovered.

The Legacy Collection is the library. The Index is the catalog.

A top-level navigation document that identifies:
- All volumes
- Chapters within each volume
- Canonical page registries
- Shared component registries
- Current versions
- Approval status
- Confidentiality level
- Document locations
- Owners
- Dependencies
- Related assets
- Last synchronization date

**Proposed location when ready:**
```
docs/MWM-Legacy-Collection-Index.md
```

---

## Propagation — Four Categories

When a source element changes, the propagation system identifies every chapter that references it and prompts for controlled cross-chapter updates.

### 1. Mission & Vision (from Volume I — The Constitution)
When rewritten, every chapter that references them is identified.

### 2. Canonical Pages
When a canonical page is updated, all curated editions and chapters that include it are identified.

### 3. Presentations (Full Chapters)
When a chapter is updated, all curated editions derived from it are identified.

### 4. Shared Components
When a design component changes, every canonical page that references it is identified.

Shared components include:
- Gold outline icon set
- Typography (DM Sans · Inter · Cormorant Garamond)
- Color tokens (#CA922B, #1C0E06, #FAF6EF, etc.)
- Gradient system
- Animation standards
- Illustrations
- Logo and wordmark
- KinfolkAI™ avatar
- Badges and trust signals
- Button and UI element styles

Components are not pages. This distinction matters — components live at a level below pages and above assets.

---

## Three Content Types Within the Presentation System

### Full Chapter
A complete approved presentation for one audience. All canonical pages in sequence. Full narrative arc.

### Curated Chapter Edition
A shorter presentation assembled from approved canonical pages across multiple chapters, shaped for a specific audience or context.

Example: A Zoom presentation may pull:
- An opening canonical page from the Experience Chapter
- A mission canonical page from the Constitution
- A business canonical page from the Business Chapter
- A Founding Community canonical page
- The approved three-page closing sequence

### Individual Approved Canonical Page
A single reusable canonical page inserted into another chapter while retaining its source page ID, version history, and approval status.

Canonical pages can be curated into different audience journeys without losing governance.

---

## The Experience Chapter — New Standard for Review

The Experience Chapter is not a presentation to be perfected. It is the first public chapter of the Mapping With Melanin™ Legacy Collection.

The review question has changed:

> ~~Does this slide look good?~~

> **Does this canonical page deserve to become part of the permanent Legacy Collection?**

That is a higher bar. It governs every visual refinement decision from this point forward.

---

## File Migration Plan — Placeholder

No files are renamed until a separate migration map is approved.

When ready, the migration map will include for each file:
- Current file name
- Proposed file name
- Current references to that file
- Documents that link to it
- Potential broken references
- Required updates
- Risk level
- Rollback plan

**Known first candidate:**
```
Current:   docs/MWM-Foundations-Book-Outline-v1.0.md
Proposed:  docs/MWM-Constitution-Outline-v1.0.md
```

No action taken until separately approved.

---

## Experience Chapter — Visual Refinement Process

**Correct process:**

1. Refine the Experience Chapter
2. Approve its visual system
3. Identify which visual decisions qualify as global Shared Component standards
4. Propose those additions to the Constitution and Creative OS
5. Audit other presentation chapters
6. Wait for cross-chapter authorization
7. Apply only the approved scope

No silent cross-chapter changes.

---

## Official Language

| Conversational / legacy | Official Legacy Collection language |
|------------------------|-------------------------------------|
| Bible | Legacy Collection |
| Foundations Book | The Constitution |
| Deck | Presentation Chapter |
| Slide | Canonical Page |
| Slide Registry | Page Registry |
| Deck Registry | Chapter Registry |
| Reusable slide | Reusable canonical page |
| Master deck | Master presentation chapter |
| Copying slides | Curating canonical pages |
| Updating all decks | Controlled cross-chapter propagation |
| Design assets | Shared Components |

*"Deck" and "slide" may be used conversationally when working with standard presentation software. Formal records use "chapter" and "canonical page."*

---

## Confirmed Roadmap

| Status | Item |
|--------|------|
| ✅ Complete | Legacy architecture |
| ✅ Complete | Constitution architecture |
| ✅ Complete | Presentation architecture |
| ⏳ Waiting | Railway |
| 🎯 Next | Experience Chapter visual refinements |
| After | Zoom experience · Sound bites · Speaker guide · Community Trust Engine · Launch readiness |

---

## What This Architecture Makes Possible

```
Mapping With Melanin™ Legacy Collection
    ↓
Volumes  (I–VI)
    ↓
Chapters
    ↓
Canonical Pages
    ↓
Shared Components and Assets
```

With:
- A Legacy Collection Index & Manifest (with purpose statement)
- A Chapter Registry
- A Page Registry (canonical pages)
- A Shared Components Registry
- Controlled cross-category propagation
- Full version history
- Audience-specific adaptations
- No silent cross-chapter changes

---

*Conceptual architecture locked. No files have been renamed, moved, or modified. No content has been rewritten. Implementation requires separate authorization.*
