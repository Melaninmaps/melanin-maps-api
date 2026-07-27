import { Router, type IRouter, type Request, type Response } from "express";
import { db, resourcesTable, resourceOpportunitiesTable, resourceAlertsTable } from "@workspace/db";
import { eq, and, or, ilike, sql, desc, inArray } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  return !!(user?.email && ADMIN_EMAILS.includes(user.email));
}

// ── Curated source list ───────────────────────────────────────────────────────

const CURATED_SOURCES = [
  // Essential Support
  { title: "211", description: "Connects people with local resources for food, housing, utilities, transportation, mental health, and emergency services.", category: "essential_support" as const, subcategory: "multi-service", sourceTier: "official" as const, organization: "211.org", url: "https://www.211.org", isNational: true, keywords: ["food", "housing", "utilities", "transportation", "mental health", "emergency"] },
  { title: "USA.gov Benefits Finder", description: "Federal and state benefit programs including food, housing, utilities, health care, unemployment, and more.", category: "essential_support" as const, subcategory: "government benefits", sourceTier: "official" as const, organization: "USA.gov", url: "https://www.usa.gov/benefit-finder", isNational: true, keywords: ["benefits", "government", "food", "housing", "utilities", "health"] },
  { title: "Benefits.gov", description: "Official U.S. government website for finding federal assistance programs.", category: "essential_support" as const, subcategory: "government benefits", sourceTier: "official" as const, organization: "Benefits.gov", url: "https://www.benefits.gov", isNational: true, keywords: ["benefits", "government", "assistance", "programs"] },
  { title: "Feeding America Food Bank Locator", description: "Find your local food bank and get access to food pantries and meal programs near you.", category: "essential_support" as const, subcategory: "food assistance", sourceTier: "verified_org" as const, organization: "Feeding America", url: "https://www.feedingamerica.org/find-your-local-foodbank", isNational: true, keywords: ["food", "food bank", "pantry", "meals", "hunger"] },
  { title: "FEMA Disaster Assistance", description: "Disaster recovery resources, emergency housing and financial assistance after disasters.", category: "essential_support" as const, subcategory: "disaster recovery", sourceTier: "official" as const, organization: "FEMA", url: "https://www.fema.gov", isNational: true, keywords: ["disaster", "emergency", "flood", "hurricane", "fire", "recovery"] },

  // Education
  { title: "Federal Student Aid (FAFSA)", description: "Apply for federal student aid including grants, loans, and work-study funding for college and career school.", category: "education" as const, subcategory: "financial aid", sourceTier: "official" as const, organization: "Federal Student Aid", url: "https://studentaid.gov", isNational: true, keywords: ["FAFSA", "grants", "loans", "scholarships", "college", "financial aid"] },
  { title: "Grants.gov", description: "Official source for federal grant opportunities across education, research, arts, and community development.", category: "education" as const, subcategory: "grants", sourceTier: "official" as const, organization: "Grants.gov", url: "https://www.grants.gov", isNational: true, keywords: ["grants", "federal", "funding", "research", "education"] },
  { title: "UNCF Scholarships", description: "Scholarships and programs for Black and minority college students, including HBCU support.", category: "education" as const, subcategory: "scholarships", sourceTier: "verified_org" as const, organization: "UNCF", url: "https://uncf.org", isNational: true, keywords: ["scholarship", "HBCU", "Black students", "college", "minority"] },
  { title: "Thurgood Marshall College Fund", description: "Scholarships, internships, and career development programs for students at HBCUs and PBIs.", category: "education" as const, subcategory: "scholarships", sourceTier: "verified_org" as const, organization: "Thurgood Marshall College Fund", url: "https://www.tmcf.org", isNational: true, keywords: ["scholarship", "HBCU", "PBI", "internship", "Black college"] },
  { title: "Scholarships.com", description: "Search thousands of scholarships by major, background, state, and deadline.", category: "education" as const, subcategory: "scholarships", sourceTier: "verified_org" as const, organization: "Scholarships.com", url: "https://www.scholarships.com", isNational: true, keywords: ["scholarship", "college", "financial aid", "search"] },
  { title: "Fastweb Scholarship Search", description: "Free scholarship matching service with millions of dollars in scholarships for all education levels.", category: "education" as const, subcategory: "scholarships", sourceTier: "verified_org" as const, organization: "Fastweb", url: "https://www.fastweb.com", isNational: true, keywords: ["scholarship", "financial aid", "college", "awards"] },
  { title: "College Board Scholarship Search", description: "Search scholarships, internships, and other funding opportunities from the College Board.", category: "education" as const, subcategory: "scholarships", sourceTier: "verified_org" as const, organization: "College Board", url: "https://bigfuture.collegeboard.org/scholarship-search", isNational: true, keywords: ["scholarship", "SAT", "college", "financial aid"] },

  // Jobs
  { title: "CareerOneStop", description: "Find jobs, apprenticeships, career centers, and workforce training resources. Powered by the U.S. Department of Labor.", category: "jobs" as const, subcategory: "job search", sourceTier: "official" as const, organization: "CareerOneStop / U.S. DOL", url: "https://www.careeronestop.org", isNational: true, keywords: ["jobs", "careers", "training", "apprenticeship", "workforce"] },
  { title: "USAJOBS", description: "Official source for U.S. federal government job listings, including entry-level and experienced positions.", category: "jobs" as const, subcategory: "government jobs", sourceTier: "official" as const, organization: "USAJOBS", url: "https://www.usajobs.gov", isNational: true, keywords: ["government jobs", "federal", "civil service", "USAJobs"] },
  { title: "GovernmentJobs", description: "State and local government job listings across the country.", category: "jobs" as const, subcategory: "government jobs", sourceTier: "verified_org" as const, organization: "GovernmentJobs.com", url: "https://www.governmentjobs.com", isNational: true, keywords: ["government", "public sector", "state", "local", "city jobs"] },

  // Business
  { title: "Small Business Administration (SBA)", description: "Small-business loans, counseling, certifications, and contracting resources, including support for minority- and women-owned businesses.", category: "business" as const, subcategory: "funding & loans", sourceTier: "official" as const, organization: "SBA", url: "https://www.sba.gov", isNational: true, keywords: ["small business", "loan", "microloan", "SBA", "contracting", "minority business"] },
  { title: "Minority Business Development Agency (MBDA)", description: "Federal programs supporting the growth and competitiveness of minority-owned businesses.", category: "business" as const, subcategory: "minority business", sourceTier: "official" as const, organization: "MBDA", url: "https://www.mbda.gov", isNational: true, keywords: ["minority business", "MBDA", "federal", "business development"] },
  { title: "NMSDC — Minority Business Certification", description: "Minority Business Enterprise (MBE) certification and corporate contracting opportunities.", category: "business" as const, subcategory: "certification", sourceTier: "verified_org" as const, organization: "NMSDC", url: "https://nmsdc.org", isNational: true, keywords: ["MBE", "minority certification", "contracting", "supplier diversity"] },
  { title: "U.S. Black Chambers, Inc.", description: "Business growth, networking, and advocacy resources for Black entrepreneurs and businesses.", category: "business" as const, subcategory: "networking", sourceTier: "verified_org" as const, organization: "U.S. Black Chambers", url: "https://www.usblackchambers.org", isNational: true, keywords: ["Black business", "chamber", "networking", "advocacy", "entrepreneur"] },
  { title: "Association for Enterprise Opportunity (AEO)", description: "Microbusiness support and lending partners helping small businesses access capital and grow.", category: "business" as const, subcategory: "microloans", sourceTier: "verified_org" as const, organization: "AEO Works", url: "https://aeoworks.org", isNational: true, keywords: ["microloan", "small business", "capital", "micro business"] },

  // Housing
  { title: "HUD Housing Resources", description: "Affordable housing, housing counseling, emergency shelters, and homeownership assistance from the U.S. Department of Housing and Urban Development.", category: "housing" as const, subcategory: "affordable housing", sourceTier: "official" as const, organization: "HUD", url: "https://www.hud.gov", isNational: true, keywords: ["housing", "affordable", "shelter", "HUD", "homeownership", "rental assistance"] },
  { title: "HUD Rental Assistance", description: "Housing Choice Voucher (Section 8) and other rental assistance programs.", category: "housing" as const, subcategory: "rental assistance", sourceTier: "official" as const, organization: "HUD", url: "https://www.hud.gov/topics/rental_assistance", isNational: true, keywords: ["Section 8", "voucher", "rental assistance", "affordable housing"] },
  { title: "HUD Find Shelter", description: "Locate shelter, housing, health care, and clothing resources near you.", category: "housing" as const, subcategory: "emergency shelter", sourceTier: "official" as const, organization: "HUD", url: "https://www.hud.gov/findshelter", isNational: true, keywords: ["shelter", "emergency housing", "homeless", "clothing"] },

  // Safety, Rights & Advocacy
  { title: "Legal Services Corporation", description: "Find free or low-cost civil legal aid for housing, employment, family, education, and government benefits.", category: "safety_rights" as const, subcategory: "legal aid", sourceTier: "official" as const, organization: "Legal Services Corporation", url: "https://www.lsc.gov", isNational: true, keywords: ["legal aid", "free lawyer", "civil rights", "tenant rights", "employment"] },
  { title: "SAMHSA — Mental Health & Substance Use", description: "Mental health crisis support, substance use treatment locator, and community resources.", category: "safety_rights" as const, subcategory: "mental health", sourceTier: "official" as const, organization: "SAMHSA", url: "https://www.samhsa.gov", isNational: true, keywords: ["mental health", "crisis", "substance use", "counseling", "hotline"] },
  { title: "HRSA Find a Health Center", description: "Find federally qualified health centers for free or low-cost medical and dental care.", category: "safety_rights" as const, subcategory: "health care", sourceTier: "official" as const, organization: "HRSA", url: "https://findahealthcenter.hrsa.gov", isNational: true, keywords: ["health clinic", "free health care", "dental", "medical", "community health"] },
  { title: "U.S. Department of Veterans Affairs", description: "Benefits, health care, housing, employment, and education resources for veterans and their families.", category: "safety_rights" as const, subcategory: "veterans", sourceTier: "official" as const, organization: "U.S. Department of Veterans Affairs", url: "https://www.va.gov", isNational: true, keywords: ["veteran", "VA", "military", "benefits", "health care"] },
];

