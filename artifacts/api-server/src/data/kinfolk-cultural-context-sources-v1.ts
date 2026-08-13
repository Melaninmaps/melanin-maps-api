/**
 * Kinfolk Cultural Context — Curated Source Records (v1)
 *
 * Founder-reviewed initial source manifest. Every record here has been verified
 * against the implementation order spec. Sources are seeded as 'active' because
 * they have been reviewed before this seed was committed.
 *
 * Tiers:
 *   A — Official work/studio/artist/government/university/licensing page
 *   B — Reputable trade/cultural publication with original reporting
 *   C — Verified public creator profile or established platform listing
 *
 * Invariants enforced by validate-kinfolk-source-manifest.ts:
 *   - canonical_url must be https://
 *   - http_status must be in expected_status set
 *   - No source is promoted to 'active' with a 404/410 or content mismatch
 *   - claim_scope must be non-empty
 */

export type SourceSeed = {
  canonicalUrl: string;
  publisher: string;
  title: string;
  tier: "A" | "B" | "C";
  claimScope: string[];
  expectedHost: string;
  expectedStatus: 200 | 301 | 302;
  notes?: string;
};

export const CURATED_SOURCES: SourceSeed[] = [
  // ── Sinners (2025 film) ─────────────────────────────────────────────────────
  {
    canonicalUrl: "https://www.sinnersmovie.com/toolkit/",
    publisher: "Sinners (Official Film)",
    title: "Sinners — Official film toolkit",
    tier: "A",
    claimScope: ["film_credit", "director_credit", "cast_credit", "release_year"],
    expectedHost: "sinnersmovie.com",
    expectedStatus: 200,
    notes: "Confirms Ryan Coogler as writer/director; Michael B. Jordan as lead",
  },
  {
    canonicalUrl: "https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96",
    publisher: "HBO Max",
    title: "Sinners — HBO Max official page",
    tier: "A",
    claimScope: ["film_credit", "streaming_availability", "release_year"],
    expectedHost: "hbomax.com",
    expectedStatus: 200,
    notes: "Official streaming page; may redirect — validation script records final URL",
  },

  // ── Michelle Williams (Destiny's Child) ────────────────────────────────────
  {
    canonicalUrl: "https://www.iamtenitra.com/about",
    publisher: "Michelle Williams (Artist Official Site)",
    title: "Michelle Williams — official biography",
    tier: "A",
    claimScope: ["biography", "group_membership", "discography", "career"],
    expectedHost: "iamtenitra.com",
    expectedStatus: 200,
    notes:
      "Confirms Michelle Williams as Destiny's Child member; do not use for restaurant or city recommendations",
  },

  // ── Annie Macaulay ─────────────────────────────────────────────────────────
  {
    canonicalUrl: "https://nollywire.com/names/annie-macaulay-idibia/",
    publisher: "Nollywire",
    title: "Nollywire — Annie Macaulay profile",
    tier: "B",
    claimScope: ["biography", "nationality", "public_profile"],
    expectedHost: "nollywire.com",
    expectedStatus: 200,
    notes:
      "Tier B: reputable Nigerian entertainment publication. Claim scope limited to biography and nationality. " +
      "Do NOT use as sole proof of a professional credential. " +
      "Profession labeled 'entertainer/public figure' — do not call her a 'singer' without Tier A confirmation.",
  },
  {
    canonicalUrl: "https://www.instagram.com/annieidibia1/",
    publisher: "Annie Macaulay — Public Instagram",
    title: "Annie Macaulay — public Instagram profile (annieidibia1)",
    tier: "C",
    claimScope: ["public_identity", "social_presence"],
    expectedHost: "instagram.com",
    expectedStatus: 200,
    notes:
      "Tier C: verified public creator profile. May be used to confirm public identity; " +
      "not sufficient for credential or biographical claims.",
  },

  // ── HBCU catalog ───────────────────────────────────────────────────────────
  {
    canonicalUrl:
      "https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/",
    publisher: "White House Initiative on Historically Black Colleges and Universities",
    title: "White House Initiative on HBCUs — institution list",
    tier: "A",
    claimScope: ["hbcu_designation", "institution_name", "institution_location"],
    expectedHost: "sites.ed.gov",
    expectedStatus: 200,
    notes: "Authoritative federal HBCU list. Use for HBCU designation only; not for current enrollment or tuition.",
  },

  // ── Temple University ───────────────────────────────────────────────────────
  {
    canonicalUrl: "https://www.temple.edu/",
    publisher: "Temple University",
    title: "Temple University — official site",
    tier: "A",
    claimScope: ["institution_name", "institution_location", "academic_offerings"],
    expectedHost: "temple.edu",
    expectedStatus: 200,
    notes: "Confirms Temple as a Philadelphia public research university. Admissions/tuition/programs subject to change.",
  },

  // ── Kendrick Lamar + Drake (public record for opinion mode) ────────────────
  {
    canonicalUrl: "https://www.allmusic.com/artist/kendrick-lamar-mn0002683148",
    publisher: "AllMusic",
    title: "Kendrick Lamar — AllMusic discography",
    tier: "B",
    claimScope: ["discography", "career_chronology", "genre"],
    expectedHost: "allmusic.com",
    expectedStatus: 200,
    notes: "Tier B: trade publication for cultural-opinion context. Not for credential claims.",
  },
  {
    canonicalUrl: "https://www.allmusic.com/artist/drake-mn0000783338",
    publisher: "AllMusic",
    title: "Drake — AllMusic discography",
    tier: "B",
    claimScope: ["discography", "career_chronology", "genre"],
    expectedHost: "allmusic.com",
    expectedStatus: 200,
    notes: "Tier B: trade publication for cultural-opinion context. Not for credential claims.",
  },
];
