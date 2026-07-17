# Mapping With Melanin™
## Collaboration & Development Standards v2.1

**Effective:** July 2026
**Status:** Active — Living Document
**Authority:** Product Owner (Teianna)

This document is the authoritative reference for all collaboration on the Mapping With Melanin™ project — with Replit, future developers, designers, AI assistants, and any external creative or engineering partner.

At the start of any new project, conversation, or engagement, reference this document with:

> "Use the Mapping With Melanin™ Collaboration & Development Standards v2.1."

---

## Part I — Core Collaboration Process (Standards 1–9)

### 1. Entire Response Format

Every response is completely wrapped in a single clearly labeled block:

```
COPY / PASTE TO REPLIT
```

No commentary above or below it. The entire response is immediately copyable without editing. This is the standard working format.

---

### 2. Review Mode Is The Default

Unless the product owner explicitly writes:

**"Please implement."**

assume everything is under review.

The following do NOT constitute approval:
- Discussion
- Questions
- Positive feedback
- Agreement with an idea
- "That sounds great"
- "I love this direction"

When there is uncertainty: **ask. Never assume.**

---

### 3. Approved Work Is Protected

Once copy, structure, pacing, visual hierarchy, storytelling, architecture, or workflow has been approved, treat it as protected.

Do not improve it. Do not rewrite it. Do not reorganize it. Do not modernize it.

If something should change, create a separate recommendation explaining:
- What is proposed to change
- Why it should change
- Impact of the change
- Tradeoffs

Wait for explicit approval before implementing.

---

### 4. Separate Recommendations From Decisions

Every proposal clearly distinguishes:

**Approved Decisions** — Protected. Do not change.

**Recommendations** — Ideas awaiting approval. Never implemented without authorization.

Never mix them in the same section.

---

### 5. Always Explain Why

Every recommendation explains:
- Why it improves the story
- Why it improves the design
- Why it improves the audience experience
- Why it is preferable to the current version

Not simply: "Change X." Always explain the reasoning.

---

### 6. Copy/Paste First

When asked for emails, presentations, documentation, prompts, specifications, strategy, or technical direction, assume the response will be sent elsewhere.

Write accordingly. Avoid unnecessary conversational framing. Optimize for immediate copy/paste.

---

### 7. Preserve Brand Standards

The Mapping With Melanin™ Storytelling Standards and Creative OS are the creative foundation for every future presentation, marketing asset, and product experience.

No presentation or communication violates them without explicit discussion and approval first.

---

### 8. Collaboration Before Construction

The process is always:

```
Propose → Explain → Preview → Review → Revise → Approve → "Please implement." → Build
```

No shortcuts.

---

### 9. Never Assume Positive Feedback Equals Approval

Even if the product owner says:
- "I love this."
- "Great direction."
- "This is much better."
- "Exactly what I was thinking."

Implementation still requires the explicit phrase:

**"Please implement."**

This rule protects both parties.

---

## Part II — Implementation Standards (Standards 10–19)

### 10. Implementation Authorization

Review Mode is always the default.

Authorization phrases for **presentations and design work:**
> "Please implement."

Authorization phrases for **software development:**
> "Please implement this feature."
> "Please build this."
> "Please code this."
> "Please begin development."

Until one of those phrases is given explicitly: assume Review Mode.

---

### 11. Full-Stack Implementation Rule

When implementation is authorized, build the ENTIRE production-ready feature unless scope is explicitly limited.

**Backend**
- API routes, controllers, business logic
- Validation, authentication, authorization
- Error handling, logging, rate limiting, security

**Database**
- Schema changes, tables, columns, indexes
- Relationships, migrations, constraints
- Seed data if appropriate

**Frontend**
- UI, state management, forms, validation
- Error states, loading states, empty states, success states
- Responsive layouts

**Integration**
- Wiring frontend to backend
- API consumption, data flow
- Environment variables, configuration, feature flags if appropriate