// ── GET /resources — browse curated resources ─────────────────────────────────

router.get("/resources", async (req: Request, res: Response) => {
  const { category, city, state, sourceTier, q, limit: limitStr, offset: offsetStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitStr ?? "20", 10), 50);
  const offset = parseInt(offsetStr ?? "0", 10);

  try {
    const conditions = [eq(resourcesTable.isActive, true)];
    if (category) conditions.push(eq(resourcesTable.category, category as any));
    if (sourceTier) conditions.push(eq(resourcesTable.sourceTier, sourceTier as any));
    if (state) conditions.push(or(eq(resourcesTable.isNational, true), ilike(resourcesTable.state, `%${state}%`))!);
    if (city) conditions.push(or(eq(resourcesTable.isNational, true), ilike(resourcesTable.city, `%${city}%`))!);
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(resourcesTable.title, term),
          ilike(resourcesTable.description, term),
          ilike(resourcesTable.organization, term),
          sql`${resourcesTable.keywords}::text ILIKE ${term}`,
        )!,
      );
    }

    const [resources, countRow] = await Promise.all([
      db.select().from(resourcesTable).where(and(...conditions))
        .orderBy(sql`CASE ${resourcesTable.sourceTier} WHEN 'official' THEN 1 WHEN 'verified_org' THEN 2 WHEN 'community_confirmed' THEN 3 ELSE 4 END`, resourcesTable.title)
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(resourcesTable).where(and(...conditions)),
    ]);

    res.json({ resources, total: Number(countRow[0]?.count ?? 0), limit, offset });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch resources");
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// ── GET /resources/:id ────────────────────────────────────────────────────────

