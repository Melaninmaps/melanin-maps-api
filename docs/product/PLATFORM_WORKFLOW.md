# Mapping With Melanin™ — Platform Workflow

**Effective:** July 26, 2026
**Status:** Active operating model. Replaces ad-hoc feature-request workflow.

---

## The Problem This Solves

The platform has grown large enough that building a feature without first auditing what already exists risks:
- Rebuilding something that is already partially implemented
- Breaking an interconnected system that was not visible from the surface
- Creating duplicate functionality that diverges over time
- Losing founder-approved ideas that were discussed but not yet built

The heritage map audit (July 2026) proved this: database tables, API routes, moderation workflows, and seeded content existed that neither the founder nor the agent expected were present.

**This workflow prevents that from happening again.**

---

## The Four-Phase Cycle

Every area of the platform — every feature, enhancement, or new capability — must complete all four phases before code is written.

---

### Phase 1 — Read-Only Capability Audit

**Goal:** Map exactly what exists before proposing what to build.

Mandatory questions:
- What already exists in this area? (DB tables, API routes, screens, components)
- What is partially built? (Infrastructure present but no UI, or UI with no backend)
- What is hidden behind a feature flag?
- What is duplicated or contradicted elsewhere?
- What APIs already exist for this capability?
- What database tables already exist?
- What admin functionality exists?
- What UI exists (mobile, web, admin panel)?
- What future-state ideas in the FSR reference this feature?
- What does the ecosystem connection map say about how this connects to other areas?

**Output:** An audit report with complete current-state inventory.

**Rules:** No code changes. No schema changes. No environment variable changes.

---

### Phase 2 — Architecture Review

**Goal:** Decide what to build based on what was found.

Mandatory questions:
- What should stay as-is?
- What should change?
- What should be reused rather than rebuilt? ("Promote, Don't Duplicate")
- What should become reusable for other areas?
- What founder decisions are required before implementation can begin?
- What are the implementation waves?
- What are the acceptance tests for each wave?
- What risks exist, and what is the rollback plan?

**Output:** An architecture recommendation with proposed implementation waves, wave-by-wave acceptance criteria, and a list of founder decisions required.

**Rules:** Still no code changes.

---

### Phase 3 — Founder Approval

**Goal:** Get explicit authorization before writing any code.

**The only phrase that starts implementation:**

> **"Please implement."**

No other phrasing authorizes code changes. "Sounds good," "yes," "go ahead," "I agree," "that makes sense," or similar expressions of agreement authorize continued planning but not code.

The approval specifies which wave(s) are approved. Approval of Wave 1 does not automatically authorize Wave 2.

---

### Phase 4 — Post-Implementation Audit

**Goal:** Verify completion and capture new knowledge before moving on.

Mandatory questions:
- Did everything requested in this wave get built?
- Did anything break in an adjacent system?
- Did new technical debt appear?
- Were the acceptance tests run and passed?
- Were the Future-State Register entries updated to reflect what was built?
- Were any new APIs documented?
- Were any new DB tables documented?
- Was PLATFORM_VOCABULARY.md updated if new user-facing copy was introduced?
- Was ECOSYSTEM_CONNECTION_MAP.md updated if new connections were created?
- Was AUDIT_LOG.md updated?

**Output:** A post-implementation audit report and updated documentation.

---

## Standing Principles

### "Promote, Don't Duplicate"

Every audit must ask:
- Can this be accomplished by expanding an existing capability?
- Is there already a workflow that should be enhanced instead of creating a new one?
- Does this new idea naturally belong within another feature?

If yes: enhance the existing thing. Do not build a parallel system.

### Experience Audit Standard

Every experience audit answers four questions:

1. **Current State** — What exactly exists today? (code, schema, APIs, UI)
2. **Future State** — What has been envisioned, discussed, or founder-approved?
3. **Journey** — How does the user progress through this experience over time?
4. **Connections** — How does this experience interact with every other major part of the platform?

### Experience Progression

Users are not static roles. They are evolving journeys:

```
Guest
  ↓
Community Member
  ↓
Contributor
  ↓
Trusted Contributor
  ↓
Cultural Ambassador
  ↓
Mentor
  ↓
Community Leader
```

Each step unlocks more responsibility, not just more permissions. Every experience audit must document where in this progression each capability applies.

### Implementation Waves

Large features are never built all at once. Each area receives a wave-based implementation plan:

- **Wave 1:** Make the existing system fully functional
- **Wave 2:** Improve content quality and administrative tools
- **Wave 3:** Introduce saved, social, and linked capabilities
- **Wave N:** [Progressive enhancement]

Each wave has its own read-only pre-audit, founder approval, implementation, and post-implementation audit.

### Emergency Exception

The only circumstances under which Phase 1–3 may be skipped:
- A confirmed production failure requiring an immediate surgical fix
- An Apple review-critical issue requiring a targeted patch
- A diagnosed bug with a narrow, non-architectural scope

Even emergency fixes receive a post-implementation audit (Phase 4).

---

## Priority Sequence (as of July 2026)

All items are **read-only** until Build 96 clears Apple review.
The next build after Build 96 approval will be **Build 97**.

| Step | Area | Phase | Status |
|------|------|-------|--------|
| 1 | Create framework documents | Documentation | In progress |
| 2 | Platform Language & UX Audit | Phase 1 | In progress |
| 3 | Community Member Experience Audit | Phase 1 | Queued |
| 4 | Maps & Heritage — Wave 1 | Phase 3 (pending Build 96 clearance) | Holding |
| 5 | Business Owner Experience Audit | Phase 1 | Queued |
| 6 | Cultural Ambassador Experience Audit | Phase 1 | Queued |
| 7 | KinfolkAI Experience Audit | Phase 1 | Queued |
| 8 | Kinfolk Circles Experience Audit | Phase 1 | Queued |
| 9 | Resources, Community, Events Experience Audits | Phase 1 | Queued |
| 10 | Feature Constitution (populated from audit findings) | Phase 2 | Queued |
| 11 | Implementation waves per area | Phase 3+ | Queued |

---

## Document Index

| Document | Purpose |
|----------|---------|
| `PLATFORM_WORKFLOW.md` (this file) | Operating contract for all development |
| `PLATFORM_VOCABULARY.md` | Source of truth for all user-facing language |
| `FEATURE_CONSTITUTION.md` | One authoritative spec per major platform area |
| `ECOSYSTEM_CONNECTION_MAP.md` | How every experience connects to every other |
| `AUDIT_LOG.md` | Running record of completed audits and decisions |
| `FUTURE_STATE_REGISTER.md` | Every approved future-state idea |
| `EXPERIENCE_AUDITS/AUDIT_TEMPLATE.md` | Standard template for all experience audits |
| `EXPERIENCE_AUDITS/*.md` | One file per completed experience audit |

---

*Last updated: July 26, 2026 — Initial creation*
