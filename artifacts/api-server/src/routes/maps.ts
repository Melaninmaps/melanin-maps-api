import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { mapsLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middlewares/requireAuth";
import { pool } from "@workspace/db";

const router: IRouter = Router();
router.use(requireAuth);

// ── KEY ARCHITECTURE ─────────────────────────────────────────────────────────
// Two separate Google Cloud API keys are used to enforce least-privilege:
//
//   GOOGLE_MAPS_BROWSER_KEY  — browser-facing routes only (js-key, embed-url).
//     Google receives the request with the user's page URL as the Referer, so
//     this key must be restricted to HTTP referrer origins (mappingwithmelanin.com).
//     Falls back to GOOGLE_MAPS_API_KEY during the transition period so production
//     never breaks before the new key is added to Railway.
//
//   GOOGLE_MAPS_API_KEY      — server-side routes only (directions).
//     Server calls Google directly with no Referer header; referrer restrictions
//     would reject these calls. This key must NEVER be sent to the browser.
//     Restrict it to the Directions API only in Google Cloud Console.
//
// Do not re-merge these into a single key — they serve different trust boundaries.
// ──────────────────────────────────────────────────────────────────────────────

router.get("/maps/embed-url", mapsLimiter, (req: Request, res: Response) => {
  // Uses browser key: the embed URL is loaded by the browser as an iframe src,
  // so Google receives the Referer from the user's page — referrer restrictions apply.
  const apiKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(q)}&zoom=16`;
  res.json({ url });
});

// Exposes the Maps JS API browser key so the frontend can load the interactive map.
// GOOGLE_MAPS_BROWSER_KEY must have HTTP referrer restrictions set in Google Cloud Console:
//   https://www.mappingwithmelanin.com/*
//   https://mappingwithmelanin.com/*
// Falls back to GOOGLE_MAPS_API_KEY during the key-split transition period only.
router.get("/maps/js-key", mapsLimiter, (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  res.json({ key: apiKey });
});

// Server-side geocoding via OpenStreetMap Nominatim — free, no key required,
// full international coverage. Using server-side so browser key restrictions
// (referrer-locked GOOGLE_MAPS_BROWSER_KEY) never block international lookups.
// Nominatim usage policy requires a valid User-Agent.
// ?address=Bangkok — returns { lat, lng, formattedAddress }
router.get("/maps/geocode", mapsLimiter, async (req: Request, res: Response) => {
  const address = typeof req.query.address === "string" ? req.query.address.trim() : "";
  if (!address) {
    res.status(400).json({ error: "address is required" });
    return;
  }
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(address)}` +
      `&format=json&limit=1&addressdetails=0`;
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)",
        "Accept-Language": "en",
      },
    });
    const data = await upstream.json() as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data?.[0]) {
      res.status(404).json({ error: "Location not found" });
      return;
    }
    const result = data[0];
    res.json({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name,
    });
  } catch {
    res.status(500).json({ error: "Failed to geocode address" });
  }
});

// ── Natural-language geography extractor ─────────────────────────────────────
// GET /maps/geo-extract?q=Phuket+restaurants
//
// PRODUCT RULE (permanent):
//   The geocoder resolves WHERE.  The MWM database resolves WHAT.
//   This endpoint exists ONLY to obtain lat/lng + city context so:
//     (a) the map can pan to the correct location
//     (b) the MWM DB search can be geo-bounded
//   It NEVER returns or implies business results from Nominatim/OSM/Google.
//
// Returns:
//   { hasLocation, locationQuery, contentQuery, lat, lng, formattedAddress }
//
// Algorithm (in order):
//   1. Normalize two-word intent phrases ("night life" → "nightlife")
//   2. Pattern: "X in/near/at/around Y" → content=X, location=Y
//   3. Strip known content/intent words → remaining tokens are the geo candidate
//   4. Geocode ONLY the geo candidate via Nominatim
//   5. Validate Nominatim result is a real place (class=place/boundary/etc.)
//      Reject class=amenity (e.g. "Phuket" restaurant in Oslo)
//   6. Return hasLocation=false if no valid geography found
// ──────────────────────────────────────────────────────────────────────────────

