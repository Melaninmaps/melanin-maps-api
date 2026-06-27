import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import crypto from "crypto";
import {
  db,
  usersTable,
  userPreferencesTable,
  userSettingsTable,
  kinfolkSessionsTable,
  kinfolkFeedbackTable,
  savedPlacesTable,
  businessesTable,
  businessIdentityTable,
  lifeJourneysTable,
  type SessionMessage,
  type JourneyPhase,
} from "@workspace/db";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { storage } from "../storage";

const router: IRouter = Router();

// ─── City Voice System (copied + shared from travel.ts) ───────────────────────
type CityVoice = { slang: string[]; phrases: string[]; culturalTouchstones: string[]; writingGuidance: string };

const CITY_VOICES: Record<string, CityVoice> = {
  "new york": { slang: ["deadass","no cap","mad","wildin","fam","bussin","lowkey","bet"], phrases: ["deadass this spot is legendary","no cap you need to pull up","mad vibes in this neighborhood"], culturalTouchstones: ["Harlem Renaissance","Brooklyn Minority excellence","Bed-Stuy do or die"], writingGuidance: "Write like a proud New Yorker — direct, confident, a little fast-paced. Use 'deadass', 'no cap', 'mad' as an adjective, 'fam'. Reference Harlem, Brooklyn, the Bronx." },
  "atlanta": { slang: ["slime","on gang","bussin","the A","ATLien","drip","lowkey","no cap","period"], phrases: ["on gang this spot is bussin","the A never misses","this is where the culture lives"], culturalTouchstones: ["Sweet Auburn","the BeltLine","Old Fourth Ward","Atlanta as the Minority mecca","HBCUs","trap music origins"], writingGuidance: "Write with Atlanta swagger — confident, aspirational, culturally rich. ATL is the Minority mecca. Use 'the A', 'slime', 'on gang', 'bussin'. Reference BeltLine, Sweet Auburn, HBCUs." },
  "chicago": { slang: ["shorty","the chi","finna","lowkey","on me","no cap","drip","bro","gang"], phrases: ["this spot is cold on me","the Chi never misses","finna pull up to this jawn"], culturalTouchstones: ["Bronzeville Black Metropolis","South Side culture","Chicago blues roots","Kanye and Chance legacy","Harold Washington legacy"], writingGuidance: "Write with Chi-town pride — real, resilient, deeply rooted. Use 'the Chi', 'shorty', 'finna', 'on me', reference the South Side and Bronzeville." },
  "houston": { slang: ["trill","H-Town","third coast","finna","bruh","what it do","screwed up"], phrases: ["trill vibes only in H-Town","what it do, this spot is everything"], culturalTouchstones: ["Third Ward","Emancipation Park","DJ Screw legacy","UGK","Juneteenth origins in Texas","Project Row Houses"], writingGuidance: "Write with Houston trill energy — slow, confident, layered. Use 'trill', 'H-Town', 'third coast', 'what it do'. Reference the screwed music legacy and Juneteenth origins." },
  "los angeles": { slang: ["no cap","faded","saucy","dub","west side","lowkey","bussin","hard","fire","on god"], phrases: ["this spot hits different out west","no cap the west coast eats","lowkey this is the move"], culturalTouchstones: ["Crenshaw District","Leimert Park Village","Inglewood culture","Compton legacy","Central Avenue jazz history","Minority Hollywood"], writingGuidance: "Write with West Coast cool — laid back but confident. Reference Leimert Park, Crenshaw, Inglewood. The vibe is sun-kissed excellence." },
  "dc": { slang: ["junt","bama","DMV","no cap","go-go","move","finna","bruh","joint","hard"], phrases: ["this junt is everything in the DMV","go-go vibes all day","the District never misses"], culturalTouchstones: ["U Street Corridor","go-go music culture","Howard University legacy","Anacostia history","Chuck Brown legacy","Ben's Chili Bowl"], writingGuidance: "Write with DMV energy — sophisticated but with that go-go bounce. Reference U Street, Howard University, go-go culture." },
  "new orleans": { slang: ["cher","lagniappe","making groceries","pass a good time","where y'at","laissez les bons temps rouler","NOLA"], phrases: ["cher this spot will make you pass a good time","lagniappe — a little something extra"], culturalTouchstones: ["Tremé neighborhood","Second Line traditions","Mardi Gras Indian culture","jazz origins","Dooky Chase legacy","Congo Square history"], writingGuidance: "Write with NOLA warmth and rhythm — joyful, deep-rooted, full of life. Use 'cher', 'lagniappe', 'pass a good time'. Reference the Tremé, Second Line, Mardi Gras Indians." },
  "miami": { slang: ["305","no cap","drip","lit","Magic City","fam","fire","on god","bussin","lowkey"], phrases: ["305 always delivers","Magic City energy is unmatched"], culturalTouchstones: ["Little Haiti culture","Overtown Minority history","Liberty City","Afro-Caribbean influence","Miami Bass music origins"], writingGuidance: "Write with Miami heat — vibrant, multicultural, bold. Reference the Afro-Caribbean influence, Overtown, Little Haiti." },
  "philadelphia": { slang: ["jawn","iight","no cap","joint","wooder ice","young bull","ard"], phrases: ["this jawn is everything","iight pull up to this spot"], culturalTouchstones: ["Black Bottom history","North Philly culture","West Philly","Roots and Questlove","South Street"], writingGuidance: "Write with Philly energy — gritty, proud, loyal. Use 'jawn' liberally, 'iight', 'young bull', 'ard'." },
  "detroit": { slang: ["finna","no cap","Motown","313","on me","hard","drip","bruh","slime","lowkey"], phrases: ["313 never misses","Motown energy in this spot","Detroit hard as ever"], culturalTouchstones: ["Motown Records legacy","Black Bottom neighborhood history","Paradise Valley","The Heidelberg Project","Detroit techno origins"], writingGuidance: "Write with Detroit resilience — proud, gritty, innovative. Use '313', 'Motown', reference Black Bottom, Paradise Valley." },
  "memphis": { slang: ["no cap","bruh","finna","901","Bluff City","slime","hard","on god","lowkey","fam"], phrases: ["901 always delivers","Bluff City culture is everything"], culturalTouchstones: ["Beale Street heritage","Memphis blues origins","Civil Rights history (Lorraine Motel)","Three 6 Mafia legacy","soul food capital","Stax Records"], writingGuidance: "Write with Memphis soul — deep, soulful, historically rooted. Use '901', 'Bluff City', reference Beale Street, Stax Records, the Civil Rights legacy." },
  "baltimore": { slang: ["no cap","fam","joint","hard","bruh","lowkey","Charm City","B-More","hon","on me"], phrases: ["Charm City holds it down","B-More never misses"], culturalTouchstones: ["Pennsylvania Avenue history","Upton neighborhood","Morgan State HBCU","Billie Holiday birthplace","Cab Calloway history"], writingGuidance: "Write with Baltimore realness — resilient, proud, underrated. Use 'B-More', 'Charm City', reference Pennsylvania Avenue, Morgan State, the deep musical history." },
};

function getCityVoice(destination: string): CityVoice | null {
  const lower = destination.toLowerCase();
  for (const [city, voice] of Object.entries(CITY_VOICES)) {
    if (lower.includes(city)) return voice;
  }
  return null;
}

// ─── City Local Terms (Kinfolk Voices™ — Local Guide mode) ────────────────────
type CityLocalData = {
  terms: Array<{ term: string; meaning: string; note?: string }>;
  transit: string[];
  nicknames: string[];
};