router.get("/resources/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!resource) { res.status(404).json({ error: "Resource not found" }); return; }
    res.json({ resource });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch resource");
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

// ── POST /resources/:id/report ────────────────────────────────────────────────

router.post("/resources/:id/report", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db.update(resourcesTable)
      .set({ reportCount: sql`${resourcesTable.reportCount} + 1`, updatedAt: new Date() })
      .where(eq(resourcesTable.id, id));
    res.json({ reported: true });
  } catch (err) {
    req.log.error({ err }, "Failed to report resource");
    res.status(500).json({ error: "Failed to report resource" });
  }
});

// ── GET /resources/opportunities ─────────────────────────────────────────────

router.get("/resources/opportunities", async (req: Request, res: Response) => {
  const { type, city, state, isRemote, isSecondChance, q, limit: limitStr, offset: offsetStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitStr ?? "20", 10), 50);
  const offset = parseInt(offsetStr ?? "0", 10);

  try {
    const conditions = [eq(resourceOpportunitiesTable.status, "active")];
    if (type) conditions.push(eq(resourceOpportunitiesTable.type, type as any));
    if (isRemote === "true") conditions.push(eq(resourceOpportunitiesTable.isRemote, true));
    if (isSecondChance === "true") conditions.push(eq(resourceOpportunitiesTable.isSecondChance, true));
    if (state) conditions.push(ilike(resourceOpportunitiesTable.state, `%${state}%`));
    if (city) conditions.push(ilike(resourceOpportunitiesTable.city, `%${city}%`));
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(resourceOpportunitiesTable.title, term),
          ilike(resourceOpportunitiesTable.description, term),
          ilike(resourceOpportunitiesTable.organization, term),
        )!,
      );
    }

    const [opportunities, countRow] = await Promise.all([
      db.select().from(resourceOpportunitiesTable).where(and(...conditions))
        .orderBy(desc(resourceOpportunitiesTable.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(resourceOpportunitiesTable).where(and(...conditions)),
    ]);

    res.json({ opportunities, total: Number(countRow[0]?.count ?? 0), limit, offset });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch opportunities");
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// ── POST /resources/opportunities ────────────────────────────────────────────

router.post("/resources/opportunities", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    type, title, organization, city, state, zipCode, isRemote, isOnline,
    description, payRange, scheduleType, leaseLength, rent, bedrooms, bathrooms,
    applicationLink, contactMethod, deadline, availableDate, submitterRole,
    isPubliclyPosted, isSecondChance, accessibilityFeatures, benefits, personalNote,
  } = req.body as Record<string, any>;

  if (!type || !title) { res.status(400).json({ error: "type and title are required" }); return; }

  const validTypes = ["job", "housing", "scholarship", "grant", "training", "volunteer", "other"];
  if (!validTypes.includes(type)) { res.status(400).json({ error: "Invalid type" }); return; }

  // Auto-set expiry: jobs 30 days, housing 14 days, everything else 60 days
  const now = new Date();
  const expiryDays = type === "job" ? 30 : type === "housing" ? 14 : 60;
  const expiresAt = deadline ? new Date(deadline) : new Date(now.getTime() + expiryDays * 86_400_000);

  // Source tier: if there's a valid application link, source_confirmed; else community_shared
  const sourceTier = applicationLink && applicationLink.startsWith("http") ? "source_confirmed" : "community_shared";

  try {
    const [inserted] = await db.insert(resourceOpportunitiesTable).values({
      submittedByUserId: req.user.id,
      type,
      title: String(title).trim(),
      organization: organization ? String(organization).trim() : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      zipCode: zipCode ? String(zipCode).trim() : null,
      isRemote: Boolean(isRemote),
      isOnline: Boolean(isOnline),
      description: description ? String(description).trim() : null,
      payRange: payRange ? String(payRange).trim() : null,
      scheduleType: scheduleType ? String(scheduleType).trim() : null,
      leaseLength: leaseLength ? String(leaseLength).trim() : null,
      rent: rent ? String(rent).trim() : null,
      bedrooms: bedrooms ? parseInt(String(bedrooms), 10) : null,
      bathrooms: bathrooms ? String(bathrooms).trim() : null,
      applicationLink: applicationLink ? String(applicationLink).trim() : null,
      contactMethod: contactMethod ? String(contactMethod).trim() : null,
      deadline: deadline ? new Date(deadline) : null,
      availableDate: availableDate ? new Date(availableDate) : null,
      submitterRole: submitterRole ? String(submitterRole).trim() : null,
      isPubliclyPosted: Boolean(isPubliclyPosted),
      isSecondChance: Boolean(isSecondChance),
      accessibilityFeatures: accessibilityFeatures ? String(accessibilityFeatures).trim() : null,
      benefits: benefits ? String(benefits).trim() : null,
      personalNote: personalNote ? String(personalNote).trim() : null,
      sourceTier,
      expiresAt,
    }).returning();

    res.json({ opportunity: inserted });
  } catch (err) {
    req.log.error({ err }, "Failed to submit opportunity");
    res.status(500).json({ error: "Failed to submit opportunity" });
  }
});