// Words that express intent/category, not geography.  Strip these to isolate
// the geographic portion of a natural-language query.
const CONTENT_TOKENS = new Set([
  // Food & drink
  "restaurant","restaurants","food","eat","eating","dining","dine",
  "cafe","cafes","coffee","brunch","lunch","dinner","breakfast","bistro",
  // Nightlife
  "nightlife","nightclub","nightclubs","bar","bars","lounge","lounges",
  "club","clubs","pub","pubs","entertainment","drinks",
  // Wellness / beauty
  "spa","spas","massage","wellness","salon","salons","hair",
  "braider","braiders","braiding","barber","barbers","barbershop",
  "nail","nails","beauty","skincare",
  // Faith
  "church","churches","temple","temples","mosque","mosques",
  "faith","worship","ame","baptist","methodist","catholic","christian","prayer",
  // Lodging
  "hotel","hotels","resort","resorts","motel","inn","airbnb","hostel",
  "stay","accommodation","lodging",
  // Retail
  "shop","shops","store","stores","market","markets","mall","boutique","shopping",
  // Services
  "doctor","doctors","dentist","hospital","clinic","healthcare","medical","pharmacy",
  "obgyn","gyn","lawyer","attorney","law","legal","notary",
  "plumber","plumbing","electrician","contractor","roofer","painter","handyman",
  "childcare","daycare","school","schools","tutoring","education",
  "gym","fitness","yoga","pilates","crossfit","wellness",
  "bank","banks","credit","union","financial","insurance",
  // Recreation
  "beach","beaches","pool","rooftop","outdoor","park","parks",
  "museum","art","gallery","galleries",
  // Qualifiers (non-geographic adjectives)
  "black","friendly","owned","minority","community","cultural",
  "best","good","top","great","nice","popular","local","authentic",
  "traditional","modern","family","luxury","affordable","cheap",
  "romantic","vibrant","cozy","trendy","lively","upscale","casual","chill",
  "amazing","perfect","hidden","gem","cool","fun","known","famous",
  // Generic discovery words
  "places","businesses","spots","venue","venues","location","locations",
  "things","stuff","services","options","choices",
  // Prepositions handled in Pattern 2 (not stripped here — used for splitting)
  // Articles / noise
  "the","a","an","and","or","with","for",
]);

// Nominatim classes that represent real geographic places
const VALID_GEO_CLASSES = new Set(["place","boundary","natural","landuse","administrative"]);

// Nominatim types that are INVALID even inside a "valid" class (specific POIs)
const INVALID_GEO_TYPES = new Set(["restaurant","bar","hotel","cafe","hospital","church","shop","school"]);

interface NominatimHit {
  lat: string; lon: string; display_name: string;
  class: string; type: string; importance: number;
}

