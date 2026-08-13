/**
 * Kinfolk Cultural Context — Curated Entity Seeds (v1)
 *
 * Each entity is founder-reviewed and backed by at least one active Tier A/B source.
 * An entity is 'active' in the resolver only if every relationship it uses for
 * factual claims points to an active source record.
 *
 * aliasType values:
 *   'title'        — official work title
 *   'stage_name'   — artistic/public name (may be a common first name — lower confidence)
 *   'full_name'    — legal or full professional name
 *   'group_context'— alias used only when a group qualifier is present
 *   'former_name'  — previous name
 *   'locale'       — translated/localized form
 *
 * confidence: 0–1. First-name-only aliases ≤ 0.5. Full unambiguous names ≥ 0.85.
 */

export type AliasEntry = {
  alias: string;
  aliasType: "title" | "stage_name" | "full_name" | "group_context" | "former_name" | "locale";
  confidence: number;
  locale?: string;
};

export type RelationshipEntry = {
  type:
    | "directed_by"
    | "member_of"
    | "stars_in"
    | "located_in"
    | "historically_black_college"
    | "produced_by"
    | "written_by";
  targetCanonicalName: string;
  sourceUrl: string;
};

export type EntitySeed = {
  canonicalName: string;
  entityType: "person" | "work" | "group" | "institution" | "place" | "team" | "event" | "movement";
  normalizedName: string;
  shortSummary: string;
  countryCodes: string[];
  languageCodes: string[];
  contextTags: string[];
  eraStart?: number;
  eraEnd?: number;
  aliases: AliasEntry[];
  sourceUrls: string[];
  relationships: RelationshipEntry[];
};

