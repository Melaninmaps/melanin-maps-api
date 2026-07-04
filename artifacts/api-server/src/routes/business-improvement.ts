import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, usersTable, businessesTable, businessImprovementPlansTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// ─── Ownership preference → DB designation mapping ───────────────────────────
const PREF_TO_DESIGNATIONS: Record<string, string[]> = {
  "black-owned": ["Black-Owned", "African American-Owned"],
  "women-owned": ["Women-Owned", "Woman-Owned", "Female-Owned"],
  "veteran-owned": ["Veteran-Owned", "Military-Owned"],
  "lgbtq-owned": ["LGBTQ+-Owned", "LGBTQ-Owned"],
  "immigrant-owned": ["Immigrant-Owned"],
  "disability-owned": ["Disability-Owned", "Disabled-Owned"],
  "minority-owned": ["Black-Owned", "Hispanic-Owned", "Latinx-Owned", "Women-Owned", "LGBTQ+-Owned", "Immigrant-Owned", "Veteran-Owned"],
};

// ─── Service type → category keyword mapping ─────────────────────────────────
const SERVICE_TO_KEYWORDS: Record<string, string[]> = {
  "General Contractor": ["construction", "contractor", "general contractor", "renovation", "remodel", "builder"],
  "Architect / Designer": ["architecture", "architect", "design", "designer"],
  "Accessibility Consultant": ["accessibility", "consultant", "consulting", "disability"],
  "ADA Compliance Specialist": ["compliance", "ada", "legal", "consultant", "accessibility"],
  "Software / Technology Vendor": ["technology", "software", "tech", "it services", "digital", "app"],
  "Marketing Agency": ["marketing", "advertising", "pr", "social media", "media", "branding", "creative"],
  "Accountant / Financial Advisor": ["accounting", "accountant", "financial", "tax", "bookkeeping", "finance", "cpa"],
  "Grant Writer": ["grant", "nonprofit", "consulting", "business services"],
  "Small Business Lender": ["lending", "loan", "banking", "financial", "credit union", "cdfi"],
  "HR / Staffing Agency": ["staffing", "hr", "human resources", "employment", "recruiting", "temp"],
  "Translator / Language Services": ["translation", "language", "interpretation", "bilingual"],
  "Equipment Supplier": ["equipment", "supply", "wholesale", "distributor", "supplier"],
  "Interior Designer": ["interior design", "interior", "decor", "furnishing", "design"],
  "Other": [],
};

interface Provider {
  id: string;
  name: string;
  category: string;
  ownershipLabel: string;
  isPreferenceMatch: boolean;
  description: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  verified: boolean;
  expandNote?: string;
}

interface ImprovementPlan {
  summary: string;
  providers: Provider[];
  expandedProviders: Provider[];
  roadmap: Array<{ phase: number; title: string; description: string; estimatedCost: string; estimatedTime: string; serviceType: string }>;
  grantOpportunities: Array<{ name: string; amount: string; description: string; eligibility: string }>;
  totalEstimateRange: string;
  nextSteps: string[];
  legalNote: string;
}