async function nominatimGeocode(q: string): Promise<NominatimHit | null> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}&format=json&limit=3&addressdetails=0`;
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)",
      "Accept-Language": "en",
    },
  });
  const hits = await upstream.json() as NominatimHit[];
  if (!hits?.length) return null;
  // Prefer the first result whose class is a real geographic entity
  for (const h of hits) {
    if (VALID_GEO_CLASSES.has(h.class) && !INVALID_GEO_TYPES.has(h.type)) return h;
  }
  return null; // Every result was an amenity/POI — reject all
}

router.get("/maps/geo-extract", mapsLimiter, async (req: Request, res: Response) => {
  const raw = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!raw) { res.status(400).json({ error: "q is required" }); return; }

  // Step 1: normalize common two-word intent phrases so they collapse to one token
  let q = raw
    .replace(/\bnight\s+life\b/gi, "nightlife")
    .replace(/\bchild\s+care\b/gi, "childcare")
    .replace(/\bob[\s-]gyn\b/gi, "obgyn")
    .replace(/\bbeach\s+club(s)?\b/gi, "beachclubs")
    .replace(/\bfitness\s+center\b/gi, "fitnesscenter");

  let locationQuery: string | null = null;
  let contentQuery = "";

  // Step 2: Preposition pattern — "X in/near/at/around Y" → content=X, location=Y
  const prepMatch = q.match(/^(.+?)\s+\b(?:in|near|at|around)\b\s+(.+)$/i);
  if (prepMatch) {
    contentQuery  = prepMatch[1].trim();
    locationQuery = prepMatch[2].trim();
  } else {
    // Step 3: Strip content tokens — what's left is the geo candidate
    const words = q.split(/\s+/);
    const geoWords: string[] = [];
    const ctWords: string[] = [];
    for (const w of words) {
      const key = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (CONTENT_TOKENS.has(key)) ctWords.push(w);
      else geoWords.push(w);
    }

    if (geoWords.length > 0 && geoWords.length < words.length) {
      // Some content words stripped — remaining are the location candidate
      locationQuery = geoWords.join(" ");
      contentQuery  = ctWords.join(" ");
    } else if (geoWords.length === words.length) {
      // No content words found → treat the whole thing as a location
      locationQuery = q;
      contentQuery  = "";
    }
    // If all words are content (geoWords.length===0) → hasLocation=false below
  }

  // Step 4 + 5: Geocode and validate
  if (!locationQuery) {
    res.json({ hasLocation: false, locationQuery: null, contentQuery: raw, lat: null, lng: null, formattedAddress: null });
    return;
  }

  // ── BUSINESS-FIRST GATE ─────────────────────────────────────────────────────
  // Before calling an external geocoder, verify the candidate location string
  // doesn't match an existing MWM business or cultural site by name.
  //
  // Example: "Amina" is a restaurant in Philadelphia. Without this check, the
  // geocoder returns "Amina, Dominican Republic" (a real place), the map pans
  // there, and the DB search finds nothing — showing "No MWM listings in AMINA."
  //
  // Example: "Shawn Hill" → exact match missed "Shawn Hill Homes"; geocoder
  // returned Shawn Hill, IL. Fix: use starts-with wildcard so any business whose
  // name *begins with* the query candidate is caught.
  //
  // Rule: ≤3-word candidates only, to avoid blocking "restaurants in Phuket"
  // where "Phuket" is a legitimate destination with no MWM business by that name.
  const locationWordCount = locationQuery.trim().split(/\s+/).length;
  if (locationWordCount <= 3) {
    try {
      const bizCheck = await pool.query<{ id: string }>(
        `SELECT id FROM businesses
         WHERE (name ILIKE $1 OR name ILIKE $2) AND status = 'active'
         LIMIT 1`,
        [locationQuery, locationQuery + "%"],
      );
      if (bizCheck.rows.length > 0) {
        // Our DB has a business named this (or starting with this) — treat as
        // a business search, not geography.
        res.json({ hasLocation: false, locationQuery, contentQuery: raw, lat: null, lng: null, formattedAddress: null });
        return;
      }
    } catch {
      // DB unavailable — fall through to geocoder
    }
  }

  try {
    const hit = await nominatimGeocode(locationQuery);
    if (!hit) {
      // No valid geographic result → return hasLocation=false; client keeps current map position
      res.json({ hasLocation: false, locationQuery, contentQuery, lat: null, lng: null, formattedAddress: null });
      return;
    }
    res.json({
      hasLocation: true,
      locationQuery,          // Geographic portion of the original query (e.g. "Phuket")
      contentQuery,           // Intent portion (e.g. "restaurants")
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      formattedAddress: hit.display_name,
    });
  } catch {
    res.status(500).json({ error: "Geo extraction failed" });
  }
});

// Proxies Google Directions API so the key stays server-side and is never sent
// to the browser. Uses GOOGLE_MAPS_API_KEY (the server-only key), NOT the browser
// key. This key should be API-restricted to Directions API only in Google Cloud.
// ?origin=lat,lng  &destination=lat,lng  (&mode=driving|walking|bicycling|transit)
router.get("/maps/directions", mapsLimiter, async (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  const origin = typeof req.query.origin === "string" ? req.query.origin.trim() : "";
  const destination = typeof req.query.destination === "string" ? req.query.destination.trim() : "";
  const mode = typeof req.query.mode === "string" ? req.query.mode.trim() : "driving";
  if (!origin || !destination) {
    res.status(400).json({ error: "origin and destination are required" });
    return;
  }
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=${encodeURIComponent(mode)}` +
      `&key=${apiKey}`;
    const upstream = await fetch(url);
    const data = await upstream.json() as unknown;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

