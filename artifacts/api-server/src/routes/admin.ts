import { randomUUID } from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, getPoolStats, businessInvitesTable, businessesTable, usersTable, knowledgeTopicsTable, topicIssuesTable, userIssueFollowsTable, userTopicFollowsTable } from "@workspace/db";
import { eq, desc, sql, count, or } from "drizzle-orm";
import { sendBusinessOutreach } from "../lib/email";
import { isAdmin } from "../lib/adminAuth";
import { SUNDOWN_TOWNS_SEED } from "../data/sundown-towns-seed";
import { HBCU_COMPLETE_SEED } from "../data/hbcu-complete-seed";
import { NATIONAL_FESTIVALS_SEED } from "../data/national-festivals-seed";
import { NATIONAL_SUNDOWN_TOWNS_SEED } from "../data/national-sundown-towns-seed";
import { DIRECTORY_BUSINESSES_SEED } from "../data/directory-businesses-seed";
import { ENDORSEMENT_TAGS } from "@workspace/db";
import { ENDORSEMENT_TAG_VARIANTS } from "@workspace/db";
import { THE_REAL_TAGS } from "@workspace/db";
import { createSession } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/invites", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const invites = await db
      .select()
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt))
      .limit(200);
    res.json({ invites });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch invites");
    res.status(500).json({ error: "Failed to fetch invites" });
  }
});

router.patch("/admin/invites/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const { status, notes } = req.body as { status?: string; notes?: string };
  const allowed = ["pending", "contacted", "accepted", "declined", "expired"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    const [updated] = await db
      .update(businessInvitesTable)
      .set(updates)
      .where(eq(businessInvitesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }
    res.json({ invite: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update invite");
    res.status(500).json({ error: "Failed to update invite" });
  }
});

router.get("/admin/businesses", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const businesses = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        verified: businessesTable.verified,
        blackOwned: businessesTable.blackOwned,
        status: businessesTable.status,
        phone: businessesTable.phone,
        website: businessesTable.website,
        createdAt: businessesTable.createdAt,
      })
      .from(businessesTable)
      .orderBy(desc(businessesTable.createdAt))
      .limit(500);

    const invites = await db
      .select({
        businessId: businessInvitesTable.businessId,
        status: businessInvitesTable.status,
        socialHandle: businessInvitesTable.socialHandle,
        createdAt: businessInvitesTable.createdAt,
      })
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt));

    const outreachByBusiness = new Map<string, typeof invites[0]>();
    for (const inv of invites) {
      if (inv.businessId && !outreachByBusiness.has(inv.businessId)) {
        outreachByBusiness.set(inv.businessId, inv);
      }
    }

    const result = businesses.map((b) => ({
      ...b,
      outreach: outreachByBusiness.get(b.id) ?? null,
    }));

    res.json({ businesses: result });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.get("/admin/members", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const members = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        memberType: usersTable.memberType,
        trialEndsAt: usersTable.trialEndsAt,
        foundingMemberNumber: usersTable.foundingMemberNumber,
        referralCode: usersTable.referralCode,
        referralCount: usersTable.referralCount,
        stripeSubscriptionId: usersTable.stripeSubscriptionId,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(500);
    res.json({ members });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch members");
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

router.patch("/admin/members/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { memberType, trialEndsAt, foundingMemberNumber, emailVerified } = req.body as {
    memberType?: string;
    trialEndsAt?: string | null;
    foundingMemberNumber?: number | null;
    emailVerified?: boolean;
  };
  const VALID_TYPES = ["individual", "business", "founding", "beta", "business_referral", "navigator", "trailblazer"];
  if (memberType && !VALID_TYPES.includes(memberType)) {
    res.status(400).json({ error: "Invalid memberType" }); return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setPayload: any = {};
    if (memberType !== undefined) setPayload.memberType = memberType;
    if (trialEndsAt !== undefined) setPayload.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    if (foundingMemberNumber !== undefined) setPayload.foundingMemberNumber = foundingMemberNumber;
    if (emailVerified !== undefined) setPayload.emailVerified = emailVerified;
    const [updated] = await db
      .update(usersTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(setPayload as any)
      .where(sql`${usersTable.id} = ${req.params.id}`)
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ member: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update member status");
    res.status(500).json({ error: "Failed to update member" });
  }
});

router.post("/admin/businesses/:id/outreach", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const businessId = String(req.params.id);
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email address required" });
    return;
  }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, name: businessesTable.name, blackOwned: businessesTable.blackOwned })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    if (!business.blackOwned) {
      res.status(403).json({ error: "Outreach emails are only sent to minority-owned businesses." });
      return;
    }

    const claimLink = `https://mappingwithmelanin.com/for-business-owners?claim=${businessId}`;

    await sendBusinessOutreach(email, business.name, claimLink);

    const adminUser = (req as any).user;
    await db.insert(businessInvitesTable).values({
      businessId: business.id,
      businessName: business.name,
      socialHandle: email,
      socialPlatform: "email",
      status: "contacted",
      invitedByUserId: adminUser?.id ?? null,
    });

    req.log.info({ businessId, email }, "Business outreach email sent");
    res.json({ sent: true, to: email, businessName: business.name });
  } catch (err) {
    req.log.error({ err }, "Failed to send business outreach");
    res.status(500).json({ error: "Failed to send outreach email" });
  }
});

/**
 * One-time admin bootstrap — promotes the first authenticated user to admin.
 * Only works when ADMIN_EMAILS is not set AND no admin users exist in the DB.
 * Call this once immediately after your first login in production.
 */
router.post("/admin/bootstrap", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Blocked if ADMIN_EMAILS is already configured (configuration check, not an auth check)
  if ((process.env.ADMIN_EMAILS ?? "").split(",").some((e) => e.trim().length > 0)) {
    res.status(403).json({
      error: "Admin access is managed via the ADMIN_EMAILS environment variable. Add your email there instead.",
    });
    return;
  }

  try {
    // Block if an admin already exists in the DB
    const [existingAdmin] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))
      .limit(1);

    if (existingAdmin) {
      res.status(403).json({ error: "An admin account already exists. Contact your existing admin." });
      return;
    }

    // Promote the calling user to admin
    await db
      .update(usersTable)
      .set({ role: "admin" })
      .where(eq(usersTable.id, user.id));

    req.log.info({ userId: user.id, email: user.email }, "Admin bootstrap: first admin account created");
    res.json({ success: true, message: "You are now an admin. Reload the page to access the admin panel." });
  } catch (err) {
    req.log.error({ err }, "Admin bootstrap failed");
    res.status(500).json({ error: "Bootstrap failed" });
  }
});

// Emergency admin token endpoint removed — security remediation 2026-07-27

// ─── ADMIN: Topic Library Management ─────────────────────────────────────────

