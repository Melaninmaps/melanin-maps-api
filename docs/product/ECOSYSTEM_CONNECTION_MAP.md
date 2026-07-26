# Mapping With Melanin™ — Ecosystem Connection Map

**Effective:** July 26, 2026
**Status:** Initial version. Updated after every experience audit and every implementation wave.
**Purpose:** Document how every experience connects to every other experience. Prevent features from becoming isolated. Every new capability must be evaluated against this map before implementation.

---

## Why This Exists

Isolated features are fragile. They do not compound. They do not serve the member as their engagement deepens.

Mapping With Melanin™ is not a collection of screens — it is an ecosystem where a member's discovery of a business should naturally connect to community recommendations, safety context, heritage nearby, events, resources, and KinfolkAI guidance. Every feature should ask: "What does this unlock for the member next?"

---

## Member Progression Connections

```
Guest
  ↓
  Can browse businesses (limited), view map, see public community feed
  ↓
Community Member (registered)
  ↓
  Can save businesses, join events, follow heritage sites,
  submit safety surveys, interact with KinfolkAI (free tier),
  join Kinfolk Circles, post to community feed
  ↓
Contributor
  ↓
  Can submit heritage stories (Living Legacy Stories),
  submit resource listings, submit event listings,
  review businesses, nominate community references,
  submit neighborhood recommendations
  ↓
Trusted Contributor
  ↓
  Posts and submissions surfaced with elevated trust weighting,
  eligible for Cultural Ambassador consideration
  ↓
Cultural Ambassador
  ↓
  Can produce heritage education content,
  stories appear first in heritage site profiles,
  can lead community events,
  elevated in KinfolkAI recommendation weighting,
  eligible for mentorship role
  ↓
Mentor
  ↓
  Can offer career, relocation, HBCU alumni, and community guidance,
  can host structured mentorship office hours within Kinfolk Circles,
  appears in Opportunity Center as available mentor
  ↓
Community Leader
  ↓
  Recognized as a trusted local guide,
  recommendations carry the highest community weight,
  can verify local information for the platform,
  eligible to become a Cultural Ambassador designator
```

---

## Feature Connection Maps

### Community Member
```
Community Member
  ├─→ Discovers Businesses
  │     ├─→ Saves Businesses (saved_places)
  │     ├─→ Reviews Businesses (reviews)
  │     ├─→ Recommends Businesses (trust-weighted)
  │     └─→ Follows Business (notifications on updates/events)
  │
  ├─→ Explores Heritage Sites
  │     ├─→ Saves Heritage Sites (FSR-010)
  │     ├─→ Submits Living Legacy Stories (FSR-001)
  │     ├─→ Views Heritage Events (FSR-006)
  │     └─→ Accesses Heritage Support Links (FSR-002)
  │
  ├─→ Uses KinfolkAI
  │     ├─→ Receives business recommendations
  │     ├─→ Receives heritage recommendations
  │     ├─→ Gets relocation guidance
  │     ├─→ Finds safety context
  │     └─→ Discovers resources and opportunities
  │
  ├─→ Joins Kinfolk Circles
  │     ├─→ Plans group trips with heritage stops
  │     ├─→ Shares saved businesses with circle
  │     └─→ Connects with alumni circles (FSR-004)
  │
  ├─→ Contributes to Safety
  │     ├─→ Submits neighborhood safety surveys
  │     ├─→ Submits employer safety reviews
  │     └─→ Activates SOS when needed
  │
  ├─→ Participates in Community Feed
  │     ├─→ Posts discoveries, tips, recommendations
  │     ├─→ Tags heritage sites and businesses
  │     ├─→ Uses hashtags for discovery
  │     └─→ Shares saved heritage collections (FSR-010)
  │
  └─→ Accesses Resources
        ├─→ Finds scholarships, grants, legal aid, housing
        ├─→ Connects to opportunity listings (jobs, mentors)
        └─→ Accesses financial and wellness tools
```

---

### Heritage Place
```
Heritage Place
  ├─→ Living Legacy Stories (FSR-001)
  │     ├─→ Community Member submissions
  │     ├─→ Cultural Ambassador featured stories
  │     └─→ Moderation queue (admin)
  │
  ├─→ Place-Linked Videos (FSR-007)
  │     ├─→ Alumni reflections
  │     ├─→ Oral histories
  │     └─→ Restoration documentation
  │
  ├─→ Real-Time Cultural Presence (FSR-006)
  │     ├─→ Events at this location
  │     ├─→ Homecoming and reunions (HBCU)
  │     ├─→ Volunteer opportunities
  │     └─→ Preservation efforts
  │
  ├─→ Alumni Profiles / HBCU Connections (FSR-004)
  │     ├─→ Find fellow alumni by city or industry
  │     ├─→ Alumni mentorship (FSR-005)
  │     └─→ Alumni giving (Heritage Support Links, FSR-002)
  │
  ├─→ Heritage Support Links (FSR-002)
  │     ├─→ Scholarships
  │     ├─→ Alumni funds
  │     └─→ Preservation donations
  │
  ├─→ Nearby Businesses
  │     └─→ Community businesses within the heritage site's geography
  │
  ├─→ KinfolkAI
  │     ├─→ Heritage site context injected into system prompt
  │     └─→ "What's near [heritage site]?" recommendations
  │
  └─→ Saved Heritage Places (FSR-010)
        ├─→ Member profile heritage collections
        └─→ Trip planning integration
```