// ── KinfolkAI Navigation Voice ───────────────────────────────────────────────
// POST /maps/nav-voice — translates Google Directions steps into the user's
// selected KinfolkAI voice mode (professional / community / local / home).
// Returns { voicedSteps: string[], voiceMode: string }
router.post("/maps/nav-voice", mapsLimiter, async (req: Request, res: Response) => {
  const { steps, destCity = "", destName = "", voiceMode = "community", prefs } = req.body as {
    steps?: string[];
    destCity?: string;
    destName?: string;
    voiceMode?: string;
    prefs?: {
      communicationStyle?: string;
      emojiLevel?: string;
      humorLevel?: string;
      culturalInterests?: string[];
    };
  };

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    res.status(400).json({ error: "steps array is required" });
    return;
  }

  const city = destCity.toLowerCase();

  // ── Build voice instructions per KinfolkAI Voices™ mode ──────────────────
  let voiceInstructions = "";

  if (voiceMode === "professional") {
    voiceInstructions =
      `KINFOLK VOICES™ — PROFESSIONAL MODE: Speak as a precise, efficient GPS navigator. ` +
      `Clear structure, no slang. Warm professionalism. ` +
      `Example: "In 0.4 miles, turn left onto Martin Luther King Jr. Boulevard."`;

  } else if (voiceMode === "local") {
    type CityVoice = { guidance: string; example: string };
    const CITY_VOICES: Record<string, CityVoice> = {
      "philadelphia": { guidance: "Philly energy — use 'jawn', 'iight', 'young bull', 'ard'. Gritty, proud, loyal.", example: "\"Iight, hang a left at that jawn on MLK, young bull — you almost there, ard?\"" },
      "atlanta":      { guidance: "ATL swagger — use 'the A', 'slime', 'on gang', 'bussin'. Aspirational and cultural.", example: "\"On gang, finna turn right on Peachtree — the A knows what's bussin.\"" },
      "new york":     { guidance: "NYC direct — use 'deadass', 'no cap', 'mad', 'fam'. Fast and confident.", example: "\"Deadass take the left here, fam — three blocks up, no cap.\"" },
      "chicago":      { guidance: "Chi-town — use 'the Chi', 'shorty', 'finna', 'on me'. Real and resilient.", example: "\"Finna turn left here, bro — South Side energy, on me.\"" },
      "houston":      { guidance: "H-Town trill — use 'trill', 'H-Town', 'third coast', 'what it do'.", example: "\"What it do — trill move, turn right here. H-Town knows the way.\"" },
      "los angeles":  { guidance: "West Coast cool — use 'lowkey', 'fire', 'hard', 'no cap'. Laid back but confident.", example: "\"Lowkey make that right — it's fire out this way, trust.\"" },
      "dc":           { guidance: "DMV energy — use 'junt', 'DMV', 'bruh', 'finna'. Sophisticated with that go-go bounce.", example: "\"Take this junt to the right, fam — DMV always delivers.\"" },
      "new orleans":  { guidance: "NOLA warmth — use 'cher', 'lagniappe', 'pass a good time'.", example: "\"Cher, turn left right here — you about to pass a real good time.\"" },
      "miami":        { guidance: "305 heat — use '305', 'Magic City', 'fam'. Vibrant and multicultural.", example: "\"305 move — take a right here, Magic City energy!\"" },
      "detroit":      { guidance: "Detroit resilient — use '313', 'Motown', 'finna', 'hard'.", example: "\"313 strong — finna make this left. Detroit hard as ever.\"" },
      "memphis":      { guidance: "Memphis soul — use '901', 'Bluff City'. Deep and soulful.", example: "\"901 vibes — turn left here, Bluff City never misses.\"" },
      "baltimore":    { guidance: "B-More realness — use 'B-More', 'Charm City', 'fam'.", example: "\"B-More move, fam — turn right here. Charm City holds it down.\"" },
    };
    let cityGuide = "Speak as a knowledgeable local — confident, culturally fluent, authentic neighborhood vernacular.";
    for (const [name, voice] of Object.entries(CITY_VOICES)) {
      if (city.includes(name)) { cityGuide = `${voice.guidance}\nExample: ${voice.example}`; break; }
    }
    voiceInstructions = `KINFOLK VOICES™ — LOCAL GUIDE MODE: ${cityGuide}`;

  } else if (voiceMode === "home") {
    const commStyle = prefs?.communicationStyle ?? "friendly";
    const emojiLvl  = prefs?.emojiLevel  ?? "some";
    const humorLvl  = prefs?.humorLevel  ?? "light";
    const interests = prefs?.culturalInterests ?? [];
    const commText: Record<string, string> = {
      professional: "Lead with facts. Precise but warm.",
      community:    "Frame everything through community and connection.",
      conversational: "Fully relaxed and casual — like a close friend.",
      friendly:     "Warm, enthusiastic, personal.",
    };
    const emojiText: Record<string, string> = {
      none: "No emojis.", lots: "Use 1-2 emojis per instruction.", some: "One emoji occasionally for warmth.",
    };
    const humorText: Record<string, string> = {
      off: "Purely informative.", playful: "Playfully funny when it fits.", light: "Occasional warmth and wit.",
    };
    voiceInstructions =
      `KINFOLK VOICES™ — HOME MODE:\n` +
      `TONE: ${commText[commStyle] ?? commText.friendly}\n` +
      `EMOJI: ${emojiText[emojiLvl] ?? emojiText.some}\n` +
      `HUMOR: ${humorText[humorLvl] ?? humorText.light}` +
      (interests.length ? `\nCULTURAL AFFINITIES: ${interests.join(", ")}` : "") +
      `\nThis is the user's personal comfort style — speak like someone who truly knows them.`;

  } else {
    // community (default)
    voiceInstructions =
      `KINFOLK VOICES™ — COMMUNITY MODE: Warm, supportive, conversational. ` +
      `Speak like a genuine friend navigating with them — encouraging and culturally aware. ` +
      `Example: "Coming up, make that right on MLK Boulevard — you're almost there, beloved."`;
  }

  const systemPrompt =
    `You are the KinfolkAI Navigation Voice for the Mapping With Melanin app — ` +
    `a culturally-rooted GPS navigator for the melanated diaspora.\n\n` +
    `${voiceInstructions}\n\n` +
    `NAVIGATION RULES:\n` +
    `- Each instruction MUST be SHORT (1-2 sentences) — designed to be spoken aloud while driving\n` +
    `- Preserve all turn/distance/street information from the original step — accuracy is non-negotiable\n` +
    `- The FINAL step should feel special: this person is arriving at a minority-owned community business` +
    (destName ? ` ("${destName}")` : "") + `\n` +
    `- Output ONLY a valid JSON object: { "steps": ["...", "..."] }\n` +
    `- The "steps" array must contain EXACTLY ${steps.length} string(s)\n` +
    `- NEVER use HTML tags in the output`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Convert these navigation steps to ${voiceMode} voice:\n${JSON.stringify(steps)}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.72,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let voiced: string[] = steps;
    try {
      const parsed = JSON.parse(raw) as { steps?: string[] };
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) voiced = parsed.steps;
    } catch { /* fall through to original steps */ }

    res.json({ voicedSteps: voiced, voiceMode });
  } catch {
    // Graceful fallback — return original steps unchanged
    res.json({ voicedSteps: steps, voiceMode });
  }
});

