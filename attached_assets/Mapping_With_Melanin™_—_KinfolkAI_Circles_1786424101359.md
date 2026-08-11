# Mapping With Melanin™ — KinfolkAI Circles
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Status:** Approved for Implementation — Final piece of the MWM intelligence ecosystem.

---

## What Circles Are

A Circle is a small, private group of 2 to 8 people who share a KinfolkAI context. When members join a Circle, Kinfolk learns who they are collectively and individually. It remembers their shared saves, their individual preferences, their upcoming dates, and their separate interests — and uses all of this to plan experiences that work for the group as a whole and for each person within it.

Circles are not a group chat. They are a shared intelligence layer. Kinfolk is the silent, always-on member of every Circle who knows everyone's preferences and is always thinking about what would make the next experience better.

---

## Circle Types & Use Cases

Circles can form around any shared context. The platform does not need to enforce rigid types, but Kinfolk must be able to recognize and adapt to the following common patterns:

**Couples:** Two people. Kinfolk remembers anniversaries, tracks individual preferences (one loves massages, one loves hiking), and plans itineraries where both people can pursue their interests simultaneously — together or apart — and reconnect at a shared moment. Example: Partner A gets a spa afternoon, Partner B gets a trail hike, and Kinfolk books them both at the same restaurant for dinner at 7pm.

**Travel Friends:** 2 to 8 people planning a trip together. Each person may have a different content focus or interest. Kinfolk assigns complementary roles based on what it knows about each person. Example: In a group of four influencer friends visiting Brazil, Kinfolk tells one to explore the luxury spa scene, one to find adventure experiences, one to document the restaurant circuit, and one to cover cultural museums — because it knows their audiences and their personal interests. It then builds a shared itinerary that has overlap moments (group dinners, shared excursions) and individual tracks.

**Family Circles:** Parents and children. Kinfolk understands the ages and interests of the children in the Circle. When a parent searches for Legoland in Utah and none exists, Kinfolk does not return zero results. It searches for the closest match — theme parks, interactive children's museums, LEGO-certified stores, or family adventure experiences in Utah that align with what a child who loves Legoland would enjoy. It surfaces these to the parent with the framing: *"There's no Legoland in Utah, but here are experiences your child will love just as much."*

**Interest Groups:** Friends who share a specific interest — a book club, a dining group, a wellness circle. Kinfolk tracks what the group has already experienced together (saved places, past check-ins) and proactively suggests what they should do next based on their collective pattern.

---

## How Kinfolk Learns a Circle

When a user creates or joins a Circle, Kinfolk begins building a collective profile from three sources:

1. **Individual profiles:** Each member's existing saves, Library follows, vibe tags, and KinfolkAI conversation history is accessible to Kinfolk within the Circle context. Members consent to this when joining.
2. **Shared saves:** Members can add saves to the Circle — a restaurant, a travel destination like Brazil, an attraction like Legoland, a spa, a hiking trail. These shared saves become the Circle's collective wishlist and Kinfolk's planning canvas.
3. **Declared topics:** Members can optionally declare topics they want to explore together (e.g., "We want to find Black-owned restaurants in every city we visit") or Kinfolk infers these from their behavior.

---

## The Itinerary Engine

When a Circle member asks Kinfolk to plan something — or when Kinfolk proactively suggests a plan — it must generate itineraries that respect both shared and individual preferences simultaneously.

**The planning logic Kinfolk must follow:**

- Identify the shared interests and the diverging interests within the Circle.
- Build a "spine" of shared moments (arrival, group meals, key experiences everyone wants).
- Build individual "branches" off the spine for the hours when members want to pursue separate interests.
- Reconnect the branches at the next shared moment.
- Surface the plan to all Circle members with each person's individual track clearly labeled.

**Example — Couple in Phuket:**
- Shared: Arrive together, dinner at a Black-owned Thai fusion restaurant at 7pm, beach morning on Day 3.
- Partner A's track: Luxury spa on Day 1 afternoon, cooking class on Day 2 morning.
- Partner B's track: Jungle hike on Day 1 afternoon, kayaking on Day 2 morning.
- Kinfolk books all of these and sends each person their individual schedule, plus the shared schedule.

**Example — Influencer Travel Group in Brazil:**
- Shared: Group arrival dinner, one beach day, farewell brunch.
- Individual tracks: Kinfolk assigns each person a content focus based on their audience and personal interest — luxury spa, adventure, food, culture — and builds a separate daily itinerary for each that does not overlap with the others (so they are not all posting the same content).

---

## The Demand Signal Connection

Circles feed the demand signal engine described in the previous brief. When multiple Circle members save the same location or search for the same experience that does not yet exist in the MWM database, this counts as a stronger demand signal than individual searches — because it represents a coordinated, social intent.

Example: A Circle of 6 travel friends all save "Legoland Utah" even though it does not exist. This is a high-confidence signal that family-friendly, interactive entertainment experiences in Utah are in demand. The engine notifies relevant businesses in Utah and surfaces alternatives to the Circle members.

---

## The Community Feedback Connection

Circles also feed back into the community intelligence layer. When a Circle checks in at a business together, their collective vibe tags carry more weight than individual tags. A group of 6 people all tagging a restaurant "Date Night Approved" after a Circle dinner is a stronger signal than one person doing the same. Kinfolk must weight group check-ins and tags accordingly.

---

## The Influencer/Creator Connection

When a Circle consists of creators or influencers, Kinfolk must recognize this and activate the creator notification layer from the demand signal engine. If the Circle's travel plans align with a business that has unmet demand in that location, the relevant Circle members receive a notification: *"Your community in [City] is looking for [Experience]. [Business Name] may be the match — check it out and share it with your audience."*

---

## Data Model Requirements for Replit

```sql
-- The Circle itself
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  created_by UUID REFERENCES users(id),
  max_members INTEGER DEFAULT 8,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Circle membership
CREATE TABLE circle_members (
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

-- Shared saves within a Circle
CREATE TABLE circle_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  saved_by UUID REFERENCES users(id),
  save_type VARCHAR(50), -- 'business', 'destination', 'experience', 'library_topic'
  reference_id VARCHAR(255), -- ID or name of the saved item
  notes TEXT,
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Kinfolk-generated itineraries for a Circle
CREATE TABLE circle_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  title VARCHAR(255),
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  shared_plan JSONB, -- The spine of shared moments
  individual_plans JSONB, -- Keyed by user_id, each person's individual track
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Behaviors Kinfolk Must Demonstrate in Circles

1. **Remember anniversaries and significant dates** declared by Circle members and proactively suggest plans in advance.
2. **Never return zero results** for a Circle save. If Legoland does not exist in Utah, Kinfolk must suggest the closest equivalent and explain why it is a good match for the child who loves Legoland.
3. **Assign complementary roles** to influencer Circles based on each member's known audience and content style.
4. **Weight group check-ins** more heavily than individual check-ins in the community feedback scoring system.
5. **Feed Circle saves into the demand signal engine** when the saved item does not exist in the local MWM database.

---

## Strict No-Touch Guardrails (Unchanged)

**DO NOT touch:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)
- The existing curated "Books" UI panel in the Library