const CITY_LOCAL_TERMS: Record<string, CityLocalData> = {
  "new york": {
    terms: [
      { term: "bodega", meaning: "corner convenience store — a neighborhood institution" },
      { term: "chopped cheese", meaning: "NYC-specific sandwich (beef, cheese, onions on a hero roll) — distinct from a Philly cheesesteak", note: "If a user asks for a chopped cheese outside NYC, clarify: 'Chopped cheese is a NYC thing. In Philly, the closest equivalent is a cheesesteak — want me to find one?'" },
      { term: "the train", meaning: "the subway — locals rarely say 'subway'" },
      { term: "deadass", meaning: "seriously, for real" },
      { term: "the city", meaning: "Manhattan specifically, even to Bronx and Brooklyn residents" },
      { term: "hero", meaning: "what NYC calls a sub or hoagie" },
    ],
    transit: ["the A/C/E", "the 2/3", "the L train", "the 4/5/6", "the Q"],
    nicknames: ["BK (Brooklyn)", "the Bronx", "Harlem", "LES (Lower East Side)", "Bed-Stuy", "Fort Greene", "the Heights"],
  },
  "philadelphia": {
    terms: [
      { term: "jawn", meaning: "Philly's most versatile word — any person, place, or thing" },
      { term: "hoagie", meaning: "what most cities call a sub or hero — Philly's term" },
      { term: "water ice", meaning: "a Philly frozen dessert — denser and different from Italian ice" },
      { term: "iight", meaning: "alright, okay" },
      { term: "cheesesteak", meaning: "a Philly original — thinly sliced beef and cheese on a long roll; NOT the same as a NYC chopped cheese", note: "If a user in Philly asks for a chopped cheese, say: 'Chopped cheese is a NYC bodega thing — here in Philly, a cheesesteak is the local equivalent. Want me to find a great one?'" },
    ],
    transit: ["SEPTA", "the El (Market-Frankford Line)", "BSL", "PATCO to Jersey"],
    nicknames: ["South Philly", "West Philly", "Fishtown", "Brewerytown", "Kensington", "the Main Line"],
  },
  "new orleans": {
    terms: [
      { term: "lagniappe", meaning: "a little something extra, given freely — a NOLA cultural value" },
      { term: "neutral ground", meaning: "the grass median strip in a boulevard — only NOLA calls it this" },
      { term: "making groceries", meaning: "going grocery shopping" },
      { term: "where y'at", meaning: "the classic NOLA greeting — 'How are you?'" },
      { term: "po' boy", meaning: "a local sandwich on French bread — shrimp, oyster, roast beef and more" },
      { term: "second line", meaning: "a parade tradition following jazz funerals or celebrations — a cultural cornerstone" },
    ],
    transit: ["the streetcar", "St. Charles line", "Canal line"],
    nicknames: ["the Tremé", "the Marigny", "the Garden District", "Mid-City", "the 7th Ward", "Uptown", "the 9th Ward"],
  },
  "atlanta": {
    terms: [
      { term: "ITP", meaning: "Inside the Perimeter (I-285) — generally Atlanta proper" },
      { term: "OTP", meaning: "Outside the Perimeter — suburbs, sometimes said with an Atlanta side-eye" },
      { term: "the BeltLine", meaning: "a 22-mile urban trail connecting neighborhoods — THE place to walk, eat, and experience Atlanta" },
      { term: "285", meaning: "I-285, the highway encircling Atlanta — constant geographic reference" },
      { term: "ATLien", meaning: "a proud Atlanta native (from OutKast's classic album)" },
    ],
    transit: ["MARTA", "the Gold Line", "the Red Line", "the Green Line"],
    nicknames: ["Old Fourth Ward", "East Atlanta Village (EAV)", "the West End", "College Park", "Bankhead", "Mechanicsville", "Vine City"],
  },
  "chicago": {
    terms: [
      { term: "gym shoes", meaning: "what Chicago calls sneakers" },
      { term: "pop", meaning: "soda / soft drink — never say 'soda' in Chicago" },
      { term: "the L", meaning: "the CTA elevated train system" },
      { term: "Jewels", meaning: "the Jewel-Osco grocery chain — always called 'Jewels'" },
      { term: "the lakefront", meaning: "Lake Michigan shoreline — the geographic and social heart of the city" },
    ],
    transit: ["the L", "the Red Line", "the Blue Line", "the Green Line", "CTA"],
    nicknames: ["Bronzeville", "Wicker Park", "Pilsen", "Hyde Park", "Chatham", "the South Side", "Chatham", "Bronzeville"],
  },
  "houston": {
    terms: [
      { term: "trill", meaning: "true + real — a Houston cultural value, popularized by UGK" },
      { term: "third coast", meaning: "Houston and the Gulf Coast — a distinct regional identity" },
      { term: "screwed music", meaning: "the slowed-down chopped-and-screwed sound invented by DJ Screw in H-Town" },
      { term: "the Bayou City", meaning: "Houston's nickname, referencing Buffalo Bayou" },
    ],
    transit: ["Metro", "METRORail (Red Line)", "park and ride"],
    nicknames: ["Third Ward", "Fifth Ward", "EaDo (East Downtown)", "the Heights", "Montrose", "Sunnyside"],
  },
  "dc": {
    terms: [
      { term: "go-go", meaning: "DC's original percussion-heavy music genre — essential cultural identity, not just music" },
      { term: "junt", meaning: "DC's variant of jawn — refers to any person, place, or thing" },
      { term: "bama", meaning: "someone unfashionable or out of touch — a DC-specific term" },
      { term: "the District", meaning: "locals call it 'the District', not just DC" },
      { term: "DMV", meaning: "DC-Maryland-Virginia — the full metro region, used as a collective identity" },
    ],
    transit: ["the Metro", "the Red Line", "the Green Line", "Circulator", "WMATA"],
    nicknames: ["U Street", "the Hill (Capitol Hill)", "Columbia Heights", "Anacostia", "Congress Heights", "NoMa", "Deanwood"],
  },
  "miami": {
    terms: [
      { term: "305", meaning: "Miami's original area code — worn as a badge of pride" },
      { term: "Magic City", meaning: "Miami's nickname" },
      { term: "calle ocho", meaning: "8th Street in Little Havana — the cultural heart of Cuban Miami" },
      { term: "the Gables", meaning: "Coral Gables shorthand" },
    ],
    transit: ["Metrorail", "Metromover", "Tri-Rail", "the Brightline"],
    nicknames: ["Wynwood", "Overtown", "Liberty City", "Little Haiti", "Little Havana", "the MiMo District", "Opa-locka"],
  },
  "detroit": {
    terms: [
      { term: "coney", meaning: "a Detroit-style hot dog with chili, mustard, and onions — a true Detroit institution" },
      { term: "party store", meaning: "what Detroit calls a convenience store" },
      { term: "313", meaning: "Detroit's area code — used as a badge of local pride" },
      { term: "Motown", meaning: "both the legendary record label AND a nickname for Detroit itself" },
    ],
    transit: ["the QLINE", "SMART bus", "DDOT"],
    nicknames: ["Corktown", "Eastern Market", "New Center", "Midtown", "Black Bottom (historic)", "Paradise Valley (historic)", "Boston-Edison"],
  },
  "baltimore": {
    terms: [
      { term: "hon", meaning: "a term of endearment unique to Baltimore — 'How ya doin, hon?'" },
      { term: "pit beef", meaning: "Baltimore's signature beef sandwich, served roadside" },
      { term: "B-More", meaning: "Baltimore shorthand" },
      { term: "Charm City", meaning: "Baltimore's nickname" },
    ],
    transit: ["MTA", "the Light Rail", "the Metro SubwayLink"],
    nicknames: ["Pigtown", "Hampden", "Fells Point", "Federal Hill", "Cherry Hill", "Upton", "Penn North"],
  },
  "memphis": {
    terms: [
      { term: "901", meaning: "Memphis area code — a mark of local pride" },
      { term: "the Bluff City", meaning: "Memphis's nickname, for the bluffs above the Mississippi River" },
      { term: "Beale Street", meaning: "the historic heart of Memphis blues — a must-experience, not just a tourist stop" },
    ],
    transit: ["MATA", "the trolley (Riverfront Loop)"],
    nicknames: ["Midtown", "South Memphis", "Cooper-Young", "Orange Mound", "the Heights (Binghampton)"],
  },
  "los angeles": {
    terms: [
      { term: "the 405", meaning: "I-405 — the most infamous freeway in LA; 'take the 405' is a reflex" },
      { term: "the valley", meaning: "San Fernando Valley, north of the Santa Monica Mountains" },
      { term: "Crenshaw", meaning: "both a boulevard and a neighborhood carrying deep Black cultural history" },
    ],
    transit: ["the Metro", "the Blue Line (A Line)", "the Purple Line (D Line)", "Metro Rail"],
    nicknames: ["Leimert Park", "Inglewood", "Crenshaw", "Compton", "South Central", "the Valley", "Watts", "View Park"],
  },
};

function getCityLocalTerms(destination: string): CityLocalData | null {
  const lower = destination.toLowerCase();
  for (const [city, data] of Object.entries(CITY_LOCAL_TERMS)) {
    if (lower.includes(city)) return data;
  }
  return null;
}

// ─── Build personalized system prompt ─────────────────────────────────────────
type BusinessCatalogEntry = {
  name: string;
  category: string;
  city: string;
  description: string;
  verified: boolean;
  tags: string[];
  story?: string | null;
  missionStatement?: string | null;
  whyStarted?: string | null;
  whatCustomersShouldKnow?: string | null;
  ownershipBadges?: string[] | null;
  communityValues?: string[] | null;
  audiencesServed?: string[] | null;
  vibes?: string[] | null;
  accessibilityFeatures?: string[] | null;
  communityInitiatives?: string[] | null;
  growthGoals?: string[] | null;
};