// ── PATCH /resources/opportunities/:id/status ─────────────────────────────────

router.patch("/resources/opportunities/:id/status", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  const { status } = req.body as { status: string };
  const validStatuses = ["active", "expired", "filled", "removed"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const [opp] = await db.select({ submittedByUserId: resourceOpportunitiesTable.submittedByUserId })
      .from(resourceOpportunitiesTable).where(eq(resourceOpportunitiesTable.id, id)).limit(1);
    if (!opp) { res.status(404).json({ error: "Not found" }); return; }
    if (opp.submittedByUserId !== req.user.id && !isAdmin(req)) {
      res.status(403).json({ error: "Not authorized" }); return;
    }
    await db.update(resourceOpportunitiesTable)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(resourceOpportunitiesTable.id, id));
    res.json({ updated: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update opportunity status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ── POST /resources/opportunities/:id/report ──────────────────────────────────

router.post("/resources/opportunities/:id/report", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db.update(resourceOpportunitiesTable)
      .set({ reportCount: sql`${resourceOpportunitiesTable.reportCount} + 1`, updatedAt: new Date() })
      .where(eq(resourceOpportunitiesTable.id, id));
    res.json({ reported: true });
  } catch (err) {
    req.log.error({ err }, "Failed to report opportunity");
    res.status(500).json({ error: "Failed to report opportunity" });
  }
});

// ── GET /resources/alerts (user's saved alerts) ───────────────────────────────

router.get("/resources/alerts", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const alerts = await db.select().from(resourceAlertsTable)
      .where(and(eq(resourceAlertsTable.userId, req.user.id), eq(resourceAlertsTable.isActive, true)))
      .orderBy(desc(resourceAlertsTable.createdAt));
    res.json({ alerts });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch alerts");
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// ── POST /resources/alerts ────────────────────────────────────────────────────

router.post("/resources/alerts", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { query, category, keywords, city, state } = req.body as Record<string, any>;
  if (!query && !category) { res.status(400).json({ error: "query or category is required" }); return; }

  try {
    const [alert] = await db.insert(resourceAlertsTable).values({
      userId: req.user.id,
      query: query ? String(query).trim() : null,
      category: category ? String(category).trim() : null,
      keywords: Array.isArray(keywords) ? keywords.map(String) : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
    }).returning();
    res.json({ alert });
  } catch (err) {
    req.log.error({ err }, "Failed to save alert");
    res.status(500).json({ error: "Failed to save alert" });
  }
});

// ── DELETE /resources/alerts/:id ──────────────────────────────────────────────

router.delete("/resources/alerts/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db.update(resourceAlertsTable)
      .set({ isActive: false })
      .where(and(eq(resourceAlertsTable.id, id), eq(resourceAlertsTable.userId, req.user.id)));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete alert");
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

// ── POST /resources/ai-search (KinfolkAI personalized resource roadmap) ───────

router.post("/resources/ai-search", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { query, city, state } = req.body as { query: string; city?: string; state?: string };
  if (!query?.trim()) { res.status(400).json({ error: "query is required" }); return; }

  try {
    // Step 1: Use AI to classify the query into structured search params
    const classifyResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a resource-matching assistant for Mapping with Melanin™, a platform that connects the melanated diaspora with trusted community resources. Extract structured search parameters from the user's natural language query.

Return ONLY valid JSON with these fields:
{
  "categories": ["essential_support"|"education"|"jobs"|"business"|"housing"|"safety_rights"],
  "keywords": ["keyword1", "keyword2"],
  "urgency": "immediate"|"soon"|"planning",
  "isNational": true|false,
  "summary": "One-sentence summary of what the user needs",
  "roadmapIntro": "Warm 1-2 sentence personalized intro for their resource roadmap"
}`,
        },
        {
          role: "user",
          content: `Query: "${query.trim()}"${city ? `\nLocation: ${city}${state ? `, ${state}` : ""}` : ""}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    let parsed: { categories?: string[]; keywords?: string[]; urgency?: string; summary?: string; roadmapIntro?: string } = {};
    try {
      const raw = classifyResponse.choices[0]?.message?.content ?? "{}";
      parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      parsed = { categories: [], keywords: [] };
    }

    const categories = (parsed.categories ?? []).filter((c): c is "essential_support" | "education" | "jobs" | "business" | "housing" | "safety_rights" =>
      ["essential_support", "education", "jobs", "business", "housing", "safety_rights"].includes(c));
    const keywords = parsed.keywords ?? [];

    // Step 2: Query the DB for matching resources
    const dbConditions = [eq(resourcesTable.isActive, true)];
    if (categories.length > 0) {
      dbConditions.push(inArray(resourcesTable.category, categories as any));
    }
    if (keywords.length > 0) {
      const keywordConditions = keywords.slice(0, 5).map((kw) =>
        or(
          ilike(resourcesTable.title, `%${kw}%`),
          ilike(resourcesTable.description, `%${kw}%`),
          sql`${resourcesTable.keywords}::text ILIKE ${`%${kw}%`}`,
        )!,
      );
      dbConditions.push(or(...keywordConditions)!);
    }

    const resources = await db.select().from(resourcesTable)
      .where(and(...dbConditions))
      .orderBy(
        sql`CASE ${resourcesTable.sourceTier} WHEN 'official' THEN 1 WHEN 'verified_org' THEN 2 WHEN 'community_confirmed' THEN 3 ELSE 4 END`,
        resourcesTable.title,
      )
      .limit(12);

    // Step 3: Query opportunities
    const oppConditions = [eq(resourceOpportunitiesTable.status, "active")];
    if (categories.length > 0) {
      const typeMap: Record<string, string[]> = {
        jobs: ["job"],
        housing: ["housing"],
        education: ["scholarship", "grant", "training"],
        business: ["grant", "other"],
        essential_support: ["volunteer"],
        safety_rights: ["other"],
      };
      const oppTypes = categories.flatMap((c) => typeMap[c] ?? []);
      if (oppTypes.length > 0) {
        oppConditions.push(inArray(resourceOpportunitiesTable.type, oppTypes as any));
      }
    }
    const opportunities = await db.select().from(resourceOpportunitiesTable)
      .where(and(...oppConditions))
      .orderBy(desc(resourceOpportunitiesTable.createdAt))
      .limit(5);

    res.json({
      query: query.trim(),
      summary: parsed.summary ?? query.trim(),
      roadmapIntro: parsed.roadmapIntro ?? "Here are resources that may help.",
      categories,
      urgency: parsed.urgency ?? "soon",
      resources,
      opportunities,
      total: resources.length + opportunities.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to run AI resource search");
    res.status(500).json({ error: "Failed to search resources" });
  }
});

// ── POST /resources/admin/seed-curated (admin only) ──────────────────────────

router.post("/resources/admin/seed-curated", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  try {
    const inserted = await db.insert(resourcesTable).values(
      CURATED_SOURCES.map((s) => ({
        ...s,
        lastConfirmedAt: new Date(),
        isActive: true,
      }))
    ).onConflictDoNothing().returning({ id: resourcesTable.id });
    res.json({ seeded: inserted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to seed curated resources");
    res.status(500).json({ error: "Failed to seed resources" });
  }
});

export default router;