// ── Discoverability pins — tour cultural sites, recurring events, orgs ──────
// Returns only coordinate-valid active rows from the three non-business
// map collections. The map client uses this to render additional pin layers
// without changing the business-pins endpoint payload.
// All returned pins pass the coordinate validity contract:
//   lat/lng numeric, non-zero, within geographic ranges.
router.get("/maps/discoverability-pins", async (req: Request, res: Response) => {
  const COORD_FILTER = `
    is_active = true
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND latitude::numeric BETWEEN -90 AND 90
    AND longitude::numeric BETWEEN -180 AND 180
    AND NOT (latitude::numeric = 0 AND longitude::numeric = 0)
  `;
  try {
    const { rows } = await pool.query<{
      id: string; source_type: string; name: string; city: string;
      state: string | null; latitude: string; longitude: string;
      description: string | null; detail_path: string; site_type: string | null;
    }>(`
      SELECT id,
             'tour_cultural_site'    AS source_type,
             name, city, state, latitude::text, longitude::text,
             description,
             '/tour-cultural-sites/' || id AS detail_path,
             COALESCE(site_type, 'landmark')  AS site_type
      FROM tour_cultural_sites
      WHERE ${COORD_FILTER}
      UNION ALL
      SELECT id,
             'recurring_event'       AS source_type,
             name, city, state, latitude::text, longitude::text,
             description,
             '/recurring-events/' || id AS detail_path,
             NULL                        AS site_type
      FROM recurring_events
      WHERE ${COORD_FILTER}
        AND (active_until IS NULL OR active_until >= CURRENT_DATE)
      UNION ALL
      SELECT id,
             'community_organization' AS source_type,
             name, city, state, latitude::text, longitude::text,
             mission                  AS description,
             '/community-orgs/' || id AS detail_path,
             NULL                      AS site_type
      FROM community_organizations
      WHERE ${COORD_FILTER}
      ORDER BY source_type, city, name
    `);

    const pins = rows.map(r => ({
      id:          r.id,
      sourceType:  r.source_type,
      name:        r.name,
      city:        r.city,
      state:       r.state ?? null,
      latitude:    parseFloat(r.latitude),
      longitude:   parseFloat(r.longitude),
      description: r.description ?? null,
      detailPath:  r.detail_path,
      siteType:    r.site_type ?? null,
    }));

    res.json({ pins });
  } catch (err) {
    req.log?.error({ err }, "GET /maps/discoverability-pins failed");
    res.status(500).json({ error: "Failed to load discoverability pins" });
  }
});

export default router;
