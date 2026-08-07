/**
 * Chip label configuration — all chip content lives here.
 * Wording changes never require a code deploy; edit this file and ship as OTA.
 */

export interface Chip {
  id: string;
  label: string;
  /** Optional: reveal extra content when this chip is selected */
  revealsDescription?: boolean;
}

// ─── B1: Unified Place Report ─────────────────────────────────────────────────
export const EXPERIENCE_CHIPS: Chip[] = [
  { id: "didnt_feel_good",     label: "This didn't feel good" },
  { id: "followed_watched",    label: "Followed or watched" },
  { id: "refused_service",     label: "Refused service" },
  { id: "treated_differently", label: "Treated differently than others" },
  { id: "rude_dismissive",     label: "Rude or dismissive to me" },
  { id: "security_police",     label: "Called security or police on me" },
  { id: "slurs_hostile",       label: "Slurs or hostile language" },
  { id: "unsafe_outside",      label: "Unsafe outside the business" },
  { id: "something_else",      label: "Something else", revealsDescription: true },
];

export const TIME_OF_DAY_CHIPS: Chip[] = [
  { id: "morning",   label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening",   label: "Evening" },
  { id: "night",     label: "Night" },
];

export const WHO_INVOLVED_CHIPS: Chip[] = [
  { id: "staff",            label: "Staff" },
  { id: "manager",          label: "Manager" },
  { id: "security",         label: "Security" },
  { id: "another_customer", label: "Another customer" },
  { id: "not_sure",         label: "Not sure" },
];

export const HAPPENED_BEFORE_CHIPS: Chip[] = [
  { id: "first_time",       label: "First time" },
  { id: "happened_before",  label: "Happened before" },
];

export const OTHERS_SAW_CHIPS: Chip[] = [
  { id: "yes",      label: "Yes" },
  { id: "no",       label: "No" },
  { id: "not_sure", label: "Not sure" },
];

// ─── B2: Write Review — badge chips ──────────────────────────────────────────
export const REVIEW_BADGE_CHIPS: Chip[] = [
  { id: "worth_every_visit",  label: "Worth Every Visit" },
  { id: "grandma_approved",   label: "Grandma Approved" },
  { id: "felt_at_home",       label: "Felt at Home" },
  { id: "great_service",      label: "Great Service" },
  { id: "would_go_back",      label: "Would Go Back" },
  { id: "mixed_feelings",     label: "Mixed Feelings" },
  { id: "not_for_us",         label: "Not For Us" },
  { id: "something_felt_off", label: "Something Felt Off" },
];

/** Badges that softly offer a safety report link */
export const NEGATIVE_REVIEW_BADGES = new Set(["not_for_us", "something_felt_off"]);

// ─── B3: Nominate Business — ownership designation chips ─────────────────────
export const OWNERSHIP_CHIPS: Chip[] = [
  { id: "black-owned",       label: "Black-owned" },
  { id: "hispanic-owned",    label: "Hispanic/Latino-owned" },
  { id: "ethiopian-owned",   label: "Ethiopian-owned" },
  { id: "caribbean-owned",   label: "Caribbean-owned" },
  { id: "brazilian-owned",   label: "Brazilian-owned" },
  { id: "indigenous-owned",  label: "Indigenous-owned" },
  { id: "asian-owned",       label: "Asian-owned" },
  { id: "african-owned",     label: "African-owned" },
  { id: "immigrant-owned",   label: "Immigrant-owned" },
  { id: "woman-owned",       label: "Woman-owned" },
  { id: "lgbtq-owned",       label: "LGBTQ+-owned" },
  { id: "veteran-owned",     label: "Veteran-owned" },
  { id: "family-owned",      label: "Family-owned" },
];

// ─── B4: Neighborhood Survey — welcome rating chips ───────────────────────────
export const WELCOME_RATING_CHIPS: Chip[] = [
  { id: "5", label: "5 — Felt completely welcome" },
  { id: "4", label: "4 — Mostly comfortable" },
  { id: "3", label: "3 — Neutral, hard to say" },
  { id: "2", label: "2 — Felt out of place" },
  { id: "1", label: "1 — Did not feel welcome" },
];

export const WHAT_STOOD_OUT_CHIPS: Chip[] = [
  { id: "people_friendly",        label: "People were friendly" },
  { id: "businesses_welcoming",   label: "Businesses welcomed me" },
  { id: "got_stared_at",          label: "Got stared at" },
  { id: "was_followed",           label: "Was followed" },
  { id: "heavy_police",           label: "Heavy police presence" },
  { id: "nowhere_for_basics",     label: "Nowhere to go for basics" },
  { id: "would_bring_family",     label: "Would bring my family here" },
];