const SEED_TOPICS: Array<{ topicName: string; category: string; description: string; keywords: string[]; notificationPriority: string; trustedSources: object }> = [
  // Community & Culture
  { topicName: "Black History", category: "community_culture", description: "African American history, civil rights milestones, and cultural heritage.", keywords: ["black history", "civil rights", "african american heritage", "freedom movement"], notificationPriority: "standard", trustedSources: [{ name: "Equal Justice Initiative", domain: "eji.org" }, { name: "NAACP", domain: "naacp.org" }, { name: "Smithsonian", domain: "nmaahc.si.edu" }] },
  { topicName: "African Diaspora", category: "community_culture", description: "Communities, culture, and connections across the African diaspora worldwide.", keywords: ["diaspora", "pan-african", "africa", "global black community"], notificationPriority: "standard", trustedSources: [{ name: "The Root", domain: "theroot.com" }, { name: "African Union", domain: "au.int" }] },
  { topicName: "Caribbean Communities", category: "community_culture", description: "Caribbean culture, diaspora experiences, news, and community updates.", keywords: ["caribbean", "jamaican", "haitian", "trinidadian", "barbadian"], notificationPriority: "standard", trustedSources: [{ name: "Caribbean Journal", domain: "caribjournal.com" }] },
  { topicName: "Civil Rights & Social Justice", category: "community_culture", description: "Ongoing civil rights struggles, social justice legislation, and community organizing.", keywords: ["civil rights", "social justice", "equity", "systemic racism", "discrimination"], notificationPriority: "breaking", trustedSources: [{ name: "NAACP", domain: "naacp.org" }, { name: "ACLU", domain: "aclu.org" }, { name: "Urban League", domain: "nul.org" }] },
  { topicName: "Voting Rights & Civic Engagement", category: "community_culture", description: "Voting rights protection, elections, and tools for civic participation.", keywords: ["voting rights", "elections", "civic engagement", "ballot access", "democracy"], notificationPriority: "breaking", trustedSources: [{ name: "NAACP Legal Defense Fund", domain: "naacpldf.org" }, { name: "ACLU", domain: "aclu.org" }] },
  { topicName: "Faith & Spirituality", category: "community_culture", description: "The role of faith communities in Black life, church news, and spiritual wellness.", keywords: ["faith", "church", "spirituality", "religion", "gospel", "prayer"], notificationPriority: "digest", trustedSources: [{ name: "The Root", domain: "theroot.com" }, { name: "Essence", domain: "essence.com" }] },
  { topicName: "Women's Issues", category: "community_culture", description: "Issues affecting Black women — policy, wellness, representation, and advocacy.", keywords: ["black women", "women's rights", "feminism", "gender equity", "womanism"], notificationPriority: "standard", trustedSources: [{ name: "Essence", domain: "essence.com" }, { name: "Black Women's Health Imperative", domain: "bwhi.org" }] },
  { topicName: "LGBTQ+ Community", category: "community_culture", description: "LGBTQ+ rights, representation, and community news in Black spaces.", keywords: ["lgbtq", "queer", "transgender", "gay rights", "pride"], notificationPriority: "standard", trustedSources: [{ name: "The Advocate", domain: "advocate.com" }, { name: "NAACP", domain: "naacp.org" }] },
  { topicName: "Veterans & Military Families", category: "community_culture", description: "Resources, benefits, and advocacy for Black veterans and military families.", keywords: ["veterans", "military", "va benefits", "military families", "service members"], notificationPriority: "standard", trustedSources: [{ name: "VA.gov", domain: "va.gov" }, { name: "Black Veterans Project", domain: "blackveteransproject.org" }] },
  { topicName: "Immigration & Community", category: "community_culture", description: "Immigration policy affecting communities of color — updates, rights, and resources.", keywords: ["immigration", "deportation", "daca", "immigrant rights", "asylum"], notificationPriority: "breaking", trustedSources: [{ name: "ACLU", domain: "aclu.org" }, { name: "USCIS", domain: "uscis.gov" }] },

  // Safety
  { topicName: "Travel Safety Advisories", category: "safety", description: "Real-time travel safety alerts, State Department advisories, and community reports.", keywords: ["travel safety", "travel advisory", "safety abroad", "do not travel"], notificationPriority: "breaking", trustedSources: [{ name: "US State Department", domain: "travel.state.gov" }, { name: "CDC Travel Health", domain: "wwwnc.cdc.gov" }] },
  { topicName: "Neighborhood Safety", category: "safety", description: "Community safety reports, crime trends, and neighborhood watch updates.", keywords: ["neighborhood safety", "crime prevention", "community safety", "local crime"], notificationPriority: "breaking", trustedSources: [{ name: "FBI Crime Data", domain: "fbi.gov" }, { name: "NAACP", domain: "naacp.org" }] },
  { topicName: "Emergency Preparedness", category: "safety", description: "Disaster readiness, evacuation planning, and emergency resources.", keywords: ["emergency preparedness", "disaster kit", "evacuation", "shelter", "fema"], notificationPriority: "breaking", trustedSources: [{ name: "FEMA", domain: "fema.gov" }, { name: "Ready.gov", domain: "ready.gov" }] },
  { topicName: "Public Health Alerts", category: "safety", description: "Outbreaks, public health emergencies, and community health notices.", keywords: ["public health", "outbreak", "disease alert", "health emergency"], notificationPriority: "breaking", trustedSources: [{ name: "CDC", domain: "cdc.gov" }, { name: "WHO", domain: "who.int" }] },
  { topicName: "Food Safety & Recalls", category: "safety", description: "FDA and USDA food recalls, contamination warnings, and consumer alerts.", keywords: ["food recall", "food safety", "contamination", "fda recall", "usda recall"], notificationPriority: "breaking", trustedSources: [{ name: "FDA", domain: "fda.gov" }, { name: "USDA FSIS", domain: "fsis.usda.gov" }] },
  { topicName: "Consumer Product Recalls", category: "safety", description: "CPSC recalls for household products, vehicles, electronics, and children's items.", keywords: ["product recall", "cpsc recall", "consumer safety", "vehicle recall"], notificationPriority: "breaking", trustedSources: [{ name: "CPSC", domain: "cpsc.gov" }, { name: "NHTSA", domain: "nhtsa.gov" }] },
  { topicName: "Cybersecurity & Digital Safety", category: "safety", description: "Identity theft alerts, scam warnings, and tips to protect yourself online.", keywords: ["cybersecurity", "identity theft", "scams", "phishing", "data breach"], notificationPriority: "breaking", trustedSources: [{ name: "FTC Consumer Info", domain: "consumer.ftc.gov" }, { name: "CISA", domain: "cisa.gov" }] },

  // Travel
  { topicName: "Black Travel Experiences", category: "travel", description: "Travel stories, tips, and destination guides by and for the Black travel community.", keywords: ["black travel", "travel while black", "black travelers", "inclusive travel"], notificationPriority: "digest", trustedSources: [{ name: "Travel Noire", domain: "travelnoire.com" }, { name: "Black Travel Alliance", domain: "blacktravelalliance.com" }] },
  { topicName: "International Travel", category: "travel", description: "Destinations, visa guides, and travel tips for international adventures.", keywords: ["international travel", "passport", "visa", "abroad", "world travel"], notificationPriority: "digest", trustedSources: [{ name: "US State Department", domain: "travel.state.gov" }, { name: "Lonely Planet", domain: "lonelyplanet.com" }] },
  { topicName: "Domestic Road Trips", category: "travel", description: "Road trip itineraries, driving routes, and hidden gems across the United States.", keywords: ["road trip", "road trip usa", "driving routes", "national highway"], notificationPriority: "digest", trustedSources: [{ name: "National Park Service", domain: "nps.gov" }, { name: "Roadtrippers", domain: "roadtrippers.com" }] },
  { topicName: "Travel Deals & Discounts", category: "travel", description: "Flight deals, hotel discounts, and travel package savings.", keywords: ["travel deals", "cheap flights", "hotel discounts", "travel savings", "airfare deals"], notificationPriority: "immediate", trustedSources: [{ name: "Google Flights", domain: "google.com/flights" }, { name: "The Points Guy", domain: "thepointsguy.com" }] },
  { topicName: "National Parks & Outdoors", category: "travel", description: "Exploring America's national parks, hiking trails, and outdoor adventures.", keywords: ["national parks", "hiking", "camping", "outdoors", "nature"], notificationPriority: "digest", trustedSources: [{ name: "National Park Service", domain: "nps.gov" }, { name: "AllTrails", domain: "alltrails.com" }] },
  { topicName: "Solo Travel", category: "travel", description: "Resources, safety tips, and inspiration for solo travelers.", keywords: ["solo travel", "traveling alone", "solo adventures", "independent travel"], notificationPriority: "digest", trustedSources: [{ name: "Lonely Planet", domain: "lonelyplanet.com" }] },
  { topicName: "Family Travel", category: "travel", description: "Kid-friendly destinations, family travel tips, and budget-conscious family getaways.", keywords: ["family travel", "travel with kids", "family vacation", "child-friendly travel"], notificationPriority: "digest", trustedSources: [{ name: "Family Vacation Critic", domain: "familyvacationcritic.com" }] },
  { topicName: "Passport & Visa Updates", category: "travel", description: "Passport processing times, visa policy changes, and international entry requirements.", keywords: ["passport renewal", "visa application", "travel documents", "entry requirements"], notificationPriority: "standard", trustedSources: [{ name: "US State Department", domain: "travel.state.gov" }, { name: "USCIS", domain: "uscis.gov" }] },
  { topicName: "Accessible Travel", category: "travel", description: "Travel resources and destination guides for travelers with disabilities.", keywords: ["accessible travel", "wheelchair travel", "disability travel", "ada travel"], notificationPriority: "digest", trustedSources: [{ name: "Disabled Travelers", domain: "disabledtravelers.com" }] },

  // Relocation
  { topicName: "Best Cities to Relocate", category: "relocation", description: "Data-driven city comparisons for Black families considering relocation.", keywords: ["relocation cities", "where to move", "best cities 2024", "black-friendly cities"], notificationPriority: "digest", trustedSources: [{ name: "Livability", domain: "livability.com" }, { name: "US Census Bureau", domain: "census.gov" }] },
  { topicName: "Housing Market Trends", category: "relocation", description: "Real estate market data, homebuying trends, and mortgage rate updates.", keywords: ["housing market", "real estate", "home prices", "mortgage rates", "homebuying"], notificationPriority: "standard", trustedSources: [{ name: "Zillow Research", domain: "zillow.com/research" }, { name: "Realtor.com", domain: "realtor.com" }, { name: "Federal Reserve", domain: "federalreserve.gov" }] },
  { topicName: "School Ratings & Education Quality", category: "relocation", description: "School district ratings, public school quality, and education resources by city.", keywords: ["school ratings", "public schools", "school district", "education quality"], notificationPriority: "digest", trustedSources: [{ name: "GreatSchools", domain: "greatschools.org" }, { name: "US Dept of Education", domain: "ed.gov" }] },
  { topicName: "Cost of Living Comparisons", category: "relocation", description: "Cost of living data, salary comparison tools, and affordability indexes.", keywords: ["cost of living", "affordability", "salary comparison", "living expenses"], notificationPriority: "digest", trustedSources: [{ name: "NerdWallet", domain: "nerdwallet.com" }, { name: "Bureau of Labor Statistics", domain: "bls.gov" }] },
  { topicName: "Moving Tips & Resources", category: "relocation", description: "Moving checklists, company reviews, and practical relocation advice.", keywords: ["moving tips", "relocation guide", "moving checklist", "moving company"], notificationPriority: "digest", trustedSources: [{ name: "Moving.com", domain: "moving.com" }] },

  // Business
  { topicName: "Black Entrepreneurship", category: "business", description: "Stories, resources, and community support for minority-owned business owners.", keywords: ["black business", "black entrepreneurship", "minority business", "black owned"], notificationPriority: "standard", trustedSources: [{ name: "Black Enterprise", domain: "blackenterprise.com" }, { name: "National Minority Supplier Development Council", domain: "nmsdc.org" }] },
  { topicName: "Minority Business Grants & Funding", category: "business", description: "Grants, loans, and funding opportunities specifically for minority-owned businesses.", keywords: ["minority grants", "small business grants", "funding opportunities", "minority funding"], notificationPriority: "standard", trustedSources: [{ name: "SBA", domain: "sba.gov" }, { name: "SCORE", domain: "score.org" }, { name: "Grants.gov", domain: "grants.gov" }] },
  { topicName: "Women-Owned Business Resources", category: "business", description: "Resources, certifications, and funding for women-owned businesses.", keywords: ["women business owner", "wbe certification", "women entrepreneur", "women business grants"], notificationPriority: "standard", trustedSources: [{ name: "SBA Women's Business Centers", domain: "sba.gov" }, { name: "SCORE", domain: "score.org" }] },
  { topicName: "SBA Loans & Programs", category: "business", description: "SBA loan programs, application processes, and program updates.", keywords: ["sba loan", "small business loan", "7a loan", "sba programs", "business financing"], notificationPriority: "standard", trustedSources: [{ name: "SBA", domain: "sba.gov" }] },
  { topicName: "Government Contracts & Procurement", category: "business", description: "Federal and state contracting opportunities for minority-owned businesses.", keywords: ["government contracts", "procurement", "federal contracting", "8a certification", "sam.gov"], notificationPriority: "standard", trustedSources: [{ name: "SAM.gov", domain: "sam.gov" }, { name: "SBA", domain: "sba.gov" }] },
  { topicName: "Startup Funding & Venture Capital", category: "business", description: "VC funding, angel investing, and startup ecosystem news for founders of color.", keywords: ["startup funding", "venture capital", "angel investor", "seed funding", "black founders"], notificationPriority: "standard", trustedSources: [{ name: "TechCrunch", domain: "techcrunch.com" }, { name: "Black VC", domain: "blackvc.com" }] },
  { topicName: "Business Certifications", category: "business", description: "MBE, WBE, 8(a), and other certifications that open doors for minority businesses.", keywords: ["mbe certification", "wbe certification", "8a program", "minority certification", "dbe certification"], notificationPriority: "digest", trustedSources: [{ name: "SBA", domain: "sba.gov" }, { name: "NMSDC", domain: "nmsdc.org" }] },
  { topicName: "Marketing & Branding for Small Business", category: "business", description: "Marketing strategy, brand building, and digital marketing for small business owners.", keywords: ["small business marketing", "branding", "social media marketing", "digital marketing"], notificationPriority: "digest", trustedSources: [{ name: "HBR", domain: "hbr.org" }, { name: "Inc.", domain: "inc.com" }] },
  { topicName: "E-commerce & Online Selling", category: "business", description: "E-commerce tools, platforms, and strategies for selling online.", keywords: ["ecommerce", "online store", "shopify", "amazon seller", "online sales"], notificationPriority: "digest", trustedSources: [{ name: "Shopify Blog", domain: "shopify.com/blog" }] },
  { topicName: "AI for Small Business", category: "business", description: "How artificial intelligence tools can help small and minority-owned businesses grow.", keywords: ["ai tools", "chatgpt business", "automation", "ai marketing", "small business ai"], notificationPriority: "standard", trustedSources: [{ name: "HBR", domain: "hbr.org" }, { name: "MIT Technology Review", domain: "technologyreview.com" }] },

  // Employment
  { topicName: "Job Market Trends", category: "employment", description: "Employment data, hiring trends, and labor market news.", keywords: ["job market", "unemployment rate", "hiring trends", "labor market", "jobs report"], notificationPriority: "standard", trustedSources: [{ name: "Bureau of Labor Statistics", domain: "bls.gov" }, { name: "Department of Labor", domain: "dol.gov" }] },
  { topicName: "Career Development", category: "employment", description: "Career growth strategies, skill building, and professional advancement resources.", keywords: ["career development", "professional growth", "career advice", "skill building", "advancement"], notificationPriority: "digest", trustedSources: [{ name: "HBR", domain: "hbr.org" }, { name: "LinkedIn", domain: "linkedin.com" }] },
  { topicName: "Remote Work & Flexibility", category: "employment", description: "Remote job opportunities, work-from-home policies, and flexible work trends.", keywords: ["remote work", "work from home", "hybrid work", "remote jobs", "flexible work"], notificationPriority: "standard", trustedSources: [{ name: "HBR", domain: "hbr.org" }, { name: "FlexJobs", domain: "flexjobs.com" }] },
  { topicName: "Workplace Discrimination & Rights", category: "employment", description: "Employment discrimination laws, EEOC updates, and worker rights resources.", keywords: ["workplace discrimination", "eeoc", "employment discrimination", "labor rights", "hostile workplace"], notificationPriority: "breaking", trustedSources: [{ name: "EEOC", domain: "eeoc.gov" }, { name: "ACLU", domain: "aclu.org" }, { name: "Department of Labor", domain: "dol.gov" }] },
  { topicName: "Salary Negotiation", category: "employment", description: "Pay equity data, negotiation tactics, and compensation benchmarking.", keywords: ["salary negotiation", "pay equity", "compensation", "wage gap", "salary data"], notificationPriority: "digest", trustedSources: [{ name: "Glassdoor", domain: "glassdoor.com" }, { name: "PayScale", domain: "payscale.com" }] },
  { topicName: "Trade Skills & Apprenticeships", category: "employment", description: "Trade job opportunities, apprenticeship programs, and vocational career paths.", keywords: ["trade skills", "apprenticeship", "vocational training", "electrician", "plumber"], notificationPriority: "standard", trustedSources: [{ name: "Department of Labor Apprenticeship", domain: "apprenticeship.gov" }] },
  { topicName: "Leadership & Executive Growth", category: "employment", description: "Resources for Black professionals in leadership and executive roles.", keywords: ["executive leadership", "c-suite", "black executives", "leadership development", "corporate diversity"], notificationPriority: "digest", trustedSources: [{ name: "HBR", domain: "hbr.org" }, { name: "Black Enterprise", domain: "blackenterprise.com" }] },

  // Education
  { topicName: "Scholarships & Grants", category: "education", description: "Scholarship opportunities for Black students at all levels of education.", keywords: ["scholarship", "college scholarship", "black scholarships", "minority scholarships", "grants for students"], notificationPriority: "standard", trustedSources: [{ name: "UNCF", domain: "uncf.org" }, { name: "Fastweb", domain: "fastweb.com" }, { name: "Scholarships.com", domain: "scholarships.com" }] },
  { topicName: "HBCUs", category: "education", description: "News, rankings, and advocacy for Historically Black Colleges and Universities.", keywords: ["hbcu", "historically black college", "black colleges", "hbcu funding", "hbcu rankings"], notificationPriority: "standard", trustedSources: [{ name: "HBCU Digest", domain: "hbcudigest.com" }, { name: "UNCF", domain: "uncf.org" }, { name: "US Dept of Education", domain: "ed.gov" }] },
  { topicName: "Student Loan Information", category: "education", description: "Student loan policy updates, repayment options, and forgiveness programs.", keywords: ["student loans", "loan forgiveness", "fafsa", "loan repayment", "pslf"], notificationPriority: "breaking", trustedSources: [{ name: "Federal Student Aid", domain: "studentaid.gov" }, { name: "CFPB", domain: "consumerfinance.gov" }] },
  { topicName: "STEM Education", category: "education", description: "STEM opportunities, programs, and advocacy for Black students in science and technology.", keywords: ["stem education", "black in stem", "stem scholarships", "coding bootcamp", "stem programs"], notificationPriority: "standard", trustedSources: [{ name: "NSF", domain: "nsf.gov" }, { name: "Code.org", domain: "code.org" }] },
  { topicName: "K–12 Education", category: "education", description: "Public school policy, curriculum news, and resources for K-12 students and parents.", keywords: ["k-12 education", "public school", "school funding", "education policy", "school choice"], notificationPriority: "standard", trustedSources: [{ name: "US Dept of Education", domain: "ed.gov" }, { name: "EducationWeek", domain: "edweek.org" }] },
  { topicName: "Education Policy", category: "education", description: "Federal and state education policy changes affecting Black students and communities.", keywords: ["education policy", "school funding", "no child left behind", "education reform"], notificationPriority: "breaking", trustedSources: [{ name: "US Dept of Education", domain: "ed.gov" }, { name: "Education Trust", domain: "edtrust.org" }] },

  // Financial Wellness
  { topicName: "Building Wealth & Investing", category: "financial", description: "Investment strategies, portfolio building, and wealth creation for beginners and beyond.", keywords: ["investing", "stocks", "etf", "wealth building", "portfolio", "compound interest"], notificationPriority: "standard", trustedSources: [{ name: "Investopedia", domain: "investopedia.com" }, { name: "SEC Investor Education", domain: "investor.gov" }] },
  { topicName: "Black Homeownership", category: "financial", description: "Homebuying resources, down payment assistance programs, and fair housing rights for Black families.", keywords: ["black homeownership", "first time homebuyer", "down payment assistance", "fair housing", "mortgage"], notificationPriority: "standard", trustedSources: [{ name: "HUD", domain: "hud.gov" }, { name: "Consumer Financial Protection Bureau", domain: "consumerfinance.gov" }] },
  { topicName: "Credit Health", category: "financial", description: "Credit score improvement, debt management, and credit rights.", keywords: ["credit score", "credit repair", "credit report", "debt management", "credit card"], notificationPriority: "standard", trustedSources: [{ name: "CFPB", domain: "consumerfinance.gov" }, { name: "NerdWallet", domain: "nerdwallet.com" }] },
  { topicName: "Tax Tips & Filing", category: "financial", description: "Tax filing tips, deductions, credits, and IRS updates for individuals and business owners.", keywords: ["tax filing", "irs", "tax deductions", "tax credit", "tax refund"], notificationPriority: "standard", trustedSources: [{ name: "IRS", domain: "irs.gov" }, { name: "TurboTax", domain: "turbotax.intuit.com" }] },
  { topicName: "Retirement Planning", category: "financial", description: "Retirement savings strategies, 401k tips, Social Security, and retirement income planning.", keywords: ["retirement", "401k", "ira", "social security", "retirement savings"], notificationPriority: "digest", trustedSources: [{ name: "Social Security Administration", domain: "ssa.gov" }, { name: "AARP", domain: "aarp.org" }] },
  { topicName: "Estate Planning & Generational Wealth", category: "financial", description: "Wills, trusts, and strategies for building lasting generational wealth.", keywords: ["estate planning", "will", "trust", "generational wealth", "inheritance", "beneficiary"], notificationPriority: "digest", trustedSources: [{ name: "CFPB", domain: "consumerfinance.gov" }, { name: "Nolo", domain: "nolo.com" }] },
  { topicName: "Personal Finance & Budgeting", category: "financial", description: "Budgeting tools, saving strategies, and practical personal finance tips.", keywords: ["budgeting", "personal finance", "saving money", "financial planning", "50/30/20 rule"], notificationPriority: "digest", trustedSources: [{ name: "CFPB", domain: "consumerfinance.gov" }, { name: "NerdWallet", domain: "nerdwallet.com" }] },

  // Health & Wellness
  { topicName: "Black Mental Health", category: "health", description: "Mental health resources, therapy access, and destigmatizing mental wellness in Black communities.", keywords: ["black mental health", "therapy", "mental wellness", "depression", "anxiety", "ptsd"], notificationPriority: "standard", trustedSources: [{ name: "SAMHSA", domain: "samhsa.gov" }, { name: "Therapy for Black Girls", domain: "therapyforblackgirls.com" }, { name: "National Alliance on Mental Illness", domain: "nami.org" }] },
  { topicName: "Black Women's Health", category: "health", description: "Health research, advocacy, and resources specific to Black women's wellness.", keywords: ["black women health", "women's health", "maternal health", "fibroids", "breast cancer"], notificationPriority: "standard", trustedSources: [{ name: "Black Women's Health Imperative", domain: "bwhi.org" }, { name: "Office on Women's Health", domain: "womenshealth.gov" }] },
  { topicName: "Black Men's Health", category: "health", description: "Health topics, screenings, and resources focused on Black men's wellness.", keywords: ["black men health", "prostate cancer", "hypertension", "men's health", "preventive care"], notificationPriority: "standard", trustedSources: [{ name: "CDC", domain: "cdc.gov" }, { name: "100 Black Men", domain: "100blackmen.org" }] },
  { topicName: "Maternal Health & Infant Mortality", category: "health", description: "Black maternal mortality crisis, advocacy, and resources for Black mothers.", keywords: ["maternal mortality", "black maternal health", "infant mortality", "birth equity", "obstetric racism"], notificationPriority: "breaking", trustedSources: [{ name: "CDC", domain: "cdc.gov" }, { name: "Black Mamas Matter Alliance", domain: "blackmamasmatter.org" }] },
  { topicName: "Health Equity & Disparities", category: "health", description: "Research and advocacy on racial health disparities and healthcare equity.", keywords: ["health equity", "health disparities", "racial health gap", "healthcare access", "social determinants"], notificationPriority: "standard", trustedSources: [{ name: "Office of Minority Health", domain: "minorityhealth.hhs.gov" }, { name: "CDC", domain: "cdc.gov" }, { name: "NIH", domain: "nih.gov" }] },
  { topicName: "Chronic Disease Management", category: "health", description: "Diabetes, hypertension, heart disease — management resources for conditions disproportionately affecting Black communities.", keywords: ["diabetes", "hypertension", "heart disease", "chronic illness", "sickle cell"], notificationPriority: "standard", trustedSources: [{ name: "ADA", domain: "diabetes.org" }, { name: "CDC", domain: "cdc.gov" }, { name: "NIH", domain: "nih.gov" }] },
  { topicName: "Nutrition & Healthy Eating", category: "health", description: "Culturally relevant nutrition information, healthy recipes, and food-as-medicine resources.", keywords: ["nutrition", "healthy eating", "plant-based", "soul food healthy", "food as medicine"], notificationPriority: "digest", trustedSources: [{ name: "USDA MyPlate", domain: "myplate.gov" }, { name: "NIH", domain: "nih.gov" }] },
  { topicName: "Fitness & Physical Activity", category: "health", description: "Workout motivation, fitness programs, and physical wellness resources.", keywords: ["fitness", "exercise", "workout", "gym", "physical activity", "strength training"], notificationPriority: "digest", trustedSources: [{ name: "CDC Physical Activity", domain: "cdc.gov" }, { name: "American College of Sports Medicine", domain: "acsm.org" }] },
  { topicName: "Vaccines & Immunizations", category: "health", description: "Vaccine updates, schedules, and addressing vaccine hesitancy in Black communities.", keywords: ["vaccines", "immunization", "flu shot", "covid vaccine", "vaccine hesitancy"], notificationPriority: "standard", trustedSources: [{ name: "CDC Vaccines", domain: "cdc.gov" }, { name: "NIH", domain: "nih.gov" }] },
  { topicName: "Health Insurance & Coverage", category: "health", description: "Navigating health insurance options, ACA marketplace, Medicaid, and coverage resources.", keywords: ["health insurance", "aca", "medicaid", "marketplace insurance", "open enrollment"], notificationPriority: "standard", trustedSources: [{ name: "Healthcare.gov", domain: "healthcare.gov" }, { name: "Medicaid.gov", domain: "medicaid.gov" }] },

  // Family
  { topicName: "Black Parenting", category: "family", description: "Raising Black children with cultural pride, resources for Black parents, and family wellness.", keywords: ["black parenting", "raising black children", "parenting tips", "black families", "fatherhood"], notificationPriority: "digest", trustedSources: [{ name: "Essence", domain: "essence.com" }, { name: "National Black Child Development Institute", domain: "nbcdi.org" }] },
  { topicName: "Childcare Resources", category: "family", description: "Childcare access, subsidies, early childhood education, and daycare quality.", keywords: ["childcare", "daycare", "childcare subsidy", "early childhood", "preschool"], notificationPriority: "standard", trustedSources: [{ name: "Child Care.gov", domain: "childcare.gov" }, { name: "Head Start", domain: "acf.hhs.gov" }] },
  { topicName: "Senior Care & Elder Support", category: "family", description: "Resources for Black families caring for aging parents and elders.", keywords: ["senior care", "elder care", "aging parents", "assisted living", "medicare"], notificationPriority: "standard", trustedSources: [{ name: "AARP", domain: "aarp.org" }, { name: "Medicare.gov", domain: "medicare.gov" }] },
  { topicName: "Adoption & Foster Care", category: "family", description: "Adoption process, foster care resources, and advocacy for Black children in the system.", keywords: ["adoption", "foster care", "black children adoption", "foster to adopt"], notificationPriority: "standard", trustedSources: [{ name: "Child Welfare Information Gateway", domain: "childwelfare.gov" }] },
  { topicName: "Family Activities & Events", category: "family", description: "Family-friendly events, activities, and community gatherings near you.", keywords: ["family activities", "family events", "things to do with kids", "family outings"], notificationPriority: "digest", trustedSources: [{ name: "PBS Kids", domain: "pbs.org" }] },

  // Food & Lifestyle
  { topicName: "Black-Owned Restaurants", category: "food", description: "Discover and support minority-owned restaurants, food trucks, and catering businesses.", keywords: ["black-owned restaurant", "black chef", "soul food", "black food business", "minority restaurant"], notificationPriority: "digest", trustedSources: [{ name: "Yelp", domain: "yelp.com" }, { name: "Black Owned Everything", domain: "blackownedeverything.com" }] },
  { topicName: "Soul Food & Cultural Recipes", category: "food", description: "Traditional and reimagined recipes celebrating African American and African culinary heritage.", keywords: ["soul food", "recipes", "black cooking", "african cuisine", "collard greens", "cornbread"], notificationPriority: "digest", trustedSources: [{ name: "Food52", domain: "food52.com" }, { name: "Bon Appétit", domain: "bonappetit.com" }] },
  { topicName: "Food Deserts & Access", category: "food", description: "Advocacy and solutions for food access in underserved Black communities.", keywords: ["food desert", "food insecurity", "food access", "food apartheid", "grocery gap"], notificationPriority: "standard", trustedSources: [{ name: "USDA ERS", domain: "ers.usda.gov" }, { name: "Urban Institute", domain: "urban.org" }] },
  { topicName: "Plant-Based & Vegan Living", category: "food", description: "Plant-based eating, veganism, and healthy lifestyle choices in Black community context.", keywords: ["vegan", "plant-based", "vegetarian", "meatless", "whole foods"], notificationPriority: "digest", trustedSources: [{ name: "PCRM", domain: "pcrm.org" }] },
  { topicName: "Natural Hair & Beauty", category: "food", description: "Natural hair care, beauty trends, and minority-owned beauty product recommendations.", keywords: ["natural hair", "locs", "afro", "black beauty", "protective styles", "hair care"], notificationPriority: "digest", trustedSources: [{ name: "Essence Beauty", domain: "essence.com" }, { name: "Naturally Curly", domain: "naturallycurly.com" }] },
  { topicName: "Fashion & Style", category: "food", description: "Black fashion designers, style trends, and culturally inspired clothing.", keywords: ["black fashion", "fashion trends", "black designers", "style", "black fashion week"], notificationPriority: "digest", trustedSources: [{ name: "Essence Style", domain: "essence.com" }, { name: "Vogue", domain: "vogue.com" }] },
  { topicName: "Farmers Markets & Local Food", category: "food", description: "Support for local agriculture, community gardens, and farmers market access.", keywords: ["farmers market", "local food", "community garden", "urban farming", "local produce"], notificationPriority: "digest", trustedSources: [{ name: "USDA Agricultural Marketing Service", domain: "ams.usda.gov" }] },

  // Entertainment
  { topicName: "Black Cinema & Film", category: "entertainment", description: "Black filmmakers, movies celebrating Black culture, and film festival news.", keywords: ["black cinema", "black movies", "black filmmakers", "black actors", "afrofuturism"], notificationPriority: "digest", trustedSources: [{ name: "The Root", domain: "theroot.com" }, { name: "Essence Entertainment", domain: "essence.com" }] },
  { topicName: "Music (R&B, Hip-Hop, Gospel, Jazz)", category: "entertainment", description: "Music news, album releases, and artist stories across genres rooted in Black culture.", keywords: ["hip-hop", "r&b", "gospel", "jazz", "soul music", "music news"], notificationPriority: "standard", trustedSources: [{ name: "Pitchfork", domain: "pitchfork.com" }, { name: "Essence", domain: "essence.com" }] },
  { topicName: "Black Authors & Literature", category: "entertainment", description: "Books by Black authors, literary awards, and reading recommendations.", keywords: ["black authors", "black books", "toni morrison", "black literature", "reading recommendations"], notificationPriority: "digest", trustedSources: [{ name: "Kirkus Reviews", domain: "kirkusreviews.com" }, { name: "African American Literature Book Club", domain: "aalbc.com" }] },
  { topicName: "Black Sports Excellence", category: "entertainment", description: "Black athletes, sports news, and stories of excellence and advocacy in sports.", keywords: ["black athletes", "sports news", "nba", "nfl", "track and field", "tennis"], notificationPriority: "standard", trustedSources: [{ name: "ESPN", domain: "espn.com" }, { name: "The Undefeated", domain: "theundefeated.com" }] },
  { topicName: "Podcasts", category: "entertainment", description: "Must-listen podcasts by and for Black communities — news, culture, comedy, and more.", keywords: ["black podcasts", "podcasting", "podcast recommendations", "black creators podcast"], notificationPriority: "digest", trustedSources: [{ name: "Spotify", domain: "spotify.com" }, { name: "Apple Podcasts", domain: "podcasts.apple.com" }] },
  { topicName: "Theater & Performing Arts", category: "entertainment", description: "Broadway, Black theater companies, and performing arts celebrations.", keywords: ["black theater", "broadway", "performing arts", "dance", "spoken word"], notificationPriority: "digest", trustedSources: [{ name: "Broadway.com", domain: "broadway.com" }] },

  // Technology
  { topicName: "AI & Machine Learning", category: "technology", description: "Artificial intelligence news, tools, and equity considerations.", keywords: ["artificial intelligence", "machine learning", "ai tools", "chatgpt", "automation"], notificationPriority: "standard", trustedSources: [{ name: "MIT Technology Review", domain: "technologyreview.com" }, { name: "Wired", domain: "wired.com" }] },
  { topicName: "Black Tech Innovators", category: "technology", description: "Stories of Black founders, tech professionals, and innovators shaping the industry.", keywords: ["black tech", "black engineers", "black founders", "diversity in tech", "black silicon valley"], notificationPriority: "standard", trustedSources: [{ name: "Built In", domain: "builtin.com" }, { name: "Black Tech Week", domain: "blacktechweek.com" }] },
  { topicName: "Digital Privacy & Safety", category: "technology", description: "Protecting your data, privacy rights, and digital safety tools.", keywords: ["digital privacy", "data protection", "privacy rights", "vpn", "data breach"], notificationPriority: "standard", trustedSources: [{ name: "EFF", domain: "eff.org" }, { name: "FTC Privacy", domain: "ftc.gov" }] },
  { topicName: "Smart Home & Consumer Tech", category: "technology", description: "Smart home devices, gadget reviews, and consumer technology news.", keywords: ["smart home", "gadgets", "technology review", "consumer electronics", "apple", "android"], notificationPriority: "digest", trustedSources: [{ name: "The Verge", domain: "theverge.com" }, { name: "CNET", domain: "cnet.com" }] },
  { topicName: "Electric Vehicles & Green Tech", category: "technology", description: "EV news, charging infrastructure, and green technology trends.", keywords: ["electric vehicle", "ev", "tesla", "charging station", "green technology"], notificationPriority: "digest", trustedSources: [{ name: "Electrek", domain: "electrek.co" }, { name: "DOE", domain: "energy.gov" }] },

  // Environment
  { topicName: "Climate Justice", category: "environment", description: "How climate change disproportionately impacts Black and Brown communities, and advocacy for change.", keywords: ["climate justice", "environmental racism", "climate change", "frontline communities", "green new deal"], notificationPriority: "standard", trustedSources: [{ name: "NAACP Environmental Justice", domain: "naacp.org" }, { name: "EPA Environmental Justice", domain: "epa.gov" }] },
  { topicName: "Clean Energy & Sustainability", category: "environment", description: "Renewable energy developments, sustainability practices, and green job opportunities.", keywords: ["clean energy", "solar", "wind energy", "sustainability", "renewable energy"], notificationPriority: "standard", trustedSources: [{ name: "DOE", domain: "energy.gov" }, { name: "NRDC", domain: "nrdc.org" }] },
  { topicName: "Water & Air Quality", category: "environment", description: "Water safety, air quality alerts, and environmental health in Black communities.", keywords: ["water quality", "air quality", "lead contamination", "clean water", "pollution"], notificationPriority: "breaking", trustedSources: [{ name: "EPA", domain: "epa.gov" }, { name: "EWG", domain: "ewg.org" }] },
  { topicName: "Urban Gardening & Conservation", category: "environment", description: "Community gardens, urban agriculture, and conservation efforts in Black communities.", keywords: ["urban garden", "community garden", "conservation", "green space", "urban farming"], notificationPriority: "digest", trustedSources: [{ name: "USDA", domain: "usda.gov" }] },

  // Community Giving
  { topicName: "Volunteer Opportunities", category: "giving", description: "Local and national volunteer opportunities to give back to your community.", keywords: ["volunteer", "community service", "nonprofit volunteer", "giving back"], notificationPriority: "digest", trustedSources: [{ name: "VolunteerMatch", domain: "volunteermatch.org" }] },
  { topicName: "Youth Programs & Mentorship", category: "giving", description: "Programs supporting Black youth through mentorship, education, and leadership development.", keywords: ["youth programs", "mentorship", "black youth", "after school", "youth development"], notificationPriority: "standard", trustedSources: [{ name: "100 Black Men", domain: "100blackmen.org" }, { name: "Big Brothers Big Sisters", domain: "bbbs.org" }] },
  { topicName: "Black Philanthropy", category: "giving", description: "Giving circles, charitable foundations, and the culture of Black philanthropy.", keywords: ["black philanthropy", "giving circle", "charitable donation", "foundation", "community investment"], notificationPriority: "digest", trustedSources: [{ name: "African American Philanthropy", domain: "aafdn.org" }] },
  { topicName: "Food & Housing Assistance", category: "giving", description: "Resources for families experiencing food insecurity and housing instability.", keywords: ["food bank", "housing assistance", "food assistance", "eviction help", "rental assistance"], notificationPriority: "standard", trustedSources: [{ name: "Feeding America", domain: "feedingamerica.org" }, { name: "HUD", domain: "hud.gov" }] },

  // Government
  { topicName: "Federal Policy News", category: "government", description: "Major federal legislation, executive orders, and policy decisions affecting Black communities.", keywords: ["federal policy", "legislation", "congress", "executive order", "white house"], notificationPriority: "breaking", trustedSources: [{ name: "Congress.gov", domain: "congress.gov" }, { name: "White House", domain: "whitehouse.gov" }, { name: "AP News", domain: "apnews.com" }] },
  { topicName: "Supreme Court Watch", category: "government", description: "Supreme Court decisions and cases with major implications for civil rights and equality.", keywords: ["supreme court", "scotus", "court ruling", "civil rights case", "constitutional law"], notificationPriority: "breaking", trustedSources: [{ name: "SCOTUS Blog", domain: "scotusblog.com" }, { name: "NPR", domain: "npr.org" }] },
  { topicName: "Criminal Justice Reform", category: "government", description: "Policing reform, sentencing policy, prison reform, and re-entry support news.", keywords: ["criminal justice reform", "police reform", "incarceration", "sentencing reform", "second chance"], notificationPriority: "breaking", trustedSources: [{ name: "Brennan Center", domain: "brennancenter.org" }, { name: "Equal Justice Initiative", domain: "eji.org" }] },
  { topicName: "Housing Policy", category: "government", description: "Fair housing law, affordable housing legislation, and HUD policy updates.", keywords: ["housing policy", "fair housing", "affordable housing", "hud", "zoning laws"], notificationPriority: "standard", trustedSources: [{ name: "HUD", domain: "hud.gov" }, { name: "National Low Income Housing Coalition", domain: "nlihc.org" }] },
  { topicName: "State & Local Legislation", category: "government", description: "State and local policy changes affecting Black communities — education, voting, policing, and more.", keywords: ["state legislation", "local government", "city council", "state law", "local policy"], notificationPriority: "standard", trustedSources: [{ name: "National Conference of State Legislatures", domain: "ncsl.org" }] },

  // Mapping with Melanin Platform
  { topicName: "MWM Platform Updates", category: "platform", description: "New features, improvements, and announcements from Mapping With Melanin™.", keywords: ["mapping with melanin", "mwm update", "new feature", "app update"], notificationPriority: "standard", trustedSources: [{ name: "Mapping With Melanin", domain: "mappingwithmelanin.com" }] },
  { topicName: "Business Spotlights", category: "platform", description: "Featured minority-owned businesses, success stories, and spotlights from the MWM community.", keywords: ["business spotlight", "black business feature", "mwm business", "entrepreneur spotlight"], notificationPriority: "digest", trustedSources: [{ name: "Mapping With Melanin", domain: "mappingwithmelanin.com" }] },
  { topicName: "Community Safety Alerts", category: "platform", description: "Real-time community safety alerts and Waze-style incident reports from the MWM community.", keywords: ["safety alert", "community alert", "ice activity", "police presence", "neighborhood alert"], notificationPriority: "breaking", trustedSources: [{ name: "Mapping With Melanin Community", domain: "mappingwithmelanin.com" }] },
  { topicName: "Black Travel Guides", category: "platform", description: "Destination guides, city safety scores, and travel content from the MWM travel community.", keywords: ["black travel guide", "mwm travel", "destination guide", "city safety", "travel tips"], notificationPriority: "digest", trustedSources: [{ name: "Mapping With Melanin", domain: "mappingwithmelanin.com" }] },
  { topicName: "Creator Spotlights", category: "platform", description: "Highlighting Black creators, influencers, and community voices in the MWM ecosystem.", keywords: ["creator spotlight", "black creators", "content creator", "community voice", "influencer"], notificationPriority: "digest", trustedSources: [{ name: "Mapping With Melanin", domain: "mappingwithmelanin.com" }] },
];

