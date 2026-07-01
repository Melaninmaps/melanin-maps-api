import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getUserTier } from "../middleware/requireMembership";

const router: IRouter = Router();

const TOPIC_PROFILES: Record<string, { label: string; domains: string; journalHint?: string }> = {
  "health & wellness": {
    label: "Health & Wellness",
    domains: "general health, nutrition, fitness, preventive care, holistic wellness",
    journalHint: "JAMA, New England Journal of Medicine, The Lancet, Black Women's Health Imperative research",
  },
  "mental health": {
    label: "Mental Health",
    domains: "mental well-being, therapy, self-care, community healing, generational trauma, joy",
    journalHint: "American Journal of Psychiatry, Journal of Black Psychology, Mental Health America findings",
  },
  "relationships & dating": {
    label: "Relationships & Dating",
    domains: "romantic relationships, friendships, family dynamics, communication, boundaries",
  },
  "finances & wealth": {
    label: "Finances & Wealth",
    domains: "personal finance, wealth building, investing, homeownership, Black wealth gap, economic empowerment",
    journalHint: "Federal Reserve economic studies, Urban Institute research, Brookings Institution data",
  },
  "pop culture": {
    label: "Pop Culture",
    domains: "celebrity news, music, film, TV, social media trends, viral moments, entertainment industry",
    journalHint: "include relevant celebrity and entertainment news; TMZ, Variety, Billboard, The Root, Shadow and Act are valid sources for this topic",
  },
  "travel": {
    label: "Travel",
    domains: "domestic and international travel, Black travel safety, hidden gems, melanated traveler experiences, visa tips",
  },
  "food & dining": {
    label: "Food & Dining",
    domains: "Black-owned restaurants, soul food, African cuisine, Caribbean food, health-conscious eating, food culture",
  },
  "fashion & beauty": {
    label: "Fashion & Beauty",
    domains: "Black fashion designers, natural hair, skincare for melanated skin, cultural style, beauty industry",
  },
  "black history & culture": {
    label: "Black History & Culture",
    domains: "African American history, diaspora culture, Black excellence, cultural preservation, Afrocentrism",
  },
  "parenting & family": {
    label: "Parenting & Family",
    domains: "Black parenting, raising children in multicultural households, family wellness, education equity",
  },
  "spirituality": {
    label: "Spirituality",
    domains: "faith, spiritual practices, ancestral connections, religious diversity, inner peace, community worship",
  },
  "career & business": {
    label: "Career & Business",
    domains: "professional growth, Black entrepreneurship, workplace culture, side hustles, mentorship, corporate navigation",
  },
  "community justice": {
    label: "Community Justice",
    domains: "social justice, civil rights, policy, criminal justice reform, advocacy, community organizing",
    journalHint: "ACLU reports, Stanford Social Innovation Review, Movement for Black Lives research",
  },
  "entertainment": {
    label: "Entertainment",
    domains: "movies, TV shows, music releases, streaming, live events, Black creatives",
  },
};

function getTopicProfile(topicRaw: string) {
  const key = topicRaw.toLowerCase().trim();
  return TOPIC_PROFILES[key] ?? { label: topicRaw, domains: topicRaw };
}

function buildPrompt(topic: string, tier: string): { system: string; user: string } {
  const profile = getTopicProfile(topic);

  const communityContext = `You serve the Mapping With Melanin community — a platform for melanated travelers, Black-owned business supporters, and the broader Black diaspora. Tailor all insights to be culturally relevant and empowering for this audience. Never be condescending or preachy.`;

  const sourceGuidance = profile.journalHint
    ? `Where relevant, reference or draw from sources like: ${profile.journalHint}.`
    : `Draw from reputable general news outlets, academic research, and community-trusted voices.`;

  if (tier === "free") {
    return {
      system: `You are a helpful community information assistant. ${communityContext}`,
      user: `Provide a brief, helpful 2–3 paragraph overview of "${profile.label}" for our community. Cover: what's important to know right now, one or two key takeaways, and a closing encouragement. Keep it warm and accessible. ${sourceGuidance} Format as plain paragraphs — no markdown headers.`,
    };
  }

  if (tier === "navigator") {
    return {
      system: `You are a knowledgeable community resource guide with broad expertise. ${communityContext}`,
      user: `Provide a comprehensive overview of "${profile.label}" covering:
1. Current landscape / what's happening now (3–4 sentences)
2. 4–5 key facts, findings, or developments the community should know
3. What the research or credible reporting says (cite source names/types where possible)
4. Practical takeaways or actions our community can take
5. A closing perspective on why this matters for melanated communities

Tone: informed, culturally aware, empowering. ${sourceGuidance}`,
    };
  }

  // trailblazer — deepest tier
  return {
    system: `You are an expert research analyst and cultural commentator with deep knowledge across health, social sciences, entertainment, finance, and culture. ${communityContext}`,
    user: `Provide a comprehensive, research-backed deep-dive on "${profile.label}" for our community. Include:

**Current Landscape**
Summarize what's happening right now across this topic space (recent news, research trends, cultural moments).

**Key Research & Data**
Cite specific studies, statistics, or findings from credible sources (name the publication/institution). ${sourceGuidance}

**Disparities & Community-Specific Context**
Address any specific disparities, advantages, or dimensions uniquely relevant to melanated communities and the Black diaspora.

**Expert Voices**
Name 2–3 experts, researchers, organizations, or credible voices in this space worth following.

**Actionable Insights**
5 specific, practical steps or resources community members can use right now.

**Bottom Line**
One powerful closing paragraph — why this matters and what the community's power looks like in this space.

Format with bold section headers as shown above. Be thorough, specific, and cite real names/institutions wherever possible.`,
  };
}

// GET /topic-brief/:topic — AI-powered topic information, tier-gated depth
router.get("/topic-brief/:topic", async (req: Request, res: Response) => {
  try {
    if (!openai) {
      res.status(503).json({ error: "AI service unavailable" });
      return;
    }

    const topic = decodeURIComponent(String(req.params.topic)).trim();
    if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

    const tier = req.user?.id ? await getUserTier(req.user.id) : "free";
    const { system, user } = buildPrompt(topic, tier);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: tier === "trailblazer" ? 1200 : tier === "navigator" ? 700 : 350,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const profile = getTopicProfile(topic);

    res.json({
      topic,
      topicLabel: profile.label,
      tier,
      content,
      sourceNote: profile.journalHint ?? null,
      upgradeNote: tier === "free"
        ? "Upgrade to Explorer+ for in-depth research, key findings, and named source references."
        : tier === "navigator"
          ? "Upgrade to Trailblazer for a full research deep-dive with expert voices and actionable steps."
          : null,
    });
  } catch (err) {
    (req as any).log?.error({ err }, "GET /topic-brief error");
    res.status(500).json({ error: "Failed to generate topic brief" });
  }
});

export default router;
