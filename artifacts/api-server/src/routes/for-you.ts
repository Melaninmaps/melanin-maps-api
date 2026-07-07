import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.get("/ai/for-you", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [savedResult, prefResult, postsResult] = await Promise.all([
      pool.query<{ category: string; name: string }>(
        `SELECT b.category, b.name FROM saved_places sp
         JOIN businesses b ON b.id = sp.business_id
         WHERE sp.user_id = $1 ORDER BY sp.created_at DESC LIMIT 12`,
        [userId]
      ),
      pool.query<{ lifestyle_services: string[] | null; favorite_cities: string[] | null; trip_style: string | null }>(
        `SELECT lifestyle_services, favorite_cities, trip_style FROM user_preferences WHERE user_id = $1 LIMIT 1`,
        [userId]
      ),
      pool.query<{ topic_tag: string | null }>(
        `SELECT DISTINCT topic_tag FROM community_posts WHERE author_id = $1 AND topic_tag IS NOT NULL LIMIT 8`,
        [userId]
      ),
    ]);

    const savedCategories = [...new Set(savedResult.rows.map((r) => r.category))].slice(0, 6);
    const savedNames = savedResult.rows.map((r) => r.name).slice(0, 6);
    const prefs = prefResult.rows[0] ?? {};
    const engagedTopics = postsResult.rows.map((r) => r.topic_tag).filter(Boolean).slice(0, 5);

    const contextLines: string[] = [];
    if (savedCategories.length) contextLines.push(`Saved business categories: ${savedCategories.join(", ")}`);
    if (savedNames.length) contextLines.push(`Recently saved: ${savedNames.join(", ")}`);
    if (prefs.lifestyle_services?.length) contextLines.push(`Lifestyle interests: ${(prefs.lifestyle_services as string[]).join(", ")}`);
    if (prefs.favorite_cities?.length) contextLines.push(`Cities of interest: ${(prefs.favorite_cities as string[]).join(", ")}`);
    if (prefs.trip_style) contextLines.push(`Travel style: ${prefs.trip_style}`);
    if (engagedTopics.length) contextLines.push(`Topics engaged with: ${engagedTopics.join(", ")}`);

    if (!contextLines.length) {
      res.json({ suggestions: [] }); return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are KinfolkAI, the intelligence layer of Mapping With Melanin — a Black community discovery platform. Based on a user's behavior and interests, generate 3 short, personalized proactive suggestions that feel like a knowledgeable friend anticipating their needs. Each suggestion should feel timely and specific — not generic.

Return a JSON array of exactly 3 objects with: { "icon": "<emoji>", "title": "<10 words max>", "insight": "<2 sentences max, specific and actionable>", "category": "<one of: discover|safety|culture|travel|community>" }.

Tone: warm, culturally fluent, direct. Do not say "Based on your data." Write as if you already know them.`,
        },
        {
          role: "user",
          content: `User context:\n${contextLines.join("\n")}\n\nGenerate 3 proactive suggestions for this user.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { suggestions?: unknown[] } = {};
    try { parsed = JSON.parse(raw) as { suggestions?: unknown[] }; } catch { parsed = {}; }

    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [];
    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "GET /ai/for-you error");
    res.json({ suggestions: [] });
  }
});

export default router;
