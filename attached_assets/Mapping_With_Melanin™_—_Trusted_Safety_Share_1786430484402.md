# Mapping With Melanin™ — Trusted Safety Share
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Status:** Approved for Implementation

---

## What This Feature Is

Trusted Safety Share allows a user to designate up to a small number of trusted contacts — family members, close friends — who will receive **immediate safety alerts only** when the trusted user is traveling or in a new location. The feature is entirely opt-in, entirely user-controlled, and can be turned off by either party at any time.

This is not location tracking. It is not a surveillance tool. It is a safety net — the digital equivalent of texting your mom "I landed" but with the platform doing it automatically when it matters most.

---

## How It Works

### The Sharing User (e.g., the son in Hawaii)
The traveling user enables Trusted Safety Share in their settings. They select which contacts they want to share safety alerts with. They choose the scope: location-based safety alerts only (weather emergencies, civil unrest, natural disasters, platform-flagged safety incidents in their area). They can turn the feature off at any time from their settings, and it pauses automatically when they return to their home location.

### The Receiving User (e.g., the parent at home)
The parent receives a notification that their son has enabled Trusted Safety Share and has added them as a trusted contact. The parent must **accept** this connection — it is never imposed. Once accepted, the parent receives safety alerts that are triggered for their son's current location. They do not see his searches, his conversations with Kinfolk, his saves, his Circle activity, or anything else. They only receive the same safety alert he receives, mirrored to them.

### What Triggers an Alert
Only platform-level safety events trigger a notification to the trusted contact. These are:

- **Severe weather:** Hurricane warnings, tornado watches, flash flood emergencies, blizzard warnings — NOAA/NWS-sourced, location-specific.
- **Civil emergency:** Government-issued emergency alerts (FEMA, local emergency management) for the user's current location.
- **Natural disaster:** Earthquake, wildfire, tsunami warnings sourced from official channels.
- **Platform safety flags:** If MWM's own community safety data flags a significant incident in the user's immediate area (e.g., a cluster of police encounter reports or safety alerts filed by multiple users in the same location within a short time window).

### What Never Triggers an Alert
- Routine check-ins or location updates
- Business searches or saves
- Kinfolk conversations
- Community activity
- Minor weather (rain, heat advisories that are not emergencies)
- Anything the user has searched or browsed

---

## Privacy Principles

This feature must be built with the same privacy intelligence described in the Privacy brief. Specifically:

1. **The receiving user sees only the alert, not the context.** The parent knows their son received a hurricane warning in Hawaii. They do not know where in Hawaii he is, what he was doing, or what he searched before the alert.
2. **The sharing user is always in control.** They can revoke the trusted contact's access at any time, instantly and without notification to the contact.
3. **No passive location sharing.** The feature does not share the user's real-time GPS coordinates with the trusted contact. It shares only the location context required to explain the alert (e.g., "Your trusted contact received a severe weather alert for Maui, Hawaii").
4. **Mutual consent required.** Both parties must actively enable and accept the connection. It cannot be set up unilaterally by either party.
5. **Auto-pause at home.** When the sharing user's location returns to their registered home area, the feature automatically pauses. It reactivates when they travel again, or they can manually reactivate it.

---

## The User Experience

**For the sharing user (setup flow):**
Settings → Safety → Trusted Safety Share → Enable → Add trusted contacts (from connections list or by phone/email) → Select alert types → Confirm

**For the receiving user (acceptance flow):**
Notification: *"[Name] has added you as a trusted safety contact. You will receive immediate safety alerts if they are triggered at their location while traveling. You can accept or decline."* → Accept → Done

**The alert notification the parent receives:**
*"Safety Alert — [Son's first name] is currently in Maui, Hawaii. A Hurricane Watch has been issued for that area. This alert was also sent to them. No action is required unless you hear otherwise."*

---

## What Makes This Different From Find My Friends

Find My Friends shares continuous location. This feature shares nothing continuously. It is silent until a real safety event occurs. The parent does not know where their son is having dinner, which beach he went to, or what time he got back to the hotel. They only know, in the moment it matters, that their child received the same emergency alert they would want to know about.

This is the feature that makes a parent feel at peace letting their child travel — without making the child feel watched.

---

## Implementation Requirements for Replit

1. **Settings toggle:** Add "Trusted Safety Share" to the user's Safety settings panel. This must be clearly labeled as opt-in and user-controlled.
2. **Trusted contacts management:** Allow users to add up to 5 trusted contacts. Contacts must be existing MWM users or invited via phone/email.
3. **Alert source integration:** Connect to NOAA/NWS weather API and FEMA IPAWS for official emergency alerts. Layer in MWM's own community safety signal (from the existing safety reporting system) as a third trigger source.
4. **Location context (not coordinates):** Store the user's current city/region for alert context purposes only. Do not store or transmit precise GPS coordinates to trusted contacts.
5. **Auto-pause logic:** Implement home-location detection. When the user's location matches their registered home city, pause the feature automatically.
6. **No-touch guardrail:** This feature is built as an extension of the existing Safety Hub. Do not alter the Safety Hub's existing reporting or alert infrastructure. Add this as a new module within it.

---

## Strict No-Touch Guardrails (Unchanged)

**DO NOT touch:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The existing Safety Hub reporting flows
- The Library, Marketplace, or any other existing feature