router.get("/admin/topics", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const topics = await db
      .select({
        id: knowledgeTopicsTable.id,
        topicName: knowledgeTopicsTable.topicName,
        category: knowledgeTopicsTable.category,
        parentCategory: knowledgeTopicsTable.parentCategory,
        description: knowledgeTopicsTable.description,
        keywords: knowledgeTopicsTable.keywords,
        synonyms: knowledgeTopicsTable.synonyms,
        trustedSources: knowledgeTopicsTable.trustedSources,
        notificationPriority: knowledgeTopicsTable.notificationPriority,
        tier: knowledgeTopicsTable.tier,
        enabled: knowledgeTopicsTable.enabled,
        createdAt: knowledgeTopicsTable.createdAt,
      })
      .from(knowledgeTopicsTable)
      .orderBy(knowledgeTopicsTable.category, knowledgeTopicsTable.topicName);

    const followCounts = await db
      .select({
        topicId: userTopicFollowsTable.topicId,
        count: count(),
      })
      .from(userTopicFollowsTable)
      .groupBy(userTopicFollowsTable.topicId);

    const followMap: Record<string, number> = {};
    for (const f of followCounts) { followMap[f.topicId] = Number(f.count); }

    res.json({
      topics: topics.map((t) => ({ ...t, followCount: followMap[t.id] ?? 0 })),
      total: topics.length,
      enabled: topics.filter((t) => t.enabled).length,
    });
  } catch (err) {
    req.log.error({ err }, "GET /admin/topics error");
    res.status(500).json({ error: "Failed to fetch topics." });
  }
});

