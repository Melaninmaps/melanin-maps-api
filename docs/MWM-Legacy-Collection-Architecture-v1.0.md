# Mapping With Melanin™
## Legacy Collection Architecture — v1.0

**Status:** PROPOSAL ONLY. No files renamed. No content moved. No implementation. This is the conceptual alignment document.
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
├── Volume II  — Presentation System
├── Volume III — Living Archive
├── Volume IV  — Community Atlas
└── Volume V   — Legacy Editions
```

---

## The Five Volumes

### Volume I — The Constitution
*(replaces working title "Foundations Book")*

The living constitution of the company. Not presentation-specific. Not audience-specific.

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

---

### Volume II — Presentation System

All decks are chapters. All slides are pages. Each page has an identifier, version history, approval status, and audience metadata.

**Current chapters:**
- Experience Chapter (Pages 01–21)
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

## The Two Registries

### Chapter Registry

Tracks complete presentation chapters within Volume II.

| Chapter | Status |
|---------|--------|
| Experience Chapter | Active — Pages 01–21 |
| Investor Chapter | Active |
| Business Chapter | Active |
| Community Chapter | Active |
| Zoom Chapter | Planned |
| Welcome Home Tour Chapter | Planned |
| Team Chapter | Planned |
| Features Chapter | Active |

---

### Page Registry

Tracks every approved reusable page across all chapters.

**Page identifier format:**
```
MWM-[CHAPTER]-P[##]-V[#]

Examples:
MWM-EXP-P01-V1    Experience Chapter, Page 01, Version 1
MWM-INV-P05-V2    Investor Chapter, Page 05, Version 2
MWM-BIZ-P09-V1    Business Chapter, Page 09, Version 1
```

A page entry records:
- Page identifier
- Source chapter
- Current version
- Approval status
- Confidentiality level
- Audiences it has been adapted for
- Chapters it appears in
- Last modified date
- Owner
- Dependencies (e.g., references Mission chapter from Constitution)

A page may appear:
- exactly as approved
- as an audience adaptation
- as a related concept
- in multiple chapters
- in print
- in a video
- on the website
- in onboarding
- in a future documentary

The medium changes. The page doesn't.

---

## The Legacy Collection Index & Manifest

The front door to the entire knowledge system.

The Legacy Collection is the library. The Index is the catalog.

A top-level navigation document that identifies:
- All volumes
- Chapters within each volume
- Page registries
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

## Three Content Types Within the Presentation System

### Full Chapter
A complete approved presentation created for one audience. All pages in sequence. Full narrative arc.

### Curated Chapter Edition
A shorter presentation assembled from approved pages across multiple chapters, shaped for a specific audience or context.

Example: A Zoom presentation may pull:
- An opening page from the Experience Chapter
- A mission page from the Constitution
- A business page from the Business Chapter
- A Founding Community page
- The approved three-page closing sequence

### Individual Approved Page
A single reusable page inserted into another chapter while retaining its source page ID, version history, and approval status.

Pages can be curated into different audience journeys without losing governance.

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
           or:
           docs/Legacy-Collection/Volume-I-Constitution/MWM-Constitution-Outline-v1.0.md
```

No action taken until separately approved.

---

## Experience Chapter — Visual Refinement Process

The current visual critique applies specifically to the Experience Chapter. Its approved design decisions may later become global standards — but changes do not automatically propagate.

**Correct process:**

1. Refine the Experience Chapter
2. Approve its visual system
3. Identify which visual decisions qualify as global standards
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
| Slide | Page |
| Slide Registry | Page Registry |
| Deck Registry | Chapter Registry |
| Reusable slide | Reusable approved page |
| Master deck | Master presentation chapter |
| Copying slides | Curating approved pages |
| Updating all decks | Controlled cross-chapter propagation |

*"Deck" and "slide" may be used conversationally when working with standard presentation software. Formal records use "chapter" and "page."*

---

## What This Architecture Makes Possible

```
Mapping With Melanin™ Legacy Collection
    ↓
Volumes
    ↓
Chapters
    ↓
Pages
    ↓
Reusable Components and Assets
```

With:
- A Legacy Collection Index & Manifest
- A Chapter Registry
- A Page Registry
- Controlled propagation
- Full version history
- Audience-specific adaptations
- No silent cross-chapter changes

---

*This is a proposal document only. No files have been renamed, moved, or modified. No content has been rewritten. The architecture awaits authorization before implementation begins.*