type CrossCityMatch = {
  category: string;
  fromCity: string;
  savedCount: number;
  matches: Array<{ name: string; category: string; city: string; verified: boolean }>;
};

function buildSystemPrompt(opts: {
  prefs: typeof userPreferencesTable.$inferSelect | null;
  likedSpots: string[];
  dislikedSpots: string[];
  savedPlaces: string[];
  destination?: string | null;
  voiceMode?: string;
  businessCatalog?: BusinessCatalogEntry[];
  activeJourney?: { title: string; city?: string | null; journeyType: string; phases: JourneyPhase[]; aiContext?: string | null } | null;
  crossCityBridge?: CrossCityMatch[] | null;
}): string {
  const { prefs, likedSpots, dislikedSpots, savedPlaces, destination, voiceMode = "community", businessCatalog, activeJourney, crossCityBridge } = opts;

  const cityVoice = destination ? getCityVoice(destination) : null;
  const localTerms = destination ? getCityLocalTerms(destination) : null;
  const kbyg = prefs?.knowBeforeYouGo !== false;

  // ── Kinfolk Voices™ — 4 emotional voice modes ─────────────────────────────
  let voiceInstructions = "";

  if (voiceMode === "professional") {
    voiceInstructions = `KINFOLK VOICES™ — PROFESSIONAL MODE:
Respond in a clear, structured, business-appropriate tone. Lead with facts. Use bullet points when listing options. No slang, no casual phrasing. Warm professionalism — helpful, never cold or robotic. Efficient and organized.`;

  } else if (voiceMode === "local") {
    const localVoice = cityVoice
      ? `${cityVoice.writingGuidance}

AUTHENTIC LOCAL LANGUAGE — Weave in 2-4 of these naturally:
Slang: ${cityVoice.slang.join(", ")}
Community phrases: ${cityVoice.phrases.join(", ")}
Cultural touchstones: ${cityVoice.culturalTouchstones.join(", ")}`
      : "Speak as someone who knows this city inside and out — the real spots, the real names, the way locals actually talk.";

    const localLang = localTerms ? `

LOCAL VOCABULARY — Know these and use them accurately:
${localTerms.terms.map((t) => `• "${t.term}": ${t.meaning}${t.note ? `\n  IMPORTANT: ${t.note}` : ""}`).join("\n")}

Transit locals use: ${localTerms.transit.join(", ")}
Neighborhood names: ${localTerms.nicknames.join(", ")}

ACCURACY RULE: Local terms are city-specific — NEVER confuse them across cities. If a user asks for something from another city, acknowledge it warmly and offer the local equivalent. Introduce unfamiliar terms with "locals call it..." or "you might hear people say..." — educational and welcoming, never corrective.` : "";

    voiceInstructions = `KINFOLK VOICES™ — LOCAL GUIDE MODE:
${localVoice}${localLang}`;

  } else if (voiceMode === "home") {
    const commStyle = (prefs?.communicationStyle ?? "friendly") as string;
    const emojiLvl = (prefs?.emojiLevel ?? "some") as string;
    const humorLvl = (prefs?.humorLevel ?? "light") as string;
    const culturalCtx = (prefs?.culturalInterests ?? []) as string[];

    const commStyleText: Record<string, string> = {
      professional: "Lead with facts and structure. Precise but warm. Example: \"Here are three options that match your criteria.\"",
      community: "Frame everything through community. Example: \"The community really enjoys this one — regulars come back every week.\"",
      conversational: "Fully relaxed and casual. Write like texting a close friend. Short sentences, contractions, informal phrasing.",
      friendly: "Warm, enthusiastic, personal. Example: \"I found a few spots I think you'll love!\"",
    };

    const emojiText: Record<string, string> = {
      none: "Use NO emojis whatsoever.",
      lots: "Use emojis freely — 3-5 per message.",
      some: "Use 1-2 emojis per message where they add warmth.",
    };

    const humorText: Record<string, string> = {
      off: "Keep responses purely informative — zero humor.",
      playful: "Be playfully funny when it fits naturally. Personality, wit, light humor — make them smile.",
      light: "Occasional warmth and wit is welcome, but keep it natural.",
    };

    const culturalText = culturalCtx.length
      ? `\nCULTURAL AFFINITIES (weave naturally when relevant): ${culturalCtx.join(", ")}`
      : "";

    voiceInstructions = `KINFOLK VOICES™ — HOME MODE (this user's personal comfort style):
${commStyleText[commStyle] ?? commStyleText.friendly}
EMOJI: ${emojiText[emojiLvl] ?? emojiText.some}
HUMOR: ${humorText[humorLvl] ?? humorText.light}${culturalText}

This is the user's "take me home" experience — the communication style they chose because it brings them comfort. Make every response feel like talking to someone who truly knows them.`;

  } else {
    // community (default — always available)
    voiceInstructions = `KINFOLK VOICES™ — COMMUNITY MODE:
Warm. Supportive. Conversational. Speak like someone who genuinely wants to help — a friend who's been where they are. Acknowledge emotional context when it surfaces before diving into recommendations. Celebrate wins. Support through challenges. Never robotic or transactional.

When someone is struggling or facing something hard, acknowledge it first: "I hear you — let's work through this together." The emotional connection is as important as the information.`;
  }

  // ── Know Before You Go ───────────────────────────────────────────────────
  const kbygInstructions = kbyg ? `

KNOW BEFORE YOU GO — When recommending a specific business, include this in each business object:
"knowBeforeYouGo": {
  "atmosphere": "one sentence on the vibe and welcome factor",
  "parking": "honest note on parking situation",
  "greatFor": "who this place is especially great for",
  "bestTime": "when to go for the best experience",
  "communityInsight": "one thing a first-timer wouldn't know but locals do"
}` : "";

  // ── User profile & history ───────────────────────────────────────────────
  const culturalLine = (prefs?.culturalInterests as string[] | null)?.length
    ? `\n- Cultural interests: ${(prefs!.culturalInterests as string[]).join(", ")}`
    : "";

  const ownershipLine = (prefs?.preferredOwnershipTypes as string[] | null)?.length
    ? `\n- Preferred business types: ${(prefs!.preferredOwnershipTypes as string[]).join(", ")} — ALWAYS prioritize recommending businesses with these designations`
    : "";

  const profileSection = prefs ? `
ABOUT THIS USER (their taste profile — personalize everything around this):
- Favorite categories: ${prefs.favoriteCategories?.length ? prefs.favoriteCategories.join(", ") : "not set yet"}
- Favorite cities: ${prefs.favoriteCities?.length ? prefs.favoriteCities.join(", ") : "not set yet"}
- Avoid: ${prefs.avoidCategories?.length ? prefs.avoidCategories.join(", ") : "none"}
- Budget: ${prefs.budgetRange ?? "any"}
- How they travel: ${prefs.tripStyle?.length ? prefs.tripStyle.join(", ") : "not specified"}
- Who they travel with: ${prefs.travelCompanion ?? "solo"}
${prefs.dietaryNotes ? `- Dietary notes: ${prefs.dietaryNotes}` : ""}${culturalLine}${ownershipLine}` : "USER PROFILE: New user — no preferences captured yet. Ask them what they're into!";

  const likedSection = likedSpots.length
    ? `\nSPOTS THEY'VE LOVED (recommend similar):\n${likedSpots.map((s) => `- ${s}`).join("\n")}`
    : "";

  const dislikedSection = dislikedSpots.length
    ? `\nSPOTS THEY'VE PASSED ON (avoid similar):\n${dislikedSpots.map((s) => `- ${s}`).join("\n")}`
    : "";

  const savedSection = savedPlaces.length
    ? `\nTHEIR SAVED PLACES:\n${savedPlaces.map((s) => `- ${s}`).join("\n")}`
    : "";

  const journeySection = activeJourney
    ? `\nACTIVE LIFE JOURNEY — THIS IS CRITICAL CONTEXT:
The user is currently on a "${activeJourney.journeyType}" journey titled "${activeJourney.title}"${activeJourney.city ? ` in ${activeJourney.city}` : ""}.
${activeJourney.aiContext ? `Journey context: ${activeJourney.aiContext}` : ""}
Current phases and their status:
${activeJourney.phases.map((p) => {
  const completedSteps = p.steps.filter((s) => s.completed).length;
  return `- ${p.icon} ${p.title} [${p.status.toUpperCase()}] — ${completedSteps}/${p.steps.length} steps done`;
}).join("\n")}
Active phase: ${activeJourney.phases.find((p) => p.status === "active")?.title ?? "none"}
IMPORTANT: When they ask about any topic related to their journey, connect it back. Reference their journey naturally. Suggest next steps. Help them make progress. This is their guide — make every conversation feel connected to where they're going.`
    : "";

  const crossCitySection = crossCityBridge?.length
    ? `\nCROSS-CITY PREFERENCE BRIDGE — BE PROACTIVE WITH THIS:
This user is heading to ${activeJourney?.city ?? "a new city"}. We matched their saved categories from previous cities to Black-owned businesses there:

${crossCityBridge.map((bridge) =>
  `• ${bridge.category} (they saved ${bridge.savedCount} in ${bridge.fromCity}):\n${bridge.matches.map((m) => `  - ${m.name}${m.verified ? " ✓ Verified" : ""}`).join("\n")}`
).join("\n\n")}

CRITICAL INSTRUCTION: Don't wait for them to ask. Proactively say something like — "Since you were feeling ${crossCityBridge[0]?.category} spots in ${crossCityBridge[0]?.fromCity}, I already found you some great ones in ${activeJourney?.city}." Make the connection feel magical, like a friend who remembered exactly what you loved.`
    : "";

  return `You are KinfolkAI™ — a conversational travel companion built by and for the Minority community. You are not a search engine. You are the user's most trusted, well-traveled friend who gives the real unfiltered scoop — the way only a neighbor who grew up there can.

You have memory. You know this person. You learn from every interaction. You get more personalized every time they talk to you.

${profileSection}${likedSection}${dislikedSection}${savedSection}${journeySection}${crossCitySection}

DISCOVERY MANDATE — REQUIRED, NOT OPTIONAL:
After answering any direct question, you MUST surface 1-2 adjacent needs the user hasn't mentioned. Frame these as warm, curious questions — not a list or a checklist. You are the friend who thinks ahead.

What to probe by situation:
- They ask for a stylist → also ask: "Have you found a primary care doctor yet? And do you need any home services — repair, cleaning, organizing?"
- They ask about restaurants → also ask: "What about community? Have you found a church, mosque, or social group yet?"
- They're moving → probe: movers, home repair, organizer, cleaning service, storage, schools, healthcare, community organizations, financial/banking setup
- They're starting a business → probe: mental health support, accountant, insurance, coworking space, marketing help
- They have a new baby → probe: postpartum mental health, nutrition, childcare backup plans, community parent groups
- They're new to a city → probe: places of worship, professional networking, healthcare setup, financial services, fitness/wellness
- General rule: healthcare, financial wellness, community connection, mental health support, legal help, childcare, and transportation are categories people almost always need but rarely think to ask about

The magic is in HOW you ask — make it feel like a friend leaning in, not a form to fill out.

HANDLING OUT-OF-SCOPE QUESTIONS:
KinfolkAI is a community travel companion — not a general assistant. If someone asks about something outside your lane (weather forecasts, news, sports scores, stock prices, directions/maps, math, etc.), be honest and brief:
- Acknowledge you can't help with that specific thing in 1 sentence
- ONLY offer a travel/community pivot if it's genuinely connected (e.g. weather → "I can't pull live forecasts, but I can tell you what to pack for Atlanta in July based on the season"). If there's no natural connection, just acknowledge and stop — do NOT force a restaurant or business recommendation onto an unrelated question
- Never pretend to have data you don't have (live weather, real-time traffic, current news, etc.)

CONVERSATION STYLE:
- Be warm, conversational, like their most well-traveled friend who's been everywhere
- Ask follow-up questions when you need more info — "Are you going solo or with the crew?" "What's your budget like?" "More food or more nightlife?"
- Reference their history when relevant: "Since you've been feeling that Atlanta energy..." or "Based on what you love, you'd be right at home in..."
- Before diving into recommendations, make sure you have a destination and some sense of their vibe
- NEVER sound like a travel brochure. ZERO use of words like "boasts", "features", "renowned", "visitors will enjoy"
- ZERO profanity. Authenticity comes from rhythm, warmth, and cultural knowledge — not curse words
- Use "you" and "your" constantly — make it personal and direct

${voiceInstructions}${kbygInstructions}

WHEN GIVING STRUCTURED RECOMMENDATIONS:
Return EXACTLY this JSON format (no markdown, no extra text — pure valid JSON):
{
  "reply": "your warm, conversational message — 2-4 sentences like you're texting a friend",
  "recommendations": {
    "destination": "city name",
    "summary": "1-2 sentences capturing the vibe",
    "businesses": [
      { "name": "...", "category": "...", "description": "...", "neighborhood": "...", "mustTry": "..."${kbyg ? `, "knowBeforeYouGo": { "atmosphere": "...", "parking": "...", "greatFor": "...", "bestTime": "...", "communityInsight": "..." }` : ""} }
    ],
    "neighborhoods": [
      { "name": "...", "vibe": "...", "highlights": ["..."], "safetyNote": "..." }
    ],
    "events": [
      { "name": "...", "type": "...", "description": "...", "timing": "..." }
    ],
    "safetyTips": ["...", "..."],
    "localInsights": ["...", "..."]
  },
  "followUpSuggestions": ["short contextual suggestion 1", "suggestion 2", "suggestion 3"]
}

If you're asking a question or don't have enough info yet, set "recommendations" to null.
"followUpSuggestions" should always be 3 short, natural things the user might say next (e.g., "More food spots", "What's the nightlife like?", "Tell me about the neighborhoods").
Include 4-6 businesses, 2-3 neighborhoods, 3-4 events, 3-4 safety tips, and 3-4 local insights.
Only recommend real Minority-owned or culturally Minority spots — no tourist traps, no chains.${businessCatalog?.length ? `

VERIFIED PLATFORM BUSINESSES${destination ? ` IN ${destination.toUpperCase()}` : ""} — PRIORITIZE THESE:
These are real, verified minority-owned businesses listed on Mapping With Melanin™. When they match the user's vibe or needs, recommend them by name and tell their story authentically. Weave in their mission, values, and personality — not just their category.

${businessCatalog.map(b => {
  const lines: string[] = [`• ${b.name} | ${b.category}${b.verified ? " ✓ Verified" : ""}`];
  if (b.description) lines.push(`  "${b.description.slice(0, 180)}"`);
  if (b.story) lines.push(`  Story: ${b.story.slice(0, 200)}`);
  if (b.missionStatement) lines.push(`  Mission: ${b.missionStatement.slice(0, 150)}`);
  if (b.whyStarted) lines.push(`  Why they started: ${b.whyStarted.slice(0, 150)}`);
  if (b.whatCustomersShouldKnow) lines.push(`  FYI: ${b.whatCustomersShouldKnow}`);
  if (b.vibes?.length) lines.push(`  Vibe: ${b.vibes.join(", ")}`);
  if (b.ownershipBadges?.length) lines.push(`  Owned by: ${b.ownershipBadges.join(", ")}`);
  if (b.communityValues?.length) lines.push(`  Values: ${b.communityValues.join(", ")}`);
  if (b.audiencesServed?.length) lines.push(`  Great for: ${b.audiencesServed.join(", ")}`);
  if (b.accessibilityFeatures?.length) lines.push(`  Accessible: ${b.accessibilityFeatures.join(", ")}`);
  if (b.communityInitiatives?.length) lines.push(`  Gives back: ${b.communityInitiatives.join(", ")}`);
  if (b.tags?.length) lines.push(`  Tags: ${b.tags.slice(0, 6).join(", ")}`);
  return lines.join("\n");
}).join("\n\n")}

When you mention any of these businesses, be specific: use their actual name, share their story, and explain WHY they'd resonate with this particular user based on their preferences and vibe.` : ""}`;
}