router.post("/admin/topics", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { topicName, category, description, keywords, synonyms, trustedSources, notificationPriority, tier } = req.body as Record<string, any>;
    if (!topicName || !category) { res.status(400).json({ error: "topicName and category are required." }); return; }
    const [topic] = await db
      .insert(knowledgeTopicsTable)
      .values({
        topicName,
        category,
        description: description ?? null,
        keywords: keywords ?? null,
        synonyms: synonyms ?? null,
        trustedSources: trustedSources ?? null,
        notificationPriority: notificationPriority ?? "standard",
        tier: tier ?? "free",
        enabled: true,
      })
      .returning();
    res.json({ topic });
  } catch (err) {
    req.log.error({ err }, "POST /admin/topics error");
    res.status(500).json({ error: "Failed to create topic." });
  }
});

router.put("/admin/topics/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const id = String(req.params.id);
    const { topicName, category, description, keywords, synonyms, trustedSources, notificationPriority, tier, enabled } = req.body as Record<string, any>;
    const update: Record<string, any> = {};
    if (topicName !== undefined) update.topicName = topicName;
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description;
    if (keywords !== undefined) update.keywords = keywords;
    if (synonyms !== undefined) update.synonyms = synonyms;
    if (trustedSources !== undefined) update.trustedSources = trustedSources;
    if (notificationPriority !== undefined) update.notificationPriority = notificationPriority;
    if (tier !== undefined) update.tier = tier;
    if (enabled !== undefined) update.enabled = enabled;
    const [topic] = await db.update(knowledgeTopicsTable).set(update).where(eq(knowledgeTopicsTable.id, id)).returning();
    res.json({ topic });
  } catch (err) {
    req.log.error({ err }, "PUT /admin/topics/:id error");
    res.status(500).json({ error: "Failed to update topic." });
  }
});

router.post("/admin/topics/seed", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    let inserted = 0;
    let skipped = 0;
    for (const t of SEED_TOPICS) {
      const existing = await db
        .select({ id: knowledgeTopicsTable.id })
        .from(knowledgeTopicsTable)
        .where(sql`lower(${knowledgeTopicsTable.topicName}) = lower(${t.topicName})`)
        .limit(1);
      if (existing.length > 0) { skipped++; continue; }
      await db.insert(knowledgeTopicsTable).values({
        topicName: t.topicName,
        category: t.category,
        description: t.description,
        keywords: t.keywords,
        notificationPriority: t.notificationPriority,
        trustedSources: t.trustedSources,
        enabled: true,
        tier: "free",
      });
      inserted++;
    }
    res.json({ inserted, skipped, total: SEED_TOPICS.length });
  } catch (err) {
    req.log.error({ err }, "POST /admin/topics/seed error");
    res.status(500).json({ error: "Seed failed." });
  }
});

router.get("/admin/topics/issues", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const issues = await db.select().from(topicIssuesTable).orderBy(topicIssuesTable.name);
    const followCounts = await db
      .select({ issueId: userIssueFollowsTable.issueId, count: count() })
      .from(userIssueFollowsTable)
      .groupBy(userIssueFollowsTable.issueId);
    const fm: Record<string, number> = {};
    for (const f of followCounts) fm[f.issueId] = Number(f.count);
    res.json({ issues: issues.map((i) => ({ ...i, followCount: fm[i.id] ?? 0 })) });
  } catch (err) {
    req.log.error({ err }, "GET /admin/topics/issues error");
    res.status(500).json({ error: "Failed to fetch issues." });
  }
});

router.post("/admin/topics/issues", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { name, description, category, keywords } = req.body as Record<string, any>;
    if (!name) { res.status(400).json({ error: "name is required." }); return; }
    const [issue] = await db.insert(topicIssuesTable).values({ name, description: description ?? null, category: category ?? null, keywords: keywords ?? null, isActive: true }).returning();
    res.json({ issue });
  } catch (err) {
    req.log.error({ err }, "POST /admin/topics/issues error");
    res.status(500).json({ error: "Failed to create issue." });
  }
});

router.put("/admin/topics/issues/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const id = String(req.params.id);
    const { name, description, category, keywords, isActive } = req.body as Record<string, any>;
    const update: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (keywords !== undefined) update.keywords = keywords;
    if (isActive !== undefined) update.isActive = isActive;
    const [issue] = await db.update(topicIssuesTable).set(update).where(eq(topicIssuesTable.id, id)).returning();
    res.json({ issue });
  } catch (err) {
    req.log.error({ err }, "PUT /admin/topics/issues/:id error");
    res.status(500).json({ error: "Failed to update issue." });
  }
});

router.post("/admin/topics/issues/seed", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const SEED_ISSUES = [
    { name: "Affordable Housing Crisis", description: "Tracking housing affordability, rent increases, and displacement of Black communities.", category: "government", keywords: ["affordable housing", "housing crisis", "rent", "displacement", "gentrification"] },
    { name: "Maternal Mortality Emergency", description: "Monitoring policy and research on Black maternal mortality rates — 3x higher than white women.", category: "health", keywords: ["maternal mortality", "maternal health", "black mothers", "birth equity"] },
    { name: "HBCU Federal Funding", description: "Ongoing efforts to secure and protect federal funding for Historically Black Colleges and Universities.", category: "education", keywords: ["hbcu funding", "federal education", "historically black colleges"] },
    { name: "Voting Rights Legislation", description: "Federal and state bills affecting Black voter access, ID laws, and polling place access.", category: "government", keywords: ["voting rights", "voter id", "election protection", "ballot access"] },
    { name: "Minority Business Grant Programs", description: "New and expiring SBA, state, and private grant programs for minority-owned businesses.", category: "business", keywords: ["minority grants", "small business grants", "sba programs", "black business funding"] },
    { name: "Student Loan Forgiveness", description: "Court rulings, policy changes, and program updates on student debt relief.", category: "education", keywords: ["student loan forgiveness", "loan cancellation", "biden loan relief", "pslf"] },
    { name: "Police Accountability Reform", description: "Legislation, court decisions, and local policy changes related to policing and accountability.", category: "government", keywords: ["police reform", "police accountability", "qualified immunity", "body cameras"] },
    { name: "CROWN Act Legislation", description: "State and federal progress on the CROWN Act protecting natural hair from discrimination.", category: "government", keywords: ["crown act", "natural hair discrimination", "hair discrimination law"] },
    { name: "Health Insurance Coverage Expansion", description: "Medicaid expansion, ACA enrollment, and policy changes affecting Black family coverage.", category: "health", keywords: ["health insurance", "aca", "medicaid expansion", "uninsured"] },
    { name: "Criminal Justice Sentencing Reform", description: "State and federal efforts to reform mandatory minimums and address racial sentencing disparities.", category: "government", keywords: ["sentencing reform", "mandatory minimum", "criminal justice", "incarceration"] },
    { name: "Minority Wealth Gap", description: "Research and policy addressing the racial wealth gap between Black and white Americans.", category: "financial", keywords: ["racial wealth gap", "wealth inequality", "economic equity", "reparations"] },
    { name: "Reparations Legislation", description: "Federal and state reparations study commissions, bills, and movements for redress.", category: "government", keywords: ["reparations", "hr40", "slavery redress", "restorative justice"] },
    { name: "Immigration Policy & Communities", description: "Immigration enforcement actions, DACA status, and impacts on Black immigrant communities.", category: "government", keywords: ["immigration", "daca", "deportation", "ice raids", "black immigrants"] },
    { name: "Climate Justice & Frontline Communities", description: "Environmental policy affecting Black communities on the frontlines of climate change.", category: "environment", keywords: ["climate justice", "environmental racism", "frontline communities", "clean air"] },
    { name: "Algorithmic Bias & AI Equity", description: "How AI systems perpetuate racial bias in hiring, lending, criminal justice, and healthcare.", category: "technology", keywords: ["algorithmic bias", "ai fairness", "facial recognition bias", "racial bias ai"] },
    { name: "Food Desert Policy", description: "Federal and local initiatives to address food deserts in Black and underserved communities.", category: "food", keywords: ["food desert", "food policy", "grocery access", "food apartheid"] },
    { name: "Black Homeownership Gap", description: "Policy and advocacy addressing the persistent gap in homeownership rates between Black and white Americans.", category: "financial", keywords: ["black homeownership", "homeownership gap", "fair housing", "redlining legacy"] },
    { name: "Community Land Trust Development", description: "Efforts to use community land trusts to prevent displacement and build Black community wealth.", category: "government", keywords: ["community land trust", "clt", "affordable housing", "anti-displacement"] },
    { name: "Minority-Owned Bank Support", category: "business", description: "Support for Black and minority depository institutions (MDIs) and community development banks.", keywords: ["minority bank", "black bank", "mdi", "community bank", "cdfi"] },
    { name: "Federal Broadband Access Expansion", category: "technology", description: "Internet access equity programs and funding aimed at closing the digital divide in underserved communities.", keywords: ["broadband", "digital divide", "internet access", "connectivity equity"] },
  ];
  try {
    let inserted = 0;
    let skipped = 0;
    for (const issue of SEED_ISSUES) {
      const existing = await db.select({ id: topicIssuesTable.id }).from(topicIssuesTable).where(sql`lower(${topicIssuesTable.name}) = lower(${issue.name})`).limit(1);
      if (existing.length > 0) { skipped++; continue; }
      await db.insert(topicIssuesTable).values({ ...issue, isActive: true });
      inserted++;
    }
    res.json({ inserted, skipped, total: SEED_ISSUES.length });
  } catch (err) {
    req.log.error({ err }, "POST /admin/topics/issues/seed error");
    res.status(500).json({ error: "Seed failed." });
  }
});

