import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GetTravelRecommendationsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/travel/recommendations", async (req, res) => {
  const parsed = GetTravelRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { destination, vibes = [] } = parsed.data;
  const vibeList = vibes.length > 0 ? vibes.join(", ") : "general travel";

  const prompt = `You are a knowledgeable travel guide for the Black community, specializing in Black-owned businesses, culturally rich neighborhoods, community events, and safety information.

A traveler is visiting: ${destination}
Their travel vibes/interests: ${vibeList}

Return a JSON object with EXACTLY this structure (no extra text, pure JSON):
{
  "destination": "${destination}",
  "summary": "2-3 sentence warm, enthusiastic overview of the Black cultural scene in this city",
  "businesses": [
    {
      "name": "Business name",
      "category": "Food/Beauty/Art/Music/Retail/etc",
      "description": "1-2 sentence description",
      "neighborhood": "Neighborhood name",
      "mustTry": "Specific dish, service, or product to try"
    }
  ],
  "neighborhoods": [
    {
      "name": "Neighborhood name",
      "vibe": "Short vibe descriptor (e.g. Historic & Soulful)",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "safetyNote": "Brief safety context for Black travelers"
    }
  ],
  "events": [
    {
      "name": "Event name",
      "type": "Festival/Market/Concert/Community/Art/Food/etc",
      "description": "Brief description",
      "timing": "When it typically occurs (e.g. Every summer, Monthly, Annual in June)"
    }
  ],
  "safetyTips": ["tip 1", "tip 2", "tip 3"],
  "localInsights": ["insight 1", "insight 2", "insight 3"]
}

Include 4-6 businesses, 2-3 neighborhoods, 3-4 events, 3-4 safety tips, and 3-4 local insights. Focus on authentic Black-owned establishments and culturally significant spots. Safety tips should be practical and community-focused.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant for the Black community. Always respond with valid JSON only, no markdown fences or extra text.",
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
