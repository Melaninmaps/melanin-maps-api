import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetTravelRecommendationsBody } from "@workspace/api-zod";

const router: IRouter = Router();

type CityVoice = {
  slang: string[];
  phrases: string[];
  culturalTouchstones: string[];
  writingGuidance: string;
};

const CITY_VOICES: Record<string, CityVoice> = {
  "new york": {
    slang: ["deadass", "no cap", "mad", "wildin", "fam", "on sight", "bussin", "lowkey", "bet"],
    phrases: ["deadass this spot is legendary", "no cap you need to pull up", "mad vibes in this neighborhood", "fam this is the move"],
    culturalTouchstones: ["Harlem Renaissance", "the Bronx hip-hop origins", "Brooklyn Black excellence", "Bed-Stuy do or die", "the culture capital"],
    writingGuidance: "Write like a proud New Yorker — direct, confident, a little fast-paced. Use 'deadass', 'no cap', 'mad' as an adjective (mad good food), 'fam', 'the city', and 'pull up'. Reference Harlem, Brooklyn, the Bronx. New Yorkers are blunt but passionate about their city.",
  },
  "philadelphia": {
    slang: ["jawn", "iight", "no cap", "joint", "wooder ice", "the bottom", "Philly love", "young bull", "ard"],
    phrases: ["this jawn is everything", "iight pull up to this spot", "the vibes are unmatched fr", "this joint been holding it down"],
    culturalTouchstones: ["Black Bottom history", "North Philly culture", "West Philly", "Roots and Questlove", "South Street", "MOVE organization history"],
    writingGuidance: "Write with Philly energy — gritty, proud, loyal. Use 'jawn' liberally (it means anything — that jawn, this jawn, the jawn). Use 'iight' (alright), 'young bull', 'ard' (alright), and emphasize Philly love and loyalty. Philly folks ride hard for their city.",
  },
  "atlanta": {
    slang: ["slime", "on gang", "bussin", "the A", "OTP", "trap", "drip", "lowkey", "no cap", "period", "ATLien", "plug"],
    phrases: ["on gang this spot is bussin", "the A never misses", "this is where the culture lives", "slime you need to pull up"],
    culturalTouchstones: ["Sweet Auburn", "the BeltLine", "Old Fourth Ward", "Bankhead", "Atlanta as the Black mecca", "HBCUs", "trap music origins", "Tyler Perry Studios"],
    writingGuidance: "Write with Atlanta swagger — confident, aspirational, culturally rich. ATL is the Black mecca, lean into that. Use 'the A', 'slime' (term of endearment), 'on gang', 'bussin', 'drip'. Reference the BeltLine, Sweet Auburn, the HBCU culture. Atlanta is where Black excellence LIVES.",
  },
  "chicago": {
    slang: ["shorty", "the chi", "finna", "lowkey", "on me", "no cap", "opps", "drip", "bro", "gang", "lick"],
    phrases: ["this spot is cold on me", "the Chi never misses", "finna pull up to this jawn", "shorty this is the spot"],
    culturalTouchstones: ["Bronzeville Black Metropolis", "South Side culture", "Chicago blues roots", "Kanye and Chance legacy", "Harold Washington legacy", "Chatham neighborhood", "Bud Billiken Parade"],
    writingGuidance: "Write with Chi-town pride — real, resilient, deeply rooted. Use 'the Chi', 'shorty', 'finna', 'on me', and reference the South Side and Bronzeville. Chicago's Black community has deep historical roots — honor that. The writing should feel warm but grounded in reality.",
  },
  "houston": {
    slang: ["trill", "H-Town", "third coast", "slabs", "swangas", "screwed up", "chopped not slopped", "finna", "bruh", "what it do"],
    phrases: ["trill vibes only in H-Town", "what it do, this spot is everything", "H-Town finest right here", "the third coast never sleeps"],
    culturalTouchstones: ["Third Ward", "Emancipation Park", "DJ Screw legacy", "UGK and screwed music", "Juneteenth origins in Texas", "Project Row Houses", "Fifth Ward"],
    writingGuidance: "Write with Houston trill energy — slow, confident, layered. Houston has its own culture that doesn't follow anyone. Use 'trill', 'H-Town', 'third coast', 'what it do'. Reference the screwed music legacy, Juneteenth origins, and the unique Houston swagger. It's slow and deliberate — like chopped and screwed.",
  },
  "los angeles": {
    slang: ["no cap", "faded", "saucy", "dub", "west side", "the crenshaw", "lowkey", "bussin", "hard", "fire", "on god"],
    phrases: ["this spot hits different out west", "no cap the west coast eats", "lowkey this is the move", "dub been holding it down"],
    culturalTouchstones: ["Crenshaw District", "Leimert Park Village", "Inglewood culture", "Compton legacy", "Central Avenue jazz history", "Eso Won Books", "Black Hollywood"],
    writingGuidance: "Write with West Coast cool — laid back but confident. LA Black culture is diverse, artistic, and unbothered. Use 'dub' (W/West), 'no cap', 'lowkey', 'hits different', reference Leimert Park, Crenshaw, Inglewood. The vibe is sun-kissed excellence.",
  },
  "dc": {
    slang: ["junt", "bama", "DMV", "no cap", "go-go", "move", "finna", "bruh", "joint", "hard"],
    phrases: ["this junt is everything in the DMV", "go-go vibes all day", "bama you need to pull up", "the District never misses"],
    culturalTouchstones: ["U Street Corridor", "go-go music culture", "Howard University legacy", "Anacostia history", "Chuck Brown legacy", "Black Broadway (U Street)", "Ben's Chili Bowl institution"],
    writingGuidance: "Write with DMV energy — sophisticated but with that go-go bounce underneath. DC is where Black politics, art, and culture collide. Use 'junt', 'bama' (term of endearment in DMV), 'DMV', reference U Street, Howard University, go-go. The writing should feel polished but authentically hood at the same time.",
  },
  "detroit": {
    slang: ["finna", "no cap", "Motown", "313", "on me", "hard", "drip", "bruh", "slime", "lowkey"],
    phrases: ["313 never misses", "Motown energy in this spot", "Detroit hard as ever", "finna pull up to the best"],
    culturalTouchstones: ["Motown Records legacy", "Black Bottom neighborhood history", "Paradise Valley", "The Heidelberg Project", "Detroit techno origins", "Charles H. Wright Museum"],
    writingGuidance: "Write with Detroit resilience — proud, gritty, innovative. Detroit has been counted out and keeps rising. Use '313', 'Motown', reference Black Bottom, Paradise Valley. Detroit energy is strong and defiant — they built the soundtrack to America and invented techno. Honor that legacy.",
  },
  "new orleans": {
    slang: ["cher", "lagniappe", "making groceries", "neutral ground", "pass a good time", "where y'at", "laissez les bons temps rouler", "NOLA"],
    phrases: ["cher this spot will make you pass a good time", "lagniappe — a little something extra", "where y'at, this is the move", "NOLA never disappoints"],
    culturalTouchstones: ["Tremé neighborhood", "Second Line traditions", "Mardi Gras Indian culture", "jazz origins", "Dooky Chase legacy", "Congo Square history", "Black Masking Indians"],
    writingGuidance: "Write with NOLA warmth and rhythm — joyful, deep-rooted, full of life. New Orleans Black culture is ancient and layered. Use 'cher' (term of endearment), 'lagniappe' (a little something extra), 'pass a good time', 'where y'at'. Reference the Tremé, Second Line, Mardi Gras Indians. NOLA is where Black culture was born in America.",
  },
  "miami": {
    slang: ["305", "no cap", "drip", "lit", "Magic City", "fam", "fire", "on god", "bussin", "lowkey"],
    phrases: ["305 always delivers", "Magic City energy is unmatched", "this spot is dripping fr", "fam you need to pull up"],
    culturalTouchstones: ["Little Haiti culture", "Overtown Black history", "Liberty City", "Afro-Caribbean influence", "Miami Bass music origins", "Opa-locka"],
    writingGuidance: "Write with Miami heat — vibrant, multicultural, bold. Miami's Black culture blends African-American, Haitian, Caribbean, and Southern traditions. Use '305', 'Magic City', reference the Afro-Caribbean influence, Overtown, Little Haiti. The energy is tropical, luxurious, and deeply cultural.",
  },
  "baltimore": {
    slang: ["no cap", "fam", "joint", "hard", "bruh", "lowkey", "Charm City", "B-More", "hon", "on me"],
    phrases: ["Charm City holds it down", "B-More never misses", "this joint is everything", "fam this is the spot"],
    culturalTouchstones: ["Pennsylvania Avenue history", "Upton neighborhood", "Freddie Gray legacy", "The Wire cultural impact", "Morgan State HBCU", "Billie Holiday birthplace", "Cab Calloway history"],
    writingGuidance: "Write with Baltimore realness — resilient, proud, underrated. Baltimore is one of the most culturally rich Black cities in America and doesn't get enough credit. Use 'B-More', 'Charm City', reference Pennsylvania Avenue, Morgan State, the deep musical history. Baltimore speaks with a warm directness.",
  },
  "memphis": {
    slang: ["no cap", "bruh", "finna", "901", "Bluff City", "slime", "hard", "on god", "lowkey", "fam"],
    phrases: ["901 always delivers", "Bluff City culture is everything", "this spot hits different", "Memphis never misses"],
    culturalTouchstones: ["Beale Street heritage", "Memphis blues origins", "Civil Rights history (Lorraine Motel)", "Three 6 Mafia legacy", "soul food capital", "Stax Records"],
    writingGuidance: "Write with Memphis soul — deep, soulful, historically rooted. Memphis is where the blues was born and where Dr. King was martyred. Take that seriously in the writing. Use '901', 'Bluff City', reference Beale Street, Stax Records, the Civil Rights legacy. Memphis writing should have a soulful, almost musical quality.",
  },
};

