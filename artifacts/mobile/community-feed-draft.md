# Community Feed — Founder Review Draft
## 12 Posts for Approval Before Publishing
### Status: DRAFT — Do Not Publish Without Founder Sign-Off

---

**Post 1 — Welcome / Mission**
> Mapping With Melanin is here. We built this platform for us — to find each other, support each other, and move through the world with community at our back. Whether you're looking for a great restaurant, a safe neighborhood, or just a place that feels like home, we've got you. Welcome. 🗺️

---

**Post 2 — Business Discovery**
> Hidden gems don't stay hidden when the community talks. Drop the name of a Black-owned business that deserves more love in the comments — we're all discovering together.

---

**Post 3 — Cultural Heritage**
> Did you know the Heritage map lets you explore cultural sites, historically significant neighborhoods, and places that shaped Black history across the country? Tap the Heritage layer on the map and see history come alive in your city.

---

**Post 4 — KinfolkAI Introduction**
> Meet KinfolkAI — your personal travel and community guide. Ask it about Black-owned businesses near you, neighborhoods with community roots, or tips for moving through a new city. It's like having a knowledgeable friend in your corner wherever you go.

---

**Post 5 — Safety + Community Awareness**
> Your safety check-ins help the whole community. When you share what you're seeing on the ground — whether it's a resource, a heads-up, or a moment of community — you're adding to the collective knowledge that keeps us informed and protected.

---

**Post 6 — Membership / Supporting the Mission**
> Every membership directly funds platform development, community partnerships, and the team working to expand our business directory. Thank you to everyone who joined early — your support built this.

---

**Post 7 — Founder Voice**
> I built this because I kept searching for platforms that understood how we move through the world. The places we choose to eat, stay, and spend matter. This is our space to organize that knowledge and share it freely. — Founder, Mapping With Melanin

---

**Post 8 — Business Owners**
> Are you a Black-owned business owner? Your listing on Mapping With Melanin puts you in front of a community that's actively looking to support you. Claim your profile or add your business from the business tab.

---

**Post 9 — Events**
> Check the Events tab for community gatherings, pop-ups, cultural celebrations, and meetups near you. The community calendar is yours — see what's happening and add events the community should know about.

---

**Post 10 — Community Circles**
> Kinfolk Circles let you create shared lists of your favorite spots with the people you trust — family, friend groups, travel crews. Build your circle and start saving places together.

---

**Post 11 — Feedback / Invitation**
> This platform grows with you. If something feels off, if a business is missing, or if you have an idea for making this better — use the feedback option in your profile. We read every message.

---

**Post 12 — Soft Launch Moment**
> We're just getting started. The business directory is live. The map is live. KinfolkAI is live. Heritage is live. The community feed is live. A lot more is coming — but what's here is real, it works, and it's ours. Share this with someone who needs to know about it.

---

## Functional verification
- Empty state: ✅ (only 1 smoke test post currently — safe)
- Post creates: requires auth (401 for unauthenticated) ✅
- Reporting endpoint: needs live check after auth works
- Moderation: admin panel functional (needs admin auth)
- Guidelines link: /api/community/guidelines → 404 (endpoint missing or path mismatch — flag for fix)
- Post deletion: admin panel can remove individual posts

## Notes for founder
- All 12 posts above are for your review and approval only
- None will be published until you say "publish" on specific posts
- Adjust voice/wording freely — these match the mission document but you know the brand voice best
- Posts 1, 7, 12 are the highest-priority for Apple review readability