// ─── GET /admin/referral-stats ─────────────────────────────────────────────
router.get("/admin/referral-stats", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [kpiRows, leaderboardRows, dailyUsersRows, dailyBizRows] = await Promise.all([
      pool.query<{ total_users: string; total_businesses: string; total_referral_signups: string; total_biz_by_referral: string; total_referral_credits: string }>(`
        SELECT
          (SELECT COUNT(*)::int FROM users)                                          AS total_users,
          (SELECT COUNT(*)::int FROM businesses)                                      AS total_businesses,
          (SELECT COUNT(*)::int FROM users WHERE referred_by_code IS NOT NULL)        AS total_referral_signups,
          (SELECT COUNT(*)::int FROM businesses WHERE referred_by_code IS NOT NULL)   AS total_biz_by_referral,
          (SELECT COALESCE(SUM(referral_count), 0)::int FROM users WHERE referral_code IS NOT NULL) AS total_referral_credits
      `),
      pool.query<{ id: string; first_name: string | null; last_name: string | null; referral_code: string; referral_count: number; biz_count: string }>(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.referral_code,
          u.referral_count,
          COUNT(b.id)::int AS biz_count
        FROM users u
        LEFT JOIN businesses b ON b.referred_by_code = u.referral_code
        WHERE u.referral_code IS NOT NULL AND u.referral_count > 0
        ORDER BY u.referral_count DESC
        LIMIT 25
      `),
      pool.query<{ day: string; total: string; by_referral: string }>(`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC')::text AS day,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE referred_by_code IS NOT NULL)::int AS by_referral
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day DESC
      `),
      pool.query<{ day: string; total: string; by_referral: string }>(`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC')::text AS day,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE referred_by_code IS NOT NULL)::int AS by_referral
        FROM businesses
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day DESC
      `),
    ]);

    const kpi = kpiRows.rows[0];

    res.json({
      kpi: {
        totalUsers: Number(kpi?.total_users ?? 0),
        totalBusinesses: Number(kpi?.total_businesses ?? 0),
        totalReferralSignups: Number(kpi?.total_referral_signups ?? 0),
        totalBizByReferral: Number(kpi?.total_biz_by_referral ?? 0),
        totalReferralCredits: Number(kpi?.total_referral_credits ?? 0),
      },
      leaderboard: leaderboardRows.rows.map((r) => ({
        id: r.id,
        name: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Anonymous",
        code: r.referral_code,
        referrals: Number(r.referral_count),
        businessesBrought: Number(r.biz_count),
      })),
      dailyUsers: dailyUsersRows.rows.map((r) => ({
        day: r.day,
        total: Number(r.total),
        byReferral: Number(r.by_referral),
        organic: Number(r.total) - Number(r.by_referral),
      })),
      dailyBusinesses: dailyBizRows.rows.map((r) => ({
        day: r.day,
        total: Number(r.total),
        byReferral: Number(r.by_referral),
        organic: Number(r.total) - Number(r.by_referral),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch referral stats");
    res.status(500).json({ error: "Failed to fetch referral stats" });
  }
});

// ── Business leads CSV export ─────────────────────────────────────────────────
router.get("/admin/businesses/export-csv", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const businesses = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        verified: businessesTable.verified,
        blackOwned: businessesTable.blackOwned,
        status: businessesTable.status,
        phone: businessesTable.phone,
        website: businessesTable.website,
        createdAt: businessesTable.createdAt,
      })
      .from(businessesTable)
      .orderBy(desc(businessesTable.createdAt))
      .limit(2000);

    const invites = await db
      .select({
        businessId: businessInvitesTable.businessId,
        status: businessInvitesTable.status,
        socialHandle: businessInvitesTable.socialHandle,
        createdAt: businessInvitesTable.createdAt,
      })
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt));

    const outreachByBusiness = new Map<string, typeof invites[0]>();
    for (const inv of invites) {
      if (inv.businessId && !outreachByBusiness.has(inv.businessId)) {
        outreachByBusiness.set(inv.businessId, inv);
      }
    }

    const escape = (v: unknown) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };

    const headers = ["Name", "Category", "City", "State", "Phone", "Website", "Verified", "Minority-Owned", "Status", "Outreach Status", "Outreach Handle", "Outreach Date", "Added Date"];
    const rows = businesses.map((b) => {
      const out = outreachByBusiness.get(b.id);
      return [
        b.name,
        b.category,
        b.city,
        b.state,
        b.phone ?? "",
        b.website ?? "",
        b.verified ? "Yes" : "No",
        b.blackOwned ? "Yes" : "No",
        b.status,
        out?.status ?? "Not contacted",
        out?.socialHandle ?? "",
        out ? new Date(out.createdAt).toLocaleDateString() : "",
        new Date(b.createdAt).toLocaleDateString(),
      ].map(escape).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="business-leads-${date}.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export business leads CSV");
    res.status(500).json({ error: "Failed to export" });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, String(req.params.id))).returning({ id: usersTable.id, email: usersTable.email });
    if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
    req.log.info({ deletedUserId: deleted.id }, "Admin deleted user");
    res.json({ deleted: true, id: deleted.id, email: deleted.email });
  } catch (err) {
    req.log.error({ err }, "Admin DELETE /admin/users/:id error");
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── Phase 1 Auth Probe: READ-ONLY canonical user investigation ───────────────
// CRON_SECRET only. Returns every row that could be the founder. No writes.
router.get("/admin/auth-probe", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const rows = await pool.query(`
      SELECT
        id,
        LEFT(COALESCE(email,''), 3) || '***@' || SPLIT_PART(COALESCE(email,'(none)'), '@', 2) AS email_masked,
        role,
        CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NULL' END AS password_hash,
        CASE WHEN apple_id IS NOT NULL THEN 'SET' ELSE 'NULL' END AS apple_id,
        CASE WHEN phone_number IS NOT NULL
          THEN LEFT(phone_number, 4) || '***' || RIGHT(phone_number, 2)
          ELSE 'NULL' END AS phone_number,
        phone_verified,
        email_verified,
        first_name,
        profile_setup_complete,
        created_at
      FROM users
      ORDER BY created_at ASC
    `);

    // Auth events for each user
    const events = await pool.query(`
      SELECT user_id, event, created_at
      FROM auth_events
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Active sessions
    const sessions = await pool.query(`
      SELECT user_id, LEFT(id, 8) || '...' AS session_id_prefix, created_at
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      users: rows.rows,
      recentAuthEvents: events.rows,
      activeSessions: sessions.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message) });
  }
});

// ── Phase 2 Auth Repair: merge duplicate phone account into canonical ─────────
// CRON_SECRET only. dryRun:true (default) shows what would happen, no writes.
// dryRun:false executes: links phone to canonical account, deletes duplicate.
router.post("/admin/auth-repair-merge", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) { res.status(401).json({ error: "Unauthorized" }); return; }

  const dryRun: boolean = req.body?.dryRun !== false;

  try {
    // Step 1: find all users, identify canonical (has email+admin) and duplicates (no email, phone-only)
    const allUsers = await pool.query(`
      SELECT id, email, role, phone_number, password_hash IS NOT NULL AS has_password,
             apple_id IS NOT NULL AS has_apple, created_at
      FROM users ORDER BY created_at ASC
    `);

    const canonical = allUsers.rows.find((u: any) => u.email && u.role === 'admin');
    const phoneDuplicates = allUsers.rows.filter((u: any) => !u.email && u.phone_number);

    if (!canonical) {
      res.status(404).json({ error: "No admin account with email found." }); return;
    }

    const report: any = {
      dryRun,
      canonical: {
        id: canonical.id,
        email: canonical.email,
        role: canonical.role,
        hasPassword: canonical.has_password,
        hasApple: canonical.has_apple,
        phoneNumber: canonical.phone_number ? 'SET' : 'NULL',
      },
      duplicatesFound: phoneDuplicates.length,
      actions: [] as string[],
    };

    for (const dup of phoneDuplicates) {
      const phone = dup.phone_number;

      // Check if canonical already has this phone
      if (canonical.phone_number === phone) {
        report.actions.push(`SKIP: canonical already has phone ${phone.slice(0,4)}***`);
        continue;
      }

      // Check if canonical already has A phone (would conflict)
      if (canonical.phone_number && canonical.phone_number !== phone) {
        report.actions.push(`WARN: canonical already has a DIFFERENT phone. Manual review needed.`);
        continue;
      }

      // Count sessions belonging to duplicate
      const sessCount = await pool.query(
        `SELECT COUNT(*) as n FROM sessions WHERE sess->'user'->>'id' = $1`,
        [dup.id]
      );

      report.actions.push(
        `MERGE: copy phone ${phone.slice(0,4)}*** from user ${dup.id.slice(0,8)} → canonical ${canonical.id.slice(0,8)}`
      );
      report.actions.push(
        `DELETE: ${sessCount.rows[0].n} session(s) for duplicate user ${dup.id.slice(0,8)}`
      );
      report.actions.push(`DELETE: duplicate user ${dup.id.slice(0,8)} (no email, phone-only account)`);

      if (!dryRun) {
        // Link phone to canonical
        await pool.query(
          `UPDATE users SET phone_number = $1, phone_verified = true WHERE id = $2`,
          [phone, canonical.id]
        );
        // Delete duplicate's sessions
        await pool.query(`DELETE FROM sessions WHERE sess->'user'->>'id' = $1`, [dup.id]);
        // Delete duplicate user
        await pool.query(`DELETE FROM users WHERE id = $1`, [dup.id]);
        report.actions.push(`DONE: merge complete for ${dup.id.slice(0,8)}`);
      }
    }

    // Final state
    const finalState = await pool.query(`
      SELECT id, email, role,
        CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NULL' END AS password,
        CASE WHEN apple_id IS NOT NULL THEN 'SET' ELSE 'NULL' END AS apple,
        CASE WHEN phone_number IS NOT NULL THEN 'SET' ELSE 'NULL' END AS phone,
        phone_verified, email_verified
      FROM users WHERE email IS NOT NULL ORDER BY created_at ASC LIMIT 5
    `);
    report.finalState = finalState.rows;

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: String(err.message) });
  }
});

// ── Production Health Monitor ───────────────────────────────────────────────
// Returns live pool stats, DB health checks, and process uptime.
// Powers the hourly health panel in the admin dashboard.
router.get("/admin/health", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const checkedAt = new Date().toISOString();
  const poolStats = getPoolStats();

  let rawSql = false;
  let drizzle = false;
  let rawSqlMs: number | null = null;
  let drizzleMs: number | null = null;

  // Raw SQL check
  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    rawSqlMs = Date.now() - t0;
    rawSql = true;
  } catch { /* falls through */ }

  // Drizzle ORM check
  try {
    const t0 = Date.now();
    await db.select({ id: businessesTable.id }).from(businessesTable).limit(1);
    drizzleMs = Date.now() - t0;
    drizzle = true;
  } catch { /* falls through */ }

  const allOk = rawSql && drizzle;
  const status = !allOk ? "down" : poolStats.waiting > 2 ? "degraded" : "ok";

  res.json({
    status,
    poolStats,
    checks: { rawSql, drizzle, rawSqlMs, drizzleMs },
    uptimeSeconds: Math.floor(process.uptime()),
    checkedAt,
    poolConfig: { max: 8, idleTimeoutMs: 30000, maxLifetimeS: 1800, connectionTimeoutMs: 10000 },
    loadTestBaseline: {
      concurrentRequests: 50,
      successRate: "50/50",
      maxMs: 1466,
      testedAt: "2026-07-21",
      note: "Community Beta 2 — baseline established"
    },
    escalationMatrix: [
      { level: "GREEN",    condition: "waiting=0, all checks pass",           action: "No action needed" },
      { level: "YELLOW",   condition: "waiting 1-2, all checks pass",         action: "Monitor — consider scaling if sustained >5 min" },
      { level: "ORANGE",   condition: "waiting ≥3, OR one check slow >2s",    action: "Page on-call; reduce non-critical cron jobs" },
      { level: "RED",      condition: "any check fails OR businesses 500s",   action: "Immediate Railway restart; run schema-check if persists" },
      { level: "CRITICAL", condition: "all checks fail OR DB unreachable",    action: "Escalate to Railway support + notify community" },
    ],
  });
});

// ── Multicultural seed (WS4 + WS5) ──────────────────────────────────────────
// POST /admin/seed-multicultural
// Auth: Authorization: Bearer CRON_SECRET
// Idempotent: skips any business/site that already exists by name+city.
router.post("/admin/seed-multicultural", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    // ── 12 demo multicultural businesses ──────────────────────────────────
    const DEMO_BUSINESSES = [
      { name: "Kinfolk Kitchen", description: "[DEMO — Test Record] A beloved gathering spot serving Southern and West African–inspired comfort food. Family recipes, community events, and a warm welcome for everyone.", category: "Food", subcategory: "Restaurant", address: "1400 South St", city: "Philadelphia", state: "PA", latitude: "39.9416", longitude: "-75.1650", black_owned: true, ownership_designations: ["black-owned"], confidence_score: 75, price_range: "$$" },
      { name: "Akosua's Cloth & Culture", description: "[DEMO — Test Record] Handcrafted West African textiles, kente cloth, and contemporary Afro-diasporic fashion. Celebrates the full breadth of the African diaspora.", category: "Retail", subcategory: "Fashion", address: "3210 Girard Ave", city: "Philadelphia", state: "PA", latitude: "39.9665", longitude: "-75.1730", black_owned: true, ownership_designations: ["black-owned", "african-diaspora-owned"], confidence_score: 75, price_range: "$$" },
      { name: "Yard Style Caribbean Grill", description: "[DEMO — Test Record] Jerk chicken, oxtail, and roti made from family recipes brought from Kingston and Port of Spain. Authentic Caribbean flavors in the heart of the city.", category: "Food", subcategory: "Caribbean", address: "5523 Germantown Ave", city: "Philadelphia", state: "PA", latitude: "39.9980", longitude: "-75.1720", black_owned: true, ownership_designations: ["black-owned", "caribbean-owned"], confidence_score: 75, price_range: "$" },
      { name: "Casa Hernández Panadería", description: "[DEMO — Test Record] Mexican and Puerto Rican baked goods, pan dulce, and fresh empanadas. A community anchor serving Philadelphia's Latino neighborhoods for over a decade.", category: "Food", subcategory: "Bakery", address: "2812 N 5th St", city: "Philadelphia", state: "PA", latitude: "39.9810", longitude: "-75.1350", black_owned: false, ownership_designations: ["hispanic-owned", "latino-owned"], confidence_score: 75, price_range: "$" },
      { name: "Lenape Roots Wellness", description: "[DEMO — Test Record] Holistic wellness rooted in Indigenous traditions — herbal medicine, mindfulness practices, and educational programs honoring Lenape heritage and land stewardship.", category: "Health", subcategory: "Wellness", address: "1200 E Columbia Ave", city: "Philadelphia", state: "PA", latitude: "39.9740", longitude: "-75.1210", black_owned: false, ownership_designations: ["indigenous-owned", "native-american-owned"], confidence_score: 75, price_range: "$$" },
      { name: "Samira's Moroccan Table", description: "[DEMO — Test Record] Slow-cooked tagines, fresh mint tea, and warm hospitality from a Casablanca native. A window into North African culinary heritage.", category: "Food", subcategory: "Restaurant", address: "734 S 9th St", city: "Philadelphia", state: "PA", latitude: "39.9352", longitude: "-75.1534", black_owned: false, ownership_designations: ["middle-eastern-owned", "north-african-owned", "immigrant-owned"], confidence_score: 75, price_range: "$$" },
      { name: "New Arrival Market", description: "[DEMO — Test Record] A multicultural grocery and community hub stocking ingredients from over 30 countries. Founded by first-generation immigrants to serve the city's growing diaspora communities.", category: "Retail", subcategory: "Grocery", address: "1840 Point Breeze Ave", city: "Philadelphia", state: "PA", latitude: "39.9291", longitude: "-75.1720", black_owned: false, ownership_designations: ["immigrant-owned"], confidence_score: 75, price_range: "$" },
      { name: "Her Collective Studio", description: "[DEMO — Test Record] A women-owned beauty and wellness studio specializing in natural hair care, skincare, and holistic self-care practices for all women.", category: "Beauty", subcategory: "Salon", address: "4512 Baltimore Ave", city: "Philadelphia", state: "PA", latitude: "39.9447", longitude: "-75.2045", black_owned: false, ownership_designations: ["women-owned"], confidence_score: 75, price_range: "$$" },
      { name: "Prism Books & Community Space", description: "[DEMO — Test Record] An LGBTQ+-owned independent bookstore, event venue, and safe space celebrating queer literature, diverse voices, and community organizing.", category: "Retail", subcategory: "Bookstore", address: "704 S 4th St", city: "Philadelphia", state: "PA", latitude: "39.9418", longitude: "-75.1480", black_owned: false, ownership_designations: ["lgbtq-owned"], confidence_score: 75, price_range: "$$" },
      { name: "Accessibility First Consulting", description: "[DEMO — Test Record] Disability-owned consulting firm specializing in ADA compliance, accessible design, and inclusive workplace strategy.", category: "Services", subcategory: "Consulting", address: "1500 Market St Ste 1200", city: "Philadelphia", state: "PA", latitude: "39.9530", longitude: "-75.1653", black_owned: false, ownership_designations: ["disability-owned"], confidence_score: 75, price_range: "$$$" },
      { name: "Honor Grounds Coffee", description: "[DEMO — Test Record] Veteran-owned coffee shop and community meeting space. Single-origin roasts, military service honor wall, and a standing welcome for all who have served.", category: "Food", subcategory: "Café", address: "1910 Passyunk Ave", city: "Philadelphia", state: "PA", latitude: "39.9280", longitude: "-75.1720", black_owned: false, ownership_designations: ["veteran-owned"], confidence_score: 75, price_range: "$" },
      { name: "The Gathering Place", description: "[DEMO — Test Record] A multicultural community restaurant and event space co-owned by Black, LGBTQ+, and women founders. Celebrates intersectional identity through food, art, and storytelling.", category: "Food", subcategory: "Restaurant", address: "2100 Fairmount Ave", city: "Philadelphia", state: "PA", latitude: "39.9635", longitude: "-75.1723", black_owned: true, ownership_designations: ["black-owned", "women-owned", "lgbtq-owned"], confidence_score: 75, price_range: "$$" },
    ];

    let businessesInserted = 0;
    let businessesSkipped = 0;
    for (const b of DEMO_BUSINESSES) {
      const exists = await pool.query(
        "SELECT id FROM businesses WHERE name = $1 AND city = $2 LIMIT 1",
        [b.name, b.city]
      );
      if (exists.rows.length > 0) { businessesSkipped++; continue; }
      await pool.query(
        `INSERT INTO businesses
          (id, name, description, category, subcategory, address, city, state,
           latitude, longitude, black_owned, ownership_designations,
           confidence_score, verified, price_range, business_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16)`,
        [
          randomUUID(),
          b.name, b.description, b.category, b.subcategory, b.address,
          b.city, b.state, b.latitude, b.longitude,
          b.black_owned, JSON.stringify(b.ownership_designations),
          b.confidence_score, false, b.price_range, "community",
        ]
      );
      businessesInserted++;
    }

    // ── 5 Philadelphia cultural sites ─────────────────────────────────────
    const CULTURAL_SITES = [
      {
        name: "Independence Hall — Annual Reminder Protests",
        description: "From 1965 to 1969, Frank Kameny and the Mattachine Society organized the Annual Reminder — peaceful annual pickets at Independence Hall demanding equal rights for LGBTQ+ Americans. These demonstrations predate the Stonewall uprising and are among the earliest organized LGBTQ+ civil rights protests in United States history.",
        category: "Heritage",
        heritage_category: "LGBTQ+ History",
        subcategory: "Civil Rights Memorial",
        ethnic_community: "LGBTQ+",
        city: "Philadelphia", state: "PA",
        address: "520 Chestnut St",
        latitude: "39.9489", longitude: "-75.1500",
        era: "1965–1969",
        significance: "Site of the Annual Reminder protests, among the first organized LGBTQ+ civil rights demonstrations in United States history.",
        external_url: "https://www.nps.gov/inde",
        verified_source: "City of Philadelphia; National Park Service",
        year_established: 1965,
        admission_free: true, is_family_friendly: true, is_accessible: true,
      },
      {
        name: "Penn Treaty Park — Lenape Treaty Site (Shackamaxon)",
        description: "The traditional gathering place of the Lenape people at Shackamaxon, where William Penn's 1683 treaty with Chief Tamanend took place. The park stands on land the Lenape called home for thousands of years before European arrival. A living memorial to Indigenous sovereignty and the first peoples of the Delaware Valley.",
        category: "Heritage",
        heritage_category: "Native American Heritage",
        subcategory: "Indigenous Sacred Site",
        ethnic_community: "Lenape / Indigenous",
        city: "Philadelphia", state: "PA",
        address: "1301 N Delaware Ave",
        latitude: "39.9729", longitude: "-75.1213",
        era: "Pre-colonial — 1683",
        significance: "Site of the 1683 treaty between William Penn and Lenape Chief Tamanend; ancestral Lenape gathering grounds at Shackamaxon.",
        external_url: "https://penntreatyparkfriends.org",
        verified_source: "Philadelphia Parks & Recreation; Penn Treaty Museum Society",
        year_established: 1683,
        admission_free: true, is_family_friendly: true, is_accessible: true,
      },
      {
        name: "Norris Square Park — Puerto Rican Cultural Heart",
        description: "The casitas and community gardens of Norris Square, built by Puerto Rican residents beginning in the 1970s, represent one of the most powerful examples of immigrant community reclamation of urban space in Philadelphia. Las Parcelas garden preserves Puerto Rican agricultural and cultural traditions in the heart of North Philadelphia.",
        category: "Heritage",
        heritage_category: "Hispanic & Latino Heritage",
        subcategory: "Cultural Landmark",
        ethnic_community: "Puerto Rican / Latino",
        city: "Philadelphia", state: "PA",
        address: "Norris St & N Howard St",
        latitude: "39.9791", longitude: "-75.1370",
        era: "1970s–present",
        significance: "Puerto Rican casitas and Las Parcelas garden — community-built cultural spaces preserving Latino heritage in North Philadelphia.",
        external_url: "https://www.nspca.net",
        verified_source: "Philadelphia Horticultural Society; Penn Urban Studies documentation",
        year_established: 1970,
        admission_free: true, is_family_friendly: true, is_accessible: true,
      },
      {
        name: "Pennsylvania Hall Site — Female Anti-Slavery Society",
        description: "Pennsylvania Hall — built by abolitionists and opened in 1838 — was burned to the ground by a pro-slavery mob three days after its dedication while the Philadelphia Female Anti-Slavery Society held an antislavery convention inside. The Society, founded in 1833 by Black and white women together including Lucretia Mott and Sarah Mapps Douglass, was among the first interracial women's organizations in United States history. A historical marker stands at the site today.",
        category: "Heritage",
        heritage_category: "Women's History",
        subcategory: "Abolitionist & Civil Rights Site",
        ethnic_community: "Women / Interracial Abolitionist",
        city: "Philadelphia", state: "PA",
        address: "6th St & Haines St",
        latitude: "39.9541", longitude: "-75.1577",
        era: "1833–1838",
        significance: "Site of Pennsylvania Hall and the Philadelphia Female Anti-Slavery Society — first interracial women's abolitionist organization in US history.",
        external_url: "https://www.hsp.org",
        verified_source: "Historical Society of Pennsylvania; Philadelphia Inquirer historical records",
        year_established: 1833,
        admission_free: true, is_family_friendly: true, is_accessible: false,
      },
      {
        name: "9th Street Italian Market — Immigrant Heritage Corridor",
        description: "America's oldest continuously operating open-air market, established by Southern Italian immigrants in the late 1800s. The corridor on South 9th Street has housed successive waves of immigrant communities — Italian, Vietnamese, Mexican, and others — making it one of Philadelphia's most enduring symbols of immigrant enterprise, cultural continuity, and community resilience.",
        category: "Heritage",
        heritage_category: "Immigrant Heritage",
        subcategory: "Cultural Landmark",
        ethnic_community: "Italian / Multi-Immigrant",
        city: "Philadelphia", state: "PA",
        address: "S 9th St & Washington Ave",
        latitude: "39.9338", longitude: "-75.1536",
        era: "Late 1800s–present",
        significance: "America's oldest continuously operating open-air market — a living symbol of multi-generational immigrant enterprise and cultural continuity.",
        external_url: "https://italianmarketphilly.org",
        verified_source: "Philadelphia Historical Commission; italianmarketphilly.org",
        year_established: 1884,
        admission_free: true, is_family_friendly: true, is_accessible: true,
      },
    ];

    // Create cultural_sites table if it doesn't exist in this environment.
    // Safe to run on every call — CREATE TABLE IF NOT EXISTS is idempotent.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cultural_sites (
        id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category    VARCHAR(100) NOT NULL DEFAULT 'Heritage',
        heritage_category  VARCHAR(100),
        subcategory        VARCHAR(100),
        ethnic_community   VARCHAR(100),
        city        VARCHAR(100) NOT NULL,
        state       VARCHAR(50)  NOT NULL,
        address     VARCHAR(255),
        latitude    NUMERIC(10,7) NOT NULL,
        longitude   NUMERIC(10,7) NOT NULL,
        era         VARCHAR(100),
        significance TEXT,
        image_url   VARCHAR(500),
        external_url VARCHAR(500),
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        year_established INTEGER,
        is_accessible    BOOLEAN DEFAULT FALSE,
        is_family_friendly BOOLEAN DEFAULT TRUE,
        admission_free   BOOLEAN DEFAULT TRUE,
        audio_guide      BOOLEAN DEFAULT FALSE,
        verified_source  VARCHAR(255),
        country     VARCHAR(100) DEFAULT 'United States',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    let sitesInserted = 0;
    let sitesSkipped = 0;
    for (const s of CULTURAL_SITES) {
      const exists = await pool.query(
        "SELECT id FROM cultural_sites WHERE name = $1 AND city = $2 LIMIT 1",
        [s.name, s.city]
      );
      if (exists.rows.length > 0) { sitesSkipped++; continue; }
      await pool.query(
        `INSERT INTO cultural_sites
          (name, description, category, heritage_category, subcategory,
           ethnic_community, city, state, address, latitude, longitude,
           era, significance, external_url, is_verified, year_established,
           admission_free, is_family_friendly, is_accessible, verified_source, country)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          s.name, s.description, s.category, s.heritage_category, s.subcategory,
          s.ethnic_community, s.city, s.state, s.address, s.latitude, s.longitude,
          s.era, s.significance, s.external_url, true, s.year_established,
          s.admission_free, s.is_family_friendly, s.is_accessible, s.verified_source,
          "United States",
        ]
      );
      sitesInserted++;
    }

    req.log.info({ businessesInserted, businessesSkipped, sitesInserted, sitesSkipped }, "Multicultural seed completed");
    res.json({
      ok: true,
      businesses: { inserted: businessesInserted, skipped: businessesSkipped },
      culturalSites: { inserted: sitesInserted, skipped: sitesSkipped },
    });
  } catch (err) {
    req.log.error({ err }, "POST /admin/seed-multicultural error");
    res.status(500).json({ error: "Seed failed" });
  }
});