// ─── GET /api/kinfolk/preferences ─────────────────────────────────────────────
router.get("/kinfolk/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [prefs] = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user.id))
      .limit(1);
    res.json({ preferences: prefs ?? { userId: req.user.id, favoriteCategories: [], favoriteCities: [], avoidCategories: [], budgetRange: "any", tripStyle: [], travelCompanion: "solo", dietaryNotes: null } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch preferences");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// ─── PUT /api/kinfolk/preferences ─────────────────────────────────────────────
router.put("/kinfolk/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const {
    favoriteCategories, favoriteCities, avoidCategories, budgetRange, tripStyle, travelCompanion, dietaryNotes,
    communicationStyle, emojiLevel, humorLevel, culturalInterests, knowBeforeYouGo, regionalFlavor,
    preferredOwnershipTypes,
  } = req.body as Record<string, unknown>;
  try {
    const [prefs] = await db
      .insert(userPreferencesTable)
      .values({
        userId: req.user.id,
        favoriteCategories: Array.isArray(favoriteCategories) ? favoriteCategories as string[] : undefined,
        favoriteCities: Array.isArray(favoriteCities) ? favoriteCities as string[] : undefined,
        avoidCategories: Array.isArray(avoidCategories) ? avoidCategories as string[] : undefined,
        budgetRange: typeof budgetRange === "string" ? budgetRange : undefined,
        tripStyle: Array.isArray(tripStyle) ? tripStyle as string[] : undefined,
        travelCompanion: typeof travelCompanion === "string" ? travelCompanion : undefined,
        dietaryNotes: typeof dietaryNotes === "string" ? dietaryNotes : undefined,
        communicationStyle: typeof communicationStyle === "string" ? communicationStyle : undefined,
        emojiLevel: typeof emojiLevel === "string" ? emojiLevel : undefined,
        humorLevel: typeof humorLevel === "string" ? humorLevel : undefined,
        culturalInterests: Array.isArray(culturalInterests) ? culturalInterests as string[] : undefined,
        knowBeforeYouGo: typeof knowBeforeYouGo === "boolean" ? knowBeforeYouGo : undefined,
        regionalFlavor: typeof regionalFlavor === "string" ? regionalFlavor : undefined,
        preferredOwnershipTypes: Array.isArray(preferredOwnershipTypes) ? preferredOwnershipTypes as string[] : undefined,
      })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: {
          ...(Array.isArray(favoriteCategories) && { favoriteCategories: favoriteCategories as string[] }),
          ...(Array.isArray(favoriteCities) && { favoriteCities: favoriteCities as string[] }),
          ...(Array.isArray(avoidCategories) && { avoidCategories: avoidCategories as string[] }),
          ...(typeof budgetRange === "string" && { budgetRange }),
          ...(Array.isArray(tripStyle) && { tripStyle: tripStyle as string[] }),
          ...(typeof travelCompanion === "string" && { travelCompanion }),
          ...(dietaryNotes !== undefined && { dietaryNotes: typeof dietaryNotes === "string" ? dietaryNotes : null }),
          ...(typeof communicationStyle === "string" && { communicationStyle }),
          ...(typeof emojiLevel === "string" && { emojiLevel }),
          ...(typeof humorLevel === "string" && { humorLevel }),
          ...(Array.isArray(culturalInterests) && { culturalInterests: culturalInterests as string[] }),
          ...(typeof knowBeforeYouGo === "boolean" && { knowBeforeYouGo }),
          ...(typeof regionalFlavor === "string" && { regionalFlavor }),
          ...(Array.isArray(preferredOwnershipTypes) && { preferredOwnershipTypes: preferredOwnershipTypes as string[] }),
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "Failed to update preferences");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ─── POST /api/kinfolk/feedback ───────────────────────────────────────────────
router.post("/kinfolk/feedback", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { sessionId, businessName, category, city, reaction } = req.body as Record<string, unknown>;
  if (!businessName || !reaction || !["like", "dislike"].includes(reaction as string)) {
    res.status(400).json({ error: "businessName and valid reaction required" });
    return;
  }
  try {
    await db.insert(kinfolkFeedbackTable).values({
      userId: req.user.id,
      sessionId: typeof sessionId === "string" ? sessionId : null,
      businessName: businessName as string,
      category: typeof category === "string" ? category : null,
      city: typeof city === "string" ? city : null,
      reaction: reaction as string,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save feedback");
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// ─── GET /api/kinfolk/sessions ────────────────────────────────────────────────
router.get("/kinfolk/sessions", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const sessions = await db
      .select({
        id: kinfolkSessionsTable.id,
        title: kinfolkSessionsTable.title,
        destination: kinfolkSessionsTable.destination,
        createdAt: kinfolkSessionsTable.createdAt,
        updatedAt: kinfolkSessionsTable.updatedAt,
      })
      .from(kinfolkSessionsTable)
      .where(eq(kinfolkSessionsTable.userId, req.user.id))
      .orderBy(desc(kinfolkSessionsTable.updatedAt))
      .limit(30);
    res.json({ sessions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch sessions");
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ─── GET /api/kinfolk/sessions/:id ───────────────────────────────────────────
router.get("/kinfolk/sessions/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [session] = await db
      .select()
      .from(kinfolkSessionsTable)
      .where(and(eq(kinfolkSessionsTable.id, id), eq(kinfolkSessionsTable.userId, req.user.id)))
      .limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({ session });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch session");
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── POST /api/kinfolk/chat ───────────────────────────────────────────────────
const FREE_MONTHLY_LIMIT = 3;

router.post("/kinfolk/chat", async (req: Request, res: Response) => {
  const { sessionId, message, vibes = [], voiceMode = "community" } = req.body as {
    sessionId?: string;
    message: string;
    vibes?: string[];
    voiceMode?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    // ── Enforce free-tier monthly query limit ─────────────────────────────────
    if (req.user?.id) {
      const user = await storage.getUser(req.user.id);
      const isFree =
        !user?.stripeSubscriptionId &&
        user?.memberType !== "founding" &&
        user?.memberType !== "beta" &&
        user?.memberType !== "navigator" &&
        user?.memberType !== "trailblazer" &&
        !(user?.trialEndsAt && user.trialEndsAt > new Date());

      if (isFree) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const sameMonth = user?.kinfolkQueryMonth === currentMonth;
        const usedQueries = sameMonth ? (user?.kinfolkQueriesThisMonth ?? 0) : 0;

        if (usedQueries >= FREE_MONTHLY_LIMIT) {
          res.status(429).json({
            error: `You've used your ${FREE_MONTHLY_LIMIT} free KinfolkAI queries this month. Upgrade to Navigator or Trailblazer for unlimited access.`,
            code: "KINFOLK_LIMIT_REACHED",
            used: usedQueries,
            limit: FREE_MONTHLY_LIMIT,
            upgradeUrl: "/membership",
          });
          return;
        }

        await db
          .update(usersTable)
          .set({
            kinfolkQueryMonth: currentMonth,
            kinfolkQueriesThisMonth: sameMonth ? usedQueries + 1 : 1,
          })
          .where(eq(usersTable.id, req.user.id));
      }
    }

    // Fetch personalization context (optional auth — works for guests too)
    let prefs: typeof userPreferencesTable.$inferSelect | null = null;
    let likedSpots: string[] = [];
    let dislikedSpots: string[] = [];
    let savedPlaces: string[] = [];

    if (req.user?.id) {
      // User preferences
      const prefsResult = await db
        .select()
        .from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, req.user.id))
        .limit(1);
      prefs = prefsResult[0] ?? null;

      // Feedback history
      const feedback = await db
        .select()
        .from(kinfolkFeedbackTable)
        .where(eq(kinfolkFeedbackTable.userId, req.user.id))
        .orderBy(desc(kinfolkFeedbackTable.createdAt))
        .limit(40);

      likedSpots = feedback
        .filter((f) => f.reaction === "like")
        .map((f) => `${f.businessName}${f.city ? ` (${f.city})` : ""}${f.category ? ` — ${f.category}` : ""}`);
      dislikedSpots = feedback
        .filter((f) => f.reaction === "dislike")
        .map((f) => `${f.businessName}${f.city ? ` (${f.city})` : ""}${f.category ? ` — ${f.category}` : ""}`);

      // Saved places
      const saved = await db
        .select()
        .from(savedPlacesTable)
        .where(eq(savedPlacesTable.userId, req.user.id))
        .limit(15);
      savedPlaces = saved.map((s) => s.businessId);
    }

    // Load or create session
    let currentSession: typeof kinfolkSessionsTable.$inferSelect | null = null;
    if (sessionId && req.user?.id) {
      const [s] = await db
        .select()
        .from(kinfolkSessionsTable)
        .where(and(eq(kinfolkSessionsTable.id, sessionId), eq(kinfolkSessionsTable.userId, req.user.id)))
        .limit(1);
      currentSession = s ?? null;
    }

    const existingMessages: SessionMessage[] = currentSession?.messages ?? [];

    // Detect destination from message or session
    const destination = currentSession?.destination ?? null;

    // Fetch platform business catalog for this destination (with identity enrichment)
    let businessCatalog: BusinessCatalogEntry[] = [];
    if (destination) {
      try {
        const bizRows = await db
          .select({
            name: businessesTable.name,
            category: businessesTable.category,
            city: businessesTable.city,
            description: businessesTable.description,
            verified: businessesTable.verified,
            tags: businessesTable.tags,
            story: businessIdentityTable.businessStory,
            missionStatement: businessIdentityTable.missionStatement,
            whyStarted: businessIdentityTable.whyStarted,
            whatCustomersShouldKnow: businessIdentityTable.whatCustomersShouldKnow,
            ownershipBadges: businessIdentityTable.ownershipBadges,
            communityValues: businessIdentityTable.communityValues,
            audiencesServed: businessIdentityTable.audiencesServed,
            vibes: businessIdentityTable.vibes,
            accessibilityFeatures: businessIdentityTable.accessibilityFeatures,
            communityInitiatives: businessIdentityTable.communityInitiatives,
            growthGoals: businessIdentityTable.growthGoals,
          })
          .from(businessesTable)
          .leftJoin(businessIdentityTable, eq(businessIdentityTable.businessId, businessesTable.id))
          .where(and(
            ilike(businessesTable.city, `%${destination}%`),
            eq(businessesTable.status, "active"),
          ))
          .limit(25);
        businessCatalog = bizRows;
      } catch { /* non-critical — proceed without catalog */ }
    }

    // Fetch active life journey for this user (inject into system prompt)
    let activeJourney: { title: string; city: string | null; journeyType: string; phases: JourneyPhase[]; aiContext: string | null } | null = null;
    if (req.user?.id) {
      try {
        const [latestJourney] = await db
          .select()
          .from(lifeJourneysTable)
          .where(and(eq(lifeJourneysTable.userId, req.user.id), eq(lifeJourneysTable.status, "active")))
          .orderBy(desc(lifeJourneysTable.updatedAt))
          .limit(1);
        if (latestJourney) {
          activeJourney = {
            title: latestJourney.title,
            city: latestJourney.city,
            journeyType: latestJourney.journeyType,
            phases: latestJourney.phases as JourneyPhase[],
            aiContext: latestJourney.aiContext ?? null,
          };
        }
      } catch { /* non-critical */ }
    }

    // Build cross-city preference bridge (when user has an active journey with a destination)
    let crossCityBridge: CrossCityMatch[] | null = null;
    if (req.user?.id && activeJourney?.city) {
      try {
        const { pool } = await import("@workspace/db");
        const fbRows = await pool.query<{ category: string; city: string; cnt: string }>(
          `SELECT category, city, COUNT(*) as cnt
           FROM kinfolk_feedback
           WHERE user_id = $1
             AND reaction = 'like'
             AND category IS NOT NULL
             AND city IS NOT NULL
             AND city NOT ILIKE $2
           GROUP BY category, city
           ORDER BY cnt DESC
           LIMIT 20`,
          [req.user.id, `%${activeJourney.city}%`],
        );
        if (fbRows.rows.length > 0) {
          const catMap = new Map<string, { category: string; fromCity: string; savedCount: number }>();
          for (const row of fbRows.rows) {
            const key = row.category.toLowerCase();
            if (!catMap.has(key)) catMap.set(key, { category: row.category, fromCity: row.city, savedCount: 0 });
            catMap.get(key)!.savedCount += parseInt(row.cnt, 10);
          }
          const topCats = [...catMap.values()].slice(0, 5);
          const bridges = await Promise.all(
            topCats.map(async ({ category, fromCity, savedCount }) => {
              const bizRows = await pool.query<{ name: string; category: string; city: string; verified: boolean }>(
                `SELECT name, category, city, verified FROM businesses
                 WHERE status = 'active' AND city ILIKE $1 AND category ILIKE $2
                 ORDER BY verified DESC, name ASC LIMIT 3`,
                [`%${activeJourney.city}%`, `%${category}%`],
              );
              return { category, fromCity, savedCount, matches: bizRows.rows };
            }),
          );
          crossCityBridge = bridges.filter((b) => b.matches.length > 0);
          if (crossCityBridge.length === 0) crossCityBridge = null;
        }
      } catch { /* non-critical */ }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({ prefs, likedSpots, dislikedSpots, savedPlaces, destination, voiceMode, businessCatalog, activeJourney, crossCityBridge });

    // Build OpenAI messages (history + new message)
    const historyMessages = existingMessages
      .slice(-12) // keep last 12 messages for context
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant"
          ? m.content // just text for history
          : m.content,
      }));

    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...historyMessages,
      { role: "user" as const, content: `${message}${vibes.length ? `\n\n[My vibes for this trip: ${vibes.join(", ")}]` : ""}` },
    ];

    // Call AI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 8192,
      messages: aiMessages,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let reply = "Let me think on that for a second — something went sideways on my end.";
    let recommendations: Record<string, unknown> | null = null;
    let followUpSuggestions: string[] = [];
    let detectedDestination: string | null = null;

    try {
      const parsed = JSON.parse(rawContent) as {
        reply?: string;
        recommendations?: Record<string, unknown> | null;
        followUpSuggestions?: string[];
      };
      reply = parsed.reply ?? rawContent;
      recommendations = parsed.recommendations ?? null;
      followUpSuggestions = parsed.followUpSuggestions ?? [];
      if (recommendations && typeof recommendations.destination === "string") {
        detectedDestination = recommendations.destination;
      }
    } catch {
      // If not JSON, just use raw content as reply
      reply = rawContent;
    }

    // Save/update session — skip if user has opted out of memory
    const timestamp = new Date().toISOString();
    const newUserMsg: SessionMessage = { role: "user", content: message, timestamp };
    const newAiMsg: SessionMessage = {
      role: "assistant",
      content: reply,
      recommendations: recommendations ?? undefined,
      followUpSuggestions,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...existingMessages, newUserMsg, newAiMsg];

    let memoryEnabled = true;
    if (req.user?.id) {
      const [userSettings] = await db
        .select({ kinfolkMemoryEnabled: userSettingsTable.kinfolkMemoryEnabled })
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, req.user.id))
        .limit(1)
        .catch(() => []);
      if (userSettings?.kinfolkMemoryEnabled === false) memoryEnabled = false;
    }

    let finalSessionId = sessionId;
    if (req.user?.id && memoryEnabled) {
      if (currentSession) {
        await db
          .update(kinfolkSessionsTable)
          .set({
            messages: updatedMessages,
            destination: detectedDestination ?? currentSession.destination,
            updatedAt: new Date(),
          })
          .where(eq(kinfolkSessionsTable.id, currentSession.id));
      } else {
        const title = detectedDestination
          ? `${detectedDestination} Trip`
          : message.length > 40 ? message.slice(0, 40) + "…" : message;
        const [newSession] = await db
          .insert(kinfolkSessionsTable)
          .values({
            userId: req.user.id,
            title,
            destination: detectedDestination,
            vibes: vibes as string[],
            messages: updatedMessages,
          })
          .returning();
        finalSessionId = newSession?.id;
      }
    }

    res.json({ sessionId: finalSessionId, reply, recommendations, followUpSuggestions });
  } catch (err) {
    req.log.error({ err }, "KinfolkAI chat failed");
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// ─── POST /api/kinfolk/business-action-plan ────────────────────────────────────
router.post("/kinfolk/business-action-plan", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  if (!openai) return void res.status(503).json({ error: "AI service unavailable" });

  const { businessName, businessCategory, businessCity, reviews } = req.body as {
    businessName?: string;
    businessCategory?: string;
    businessCity?: string;
    reviews?: Array<{ rating: number; content: string | null }>;
  };

  // Fetch the owner's business identity for personalized advice
  let identityContext = "";
  try {
    const [ownerBiz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);
    if (ownerBiz) {
      const [identity] = await db
        .select()
        .from(businessIdentityTable)
        .where(eq(businessIdentityTable.businessId, ownerBiz.id))
        .limit(1);
      if (identity) {
        const parts: string[] = [];
        if (identity.missionStatement) parts.push(`Mission: ${identity.missionStatement}`);
        if (identity.businessStory) parts.push(`Story: ${identity.businessStory.slice(0, 300)}`);
        if (identity.communityValues?.length) parts.push(`Core values: ${identity.communityValues.join(", ")}`);
        if (identity.audiencesServed?.length) parts.push(`Serves: ${identity.audiencesServed.join(", ")}`);
        if (identity.vibes?.length) parts.push(`Business vibe: ${identity.vibes.join(", ")}`);
        if (identity.growthGoals?.length) parts.push(`Growth goals: ${identity.growthGoals.join(", ")}`);
        if (identity.accessibilityFeatures?.length) parts.push(`Current accessibility: ${identity.accessibilityFeatures.join(", ")}`);
        if (identity.communityInitiatives?.length) parts.push(`Community commitments: ${identity.communityInitiatives.join(", ")}`);
        if (identity.isHiring) parts.push("Currently hiring");
        if (parts.length) identityContext = `\nBUSINESS IDENTITY (owner-defined):\n${parts.join("\n")}`;
      }
    }
  } catch { /* non-critical */ }

  const reviewsText = reviews?.length
    ? reviews.map((r) => `- Rating: ${r.rating}/5 | Feedback: ${r.content ?? "(no written feedback)"}`).join("\n")
    : "No community reviews yet.";

  const prompt = `You are an expert Black business advisor helping "${businessName ?? "a business"}" (category: ${businessCategory ?? "General"}, city: ${businessCity ?? "Unknown"}) build an improvement action plan.${identityContext}

COMMUNITY FEEDBACK FROM REVIEWS:
${reviewsText}

Analyze the feedback and generate a practical, budget-conscious action plan that honors the business's mission, values, and growth goals. If no reviews mention specific issues, generate proactive improvements relevant to the business category, community expectations, and the owner's stated goals.

Return EXACTLY this JSON (no markdown, pure valid JSON):
{
  "summary": "2-3 sentence overview of what the feedback signals and what the plan focuses on",
  "actionItems": [
    {
      "issue": "Short description of the issue or opportunity",
      "priority": "critical|high|medium|low",
      "category": "Accessibility|Safety|Cleanliness|Service|Experience|Marketing|Infrastructure|Community",
      "actions": ["specific action step 1", "action step 2", "action step 3"],
      "estimatedCost": "e.g. $500–$1,500 or Free",
      "estimatedTimeline": "e.g. 1–2 weeks or Same day",
      "resources": ["Optional: local vendor/org/program that can help"]
    }
  ]
}

Include 3–6 action items. Prioritize accessibility (ADA compliance, wheelchair access, signage) and safety first. Be specific with dollar estimates — research realistic costs for small businesses. Keep language warm, community-centered, and practical.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { summary: string; actionItems: unknown[] };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Business action plan failed");
    res.status(500).json({ error: "Failed to generate action plan" });
  }
});

// ─── POST /api/kinfolk/expansion-analysis ─────────────────────────────────────
router.post("/kinfolk/expansion-analysis", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  if (!openai) return void res.status(503).json({ error: "AI service unavailable" });

  const { businessName, businessCategory, businessCity, avgRating, reviewCount, savesCount } = req.body as {
    businessName?: string;
    businessCategory?: string;
    businessCity?: string;
    avgRating?: number;
    reviewCount?: number;
    savesCount?: number;
  };

  // Fetch the owner's business identity for personalized expansion advice
  let expansionIdentityContext = "";
  try {
    const [ownerBiz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);
    if (ownerBiz) {
      const [identity] = await db
        .select()
        .from(businessIdentityTable)
        .where(eq(businessIdentityTable.businessId, ownerBiz.id))
        .limit(1);
      if (identity) {
        const parts: string[] = [];
        if (identity.missionStatement) parts.push(`Mission: ${identity.missionStatement}`);
        if (identity.communityValues?.length) parts.push(`Core values: ${identity.communityValues.join(", ")}`);
        if (identity.audiencesServed?.length) parts.push(`Serves: ${identity.audiencesServed.join(", ")}`);
        if (identity.vibes?.length) parts.push(`Business vibe: ${identity.vibes.join(", ")}`);
        if (identity.growthGoals?.length) parts.push(`Owner-stated growth goals: ${identity.growthGoals.join(", ")}`);
        if (identity.ownershipBadges?.length) parts.push(`Identity: ${identity.ownershipBadges.join(", ")}`);
        if (identity.communityInitiatives?.length) parts.push(`Community commitments: ${identity.communityInitiatives.join(", ")}`);
        if (parts.length) expansionIdentityContext = `\nBUSINESS IDENTITY (owner-defined):\n${parts.join("\n")}`;
      }
    }
  } catch { /* non-critical */ }

  // Fetch platform survey data for context
  let surveyContext = "";
  try {
    const { neighborhoodSurveysTable } = await import("@workspace/db");
    const surveys = await db
      .select({
        city: neighborhoodSurveysTable.city,
        daytimeSafety: neighborhoodSurveysTable.daytimeSafety,
        nighttimeSafety: neighborhoodSurveysTable.nighttimeSafety,
        walkability: neighborhoodSurveysTable.walkability,
        atmosphere: neighborhoodSurveysTable.atmosphere,
      })
      .from(neighborhoodSurveysTable)
      .limit(50);

    const cityMap: Record<string, { safetySum: number; count: number }> = {};
    for (const s of surveys) {
      const c = s.city;
      if (!cityMap[c]) cityMap[c] = { safetySum: 0, count: 0 };
      const avg = ((s.daytimeSafety ?? 0) + (s.nighttimeSafety ?? 0)) / 2;
      cityMap[c].safetySum += avg;
      cityMap[c].count += 1;
    }
    const citySummary = Object.entries(cityMap)
      .map(([city, { safetySum, count }]) => `${city}: avg safety ${(safetySum / count).toFixed(1)}/5 (${count} community reports)`)
      .join(", ");
    if (citySummary) surveyContext = `Platform community safety data by city: ${citySummary}`;
  } catch { /* non-critical */ }

  const prompt = `You are a business expansion strategist advising a minority-owned ${businessCategory ?? "business"} called "${businessName ?? "this business"}" currently based in ${businessCity ?? "their city"}.${expansionIdentityContext}

CURRENT PERFORMANCE:
- Average rating: ${avgRating?.toFixed(1) ?? "N/A"}/5
- Community reviews: ${reviewCount ?? 0}
- Saves by community members: ${savesCount ?? 0}
${surveyContext ? `\n${surveyContext}` : ""}

Based on community demand patterns, urban demographics, and the growth of Black consumer spending power ($1.8 trillion annually), generate an expansion vision and action plan.

Return EXACTLY this JSON (no markdown, pure valid JSON):
{
  "summary": "2-3 sentence big-picture expansion vision tailored to this business",
  "opportunities": [
    {
      "city": "City name",
      "state": "State abbreviation",
      "opportunity": "Specific opportunity description",
      "marketSignal": "Why this market is ready — data, demographics, community need",
      "estimatedDemand": "e.g. High — 2.4M Black residents, no comparable business within 10 miles",
      "actionSteps": ["step 1", "step 2", "step 3"]
    }
  ],
  "insights": [
    "Platform-level insight about community demand or untapped market",
    "Trend insight relevant to this category",
    "Strategic partnership or funding opportunity"
  ]
}

Include 2–4 city opportunities and 3–4 strategic insights. Focus on cities with strong Black communities: Atlanta, Houston, Chicago, DC, New York, New Orleans, LA, Miami, Dallas, Philadelphia, Detroit, Baltimore, Memphis, Charlotte. Prioritize cities near ${businessCity ?? "their base"}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { summary: string; opportunities: unknown[]; insights: string[] };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Expansion analysis failed");
    res.status(500).json({ error: "Failed to generate expansion analysis" });
  }
});

// ─── POST /kinfolk/relocation ─────────────────────────────────────────────────
// AI-powered relocation concierge — walks through phases, proactively recommends
// minority-owned businesses at every step of a move
router.post("/kinfolk/relocation", async (req: Request, res: Response) => {
  const {
    messages = [],
    fromCity,
    toCity,
    toState,
    familySize = "solo",
    budget = "mid",
    homeType = "renting",
    hasKids = false,
    hasPets = false,
    currentPhase = "neighborhoods",
    needs = [],
  } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    fromCity?: string;
    toCity?: string;
    toState?: string;
    familySize?: string;
    budget?: string;
    homeType?: string;
    hasKids?: boolean;
    hasPets?: boolean;
    currentPhase?: string;
    needs?: string[];
  };

  const RELOCATION_PHASES: Record<string, { title: string; icon: string; description: string; categories: string[] }> = {
    neighborhoods: { title: "Neighborhood Research", icon: "🏘️", description: "Find the right community for your lifestyle", categories: ["Real Estate", "Community"] },
    realtors:      { title: "Find a Realtor",        icon: "🏠", description: "Connect with Black-owned real estate agents",  categories: ["Real Estate"] },
    mortgage:      { title: "Mortgage & Financing",   icon: "💰", description: "Get pre-approved with community lenders",      categories: ["Finance", "Banking"] },
    movers:        { title: "Moving Companies",       icon: "🚚", description: "Book trustworthy movers",                     categories: ["Moving", "Transportation"] },
    utilities:     { title: "Set Up Utilities",       icon: "⚡", description: "Electricity, internet, and home services",    categories: ["Home Services"] },
    healthcare:    { title: "Find a Doctor",          icon: "🏥", description: "Primary care, specialists, and dentists",     categories: ["Healthcare", "Medical", "Health"] },
    schools:       { title: "Schools & Education",    icon: "🎓", description: "Research schools and childcare options",      categories: ["Education", "Childcare"] },
    salons:        { title: "Beauty & Grooming",      icon: "✂️", description: "Your go-to salon, barber, and spa",          categories: ["Beauty", "Salon", "Barbershop"] },
    restaurants:   { title: "Restaurants & Food",     icon: "🍽️", description: "Build your regular spots",                   categories: ["Restaurant", "Food", "Café"] },
    community:     { title: "Community & Events",     icon: "🤝🏾", description: "Find your people and local events",        categories: ["Community", "Events"] },
    employment:    { title: "Career & Employment",    icon: "💼", description: "Job boards, networking, and local employers", categories: ["Employment", "Networking"] },
    safety:        { title: "Safety & Security",      icon: "🛡️", description: "Understand your neighborhood safety profile", categories: ["Safety"] },
  };

  const phase = RELOCATION_PHASES[currentPhase] ?? RELOCATION_PHASES["neighborhoods"]!;

  let verifiedBusinesses: Array<{
    id: number | string; name: string; category: string; description: string;
    city: string; verified: boolean; phone: string | null; website: string | null;
  }> = [];

  if (toCity && phase.categories.length > 0) {
    try {
      const catConditions = phase.categories.map(cat => ilike(businessesTable.category, `%${cat}%`));
      verifiedBusinesses = await db
        .select({
          id: businessesTable.id,
          name: businessesTable.name,
          category: businessesTable.category,
          description: businessesTable.description,
          city: businessesTable.city,
          verified: businessesTable.verified,
          phone: businessesTable.phone,
          website: businessesTable.website,
        })
        .from(businessesTable)
        .where(and(ilike(businessesTable.city, `%${toCity}%`), or(...catConditions)))
        .limit(6);
    } catch { /* non-critical */ }
  }

  const isOutOfState = !!(fromCity && toState && fromCity.toLowerCase() !== (toCity ?? "").toLowerCase());

  const proactiveFlags = [
    hasKids  ? "They have children — proactively mention schools, childcare, and family-friendly neighborhoods." : "",
    hasPets  ? "They have pets — mention pet-friendly buildings, local vets, and dog parks when relevant." : "",
    isOutOfState ? "They're moving from out of state — proactively bring up transferring medical records, finding a new primary care doctor, and updating insurance networks." : "",
    homeType === "buy" ? "They're buying — mention home inspectors, real estate attorneys, and the Black-owned realtor advantage." : "",
    (needs as string[]).includes("Home Repair") ? "They flagged home repair — proactively mention minority-owned contractors and handymen." : "",
    (needs as string[]).includes("Mental Health") ? "They flagged mental health — mention Black therapists and culturally affirming wellness providers." : "",
  ].filter(Boolean).join("\n");

  const businessCatalog = verifiedBusinesses.length > 0
    ? `\n\nVERIFIED PLATFORM BUSINESSES IN ${toCity?.toUpperCase()} (PRIORITIZE THESE):\n` +
      verifiedBusinesses.map(b =>
        `• ${b.name} | ${b.category}${b.verified ? " ✓ Verified" : ""}\n  "${(b.description ?? "").slice(0, 160)}"\n  ${b.phone ? `📞 ${b.phone}` : ""}${b.website ? ` | 🌐 ${b.website}` : ""}`
      ).join("\n\n")
    : "";

  const systemPrompt = `You are KinfolkAI's Relocation Concierge — the most trusted friend anyone could have when moving to a new city. You know Black-owned and minority-owned businesses, culturally affirming neighborhoods, community resources, and all the hidden knowledge it takes to make a new place feel like home.

MOVE CONTEXT:
- Relocating: ${fromCity ?? "current city"} → ${toCity ?? "new city"}${toState ? `, ${toState}` : ""}
- Family: ${familySize} | Budget: ${budget} | Home plan: ${homeType}
- Has kids: ${hasKids ? "Yes" : "No"} | Has pets: ${hasPets ? "Yes" : "No"}
- Current focus: ${phase.icon} ${phase.title} — ${phase.description}
- Stated needs: ${(needs as string[]).length > 0 ? (needs as string[]).join(", ") : "general relocation"}

PROACTIVE CONTEXT (address these naturally throughout conversation):
${proactiveFlags || "No special flags — guide through the standard relocation journey."}

YOUR VOICE:
- Warm and direct, like texting your most well-connected friend who has already lived in this city
- ALWAYS center Black-owned, minority-owned, and culturally affirming businesses first
- At each phase, mention what they will need NEXT so they stay ahead of the process
- Reference their specific situation (family size, budget, home type) in every response
- NEVER use travel-brochure language: no "boasts", "features", "renowned", "visitors will enjoy"
- Use "you" constantly — make it personal and direct

RETURN EXACTLY THIS JSON (no markdown fencing, no extra text):
{
  "reply": "2-3 sentences warm and direct, like a text from a trusted friend who has been through this",
  "businesses": [
    {
      "name": "Business Name",
      "category": "Category",
      "description": "Why this is the right fit for their specific situation",
      "neighborhood": "Area of city",
      "whyForYou": "Very specific reason it matches their family size, budget, home type, etc.",
      "phone": "phone number or null",
      "website": "website or null",
      "verified": true
    }
  ],
  "proactiveSuggestions": ["3-4 short tap-able action chips"],
  "insight": "One proactive thing they have not thought of yet that they will thank you for later",
  "checklistItems": ["3-5 concrete action items for this phase"],
  "nextPhaseHint": "1 sentence teaser for what comes after this phase"
}

Include 3-5 businesses. Mix platform-verified (from the list below) with AI knowledge.${businessCatalog}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages as Array<{ role: string; content: string }>).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.75,
      max_tokens: 1800,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean) as Record<string, unknown>;
    } catch {
      parsed = { reply: raw, businesses: [], proactiveSuggestions: [], insight: "", checklistItems: [], nextPhaseHint: "" };
    }

    const mentionedNames = new Set<string>(
      ((parsed.businesses as Array<{ name: string }>) ?? []).map(b => b.name.toLowerCase())
    );
    const extraVerified = verifiedBusinesses
      .filter(b => !mentionedNames.has(b.name.toLowerCase()))
      .slice(0, 2)
      .map(b => ({
        id: b.id, name: b.name, category: b.category, description: b.description,
        neighborhood: b.city, whyForYou: `Verified on Mapping With Melanin™ in ${b.city}`,
        phone: b.phone, website: b.website, verified: b.verified, platformVerified: true,
      }));

    res.json({ ...parsed, phase: { id: currentPhase, ...phase }, extraVerified });
  } catch (err) {
    req.log.error({ err }, "Relocation concierge failed");
    res.status(500).json({ error: "Failed to generate relocation guidance" });
  }
});

// ─── Share a trip ──────────────────────────────────────────────────────────────
router.post("/kinfolk/sessions/:id/share", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };

  const [session] = await db
    .select()
    .from(kinfolkSessionsTable)
    .where(eq(kinfolkSessionsTable.id, id))
    .limit(1);

  if (!session || session.userId !== req.user.id) {
    return void res.status(404).json({ error: "Trip not found" });
  }

  let { shareId } = session;
  if (!shareId) {
    shareId = crypto.randomBytes(8).toString("hex");
    await db
      .update(kinfolkSessionsTable)
      .set({ shareId })
      .where(eq(kinfolkSessionsTable.id, id));
  }

  return void res.json({ shareId, shareUrl: `/shared/trip/${shareId}` });
});

// ─── View a shared trip (public) ───────────────────────────────────────────────
router.get("/kinfolk/shared/:shareId", async (req: Request, res: Response) => {
  const { shareId } = req.params as { shareId: string };

  const [session] = await db
    .select()
    .from(kinfolkSessionsTable)
    .where(eq(kinfolkSessionsTable.shareId, shareId))
    .limit(1);

  if (!session) return void res.status(404).json({ error: "Trip not found" });

  const msgs = session.messages ?? [];
  const lastRec = [...msgs].reverse().find(m => m.role === "assistant" && m.recommendations);

  return void res.json({
    title: session.title,
    destination: session.destination,
    lastRecommendations: lastRec?.recommendations ?? null,
    followUpSuggestions: lastRec?.followUpSuggestions ?? [],
  });
});

export default router;
