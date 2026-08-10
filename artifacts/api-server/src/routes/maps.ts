import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { mapsLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/maps/embed-url", mapsLimiter, (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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

// Exposes the Maps JS API key so the frontend can load the interactive map.
// The key should have HTTP referrer restrictions set in Google Cloud Console.
router.get("/maps/js-key", mapsLimiter, (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  res.json({ key: apiKey });
});

// Proxies Google Directions API so the key stays server-side.
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

export default router;