function getCityVoice(destination: string): CityVoice | null {
  const lower = destination.toLowerCase();
  for (const [city, voice] of Object.entries(CITY_VOICES)) {
    if (lower.includes(city)) return voice;
  }
  return null;
}

function buildCulturalVoiceInstructions(voice: CityVoice): string {
  return `
CRITICAL — CULTURAL VOICE REQUIREMENT:
You must write ALL text content (summary, descriptions, safety notes, highlights, insights) in the authentic cultural voice of this city's Black community. This is the KinfolkAI signature — each city guide sounds like a local.

Writing guidance: ${voice.writingGuidance}

Authentic slang to weave in naturally (don't force every word, use 2-4 organically): ${voice.slang.join(", ")}

Cultural touchstones to reference where relevant: ${voice.culturalTouchstones.join(", ")}

Example phrases to draw inspiration from: ${voice.phrases.join(" | ")}

Rules:
- The summary MUST open with authentic local flavor and at least one piece of slang
- Business descriptions should feel like a local is recommending it to a friend
- Safety notes should feel like real community advice, not a travel brochure
- Local insights should sound like insider knowledge passed down
- Never feel forced or performative — weave the voice in naturally
`;
}

router.post("/travel/recommendations", async (req, res) => {
  const parsed = GetTravelRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { destination, vibes = [] } = parsed.data;
  const vibeList = vibes.length > 0 ? vibes.join(", ") : "general travel";
  const cityVoice = getCityVoice(destination);
  const culturalVoiceInstructions = cityVoice
    ? buildCulturalVoiceInstructions(cityVoice)
    : `Write warmly and authentically for the Black community — celebrate the culture, speak like a knowledgeable friend, not a travel brochure.`;

  const prompt = `You are KinfolkAI — the community travel guide built by and for the Black community. You specialize in Black-owned businesses, culturally rich neighborhoods, community events, and real safety information from a community perspective.

A traveler is visiting: ${destination}
Their travel vibes/interests: ${vibeList}

${culturalVoiceInstructions}

Return a JSON object with EXACTLY this structure (no extra text, pure JSON):
{
  "destination": "${destination}",
  "summary": "2-3 sentence warm, enthusiastic overview written in the city's authentic Black cultural voice",
  "businesses": [
    {
      "name": "Business name",
      "category": "Food/Beauty/Art/Music/Retail/etc",
      "description": "1-2 sentence description written in the city's cultural voice — like a local recommending it",
      "neighborhood": "Neighborhood name",
      "mustTry": "Specific dish, service, or product to try"
    }
  ],
  "neighborhoods": [
    {
      "name": "Neighborhood name",
      "vibe": "Short vibe descriptor in the city's cultural voice (e.g. Historic & Soulful, Trill Energy, Deadass Legendary)",
      "highlights": ["highlight written like a local", "highlight 2", "highlight 3"],
      "safetyNote": "Real community safety context written like a trusted local friend"
    }
  ],
  "events": [
    {
      "name": "Event name",
      "type": "Festival/Market/Concert/Community/Art/Food/etc",
      "description": "Brief description in the city's cultural voice",
      "timing": "When it typically occurs (e.g. Every summer, Monthly, Annual in June)"
    }
  ],
  "safetyTips": ["tip written like a local looking out for you", "tip 2", "tip 3"],
  "localInsights": ["insider insight in the city's voice", "insight 2", "insight 3"]
}

Include 4-6 businesses, 2-3 neighborhoods, 3-4 events, 3-4 safety tips, and 3-4 local insights. Focus on authentic Black-owned establishments and culturally significant spots.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content:
            "You are KinfolkAI, a culturally authentic travel guide for the Black community. Always respond with valid JSON only, no markdown fences or extra text. Your writing voice adapts to match the authentic Black cultural dialect of each city.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch {
      req.log.error({ content }, "Failed to parse AI response as JSON");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(recommendations);
  } catch (err) {
    req.log.error({ err }, "Travel recommendations AI call failed");
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