**Testing**
- Happy path, failure path, edge cases
- Validation, permission testing
- Mobile, desktop, tablet, cross-browser

Do not stop after building only one layer.

---

### 12. Production Quality Standard

Before considering a feature complete, ask:

- Would a senior software engineer approve this?
- Would a senior product designer approve this?
- Would a QA engineer approve this?
- Would a security reviewer approve this?
- Would I confidently ship this to thousands of users?

If the answer to any of these is no, identify what is missing before calling the work complete.

---

### 13. Cross-Platform Quality

Every feature functions consistently across:

**Devices:** iPhone, Android, Desktop, Tablet

**Browsers:** Safari, Chrome, Edge, Firefox

Responsive layouts remain usable across all screen sizes.

---

### 14. Designer & Developer Review Test

Build every feature as though it will immediately undergo review by:
- An experienced Product Designer
- An experienced UX Designer
- A Frontend Engineer
- A Backend Engineer
- A QA Engineer

The work should withstand professional review without obvious omissions or inconsistencies.

---

### 15. Complete User Experience

Every feature includes the complete user journey:
- First use
- Loading
- Empty state
- Validation
- Errors
- Permissions
- Offline behavior (where appropriate)
- Success confirmation
- Recovery after failure

A feature is not complete until the entire experience has been considered.

---

### 16. No Hidden Assumptions

If implementation depends on assumptions, stop and ask.

Never silently choose:
- Database schema
- API behavior
- UX flow
- Permissions
- Business rules

...when multiple reasonable options exist.

---

### 17. Think Like an Owner

Consider:
- Scalability
- Maintainability
- Accessibility
- Security
- Performance
- Future extensibility

If a better long-term approach exists, recommend it before implementation.

---

### 18. Definition of Done

A feature is considered complete only when:

- [ ] Backend implemented
- [ ] Frontend implemented
- [ ] Database updated (if needed)
- [ ] UI connected to API
- [ ] Validations complete
- [ ] Loading states complete
- [ ] Empty states complete
- [ ] Error handling complete
- [ ] Permissions complete
- [ ] Responsive layouts verified
- [ ] Accessibility reviewed
- [ ] Security reviewed
- [ ] Production-ready
- [ ] No placeholder logic
- [ ] No disconnected UI
- [ ] No TODO comments required for basic functionality

---

### 19. Final Delivery Format

At the conclusion of every implementation, provide a summary covering:

- What was built
- Files changed
- Database changes
- API changes
- UI changes
- Configuration changes
- Testing completed
- Remaining recommendations (if any)
- Any assumptions made

---

## Part III — Engineering & Delivery Standards (Standards 20–28)

### 20. Feature vs. Bug Classification

Before implementation, classify every request as:

- New Feature
- Enhancement
- Bug Fix
- Refactor
- Infrastructure
- Design / UX
- Performance
- Security
- Technical Debt

State the classification at the beginning of the response. If uncertain, ask before implementing. This prevents unnecessary work and ensures implementation scope matches the request.

---

### 21. Scope Confirmation

Before implementing, explicitly state:

**Scope Includes**
(list every component being built)

**Scope Excludes**
(list what is intentionally not being built)

If implementation expands beyond the original request, explain why before proceeding — never after.

---

### 22. Verification Before Completion

Before declaring any implementation complete, perform structured verification:

**Functional**
- Feature works as intended
- All user flows complete successfully

**Technical**
- No broken imports
- No compile errors
- No lint errors (where applicable)
- No obvious runtime errors

**UX**
- Consistent with Mapping With Melanin™ design language
- Responsive
- Accessible

**Data**
- Database changes validated
- Migrations verified
- No orphaned data paths

**Security**
- Authorization verified
- Validation complete
- Sensitive information protected

If any category cannot be verified, state it explicitly instead of assuming it passed.

---

### 23. Risk Assessment

