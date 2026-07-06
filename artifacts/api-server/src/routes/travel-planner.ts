import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, businessesTable } from "@workspace/db";
import { eq, ilike, or, and, isNotNull } from "drizzle-orm";

const router: IRouter = Router();

// ─── POST /api/travel-planner/generate ────────────────────────────────────────
router.post("/travel-planner/generate", async (req: Request, res: Response) => {
  const { destination, days, style, interests } = req.body as {
    destination?: string;
    days?: number;
    style?: string;
    interests?: string[];
  };

  if (!destination || !days) {
    res.status(400).json({ error: "destination and days are required" });
    return;
  }

  const tripDays = Math.min(Math.max(Number(days) || 3, 1), 14);
  const travelStyle = style ?? "mid-range";
  const interestList = (interests ?? []).join(", ") || "food, culture, history, music";

  try {
    // Pull Black-owned businesses in or near the destination city
    const citySlug = destination.split(",")[0].trim();
    const localBusinesses = await db
      .select({
        name: businessesTable.name,
        category: businessesTable.category,
        address: businessesTable.address,
        city: businessesTable.city,
        description: businessesTable.description,
      })
      .from(businessesTable)
      .where(
        and(
          or(
            ilike(businessesTable.city, `%${citySlug}%`),
            ilike(businessesTable.address, `%${citySlug}%`),
          ),
          isNotNull(businessesTable.name),
        ),
      )
      .limit(40);

    const bizContext = localBusinesses.length > 0
      ? `\n\nBlack-owned businesses in the database for ${destination}:\n` +
        localBusinesses.map((b) => `- ${b.name} (${b.category ?? "Business"}): ${b.address ?? ""}`).join("\n")
      : "";

    const systemPrompt = `You are KinfolkAI, the travel planning assistant for Mapping With Melanin — a platform celebrating Black culture and Black-owned businesses. You create itineraries that center Black culture, history, food, art, and community.

Your itineraries:
- Prioritize Black-owned restaurants, hotels, barbershops, spas, galleries, and experiences
- Include culturally significant landmarks and historically Black neighborhoods
- Note safety context naturally and respectfully (not fear-based)
- Feel authentic, warm, and knowledgeable — like advice from a well-traveled friend
- Match the requested travel style: budget, mid-range, or luxury

CRITICAL: Return ONLY valid JSON matching this exact structure, no extra text:
{
  "destination": string,
  "totalDays": number,
  "overview": string (2-3 sentences painting the picture),
  "highlights": string[] (3-5 must-do bullet points),
  "days": [
    {
      "day": number,
      "theme": string (one evocative phrase for the day),
      "activities": [
        {
          "time": string,
          "title": string,
          "description": string (1-2 sentences),
          "type": "breakfast"|"lunch"|"dinner"|"attraction"|"shopping"|"experience"|"rest"|"nightlife",
          "businessName": string | null,
          "businessType": string | null,
          "tip": string | null (insider tip, optional),
          "isBlackOwned": boolean
        }
      ]
    }
  ],
  "safetyNote": string (1-2 sentences, positive framing),
  "packingTips": string[] (3-4 practical tips)
}${bizContext}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Plan a ${tripDays}-day ${travelStyle} trip to ${destination}. My interests: ${interestList}. Weave in as many Black-owned businesses and cultural experiences as possible. Make it feel like insider knowledge.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let itinerary: unknown;
    try {
      itinerary = JSON.parse(raw);
    } catch {
      res.status(500).json({ error: "Failed to parse itinerary response" });
      return;
    }

    res.json({ itinerary, localBusinessCount: localBusinesses.length });
  } catch (err) {
    req.log.error({ err }, "travel planner generate error");
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

export default router;