---

### Business Profile
```
Business Profile
  ├─→ Community Reviews
  │     ├─→ Community Member reviews
  │     ├─→ Owner responses
  │     ├─→ Compliment chips
  │     └─→ Trust-weighted ranking
  │
  ├─→ Heritage Connections
  │     ├─→ Business near heritage site surfacing
  │     └─→ Community Reference designation (for non-commercial cultural places)
  │
  ├─→ Events
  │     ├─→ Business-hosted events
  │     └─→ Event discovery from business profile
  │
  ├─→ KinfolkAI
  │     ├─→ Business recommendation in chat responses
  │     └─→ Business context in relocation/travel guidance
  │
  ├─→ Safety
  │     ├─→ Safety context near business location
  │     └─→ Move alerts for business area
  │
  ├─→ Business Growth Tools
  │     ├─→ Promotions (paid placement)
  │     ├─→ Analytics dashboard
  │     └─→ Advertising options
  │
  └─→ Community Member Actions
        ├─→ Save business
        ├─→ Follow business (notifications)
        ├─→ Share business (community feed, Kinfolk Circles)
        └─→ Report business (moderation)
```

---

### KinfolkAI
```
KinfolkAI
  ├─→ Business Discovery
  │     └─→ Contextual recommendations based on conversation, preferences, location
  │
  ├─→ Heritage Education
  │     └─→ Heritage site context from cultural_sites table
  │
  ├─→ Safety Guidance
  │     └─→ Neighborhood safety data from surveys and alerts
  │
  ├─→ Resource Finding
  │     └─→ Knowledge library, topic issues, resource listings
  │
  ├─→ Relocation Assistance
  │     └─→ City-specific business, safety, heritage, and community data
  │
  ├─→ Travel Planning
  │     └─→ Heritage sites + businesses + events in destination
  │
  ├─→ Life Journey Integration
  │     └─→ life_journeys table context injection
  │
  ├─→ Membership Tier Awareness
  │     └─→ free / Navigator / Trailblazer depth rules
  │
  └─→ Future Personas (FSR - not yet built)
        ├─→ Community Guide
        ├─→ Cultural Guide / Heritage Educator
        ├─→ Relocation Guide
        ├─→ Business Advisor
        ├─→ Mentor Connector
        ├─→ Opportunity Finder
        ├─→ Scholarship Assistant
        ├─→ Safety Companion
        ├─→ Event Planner / Itinerary Builder
        ├─→ Family Mode
        ├─→ Elder Mode
        └─→ Student Mode
```

---

### Kinfolk Circles
```
Kinfolk Circles
  ├─→ Saved Places
  │     └─→ Members share saved businesses and heritage sites with circle
  │
  ├─→ Heritage Sites
  │     └─→ Heritage stops in shared trip itineraries
  │
  ├─→ Events
  │     └─→ Group attendance at community events
  │
  ├─→ Mentorship (FSR-005)
  │     └─→ Mentorship circles (structured group mentorship sessions)
  │
  ├─→ Alumni (FSR-004)
  │     └─→ HBCU alumni circles
  │
  └─→ KinfolkAI
        └─→ AI curator mode (votes / random / by_member) for circle planning
```

---

### Safety
```
Safety
  ├─→ Map
  │     └─→ Safety overlay on business and heritage map
  │
  ├─→ Business Profiles
  │     └─→ Safety context near business location
  │
  ├─→ KinfolkAI
  │     └─→ Safety signals inform travel and relocation recommendations
  │
  ├─→ Community Feed
  │     └─→ Move alerts and buzz alerts surfaced in feed
  │
  ├─→ Notifications
  │     └─→ Community alerts for subscribed areas
  │
  └─→ Resources
        └─→ Emergency resources connected to safety events
```

---

## "Promote, Don't Duplicate" Quick Reference

Before building anything new, check this table:

| New Feature Being Considered | Check First |
|------------------------------|-------------|
| A new recommendation system | KinfolkAI + existing trust-weighted business ranking |
| A new notification type | Existing notifications system |
| A new content submission flow | heritage_stories + community_posts + knowledge_articles patterns |
| A new saved-places list | saved_places table (currently business-only; extend for heritage) |
| A new user role | Experience Progression levels above |
| A new map layer | Existing FullMapView layer architecture + FSR-016 |
| A new events feature | Existing events system; consider adding heritage_site_id FK |
| A new resource type | Existing knowledge_articles + FSR topics system |
| A new moderation queue | Existing content reports + heritage stories moderation pattern |
| A new analytics dashboard | Existing admin panel analytics |

---

*Last updated: July 26, 2026 — Initial version. Map is extended after each experience audit and each implementation wave.*