export const CURATED_ENTITIES: EntitySeed[] = [
  // ── Sinners (2025 film) ────────────────────────────────────────────────────
  {
    canonicalName: "Sinners (2025 film)",
    entityType: "work",
    normalizedName: "sinners 2025 film",
    shortSummary:
      "Sinners is a 2025 horror/drama film written and directed by Ryan Coogler, " +
      "starring Michael B. Jordan. Released by Warner Bros. and available on HBO Max.",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: ["black cinema", "ryan coogler filmography", "michael b jordan", "horror", "drama", "2025 film"],
    eraStart: 2025,
    aliases: [
      { alias: "Sinners", aliasType: "title", confidence: 0.75 },
      { alias: "Sinners 2025", aliasType: "title", confidence: 0.92 },
      { alias: "Sinners film", aliasType: "title", confidence: 0.92 },
      { alias: "Sinners movie", aliasType: "title", confidence: 0.92 },
    ],
    sourceUrls: [
      "https://www.sinnersmovie.com/toolkit/",
      "https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96",
    ],
    relationships: [
      {
        type: "directed_by",
        targetCanonicalName: "Ryan Coogler",
        sourceUrl: "https://www.sinnersmovie.com/toolkit/",
      },
      {
        type: "written_by",
        targetCanonicalName: "Ryan Coogler",
        sourceUrl: "https://www.sinnersmovie.com/toolkit/",
      },
    ],
  },

  // ── Ryan Coogler ──────────────────────────────────────────────────────────
  {
    canonicalName: "Ryan Coogler",
    entityType: "person",
    normalizedName: "ryan coogler",
    shortSummary:
      "Ryan Coogler is an American film director and screenwriter from Oakland, California. " +
      "Known for Fruitvale Station (2013), Creed (2015), Black Panther (2018), " +
      "Black Panther: Wakanda Forever (2022), and Sinners (2025).",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: ["black cinema", "film director", "african american directors", "marvel", "ryan coogler"],
    eraStart: 2013,
    aliases: [
      { alias: "Ryan Coogler", aliasType: "full_name", confidence: 0.97 },
      { alias: "Coogler", aliasType: "stage_name", confidence: 0.82 },
    ],
    sourceUrls: ["https://www.sinnersmovie.com/toolkit/"],
    relationships: [],
  },

  // ── Michelle Williams (singer, Destiny's Child) ────────────────────────────
  {
    canonicalName: "Michelle Williams (singer)",
    entityType: "person",
    normalizedName: "michelle williams singer",
    shortSummary:
      "Michelle Williams is a singer, actress, and Broadway performer born July 23, 1980, " +
      "in Rockford, Illinois. Best known as a member of Destiny's Child alongside " +
      "Beyoncé and Kelly Rowland. Gospel/R&B solo career includes Heart to Yours (2002).",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: [
      "destinys child",
      "r&b",
      "gospel",
      "black music history",
      "beyonce",
      "kelly rowland",
      "singer",
      "broadway",
    ],
    eraStart: 2000,
    aliases: [
      // Full name — high confidence but still ambiguous (actress also named Michelle Williams)
      { alias: "Michelle Williams", aliasType: "full_name", confidence: 0.62 },
      // Qualified — disambiguates with group context
      { alias: "Michelle Williams from Destiny's Child", aliasType: "group_context", confidence: 0.99 },
      { alias: "Michelle Williams Destiny's Child", aliasType: "group_context", confidence: 0.99 },
      { alias: "Michelle Williams singer", aliasType: "group_context", confidence: 0.95 },
    ],
    sourceUrls: ["https://www.iamtenitra.com/about"],
    relationships: [
      {
        type: "member_of",
        targetCanonicalName: "Destiny's Child",
        sourceUrl: "https://www.iamtenitra.com/about",
      },
    ],
  },

  // ── Destiny's Child ─────────────────────────────────────────────────────────
  {
    canonicalName: "Destiny's Child",
    entityType: "group",
    normalizedName: "destinys child",
    shortSummary:
      "Destiny's Child was an American R&B girl group formed in Houston, Texas. " +
      "Classic lineup: Beyoncé Knowles, Kelly Rowland, and Michelle Williams. " +
      "Hits include Say My Name, Survivor, Bootylicious, Independent Women Part I.",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: ["r&b", "black music history", "houston", "girl groups", "beyonce", "kelly rowland"],
    eraStart: 1990,
    eraEnd: 2006,
    aliases: [
      { alias: "Destiny's Child", aliasType: "full_name", confidence: 0.97 },
      { alias: "Destinys Child", aliasType: "full_name", confidence: 0.97 },
      { alias: "DC", aliasType: "stage_name", confidence: 0.30 }, // Very ambiguous
    ],
    sourceUrls: ["https://www.iamtenitra.com/about"],
    relationships: [],
  },

  // ── Annie Macaulay ────────────────────────────────────────────────────────
  {
    canonicalName: "Annie Macaulay-Idibia",
    entityType: "person",
    normalizedName: "annie macaulay idibia",
    shortSummary:
      "Annie Macaulay-Idibia is a Nigerian-born public figure and entertainer married to " +
      "2face Idibia. Publicly known in Nigerian entertainment and social media circles. " +
      "Source: Nollywire profile and public Instagram presence.",
    countryCodes: ["NG"],
    languageCodes: ["en", "yo"],
    contextTags: ["nigerian entertainment", "nigeria", "nollywood adjacent", "public figure", "annie idibia"],
    eraStart: 2010,
    aliases: [
      // First name only — very low confidence; requires explicit context to resolve
      { alias: "Annie", aliasType: "stage_name", confidence: 0.35 },
      { alias: "Annie Macaulay", aliasType: "full_name", confidence: 0.88 },
      { alias: "Annie Idibia", aliasType: "stage_name", confidence: 0.90 },
      { alias: "Annie Macaulay-Idibia", aliasType: "full_name", confidence: 0.95 },
      { alias: "annieidibia1", aliasType: "stage_name", confidence: 0.90 },
    ],
    sourceUrls: [
      "https://nollywire.com/names/annie-macaulay-idibia/",
      "https://www.instagram.com/annieidibia1/",
    ],
    relationships: [],
  },

  // ── Temple University ─────────────────────────────────────────────────────
  {
    canonicalName: "Temple University",
    entityType: "institution",
    normalizedName: "temple university",
    shortSummary:
      "Temple University is a public research university in Philadelphia, Pennsylvania. " +
      "Founded 1884. Located in North Philadelphia. Home to 17 schools and colleges, " +
      "including the Klein College of Media and Communication and the Beasley School of Law.",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: ["philadelphia", "pennsylvania", "public university", "research university", "north philadelphia"],
    eraStart: 1884,
    aliases: [
      { alias: "Temple University", aliasType: "full_name", confidence: 0.97 },
      { alias: "Temple", aliasType: "stage_name", confidence: 0.75 },
      { alias: "TU", aliasType: "stage_name", confidence: 0.30 },
      { alias: "Temple Owls", aliasType: "stage_name", confidence: 0.80 },
    ],
    sourceUrls: ["https://www.temple.edu/"],
    relationships: [],
  },

  // ── Kendrick Lamar ────────────────────────────────────────────────────────
  {
    canonicalName: "Kendrick Lamar",
    entityType: "person",
    normalizedName: "kendrick lamar",
    shortSummary:
      "Kendrick Lamar is an American rapper, songwriter, and record producer from Compton, " +
      "California. Widely considered one of the most influential rappers of his generation. " +
      "Albums: Section.80, good kid m.A.A.d city, To Pimp a Butterfly, DAMN., Mr. Morale. " +
      "Pulitzer Prize winner (2018). Grammy winner.",
    countryCodes: ["US"],
    languageCodes: ["en"],
    contextTags: ["hip hop", "rap", "compton", "black music", "pulitzer", "tde", "pglan", "music artist"],
    eraStart: 2011,
    aliases: [
      { alias: "Kendrick Lamar", aliasType: "full_name", confidence: 0.97 },
      { alias: "Kendrick", aliasType: "stage_name", confidence: 0.80 },
      { alias: "K.Dot", aliasType: "stage_name", confidence: 0.82 },
    ],
    sourceUrls: ["https://www.allmusic.com/artist/kendrick-lamar-mn0002683148"],
    relationships: [],
  },

  // ── Drake ─────────────────────────────────────────────────────────────────
  {
    canonicalName: "Drake (rapper)",
    entityType: "person",
    normalizedName: "drake rapper",
    shortSummary:
      "Drake (Aubrey Drake Graham) is a Canadian rapper, singer, songwriter, and actor from " +
      "Toronto, Ontario. One of the best-selling music artists in history. " +
      "Albums: Thank Me Later, Take Care, Nothing Was the Same, Scorpion, Certified Lover Boy.",
    countryCodes: ["CA"],
    languageCodes: ["en"],
    contextTags: ["hip hop", "rap", "toronto", "ovo", "music artist", "r&b", "pop rap"],
    eraStart: 2009,
    aliases: [
      { alias: "Drake", aliasType: "stage_name", confidence: 0.83 },
      { alias: "Aubrey Drake Graham", aliasType: "full_name", confidence: 0.95 },
      { alias: "Champagne Papi", aliasType: "stage_name", confidence: 0.85 },
    ],
    sourceUrls: ["https://www.allmusic.com/artist/drake-mn0000783338"],
    relationships: [],
  },
];