// ─── POST /api/business-improvement ──────────────────────────────────────────
router.post("/business-improvement", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    businessId, businessName, businessCategory, businessCity,
    issueType, issueDescription, ownershipPreferences = [], serviceTypes = [], budget, timeline,
  } = req.body as {
    businessId: string;
    businessName: string;
    businessCategory: string;
    businessCity: string;
    issueType: string;
    issueDescription?: string;
    ownershipPreferences: string[];
    serviceTypes: string[];
    budget: string;
    timeline: string;
  };

  if (!businessId || !issueType || !serviceTypes.length) {
    res.status(400).json({ error: "businessId, issueType, and serviceTypes are required" });
    return;
  }

  try {
    // ── Find providers matching service types ────────────────────────────────
    const keywords: string[] = serviceTypes.flatMap((st) => SERVICE_TO_KEYWORDS[st] ?? []);
    const keywordConditions = keywords.length > 0
      ? keywords.map((_, i) => `LOWER(b.category) LIKE $${i + 2}`).join(" OR ")
      : "1=1";

    const findProviders = async (ownershipFilter: string, extraCondition: string = "") => {
      const params: unknown[] = [businessCity.toLowerCase()];
      if (keywords.length > 0) params.push(...keywords.map((k) => `%${k}%`));

      const sql = `
        SELECT b.id, b.name, b.category, b.description, b.city, b.state,
               b.phone, b.website, b.verified, b.black_owned,
               b.ownership_designations
        FROM businesses b
        WHERE b.status = 'active'
          AND (
            LOWER(b.city) = $1
            OR LOWER(b.state) = $1
          )
          AND (${keywordConditions})
          ${ownershipFilter}
          ${extraCondition}
        ORDER BY b.verified DESC, b.confidence_score DESC
        LIMIT 12
      `;
      return pool.query(sql, params);
    };

    // Determine ownership SQL condition
    const prefs = ownershipPreferences.filter((p) => p !== "no-preference" && p !== "local-only");
    const noPreference = ownershipPreferences.includes("no-preference") || ownershipPreferences.length === 0;
    const localOnly = ownershipPreferences.includes("local-only");

    let ownershipSql = "";
    if (!noPreference && prefs.length > 0) {
      const allDesignations = [...new Set(prefs.flatMap((p) => PREF_TO_DESIGNATIONS[p] ?? []))];
      if (allDesignations.length > 0) {
        const desigConditions = allDesignations
          .map((d) => `b.ownership_designations::text ILIKE '%${d.replace(/'/g, "''")}%'`)
          .join(" OR ");
        ownershipSql = `AND (b.black_owned = true OR (${desigConditions}))`;
      }
    }

    const localSql = localOnly ? `AND LOWER(b.city) = '${businessCity.toLowerCase().replace(/'/g, "''")}'` : "";

    // First pass: exact preference matches
    const exactResult = await findProviders(ownershipSql, localSql);
    const exactRows = exactResult.rows as Array<Record<string, unknown>>;

    // If not enough exact matches, expand to all minority-owned
    let expandedRows: Array<Record<string, unknown>> = [];
    if (!noPreference && exactRows.length < 3) {
      const minDesigs = PREF_TO_DESIGNATIONS["minority-owned"].map(
        (d) => `b.ownership_designations::text ILIKE '%${d.replace(/'/g, "''")}%'`
      ).join(" OR ");
      const expandResult = await findProviders(
        `AND (b.black_owned = true OR (${minDesigs}))`,
        localSql,
      );
      expandedRows = (expandResult.rows as Array<Record<string, unknown>>)
        .filter((r) => !exactRows.some((e) => e.id === r.id))
        .slice(0, 6);
    }

    const toProvider = (row: Record<string, unknown>, isMatch: boolean): Provider => {
      const designations = (row.ownership_designations as string[] | null) ?? [];
      const ownershipLabel = row.black_owned
        ? "Black-Owned"
        : designations[0] ?? "Minority-Owned";
      return {
        id: row.id as string,
        name: row.name as string,
        category: row.category as string,
        ownershipLabel,
        isPreferenceMatch: isMatch,
        description: (row.description as string | null)?.slice(0, 200) ?? "",
        city: row.city as string,
        state: row.state as string,
        phone: row.phone as string | null,
        website: row.website as string | null,
        verified: row.verified as boolean,
      };
    };

    const preferenceProviders = exactRows.map((r) => toProvider(r, true));
    const expandedProviders = expandedRows.map((r) => {
      const p = toProvider(r, false);
      const designations = (r.ownership_designations as string[] | null) ?? [];
      const label = r.black_owned ? "Black-Owned" : designations[0] ?? "Minority-Owned";
      p.expandNote = `We expanded the search — ${p.name} is ${label} and comes highly recommended`;
      return p;
    });

    // ── Build OpenAI prompt ──────────────────────────────────────────────────
    const providerContext = [
      ...preferenceProviders.slice(0, 4).map((p) =>
        `• ${p.name} | ${p.category} | ${p.ownershipLabel}${p.verified ? " ✓" : ""} | ${p.city}, ${p.state}`,
      ),
      ...expandedProviders.slice(0, 3).map((p) =>
        `• ${p.name} | ${p.category} | ${p.ownershipLabel} (expanded) | ${p.city}, ${p.state}`,
      ),
    ].join("\n") || "No platform providers found — generate general guidance";

    const ownershipContext = noPreference
      ? "No ownership preference stated — recommend any qualified providers"
      : `Owner's stated preferences (opt-in, positive sourcing): ${ownershipPreferences.join(", ")}`;

    const prompt = `You are KinfolkAI™ — a business advisor helping a minority-owned business owner improve their business. Generate a comprehensive, actionable Business Improvement Plan.

BUSINESS CONTEXT:
Business: ${businessName}
Category: ${businessCategory}
City: ${businessCity}
Issue to address: ${issueType}${issueDescription ? `\nDescription: ${issueDescription}` : ""}
Budget: ${budget}
Timeline: ${timeline}
Service types needed: ${serviceTypes.join(", ")}
${ownershipContext}

PROVIDERS FOUND ON MAPPING WITH MELANIN™ PLATFORM:
${providerContext}

Generate a JSON response with this exact structure:
{
  "summary": "2-3 sentence warm, encouraging summary of what you'll help them accomplish and why it matters for their business and community",
  "roadmap": [
    {
      "phase": 1,
      "title": "Phase title",
      "description": "What to do in this phase",
      "estimatedCost": "cost range",
      "estimatedTime": "time estimate",
      "serviceType": "who to hire for this phase"
    }
  ],
  "grantOpportunities": [
    {
      "name": "Grant or program name",
      "amount": "funding range",
      "description": "Brief description",
      "eligibility": "Who qualifies"
    }
  ],
  "totalEstimateRange": "overall cost range for the full project",
  "nextSteps": ["3-5 immediate action items the owner should take this week"],
  "legalNote": "Brief note explaining that ownership preferences are positive sourcing preferences, not exclusive requirements, and that the search will expand if needed"
}

Include 2-4 roadmap phases, 2-3 grant opportunities (real programs when possible — SBA grants, CDFI programs, local programs), 3-5 next steps.
Make the summary warm, specific to their situation, and affirming of their mission. Keep the tone of KinfolkAI — a trusted friend who's been there.
IMPORTANT: Return ONLY valid JSON, no markdown, no extra text.`;

    let planData: Omit<ImprovementPlan, "providers" | "expandedProviders">;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      planData = JSON.parse(completion.choices[0].message.content ?? "{}") as typeof planData;
    } catch {
      planData = {
        summary: `We're pulling together a plan to help ${businessName} address ${issueType}. Based on your preferences, we've identified providers who can help.`,
        roadmap: [
          { phase: 1, title: "Assessment", description: "Get professional assessments and quotes from providers", estimatedCost: "Free – $500", estimatedTime: "1–2 weeks", serviceType: serviceTypes[0] ?? "Consultant" },
          { phase: 2, title: "Planning & Permits", description: "Finalize design, obtain necessary permits, secure funding", estimatedCost: "5–15% of project", estimatedTime: "2–6 weeks", serviceType: "General Contractor" },
          { phase: 3, title: "Implementation", description: "Execute the improvement with your chosen providers", estimatedCost: budget, estimatedTime: timeline, serviceType: serviceTypes.join(", ") },
        ],
        grantOpportunities: [
          { name: "SBA Community Advantage", amount: "Up to $250,000", description: "Loans for businesses in underserved communities", eligibility: "Small businesses in low-to-moderate income areas" },
          { name: "CDFI Fund Programs", amount: "Varies", description: "Community Development Financial Institution programs", eligibility: "Minority-owned small businesses" },
        ],
        totalEstimateRange: budget,
        nextSteps: ["Request quotes from at least 3 providers", "Check with your local SBDC for free consulting", "Apply for any relevant grants before starting work", "Document existing conditions with photos"],
        legalNote: "Your ownership preferences are positive sourcing preferences, not exclusive requirements. If we can't find enough exact matches in your area, we'll expand the search to include other qualified minority-owned businesses.",
      };
    }

    const fullPlan: ImprovementPlan = {
      ...planData,
      providers: preferenceProviders,
      expandedProviders,
    };

    // Store in DB
    try {
      await db.insert(businessImprovementPlansTable).values({
        businessId,
        userId: req.user.id,
        issueType,
        issueDescription: issueDescription ?? null,
        ownershipPreferences,
        serviceTypes,
        budget: budget ?? null,
        timeline: timeline ?? null,
        planData: fullPlan,
      });
    } catch { /* non-critical */ }

    res.json(fullPlan);
  } catch (err) {
    req.log.error({ err }, "Failed to generate business improvement plan");
    res.status(500).json({ error: "Failed to generate improvement plan" });
  }
});

// ─── GET /api/business-improvement/:businessId ────────────────────────────────
router.get("/business-improvement/:businessId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const plans = await db
      .select()
      .from(businessImprovementPlansTable)
      .where(eq(businessImprovementPlansTable.businessId, String(req.params.businessId)))
      .orderBy(desc(businessImprovementPlansTable.createdAt))
      .limit(5);
    res.json({ plans });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch improvement plans");
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

export default router;
