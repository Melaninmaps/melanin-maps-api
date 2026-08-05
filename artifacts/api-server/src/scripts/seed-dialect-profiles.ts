/**
 * Seed: City Dialect Profiles
 *
 * Sources: MWM Cultural Phrases By City document (all tour cities, expansion
 * cities, and Replit built-ins). Upserts — safe to re-run, never deletes.
 */
import { pool } from "@workspace/db";

interface DialectProfile {
  city: string;
  state: string;
  phrases: string[];
  kinfolkContext?: string;
}

const PROFILES: DialectProfile[] = [
  // ── NORTHEAST ──────────────────────────────────────────────────────────────
  {
    city: "Philadelphia",
    state: "PA",
    phrases: [
      "That jawn is certified",
      "Real ones been knowing about this spot",
      "No cap that's fire",
      "Philly approved",
    ],
    kinfolkContext:
      "Use 'jawn' naturally — it's Philly's most iconic all-purpose noun. Keep it hyper-local, keep it real.",
  },
  {
    city: "New York City",
    state: "NY",
    phrases: [
      "Deadass",
      "Bodega-certified",
      "That's valid",
      "NYC staple",
      "The city never sleeps on this",
    ],
    kinfolkContext:
      "NYC is five boroughs with distinct voices. Lean into borough pride when relevant — Harlem, BK, the BX each have their own energy.",
  },
  {
    city: "Newark",
    state: "NJ",
    phrases: [
      "Brick City certified",
      "973 staple",
      "Newark approved",
      "That's valid",
    ],
    kinfolkContext:
      "Newark is proud and underestimated — celebrate that. 'Brick City' is the badge of honor.",
  },
  {
    city: "Baltimore",
    state: "MD",
    phrases: [
      "That's dummy",
      "Hon",
      "Charm City certified",
      "Bmore staple",
      "Lor spot is fire",
    ],
    kinfolkContext:
      "'Dummy' means excellent here — never negative. 'Lor' is Baltimore for 'little' (as in little homie). 'Hon' is affectionate local slang.",
  },
  {
    city: "Boston",
    state: "MA",
    phrases: [
      "Wicked good",
      "Bean Town certified",
      "Boston staple",
      "617 approved",
    ],
    kinfolkContext:
      "'Wicked' is the Boston intensifier — wicked good means excellent. Acknowledge Boston's strong Black neighborhoods: Roxbury, Mattapan, Dorchester.",
  },
  {
    city: "Hartford",
    state: "CT",
    phrases: [
      "Hartford certified",
      "860 staple",
      "CT approved",
      "That's fire",
    ],
    kinfolkContext:
      "Hartford's Caribbean and Puerto Rican communities are central. Acknowledge their contributions alongside Black American culture.",
  },
  {
    city: "Allentown",
    state: "PA",
    phrases: [
      "610 certified",
      "Lehigh Valley staple",
      "PA approved",
      "That's real",
    ],
    kinfolkContext:
      "Satellite city in the Philly orbit. Growing Latino and Black communities deserve recognition.",
  },
  {
    city: "Harrisburg",
    state: "PA",
    phrases: [
      "717 certified",
      "Capitol City staple",
      "Harrisburg approved",
      "That's solid",
    ],
    kinfolkContext:
      "State capital with deep Black church and community roots. Anchor around community institutions.",
  },
  // ── MID-ATLANTIC / SOUTH ───────────────────────────────────────────────────
  {
    city: "Washington",
    state: "DC",
    phrases: [
      "DMV certified",
      "That joint go hard",
      "Real DMV staple",
      "Moe, you gotta check this out",
    ],
    kinfolkContext:
      "'Moe' is DC/DMV slang for friend/homie — deeply authentic. 'Joint' for spot/place is DMV-specific.",
  },
  {
    city: "Richmond",
    state: "VA",
    phrases: [
      "RVA certified",
      "804 staple",
      "Richmond approved",
      "That's gas",
    ],
    kinfolkContext:
      "RVA is Richmond's identity badge. Strong HBCU (Virginia Union) and Black arts community.",
  },
  {
    city: "Norfolk",
    state: "VA",
    phrases: [
      "757 certified",
      "Norfolk staple",
      "Hampton Roads approved",
      "That's valid",
    ],
    kinfolkContext:
      "757 covers the whole Hampton Roads region — Norfolk, Virginia Beach, Newport News. Use area code pride.",
  },
  {
    city: "Raleigh",
    state: "NC",
    phrases: [
      "Bull City certified",
      "Triangle staple",
      "FC (Carolina) approved",
      "That's valid",
    ],
    kinfolkContext:
      "The Triangle (Raleigh-Durham-Chapel Hill) is a HBCU corridor — NCCU, Shaw, St. Aug's. Lean into academic and community excellence.",
  },
  {
    city: "Durham",
    state: "NC",
    phrases: [
      "Bull City certified",
      "Triangle staple",
      "Durham approved",
      "That's valid",
    ],
    kinfolkContext:
      "Durham's Black Wall Street legacy is central. The Hayti neighborhood is sacred cultural ground.",
  },
  {
    city: "Charlotte",
    state: "NC",
    phrases: [
      "Queen City certified",
      "CLT staple",
      "704 approved",
      "That's fire",
    ],
    kinfolkContext:
      "Charlotte is one of the fastest-growing cities for Black professionals. Balance old-school legacy with new energy.",
  },
  {
    city: "Columbia",
    state: "SC",
    phrases: [
      "Cola certified",
      "Famously Hot staple",
      "803 approved",
      "Real SC vibes",
    ],
    kinfolkContext:
      "'Famously Hot' is the city's official slogan (literally the hottest city in SC). Strong HBCU presence (Benedict, Allen).",
  },
  {
    city: "Charleston",
    state: "SC",
    phrases: [
      "Holy City certified",
      "843 staple",
      "Charleston approved",
      "Real Lowcountry vibes",
    ],
    kinfolkContext:
      "The Gullah Geechee culture is sacred here — honor it. 'Holy City' from its historic churches. Lowcountry is a cultural identifier.",
  },
  {
    city: "Savannah",
    state: "GA",
    phrases: [
      "Hostess City certified",
      "912 staple",
      "Savannah approved",
      "Real Lowcountry vibes",
    ],
    kinfolkContext:
      "Savannah is steeped in Black history — Juneteenth was declared here. Lowcountry identity extends from Charleston down through Savannah.",
  },
  {
    city: "Atlanta",
    state: "GA",
    phrases: [
      "That's gas fr",
      "ATL certified",
      "Been putting on since day one",
      "On God",
      "Certified in the A",
    ],
    kinfolkContext:
      "'The A' is Atlanta. 'Gas' means excellent, fire. 'Putting on' means representing the city. HBCU legacy (AUC), trap music roots, Black media capital.",
  },
  // ── DEEP SOUTH ────────────────────────────────────────────────────────────
  {
    city: "Montgomery",
    state: "AL",
    phrases: [
      "MGM certified",
      "Gump staple",
      "334 approved",
      "Real Southern comfort",
    ],
    kinfolkContext:
      "Montgomery is the cradle of the Civil Rights Movement. Every engagement should honor the weight of that history.",
  },
  {
    city: "Birmingham",
    state: "AL",
    phrases: [
      "Magic City certified",
      "Bham staple",
      "205 approved",
      "That's raw",
    ],
    kinfolkContext:
      "'Magic City' from Birmingham's rapid industrial growth. Strong labor and civil rights history — the 16th Street Baptist Church is sacred ground.",
  },
  {
    city: "Mobile",
    state: "AL",
    phrases: [
      "Port City certified",
      "251 staple",
      "Gulf Coast approved",
      "Real Gulf vibes",
    ],
    kinfolkContext:
      "Mobile claims the oldest Mardi Gras in the US, predating New Orleans. Deep Creole and African American Gulf Coast culture.",
  },
  {
    city: "Tuskegee",
    state: "AL",
    phrases: [
      "Tuskegee certified",
      "334 staple",
      "Skegee approved",
      "Real HBCU vibes",
    ],
    kinfolkContext:
      "'Skegee' is what Tuskegee University alumni call it. Tuskegee is sacred — the legacy of Booker T. Washington and the Tuskegee Airmen.",
  },
  {
    city: "Baton Rouge",
    state: "LA",
    phrases: [
      "Red Stick certified",
      "BR staple",
      "225 approved",
      "That's cold",
    ],
    kinfolkContext:
      "'Red Stick' is the English translation of Baton Rouge. 'Cold' means excellent in Louisiana vernacular.",
  },
  {
    city: "New Orleans",
    state: "LA",
    phrases: [
      "Where ya at",
      "That's cold",
      "Who dat approved",
      "NOLA certified",
      "Yeah you right",
    ],
    kinfolkContext:
      "'Where ya at' is a greeting, not a question about location. 'Yeah you right' is enthusiastic agreement. 'Who dat' is sacred Saints territory. Use with warmth — NOLA culture is incomparable.",
  },
  {
    city: "Jackson",
    state: "MS",
    phrases: [
      "City with Soul certified",
      "601 staple",
      "Jackson approved",
      "That's raw",
    ],
    kinfolkContext:
      "Jackson is the capital of the Blackest state per capita. Deep blues and civil rights history. The water crisis is part of the community's lived reality — acknowledge systemic challenges alongside cultural pride.",
  },
  // ── TEXAS ─────────────────────────────────────────────────────────────────
  {
    city: "Houston",
    state: "TX",
    phrases: [
      "Chopped and screwed",
      "That's trill",
      "H-Town certified",
      "713 staple",
      "Holdin' it down",
    ],
    kinfolkContext:
      "'Trill' (true + real) was born in Houston hip-hop. Chopped and Screwed music is a Houston original. H-Town has the most diverse diaspora communities of any US city — Nigerian, Caribbean, African American all thrive here.",
  },
  {
    city: "Dallas",
    state: "TX",
    phrases: [
      "D-Town certified",
      "Triple D staple",
      "214 approved",
      "That's gas",
    ],
    kinfolkContext:
      "Dallas/Fort Worth — use 'D-Town' for Dallas, 'Cowtown' awareness for Fort Worth. Strong Southern Black church and business culture.",
  },
  {
    city: "San Antonio",
    state: "TX",
    phrases: [
      "Alamo City certified",
      "210 staple",
      "SA approved",
      "Puro San Antonio",
    ],
    kinfolkContext:
      "'Puro' means pure/authentic in Tejano slang — 'Puro San Antonio' means purely/authentically SA. Majority Latino city with strong Black community presence.",
  },
  // ── SOUTHEAST / FLORIDA ───────────────────────────────────────────────────
  {
    city: "Jacksonville",
    state: "FL",
    phrases: [
      "Duval certified",
      "904 staple",
      "Jax approved",
      "That's raw",
    ],
    kinfolkContext:
      "'Duval' is the county and the city's identity — 'Duval County' pride runs deep. JAX is the airport code turned city nickname.",
  },
  {
    city: "Miami",
    state: "FL",
    phrases: [
      "That's fire",
      "305 certified",
      "Magic City staple",
      "Miami approved",
      "Dale",
    ],
    kinfolkContext:
      "'Dale' (pronounced DAH-lay) is the iconic Miami/Cuban expression meaning go/do it/let's go. 305 is sacred to Miami. Miami's Magic City nickname predates Atlanta's usage.",
  },
  {
    city: "Orlando",
    state: "FL",
    phrases: [
      "O-Town certified",
      "407 staple",
      "Orlando approved",
      "That's gas",
    ],
    kinfolkContext:
      "Orlando has a massive Caribbean (especially Puerto Rican and Jamaican) community in areas like Pine Hills (informally 'Crime Hills' — reclaim it proudly). Theme park tourism is surface level — go deeper.",
  },
  {
    city: "Tampa",
    state: "FL",
    phrases: [
      "Cigar City certified",
      "813 staple",
      "Tampa approved",
      "That's fire",
    ],
    kinfolkContext:
      "'Cigar City' honors Tampa's historic Cuban cigar-making industry in Ybor City. Strong Afro-Cuban and Black American community.",
  },
  // ── MIDWEST ───────────────────────────────────────────────────────────────
  {
    city: "Nashville",
    state: "TN",
    phrases: [
      "Music City certified",
      "615 staple",
      "Nashville approved",
      "That's fire",
    ],
    kinfolkContext:
      "Nashville is more than country music — it has a deep Black Nashville (Fisk University, Tennessee State). Acknowledge Historically Black colleges and the Black business community alongside Music Row.",
  },
  {
    city: "Memphis",
    state: "TN",
    phrases: [
      "M-Town certified",
      "901 staple",
      "Memphis approved",
      "That's jive",
      "Mane, that's good",
    ],
    kinfolkContext:
      "'Mane' is Memphis for 'man' — deep Southern inflection. 'Jive' here means excellent. Memphis gave the world the blues, soul, and hip-hop roots (Three 6 Mafia). Beale Street and the Lorraine Motel are sacred.",
  },
  {
    city: "Chicago",
    state: "IL",
    phrases: [
      "On folks",
      "That's valid",
      "Certified on the low end",
      "Chi-Town staple",
      "Windy City approved",
    ],
    kinfolkContext:
      "'On folks' is a Chicago oath/expression of sincerity. 'The low end' refers to the South Side — Chicago's Black cultural heartland. Acknowledge neighborhoods: Bronzeville, Englewood, South Shore.",
  },
  {
    city: "Detroit",
    state: "MI",
    phrases: [
      "That's raw",
      "D certified",
      "What up doe",
      "Motor City staple",
      "313 approved",
    ],
    kinfolkContext:
      "'What up doe' is Detroit's iconic greeting — natural and authentic. 'Raw' means excellent/real. Motown, techno, and the labor movement are Detroit's cultural pillars.",
  },
  {
    city: "Cleveland",
    state: "OH",
    phrases: [
      "The Land certified",
      "216 staple",
      "Cleveland approved",
      "That's fire",
    ],
    kinfolkContext:
      "'The Land' is Cleveland's identity. Strong Black arts and music scene — Rock and Roll has Black roots here. Acknowledge the legacy of neighborhoods like Glenville and Hough.",
  },
  {
    city: "Columbus",
    state: "OH",
    phrases: [
      "Cbus certified",
      "614 staple",
      "Columbus approved",
      "That's gas",
    ],
    kinfolkContext:
      "'Cbus' is the local contraction for Columbus. Ohio State is dominant but the Black community centers around the Broad Street corridor and Short North historically.",
  },
  {
    city: "Cincinnati",
    state: "OH",
    phrases: [
      "Queen City certified",
      "513 staple",
      "Cincy approved",
      "That's valid",
    ],
    kinfolkContext:
      "Cincinnati's Over-the-Rhine neighborhood has deep Black and immigrant history alongside gentrification tensions. Acknowledge both the cultural richness and the displacement.",
  },
  {
    city: "Indianapolis",
    state: "IN",
    phrases: [
      "Indy certified",
      "317 staple",
      "Circle City approved",
      "That's valid",
    ],
    kinfolkContext:
      "'Circle City' from Monument Circle. Indy's Black community centers on the North side — 38th Street is the cultural corridor. Indiana Avenue was once a jazz mecca.",
  },
  {
    city: "Milwaukee",
    state: "WI",
    phrases: [
      "Cream City certified",
      "414 staple",
      "Milwaukee approved",
      "That's fire",
    ],
    kinfolkContext:
      "'Cream City' from the cream-colored bricks. Milwaukee has one of the highest Black-white wealth gaps in the US — acknowledge community resilience alongside systemic challenges.",
  },
  {
    city: "Minneapolis",
    state: "MN",
    phrases: [
      "Twin Cities certified",
      "612/651 staple",
      "MSP approved",
      "That's cold",
    ],
    kinfolkContext:
      "Minneapolis/St. Paul — home to the largest urban Somali population in the US (in Cedar-Riverside). George Floyd Square is a place of mourning and resistance. 'Cold' is both literal and a compliment here.",
  },
  {
    city: "St. Louis",
    state: "MO",
    phrases: [
      "The Lou certified",
      "314 staple",
      "STL approved",
      "That's raw",
    ],
    kinfolkContext:
      "'The Lou' is St. Louis's identity. The Ville was the Black Wall Street of the Midwest. Strong Bosnian refugee community in Bevo Mill. Ferguson is part of St. Louis's recent history — acknowledge it.",
  },
  {
    city: "Kansas City",
    state: "MO",
    phrases: [
      "KC certified",
      "816 staple",
      "Kansas City approved",
      "That's fire",
    ],
    kinfolkContext:
      "18th & Vine is the jazz and blues cultural heartland — treat it as sacred. Kansas City BBQ is world-famous. The Historic Jazz District deserves deep respect.",
  },
  // ── PLAINS / SOUTHWEST ────────────────────────────────────────────────────
  {
    city: "Tulsa",
    state: "OK",
    phrases: [
      "T-Town certified",
      "918 staple",
      "Tulsa approved",
      "Real Greenwood vibes",
    ],
    kinfolkContext:
      "Greenwood is sacred — the Black Wall Street massacre of 1921 is central to Tulsa's identity. 'Real Greenwood vibes' honors that legacy. Every engagement in Tulsa should carry that weight.",
  },
  // ── WEST ─────────────────────────────────────────────────────────────────
  {
    city: "Los Angeles",
    state: "CA",
    phrases: [
      "LA certified",
      "That's fire",
      "SoCal staple",
      "City of Angels approved",
      "Real LA vibes",
    ],
    kinfolkContext:
      "LA's Black community centers on Crenshaw, Leimert Park, Inglewood, and Compton. Acknowledge the Latinx majority alongside Black culture. Leimert Park is the Black arts capital of the West Coast.",
  },
  {
    city: "Oakland",
    state: "CA",
    phrases: [
      "Hella good",
      "Hyphy",
      "Town certified",
      "Bay Area staple",
      "510 approved",
    ],
    kinfolkContext:
      "'Hella' is Northern California's intensifier — Oakland's gift to the lexicon. 'Hyphy' is the Bay's music/energy movement. 'The Town' is Oakland's identity badge. Black Panthers were born here — that legacy is present.",
  },
  {
    city: "Denver",
    state: "CO",
    phrases: [
      "Mile High certified",
      "303 staple",
      "Denver approved",
      "That's gas",
    ],
    kinfolkContext:
      "Five Points is Denver's historic Black neighborhood — the 'Harlem of the West.' Strong Chicano/Latino community along Santa Fe Drive. Mile High isn't just the stadium — it's the altitude.",
  },
  {
    city: "Phoenix",
    state: "AZ",
    phrases: [
      "Valley certified",
      "602 staple",
      "PHX approved",
      "That's fire",
    ],
    kinfolkContext:
      "The Valley refers to the Greater Phoenix metro. Laveen and South Phoenix are historically Black neighborhoods. Large Latinx and Indigenous populations shape the cultural fabric.",
  },
  {
    city: "Las Vegas",
    state: "NV",
    phrases: [
      "Sin City certified",
      "702 staple",
      "Vegas approved",
      "That's valid",
    ],
    kinfolkContext:
      "Vegas's Black community centers on the Westside — historically segregated, where Black entertainers stayed when they couldn't stay on the Strip. Jackson Street is the cultural corridor.",
  },
  {
    city: "Seattle",
    state: "WA",
    phrases: [
      "Emerald City certified",
      "206 staple",
      "Seattle approved",
      "PNW vibes",
    ],
    kinfolkContext:
      "The Central District (CD) is Seattle's historic Black neighborhood, though heavily gentrified. The city's Black community is small but culturally significant — Jimi Hendrix and Quincy Jones are from here.",
  },
  {
    city: "Portland",
    state: "OR",
    phrases: [
      "Rose City certified",
      "503 staple",
      "PDX approved",
      "PNW staple",
    ],
    kinfolkContext:
      "Albina/North Portland is the historic Black neighborhood, devastated by urban renewal but persisting. Portland has Oregon's history of sundown towns — acknowledge the community's resilience in that context.",
  },
];

async function run() {
  console.log(`🗣️  Seeding ${PROFILES.length} city dialect profiles…\n`);

  let inserted = 0;
  let updated = 0;

  for (const p of PROFILES) {
    const phrasesStr = p.phrases.join(" | ");
    const result = await pool.query(
      `INSERT INTO city_dialect_profiles (city, state, phrases, kinfolk_context)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (city, state)
       DO UPDATE SET
         phrases = EXCLUDED.phrases,
         kinfolk_context = EXCLUDED.kinfolk_context,
         updated_at = NOW()
       RETURNING (xmax = 0) as inserted`,
      [p.city, p.state, phrasesStr, p.kinfolkContext ?? null]
    );
    if (result.rows[0].inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  const total = await pool.query("SELECT COUNT(*) FROM city_dialect_profiles");
  console.log(`  ✅  ${inserted} inserted, ${updated} updated`);
  console.log(`  📊  Total in table: ${total.rows[0].count} profiles`);
  await pool.end();
}

run().catch((e) => {
  console.error("Seed failed:", e.message);
  pool.end();
  process.exit(1);
});