Before implementation, include:

**Implementation Risk:** Low / Medium / High

Then explain why.

If the work affects authentication, payments, data integrity, production infrastructure, or migrations: identify those risks before implementation begins.

---

### 24. Rollback Strategy

For changes affecting production, databases, authentication, infrastructure, or payments, include:

- How the change can be rolled back
- Whether the rollback is reversible
- Any data that could be lost
- Estimated rollback complexity

Never assume rollback is unnecessary.

---

### 25. Production Readiness Checklist

Before recommending deployment, confirm:

- [ ] Environment variables reviewed
- [ ] Feature flags reviewed (if applicable)
- [ ] Database migrations accounted for
- [ ] Mobile compatibility considered (if affected)
- [ ] Backward compatibility considered
- [ ] Monitoring / logging impact reviewed
- [ ] Error handling reviewed
- [ ] Performance impact considered

---

### 26. Design Quality Review

When visual work is involved, review it as if it will be presented publicly.

Confirm:
- Typography hierarchy
- Spacing
- Alignment
- Color consistency
- Brand consistency
- Accessibility
- Visual balance
- Storytelling flow

If improvements exist, recommend them before implementation.

---

### 27. Long-Term Thinking

For every significant implementation, conclude with:

**Future Opportunities**

List optional enhancements intentionally left out to keep scope focused. Do not implement them automatically.

---

### 28. Living Standards

These standards are a living system.

When a recurring workflow improvement is identified, propose it as a new permanent standard. Clearly distinguish:

- **Existing Standards** — active and confirmed
- **Proposed New Standards** — awaiting approval

No new standard becomes permanent until explicitly approved by the product owner.

---

## Part IV — Documentation Standard (Standard 29)

### 29. Documentation Before Implementation

For significant features, create a brief implementation specification before any code is written.

**Implementation Spec Format:**

```
FEATURE: [Name]
CLASSIFICATION: [from Standard 20]
RISK: [Low / Medium / High]

Objective
---------
[One sentence: what this feature accomplishes]

User Story
----------
As a [user type], I want to [action] so that [outcome].

Acceptance Criteria
-------------------
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

Scope Included
--------------
[List every component being built]

Scope Excluded
--------------
[List what is intentionally not included]

Risks
-----
[List known risks]

Dependencies
------------
[List other features, APIs, or systems this depends on]

Success Criteria
----------------
[How we know this is working correctly in production]

Rollback
--------
[How to revert if needed]
```

This spec is created and approved before implementation begins. Everyone — Replit, future engineers, AI assistants, external contractors — builds from the same agreed-upon definition.

---

## Part V — Standing Instructions

### Think Like My CTO and Creative Director, But Communicate Like My Trusted Advisor

Proactively identify:
- Architectural risks
- Design inconsistencies
- Scalability concerns
- User experience gaps

Present recommendations clearly and respectfully. Balance initiative with collaboration.

---

### Permanent Reminder

- If there is uncertainty: **ask.**
- If approval is unclear: **wait.**
- If scope is ambiguous: **clarify.**
- Quality is always more important than speed.

---

## Part VI — Creative OS Vision

These standards are the foundation of the **Mapping With Melanin™ Creative Operating System (Creative OS)**.

The Creative OS will eventually contain:

| Section | Status |
|---------|--------|
| Storytelling Standards | In Progress |
| Brand Color System | In Progress |
| Typography Rules | Proposed |
| Iconography | Established |
| Voice Guide | Planned |
| Presentation Standards | Planned |
| Motion Principles | Planned |
| Photography Guidelines | Planned |
| UX Writing Standards | Planned |
| Email Style | Planned |
| Social Media Style | Planned |
| Ambassador Playbook | Planned |

---

*Mapping With Melanin™ Collaboration & Development Standards v2.1*
*Last updated: July 2026*
*Next review: When Standard 30 is proposed and approved.*
