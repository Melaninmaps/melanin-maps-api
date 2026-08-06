import { Router, type IRouter, type Request, type Response } from "express";
import { db, roadmapsTable, roadmapStepsTable } from "@workspace/db";
import { and, eq, desc, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

type StepDraft = {
  category: string;
  categoryEmoji: string;
  title: string;
  description: string;
  priority?: string;
  externalUrl?: string;
  externalLabel?: string;
};

// ─── POST /api/roadmaps/generate ──────────────────────────────────────────────
router.post("/roadmaps/generate", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { topicName, topicId, intent } = req.body as {
    topicName: string;
    topicId?: string;
    intent?: string;
  };
  if (!topicName) { res.status(400).json({ error: "topicName required" }); return; }

  if (!openai) { res.status(503).json({ error: "AI unavailable" }); return; }

  try {
    const intentLabel = intent ?? "general";
    const prompt = `You are building a practical action roadmap for a Black community discovery app.

The user wants a roadmap for: "${topicName}" with intent: "${intentLabel}"

Generate a comprehensive checklist of steps organized by category. Each step should be specific, actionable, and culturally relevant where possible.

Return ONLY valid JSON in this exact format:
{
  "title": "Short roadmap title (e.g. 'Moving to Brazil Roadmap' or 'Type 2 Diabetes Management Plan')",
  "description": "One sentence overview",
  "coverEmoji": "Single emoji",
  "steps": [
    {
      "category": "Category name",
      "categoryEmoji": "Single emoji",
      "title": "Step title",
      "description": "What to do and why it matters",
      "priority": "high|normal|low",
      "externalUrl": "https://... or null",
      "externalLabel": "Link label or null"
    }
  ]
}

Guidelines:
- 15-25 steps total across 4-7 categories
- For travel: Documents, Health, Money, Logistics, Culture, Safety, Community
- For health conditions: Understanding, Medical Team, Lifestyle, Monitoring, Support, Resources
- For relocation: Documents, Housing, Healthcare, Schools, Community, Logistics, Finances
- For business: Research, Legal, Finances, Marketing, Operations, Community
- Prioritize "high" for time-sensitive or legally required steps
- Include culturally relevant resources when possible (minority-owned, HBCU, NAACP, etc.)`;

    const aiResult = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = aiResult.choices[0]?.message?.content;
    if (!content) { res.status(500).json({ error: "AI returned empty response" }); return; }

    const parsed = JSON.parse(content) as {
      title: string;
      description: string;
      coverEmoji: string;
      steps: StepDraft[];
    };

    const [roadmap] = await db
      .insert(roadmapsTable)
      .values({
        userId,
        title: parsed.title,
        description: parsed.description,
        coverEmoji: parsed.coverEmoji ?? "🗺️",
        topicId: topicId ?? null,
        topicName,
        intent: intentLabel,
        totalSteps: parsed.steps.length,
        completedSteps: 0,
      })
      .returning();

    if (parsed.steps?.length) {
      await db.insert(roadmapStepsTable).values(
        parsed.steps.map((step: StepDraft, i: number) => ({
          roadmapId: roadmap.id,
          category: step.category,
          categoryEmoji: step.categoryEmoji ?? "📋",
          title: step.title,
          description: step.description,
          displayOrder: i,
          priority: step.priority ?? "normal",
          externalUrl: step.externalUrl ?? null,
          externalLabel: step.externalLabel ?? null,
        }))
      );
    }

    const steps = await db
      .select()
      .from(roadmapStepsTable)
      .where(eq(roadmapStepsTable.roadmapId, roadmap.id))
      .orderBy(asc(roadmapStepsTable.displayOrder));

    res.status(201).json({ roadmap, steps });
  } catch (err) {
    req.log.error({ err }, "generate roadmap error");
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

// ─── GET /api/roadmaps ────────────────────────────────────────────────────────
router.get("/roadmaps", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const roadmaps = await db
      .select()
      .from(roadmapsTable)
      .where(eq(roadmapsTable.userId, userId))
      .orderBy(desc(roadmapsTable.updatedAt));

    res.json({ roadmaps });
  } catch (err) {
    req.log.error({ err }, "get roadmaps error");
    res.status(500).json({ error: "Failed to load roadmaps" });
  }
});

// ─── GET /api/roadmaps/:id ────────────────────────────────────────────────────
router.get("/roadmaps/:id", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  try {
    const [roadmap] = await db
      .select()
      .from(roadmapsTable)
      .where(and(eq(roadmapsTable.id, id), eq(roadmapsTable.userId, userId)))
      .limit(1);
    if (!roadmap) { res.status(404).json({ error: "Roadmap not found" }); return; }

    const steps = await db
      .select()
      .from(roadmapStepsTable)
      .where(eq(roadmapStepsTable.roadmapId, id))
      .orderBy(asc(roadmapStepsTable.displayOrder));

    res.json({ roadmap, steps });
  } catch (err) {
    req.log.error({ err }, "get roadmap error");
    res.status(500).json({ error: "Failed to load roadmap" });
  }
});

// ─── PUT /api/roadmaps/:id/steps/:stepId/toggle ───────────────────────────────
router.put("/roadmaps/:id/steps/:stepId/toggle", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const stepId = String(req.params.stepId);
  try {
    const [roadmap] = await db
      .select({ userId: roadmapsTable.userId, completedSteps: roadmapsTable.completedSteps, totalSteps: roadmapsTable.totalSteps })
      .from(roadmapsTable)
      .where(and(eq(roadmapsTable.id, id), eq(roadmapsTable.userId, userId)))
      .limit(1);
    if (!roadmap) { res.status(403).json({ error: "Not your roadmap" }); return; }

    const [step] = await db
      .select({ isComplete: roadmapStepsTable.isComplete })
      .from(roadmapStepsTable)
      .where(and(eq(roadmapStepsTable.id, stepId), eq(roadmapStepsTable.roadmapId, id)))
      .limit(1);
    if (!step) { res.status(404).json({ error: "Step not found" }); return; }

    const newComplete = !step.isComplete;
    await db.update(roadmapStepsTable).set({
      isComplete: newComplete,
      completedAt: newComplete ? new Date() : null,
    }).where(eq(roadmapStepsTable.id, stepId));

    const delta = newComplete ? 1 : -1;
    const newCount = Math.max(0, Math.min(roadmap.totalSteps, roadmap.completedSteps + delta));
    await db.update(roadmapsTable).set({ completedSteps: newCount, updatedAt: new Date() }).where(eq(roadmapsTable.id, id));

    res.json({ isComplete: newComplete, completedSteps: newCount });
  } catch (err) {
    req.log.error({ err }, "toggle step error");
    res.status(500).json({ error: "Failed to update step" });
  }
});

export default router;