// ── POST /admin/seed-sundown-towns ────────────────────────────────────────────
// Seeds Historical Sundown Towns into cultural_sites table.
// Source: Loewen, "Sundown Towns" (2005); Tougaloo College NSF Database;
//         NAACP; state historical societies; DOJ records.
// All entries are historical record only — no current safety claims.
router.post("/admin/seed-sundown-towns", async (req: Request, res: Response) => {
  // Accept either an authenticated admin session OR a valid CRON_SECRET header.
  // CRON_SECRET path exists so this endpoint can be called from the deployment
  // pipeline without requiring an interactive admin login.
  const cronSecret = process.env.CRON_SECRET;
  const cronHeader = req.headers["x-cron-secret"];
  const hasCronAuth = cronSecret && cronHeader === cronSecret;
  if (!isAdmin(req) && !hasCronAuth) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    let inserted = 0;
    let skipped = 0;

    for (const site of SUNDOWN_TOWNS_SEED) {
      const existing = await pool.query(
        `SELECT id FROM cultural_sites WHERE name = $1 AND city = $2 AND state = $3 LIMIT 1`,
        [site.name, site.city, site.state]
      );
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await pool.query(
        `INSERT INTO cultural_sites
          (id, name, description, category, heritage_category, subcategory,
           city, state, latitude, longitude, era, significance,
           external_url, is_verified, is_accessible, is_family_friendly,
           admission_free, verified_source, country, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())`,
        [
          randomUUID(),
          site.name,
          site.description,
          site.category,
          site.heritageCategory,
          site.subcategory,
          site.city,
          site.state,
          site.latitude,
          site.longitude,
          site.era,
          site.significance,
          site.externalUrl,
          site.isVerified,
          site.isAccessible,
          site.isFamilyFriendly,
          site.admissionFree,
          site.verifiedSource,
          "United States",
        ]
      );
      inserted++;
    }

    req.log.info({ inserted, skipped }, "Sundown towns seed completed");
    res.json({ ok: true, inserted, skipped, total: SUNDOWN_TOWNS_SEED.length });
  } catch (err) {
    req.log.error({ err }, "POST /admin/seed-sundown-towns error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/set-user-tier ─────────────────────────────────────────────────
// Sets memberType on a user by email. CRON_SECRET or admin session.
// Used for review account setup and internal tier management without
// requiring an interactive admin browser session.
// Body: { email: string, memberType: string }
router.post("/admin/set-user-tier", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const cronHeader = req.headers["x-cron-secret"];
  const hasCronAuth = cronSecret && cronHeader === cronSecret;
  if (!isAdmin(req) && !hasCronAuth) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { email, memberType } = req.body as { email?: string; memberType?: string };
  const VALID = ["individual", "navigator", "trailblazer", "founding", "beta", "business", "business_referral"];
  if (!email || !memberType || !VALID.includes(memberType)) {
    res.status(400).json({ error: "email and valid memberType required" });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE users SET member_type = $1 WHERE email = $2
       RETURNING id, email, member_type`,
      [memberType, email.toLowerCase().trim()]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    req.log.error({ err }, "POST /admin/set-user-tier error");
    res.status(500).json({ error: "Failed to update tier", detail: String(err) });
  }
});

// ── Manus Tour Guide cultural sites seed ──────────────────────────────────────
// POST /admin/seed-manus-cultural-sites
// Seeds all 438 cultural sites from the three Manus AI guide PDFs.
// Safe to run multiple times — dedup is on LOWER(name)+LOWER(city).
router.post("/admin/seed-manus-cultural-sites", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    // Ensure new columns exist (idempotent)
    await pool.query(`ALTER TABLE cultural_sites
      ADD COLUMN IF NOT EXISTS pin_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS visit_tip TEXT,
      ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'staged',
      ADD COLUMN IF NOT EXISTS data_source VARCHAR(100),
      ADD COLUMN IF NOT EXISTS approximate_location BOOLEAN DEFAULT FALSE`);

    const { seedManusEntities } = await import("../scripts/seed-manus-cultural-sites");
    const result = await seedManusEntities(pool);
    req.log.info(result, "POST /admin/seed-manus-cultural-sites completed");
    res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error({ err }, "POST /admin/seed-manus-cultural-sites error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// POST /admin/seed-manus-cultural-sites-pass2
// Seeds ~306 additional cultural sites and diaspora businesses from the three
// Manus AI tour guide PDFs — second extraction pass.
// Safe to run multiple times — upserts on LOWER(name)+LOWER(city).
router.post("/admin/seed-manus-cultural-sites-pass2", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    // Ensure new columns exist (idempotent)
    await pool.query(`ALTER TABLE cultural_sites
      ADD COLUMN IF NOT EXISTS content_note TEXT,
      ADD COLUMN IF NOT EXISTS practical_tips TEXT`);

    const { seedManusEntitiesPass2 } = await import("../scripts/seed-manus-cultural-sites-pass2");
    const result = await seedManusEntitiesPass2(pool);
    req.log.info(result, "POST /admin/seed-manus-cultural-sites-pass2 completed");
    res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error({ err }, "POST /admin/seed-manus-cultural-sites-pass2 error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-hbcu-complete ────────────────────────────────────────────
// Seeds all 107 HBCUs into cultural_sites. Dedup-safe (name+state check).
// CRON_SECRET bypass so it can be triggered without a web session.
router.post("/admin/seed-hbcu-complete", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    let inserted = 0; let skipped = 0;
    for (const h of HBCU_COMPLETE_SEED) {
      const exists = await pool.query(
        `SELECT id FROM cultural_sites
         WHERE LOWER(name)=LOWER($1) AND LOWER(state)=LOWER($2) LIMIT 1`,
        [h.name, h.state]
      );
      if (exists.rows.length) { skipped++; continue; }

      const era = `Founded ${h.founded}`;
      const subcategory = h.control === "public" ? "Public HBCU" : "Private HBCU";

      await pool.query(
        `INSERT INTO cultural_sites
          (id, name, description, category, heritage_category, subcategory,
           ethnic_community, city, state, latitude, longitude, era,
           significance, external_url, pin_type,
           is_accessible, is_family_friendly, admission_free, is_verified,
           verified_source, created_at)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
           true,true,true,true,$16,NOW())`,
        [
          randomUUID(),
          h.name,
          h.description,
          "Historically Black College or University",
          "HBCU",
          subcategory,
          "African American",
          h.city,
          h.state,
          h.latitude,
          h.longitude,
          era,
          h.significance,
          h.externalUrl,
          "hbcu",
          "U.S. Dept. of Education HBCU List · thehundred-seven.org",
        ]
      );
      inserted++;
    }
    req.log.info({ inserted, skipped }, "seed-hbcu-complete done");
    res.json({ ok: true, inserted, skipped, total: HBCU_COMPLETE_SEED.length });
  } catch (err) {
    req.log.error({ err }, "seed-hbcu-complete error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-sundown-towns-v2 ─────────────────────────────────────────
// Seeds the 16 curated entries from SUNDOWN_TOWNS_SEED into the dedicated
// sundown_towns table (NOT cultural_sites). Safe to run multiple times — dedup
// on LOWER(name)+LOWER(city)+LOWER(state). Gates cleared August 7 2026.
router.post("/admin/seed-sundown-towns-v2", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sundown_towns (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name             TEXT        NOT NULL,
        city             TEXT        NOT NULL,
        state            TEXT        NOT NULL,
        county           TEXT,
        latitude         NUMERIC(10,7) NOT NULL,
        longitude        NUMERIC(10,7) NOT NULL,
        confidence_level TEXT        NOT NULL DEFAULT 'confirmed',
        historical_evidence TEXT,
        time_period      TEXT,
        excluded_population TEXT     DEFAULT 'Black residents',
        source_organization TEXT,
        source_url       TEXT,
        census_geocode   TEXT,
        current_state    TEXT        NOT NULL DEFAULT 'historical_neutral',
        last_review_date DATE,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sundown_community_reports (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        sundown_town_id UUID        NOT NULL REFERENCES sundown_towns(id) ON DELETE CASCADE,
        content         TEXT        NOT NULL,
        sentiment       TEXT        NOT NULL CHECK (sentiment IN ('positive','negative')),
        is_moderated    BOOLEAN     NOT NULL DEFAULT FALSE,
        is_approved     BOOLEAN     NOT NULL DEFAULT FALSE,
        user_id         TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    let inserted = 0; let skipped = 0;
    for (const entry of SUNDOWN_TOWNS_SEED) {
      const exists = await pool.query(
        `SELECT id FROM sundown_towns
         WHERE LOWER(name)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3) LIMIT 1`,
        [entry.name, entry.city, entry.state]
      );
      if (exists.rows.length) { skipped++; continue; }
      await pool.query(
        `INSERT INTO sundown_towns
          (id,name,city,state,latitude,longitude,confidence_level,
           historical_evidence,time_period,excluded_population,
           source_organization,source_url,current_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          randomUUID(), entry.name, entry.city, entry.state,
          parseFloat(entry.latitude), parseFloat(entry.longitude),
          "confirmed",
          entry.significance ?? null, entry.era ?? null,
          "Black residents",
          entry.verifiedSource ?? null, entry.externalUrl ?? null,
          "historical_neutral",
        ]
      );
      inserted++;
    }
    req.log.info({ inserted, skipped }, "seed-sundown-towns-v2 completed");
    res.json({ ok: true, inserted, skipped, total: SUNDOWN_TOWNS_SEED.length });
  } catch (err) {
    req.log.error({ err }, "POST /admin/seed-sundown-towns-v2 error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/recategorize-festivals ────────────────────────────────────────
// Upgrades existing cultural_sites with pin_type=festival_or_event to
// heritage_festival so they get gold pins instead of orange "EVENT" pins.
router.post("/admin/recategorize-festivals", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const result = await pool.query(
      `UPDATE cultural_sites
       SET pin_type = 'heritage_festival'
       WHERE pin_type = 'festival_or_event'
         AND (
           -- annual cultural events with heritage significance
           LOWER(name) LIKE '%festival%'
           OR LOWER(name) LIKE '%carnival%'
           OR LOWER(name) LIKE '%celebration%'
           OR LOWER(name) LIKE '%parade%'
           OR LOWER(name) LIKE '%fiesta%'
           OR LOWER(name) LIKE '%juneteenth%'
           OR LOWER(name) LIKE '%mardi%'
           OR LOWER(name) LIKE '%heritage%'
           OR LOWER(name) LIKE '%pow%wow%'
           OR LOWER(name) LIKE '%powwow%'
         )
       RETURNING id`
    );
    res.json({ ok: true, recategorized: result.rowCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "recategorize-festivals error");
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /admin/seed-national-festivals ───────────────────────────────────────
// Seeds 120+ national heritage festivals with pin_type=heritage_festival (gold).
// Dedup-safe: skips any name+state already in cultural_sites.
router.post("/admin/seed-national-festivals", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    let inserted = 0; let skipped = 0;
    for (const f of NATIONAL_FESTIVALS_SEED) {
      const exists = await pool.query(
        `SELECT id FROM cultural_sites
         WHERE LOWER(name)=LOWER($1) AND LOWER(state)=LOWER($2) LIMIT 1`,
        [f.name, f.state]
      );
      if (exists.rows.length) { skipped++; continue; }
      await pool.query(
        `INSERT INTO cultural_sites
          (id, name, description, category, heritage_category, subcategory,
           ethnic_community, city, state, latitude, longitude, era,
           significance, external_url, pin_type,
           is_accessible, is_family_friendly, admission_free, is_verified,
           verified_source, created_at)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
           true,true,true,true,$16,NOW())`,
        [
          randomUUID(),
          f.name,
          f.description,
          "Cultural Celebration",
          f.heritageCategory,
          "Annual Festival",
          f.ethnicCommunity ?? null,
          f.city,
          f.state,
          f.latitude,
          f.longitude,
          f.typicalMonth,
          f.significance,
          f.externalUrl ?? null,
          "heritage_festival",
          "Community Knowledge",
        ]
      );
      inserted++;
    }
    req.log.info({ inserted, skipped }, "seed-national-festivals done");
    res.json({ ok: true, inserted, skipped, total: NATIONAL_FESTIVALS_SEED.length });
  } catch (err) {
    req.log.error({ err }, "seed-national-festivals error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-sundown-towns-national ───────────────────────────────────
// Seeds 60+ additional national sundown towns into the sundown_towns table.
// Corrects the geographic bias toward the Southeast in the initial seed.
// Dedup-safe: skips any name+state already in the table.
router.post("/admin/seed-sundown-towns-national", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    // Ensure table exists (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sundown_towns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        state TEXT,
        county TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        confidence_level TEXT DEFAULT 'possible',
        historical_evidence TEXT,
        time_period TEXT,
        excluded_population TEXT DEFAULT 'Black residents',
        source_organization TEXT,
        source_url TEXT,
        current_state TEXT DEFAULT 'historical_neutral',
        report_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    let inserted = 0; let skipped = 0;
    for (const t of NATIONAL_SUNDOWN_TOWNS_SEED) {
      const exists = await pool.query(
        `SELECT id FROM sundown_towns
         WHERE LOWER(name)=LOWER($1) AND LOWER(state)=LOWER($2) LIMIT 1`,
        [t.name, t.state]
      );
      if (exists.rows.length) { skipped++; continue; }
      await pool.query(
        `INSERT INTO sundown_towns
          (id,name,city,state,county,latitude,longitude,confidence_level,
           historical_evidence,time_period,excluded_population,
           source_organization,current_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          randomUUID(),
          t.name, t.city, t.state, t.county ?? null,
          t.latitude, t.longitude,
          t.confidence_level,
          t.historical_evidence,
          t.time_period,
          t.excluded_population ?? "African American",
          t.source_organization,
          "historical_neutral",
        ]
      );
      inserted++;
    }
    req.log.info({ inserted, skipped }, "seed-sundown-towns-national done");
    res.json({ ok: true, inserted, skipped, total: NATIONAL_SUNDOWN_TOWNS_SEED.length });
  } catch (err) {
    req.log.error({ err }, "seed-sundown-towns-national error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-demo-taps ────────────────────────────────────────────────
// Seeds demonstration endorsement taps so tags are visible above the 10-tap
// threshold. Uses deterministic demo user IDs (demo_tap_user_01..15) so they
// are distinguishable from real community taps and can be cleaned up later.
// Each call is fully idempotent — ON CONFLICT DO NOTHING.
router.post("/admin/seed-demo-taps", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    // Map: businessName → tag_keys to demo-seed
    const DEMO_TAPS: Record<string, string[]> = {
      // ── Philly Barber Studios ─────────────────────────────────────────────
      "Philly Barber Studios": [
        "patient_with_kids", "sharpest_lineup", "on_time_every_time",
        "worth_the_price", "blessed_hands",
      ],
      // ── AMINA ─────────────────────────────────────────────────────────────
      "AMINA": [
        "cooks_like_home", "seasoned_right", "grandma_approved",
        "portions_with_love", "worth_the_drive", "i_sent_the_group_chat",
      ],
      // ── SOUTH ─────────────────────────────────────────────────────────────
      "SOUTH": [
        "book_this_table", "don_t_sleep_on_this_one", "date_night",
        "cooks_like_home", "seasoned_right",
      ],
      // ── The Nail Jawns ────────────────────────────────────────────────────
      "The Nail Jawns": [
        "style_lasted", "book_now", "worth_the_price",
        "on_time_every_time", "blessed_hands",
      ],
      // ── Angie's Eats ──────────────────────────────────────────────────────
      "Angie's Eats": [
        "portions_with_love", "seasoned_right", "i_sent_the_group_chat",
        "cooks_like_home", "fresh_not_frozen",
      ],
    };

    const DEMO_USER_COUNT = 12; // above 10-tap threshold

    // Step 1: Create 12 predictable demo users in the users table (if not exist).
    // These are identifiable system accounts, not real community members.
    const DEMO_USER_IDS = Array.from({ length: DEMO_USER_COUNT }, (_, i) =>
      `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`
    );

    // Build batch INSERT for demo users
    const userValues = DEMO_USER_IDS.map((_, i) => `($${i + 1},'Demo Tap User ${i + 1}','system')`).join(",");
    await pool.query(
      `INSERT INTO users (id, first_name, role) VALUES ${userValues} ON CONFLICT (id) DO NOTHING`,
      DEMO_USER_IDS
    );

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [bizName, tagKeys] of Object.entries(DEMO_TAPS)) {
      const bizRow = await pool.query(
        `SELECT id FROM businesses WHERE name = $1 LIMIT 1`, [bizName]
      );
      if (bizRow.rows.length === 0) {
        req.log.warn({ bizName }, "demo-taps: business not found, skipping");
        continue;
      }
      const businessId = bizRow.rows[0].id;

      // Batch INSERT all taps for this tag — one round-trip per tag
      for (const tagKey of tagKeys) {
        const values: string[] = [];
        const params: string[] = [];
        let p = 1;
        for (const demoUserId of DEMO_USER_IDS) {
          values.push(`($${p++},$${p++},$${p++},NOW())`);
          params.push(businessId, demoUserId, tagKey);
        }
        const r = await pool.query(
          `INSERT INTO business_endorsement_taps (business_id, user_id, tag_key, created_at)
           VALUES ${values.join(",")}
           ON CONFLICT (business_id, user_id, tag_key) DO NOTHING`,
          params
        );
        totalInserted += r.rowCount ?? 0;
      }
    }

    res.json({ ok: true, inserted: totalInserted, skipped: totalSkipped, demoUsers: DEMO_USER_COUNT });
  } catch (err) {
    req.log.error({ err }, "seed-demo-taps error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/patch-business-coordinates ────────────────────────────────────
// Patches real geocoded coordinates for seeded businesses that got city-centroid defaults.
// Body: { businesses: [{ name: string, latitude: number, longitude: number }] }
router.post("/admin/patch-business-coordinates", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const { businesses: patches } = req.body as {
      businesses: Array<{ name: string; latitude: number; longitude: number; approximate?: boolean }>;
    };
    if (!Array.isArray(patches) || patches.length === 0) {
      res.status(400).json({ error: "businesses array required" }); return;
    }
    const results: Array<{ name: string; updated: number }> = [];
    for (const p of patches) {
      const r = await pool.query(
        `UPDATE businesses
         SET latitude = $1, longitude = $2
         WHERE LOWER(name) = LOWER($3)`,
        [p.latitude, p.longitude, p.name]
      );
      results.push({ name: p.name, updated: r.rowCount ?? 0 });
    }
    res.json({ ok: true, results });
  } catch (err) {
    req.log.error({ err }, "patch-business-coordinates error");
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /admin/patch-listing-status ─────────────────────────────────────────
// One-time fix: set listing_status='live_unclaimed' on all businesses that
// have profile_status='community_listed' but listing_status IS NULL.
router.post("/admin/patch-listing-status", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const r = await pool.query(
      `UPDATE businesses
       SET listing_status = 'live_unclaimed'
       WHERE profile_status = 'community_listed'
         AND (listing_status IS NULL OR listing_status = '')`
    );
    res.json({ ok: true, updated: r.rowCount });
  } catch (err) {
    req.log.error({ err }, "patch-listing-status error");
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /admin/seed-directory-businesses ─────────────────────────────────────
// Seeds the 6 businesses from the MASTER Business Directory Excel file.
// Sets listing_status = community_listed (unclaimed). Dedup by name+city+state.
router.post("/admin/seed-directory-businesses", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    let inserted = 0; let skipped = 0;
    for (const b of DIRECTORY_BUSINESSES_SEED) {
      const exists = await pool.query(
        `SELECT id FROM businesses WHERE LOWER(name)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3) LIMIT 1`,
        [b.name, b.city, b.state]
      );
      if (exists.rows.length) { skipped++; continue; }
      const isBlack = b.ownershipDesignations.some((d) =>
        ["Black / African American-Owned", "African-Owned", "West African-Owned",
         "Nigerian-Owned", "Ghanaian-Owned", "Liberian-Owned", "Ethiopian-Owned",
         "Somali-Owned", "East African-Owned", "Caribbean / West Indian-Owned",
         "Afro-Caribbean-Owned", "Jamaican-Owned", "Haitian-Owned",
         "Trinidadian & Tobagonian-Owned", "Afro-Latino-Owned"].includes(d)
      );
      await pool.query(
        `INSERT INTO businesses
          (id, name, category, subcategory, address, city, state,
           description, website, instagram, tiktok, primary_social_platform,
           ownership_designations, vibes, black_owned,
           latitude, longitude,
           listing_status, profile_status, status,
           rating, review_count, verified, featured,
           confidence_score, tags, photos, pending_photos, videos,
           trust_badges, flag_count, flag_status, hidden_gem_nominations,
           marketplace_tier, business_status, marketplace_fee_locked,
           promotion_eligible, feedback_opt_in, show_availability,
           community_audience_type, is_reference_only,
           created_at, updated_at)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,
           $8,$9,$10,$11,$12,
           $13,$14,$15,
           $16,$17,
           'live_unclaimed','community_listed','active',
           0,0,false,false,
           0,'[]','[]','[]','[]',
           '[]',0,'none',0,
           'free','community',false,
           true,false,false,
           'unknown',false,
           NOW(),NOW())`,
        [
          randomUUID(),
          b.name, b.category, b.subcategory,
          b.address ?? `${b.city}, ${b.state}`,
          b.city, b.state,
          b.description ?? `${b.name} — community-listed business in ${b.city}, ${b.state}.`,
          b.website ?? null, b.instagram ?? null, b.tiktok ?? null,
          b.primarySocialPlatform ?? null,
          JSON.stringify(b.ownershipDesignations),
          JSON.stringify(b.vibes ?? []),
          isBlack,
          b.latitude, b.longitude,
        ]
      );
      inserted++;
    }
    req.log.info({ inserted, skipped }, "seed-directory-businesses done");
    res.json({ ok: true, inserted, skipped, total: DIRECTORY_BUSINESSES_SEED.length });
  } catch (err) {
    req.log.error({ err }, "seed-directory-businesses error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-endorsement-tags ────────────────────────────────────────
// Seeds the endorsement_tags and endorsement_tag_variants tables.
// Creates tables if they don't exist (idempotent). Skips existing keys.
router.post("/admin/seed-endorsement-tags", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    // Create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS endorsement_tags (
        id SERIAL PRIMARY KEY,
        tag_key VARCHAR(100) NOT NULL UNIQUE,
        tag_family VARCHAR(100),
        tag_type VARCHAR(20) NOT NULL,
        default_label VARCHAR(200) NOT NULL,
        helper_text TEXT,
        category_ids JSONB NOT NULL DEFAULT '[]',
        subcategory_keys JSONB NOT NULL DEFAULT '[]',
        sort_weight INTEGER NOT NULL DEFAULT 50,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS endorsement_tag_variants (
        id SERIAL PRIMARY KEY,
        tag_family VARCHAR(100) NOT NULL,
        community_code VARCHAR(50) NOT NULL,
        display_label VARCHAR(200) NOT NULL,
        said_verb VARCHAR(50) NOT NULL DEFAULT 'said',
        subcategory_key VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tag_family, community_code, subcategory_key)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_endorsement_taps (
        id SERIAL PRIMARY KEY,
        business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tag_key VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(business_id, user_id, tag_key)
      )
    `);

    // Seed endorsement_tags
    let tagsInserted = 0; let tagsSkipped = 0;
    for (const t of ENDORSEMENT_TAGS) {
      const exists = await pool.query(`SELECT id FROM endorsement_tags WHERE tag_key=$1 LIMIT 1`, [t.tag_key]);
      if (exists.rows.length) { tagsSkipped++; continue; }
      await pool.query(
        `INSERT INTO endorsement_tags (tag_key, tag_family, tag_type, default_label, helper_text, category_ids, subcategory_keys, sort_weight)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [t.tag_key, t.tag_family, t.tag_type, t.default_label, t.helper_text,
         JSON.stringify(t.category_ids), JSON.stringify(t.subcategory_keys), t.sort_weight]
      );
      tagsInserted++;
    }

    // Seed endorsement_tag_variants
    let varInserted = 0; let varSkipped = 0;
    for (const v of ENDORSEMENT_TAG_VARIANTS) {
      const subKey = v.subcategory_key ?? null;
      const exists = await pool.query(
        `SELECT id FROM endorsement_tag_variants WHERE tag_family=$1 AND community_code=$2 AND (subcategory_key=$3 OR (subcategory_key IS NULL AND $3 IS NULL)) LIMIT 1`,
        [v.tag_family, v.community_code, subKey]
      );
      if (exists.rows.length) { varSkipped++; continue; }
      await pool.query(
        `INSERT INTO endorsement_tag_variants (tag_family, community_code, display_label, said_verb, subcategory_key)
         VALUES ($1,$2,$3,$4,$5)`,
        [v.tag_family, v.community_code, v.display_label, v.said_verb, subKey]
      );
      varInserted++;
    }

    req.log.info({ tagsInserted, tagsSkipped, varInserted, varSkipped }, "seed-endorsement-tags done");
    res.json({
      ok: true,
      tags: { inserted: tagsInserted, skipped: tagsSkipped, total: ENDORSEMENT_TAGS.length },
      variants: { inserted: varInserted, skipped: varSkipped, total: ENDORSEMENT_TAG_VARIANTS.length },
    });
  } catch (err) {
    req.log.error({ err }, "seed-endorsement-tags error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/seed-the-real-tags ───────────────────────────────────────────
// Idempotent seed of all 151 THE REAL professional trust-signal tags.
// Creates the the_real_tags and the_real_taps tables if missing, then inserts
// all tags from the permanent constants, skipping any that already exist.
router.post("/admin/seed-the-real-tags", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    // Create tables if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS the_real_tags (
        tag_key          TEXT PRIMARY KEY,
        label            TEXT NOT NULL,
        category         TEXT NOT NULL,
        type             TEXT NOT NULL DEFAULT 'real-specific',
        adaptive_family  TEXT,
        subcategory_scope TEXT NOT NULL DEFAULT 'all',
        helper_text      TEXT NOT NULL DEFAULT '',
        sort_weight      INTEGER NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS the_real_taps (
        id          TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        user_id     TEXT NOT NULL,
        tag_key     TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT the_real_taps_business_user_tag UNIQUE (business_id, user_id, tag_key)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS the_real_taps_business_idx ON the_real_taps (business_id)
    `);

    let inserted = 0, skipped = 0;
    for (const t of THE_REAL_TAGS) {
      const existing = await pool.query(
        `SELECT tag_key FROM the_real_tags WHERE tag_key = $1`,
        [t.tag_key]
      );
      if (existing.rows.length > 0) { skipped++; continue; }
      await pool.query(
        `INSERT INTO the_real_tags
           (tag_key, label, category, type, adaptive_family, subcategory_scope, helper_text)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [t.tag_key, t.label, t.category, t.type, t.adaptive_family ?? null,
         t.subcategory_scope, t.helper_text]
      );
      inserted++;
    }

    req.log.info({ inserted, skipped }, "seed-the-real-tags done");
    res.json({ ok: true, inserted, skipped, total: THE_REAL_TAGS.length });
  } catch (err) {
    req.log.error({ err }, "seed-the-real-tags error");
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

// ── POST /admin/geocode-business ──────────────────────────────────────────────
// Auto-geocodes a business by name + address using Google Maps Geocoding API.
// Body: { name: string, address: string, city: string, state: string }
// Updates the business row with the geocoded lat/lng.
router.post("/admin/geocode-business", async (req: Request, res: Response) => {
  const _cs = process.env.CRON_SECRET;
  if (!isAdmin(req) && !(_cs && req.headers["x-cron-secret"] === _cs)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const { name, address, city, state } = req.body as {
      name?: string; address?: string; city?: string; state?: string;
    };
    if (!name || !city || !state) {
      res.status(400).json({ error: "name, city, and state are required" }); return;
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) { res.status(500).json({ error: "GOOGLE_MAPS_API_KEY not configured" }); return; }

    const query = encodeURIComponent([address, city, state].filter(Boolean).join(", "));
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`,
    );
    const geoData = await geoRes.json() as any;

    if (geoData.status !== "OK" || !geoData.results?.[0]?.geometry?.location) {
      res.status(422).json({ error: "Geocoding failed", status: geoData.status }); return;
    }

    const { lat, lng } = geoData.results[0].geometry.location as { lat: number; lng: number };
    const formattedAddress = geoData.results[0].formatted_address as string;

    const r = await pool.query(
      `UPDATE businesses SET latitude = $1, longitude = $2 WHERE LOWER(name) = LOWER($3)`,
      [lat, lng, name],
    );

    res.json({ ok: true, lat, lng, formattedAddress, updated: r.rowCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "geocode-business error");
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /admin/set-user-password ────────────────────────────────────────────
// CRON_SECRET only. Force-sets a user's password hash by email.
// Used for review account setup — sets password without email verification.
// Body: { email: string, password: string }
router.post("/admin/set-user-password", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const cronHeader = req.headers["x-cron-secret"];
  if (!cronSecret || cronHeader !== cronSecret) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: "email and password (min 8 chars) required" });
    return;
  }
  try {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(password, 8);
    const r = await pool.query(
      `UPDATE users SET password_hash = $1, email_verified = true,
        email_verification_token = NULL, email_verification_expires = NULL,
        failed_login_attempts = 0, locked_until = NULL
       WHERE LOWER(email) = LOWER($2)
       RETURNING id, email, member_type, approved`,
      [hash, email.trim()]
    );
    if ((r.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ok: true, user: r.rows[0] });
  } catch (err) {
    req.log.error({ err }, "POST /admin/set-user-password error");
    res.status(500).json({ error: "Failed", detail: String(err) });
  }
});

export default router;


