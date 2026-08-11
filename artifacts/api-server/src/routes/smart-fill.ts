import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// ─── POST /api/businesses/smart-fill ──────────────────────────────────────────
// KinfolkAI auto-fills business listing fields from just a name + city
router.post("/businesses/smart-fill", async (req: Request, res: Response) => {
  const { name, city } = req.body as { name?: string; city?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are KinfolkAI helping Black business owners list their businesses on Mapping With Melanin — a community discovery platform celebrating Black culture. Generate accurate, welcoming listing details.

Return ONLY valid JSON with this exact structure (no extra text):
{
  "description": string (2-3 warm, specific sentences about what the business does and its community value),
  "category": string (exactly one of: "Food & Drink" | "Beauty & Grooming" | "Retail & Shopping" | "Health & Wellness" | "Professional Services" | "Arts & Culture" | "Entertainment" | "Education" | "Real Estate" | "Tech & Digital" | "Travel & Accommodation" | "Automotive"),
  "subcategory": string (specific type, e.g. "Restaurant", "Barbershop", "Bookstore"),
  "priceRange": string (exactly one of: "$" | "$$" | "$$$" | "$$$$"),
  "hours": string (typical hours like "Mon–Fri 9am–6pm, Sat 10am–4pm" or "Open daily 11am–10pm"),
  "tags": string[] (4-6 descriptive tags, e.g. ["family-owned", "community-focused", "walk-ins-welcome"]),
  "vibes": string[] (2-3 atmosphere descriptors, e.g. ["welcoming", "professional", "creative"])
}`,
        },
        {
          role: "user",
          content: `Business name: "${name.trim()}"${city?.trim() ? ` in ${city.trim()}` : ""}. Generate friendly, accurate listing details.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let fields: unknown;
    try {
      fields = JSON.parse(raw);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json({ fields });
  } catch (err) {
    req.log.error({ err }, "smart-fill error");
    res.status(500).json({ error: "Failed to generate listing details" });
  }
});

export default router;
