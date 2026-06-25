import { Router, type IRouter, type Request, type Response } from "express";
import { db, journalInsightsTable, journalInsightBookmarksTable, journalSyncLogTable, DESIGNATIONS, INSIGHT_JOURNALS, HEALTH_TOPICS } from "@workspace/db";
import { eq, and, desc, sql, inArray, or, like } from "drizzle-orm";
import type { DesignationId, InsightJournalId } from "@workspace/db";

const router: IRouter = Router();

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL = "MappingWithMelanin";
const EMAIL = "health@mappingwithmelanin.com";

// All designation keywords combined (for building search query)
const ALL_DESIGNATION_KEYWORDS = DESIGNATIONS.flatMap(d => d.keywords);
// Health topic keyword map for tagging
const TOPIC_KEYWORD_MAP: Record<string, string[]> = {
  "pediatric": ["pediatric", "child health", "childhood", "infant", "newborn", "adolescent"],
  "diabetes": ["diabetes", "diabetic", "blood sugar", "glycemic", "insulin", "A1C"],
  "womens-health": ["women's health", "gynecol", "ovarian", "uterine", "cervical", "menopause", "estrogen"],
  "mens-health": ["men's health", "prostate", "testosterone", "erectile"],
  "mental-health": ["mental health", "depression", "anxiety", "trauma", "PTSD", "psychiatric", "behavioral health"],
  "heart-health": ["cardiovascular", "cardiac", "heart disease", "hypertension", "blood pressure", "coronary", "stroke"],
  "nutrition": ["nutrition", "diet", "dietary", "obesity", "overweight", "food insecurity"],
  "fitness": ["physical activity", "exercise", "sedentary", "fitness"],
  "cancer": ["cancer", "oncol", "tumor", "malignant", "carcinoma", "breast cancer", "lung cancer", "colon cancer"],
  "maternal": ["maternal", "pregnancy", "prenatal", "postpartum", "preeclampsia", "birth", "obstetric"],
  "hypertension": ["hypertension", "blood pressure", "antihypertensive"],
  "sickle-cell": ["sickle cell", "sickle-cell", "hemoglobin S"],
  "elder-care": ["aging", "elderly", "dementia", "Alzheimer", "geriatric", "older adult"],
  "hiv-aids": ["HIV", "AIDS", "antiretroviral", "viral load"],
  "substance-recovery": ["addiction", "substance use", "opioid", "alcohol use", "drug use", "recovery"],
  "reproductive": ["reproductive", "fertility", "contraceptive", "sexually transmitted", "STI", "STD"],
  "kidney": ["kidney", "renal", "dialysis", "nephropathy", "chronic kidney disease"],
  "respiratory": ["respiratory", "asthma", "COPD", "pulmonary", "lung", "COVID"],
  "dental": ["dental", "oral health", "periodontal", "tooth"],
  "vision": ["vision", "ophthalm", "glaucoma", "retinal", "eye disease"],
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Parse PubMed MEDLINE text format ─────────────────────────────────────────
function parseMedlineText(text: string) {
  const articles: Array<{
    pmid: string; title: string; abstract: string;
    authors: string[]; journal: string; journalAbbrev: string;
    pubDate: string; doi: string;
  }> = [];

  // Split into records (each starts with PMID-)
  const parts = text.split(/(?=^PMID- )/m).filter(p => p.trim());

  for (const part of parts) {
    const fieldMap: Record<string, string[]> = {};
    let currentTag = "";

    for (const line of part.split("\n")) {
      // Tag line: TAG  - value  (TAG is 1-6 uppercase chars, then spaces, then "- ")
      const tagMatch = line.match(/^([A-Z]{2,6})\s+- (.*)/);
      if (tagMatch) {
        currentTag = tagMatch[1];
        if (!fieldMap[currentTag]) fieldMap[currentTag] = [];
        fieldMap[currentTag].push(tagMatch[2]);
      } else if (currentTag && /^\s{6}/.test(line)) {
        // Continuation line
        const arr = fieldMap[currentTag];
        if (arr.length > 0) arr[arr.length - 1] += " " + line.trim();
      }
    }

    const pmid = fieldMap["PMID"]?.[0]?.trim();
    if (!pmid) continue;

    // DOI from LID or AID fields (format: "10.xxx/yyy [doi]")
    const lidFields = [...(fieldMap["LID"] ?? []), ...(fieldMap["AID"] ?? [])];
    const doiField = lidFields.find(v => v.toLowerCase().includes("[doi]"));
    const doi = doiField ? doiField.replace(/\s*\[doi\]/i, "").trim() : "";

    articles.push({
      pmid,
      title: (fieldMap["TI"] ?? []).join(" ").replace(/\.$/, ""),
      abstract: (fieldMap["AB"] ?? []).join(" "),
      authors: (fieldMap["FAU"] ?? fieldMap["AU"] ?? []).slice(0, 10),
      journal: fieldMap["JT"]?.[0]?.trim() ?? "",
      journalAbbrev: fieldMap["TA"]?.[0]?.trim() ?? "",
      pubDate: fieldMap["DP"]?.[0]?.trim() ?? "",
      doi,
    });
  }

  return articles;
}

// ─── Detect designations in text ─────────────────────────────────────────────
function detectDesignations(text: string): DesignationId[] {
  const lower = text.toLowerCase();
  return DESIGNATIONS
    .filter(d => d.keywords.some(kw => lower.includes(kw.toLowerCase())))
    .map(d => d.id);
}

// ─── Detect health topics in text ────────────────────────────────────────────
function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(TOPIC_KEYWORD_MAP)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw.toLowerCase())))
    .map(([topicId]) => topicId);
}

// ─── PubMed search → PMIDs ────────────────────────────────────────────────────
async function searchPubMed(query: string, maxResults = 100): Promise<string[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    retmode: "json",
    tool: TOOL,
    email: EMAIL,
    sort: "pub+date",
  });
  const res = await fetch(`${PUBMED_BASE}/esearch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed esearch failed: ${res.status}`);
  const data = await res.json() as { esearchresult?: { idlist?: string[] } };
  return data.esearchresult?.idlist ?? [];
}

// ─── PubMed fetch → MEDLINE text (batch, up to 100 IDs) ─────────────────────
async function fetchMedline(pmids: string[]): Promise<string> {
  if (!pmids.length) return "";
  const params = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    rettype: "medline",
    retmode: "text",
    tool: TOOL,
    email: EMAIL,
  });
  const res = await fetch(`${PUBMED_BASE}/efetch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed efetch failed: ${res.status}`);
  return res.text();
}

// ─── Core sync function ───────────────────────────────────────────────────────
async function syncJournal(journalId: string, minDaysBack = 730): Promise<{ found: number; inserted: number; error?: string }> {
  const journal = INSIGHT_JOURNALS.find(j => j.id === journalId);
  if (!journal) return { found: 0, inserted: 0, error: "Unknown journal" };

  try {
    // Build designation keyword query (all designations combined)
    const kwTerms = ALL_DESIGNATION_KEYWORDS.map(kw => `"${kw}"[tiab]`).join(" OR ");
    const minDate = new Date(Date.now() - minDaysBack * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0].replace(/-/g, "/");
    const query = `((${kwTerms}) AND "${journal.abbrev}"[ta] AND ("${minDate}"[dp] : "3000"[dp]))`;

    const pmids = await searchPubMed(query, 100);
    if (!pmids.length) return { found: 0, inserted: 0 };

    // Filter out PMIDs already in DB
    const existing = await db
      .select({ pmid: journalInsightsTable.pmid })
      .from(journalInsightsTable)
      .where(inArray(journalInsightsTable.pmid, pmids));
    const existingSet = new Set(existing.map(r => r.pmid));
    const newPmids = pmids.filter(id => !existingSet.has(id));

    if (!newPmids.length) return { found: pmids.length, inserted: 0 };

    // Fetch MEDLINE in batches of 50
    let inserted = 0;
    for (let i = 0; i < newPmids.length; i += 50) {
      const batch = newPmids.slice(i, i + 50);
      await sleep(400); // respect rate limit

      const medlineText = await fetchMedline(batch);
      const articles = parseMedlineText(medlineText);

      for (const article of articles) {
        if (!article.title) continue;

        const fullText = `${article.title} ${article.abstract}`;
        const designationIds = detectDesignations(fullText);
        const healthTopicIds = detectTopics(fullText);

        const url = `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`;
        const doiUrl = article.doi ? `https://doi.org/${article.doi}` : url;

        try {
          await db.insert(journalInsightsTable).values({
            pmid: article.pmid,
            title: article.title.slice(0, 500),
            abstract: article.abstract ? article.abstract.slice(0, 3000) : null,
            authors: article.authors.slice(0, 10),
            journalId,
            journalLabel: journal.label,
            journalAbbrev: journal.abbrev,
            pubDate: article.pubDate,
            doi: article.doi || null,
            url: doiUrl,
            designationIds,
            healthTopicIds,
          }).onConflictDoNothing();
          inserted++;
        } catch { /* skip duplicates */ }
      }
    }

    return { found: pmids.length, inserted };
  } catch (err) {
    return { found: 0, inserted: 0, error: String(err) };
  }
}

// ─── GET /api/journal-insights/meta ──────────────────────────────────────────
router.get("/journal-insights/meta", (_req: Request, res: Response) => {
  res.json({ designations: DESIGNATIONS, journals: INSIGHT_JOURNALS });
});

// ─── GET /api/journal-insights ────────────────────────────────────────────────
router.get("/journal-insights", async (req: Request, res: Response) => {
  const { designation, journal, topic, limit: limitStr, offset: offsetStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitStr ?? "20", 10) || 20, 50);
  const offset = parseInt(offsetStr ?? "0", 10) || 0;

  // We pull all and filter in JS for array-contains (JSONB) — works fine at this scale
  const rows = await db
    .select()
    .from(journalInsightsTable)
    .orderBy(desc(journalInsightsTable.syncedAt))
    .limit(500); // fetch a pool then filter

  let filtered = rows;

  if (designation) {
    filtered = filtered.filter(r => (r.designationIds as string[]).includes(designation));
  }
  if (journal) {
    filtered = filtered.filter(r => r.journalId === journal);
  }
  if (topic) {
    filtered = filtered.filter(r => (r.healthTopicIds as string[]).includes(topic));
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  // Attach bookmark status for auth users
  let bookmarkedSet = new Set<string>();
  if (req.user?.id) {
    const bookmarks = await db
      .select({ insightId: journalInsightBookmarksTable.insightId })
      .from(journalInsightBookmarksTable)
      .where(eq(journalInsightBookmarksTable.userId, req.user.id));
    bookmarkedSet = new Set(bookmarks.map(b => b.insightId));
  }

  res.json({
    insights: page.map(r => ({ ...r, bookmarked: bookmarkedSet.has(r.id) })),
    total,
    limit,
    offset,
  });
});

// ─── GET /api/journal-insights/bookmarks ──────────────────────────────────────
router.get("/journal-insights/bookmarks", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const bookmarks = await db
    .select({ insightId: journalInsightBookmarksTable.insightId })
    .from(journalInsightBookmarksTable)
    .where(eq(journalInsightBookmarksTable.userId, req.user.id));

  if (!bookmarks.length) { res.json({ insights: [] }); return; }

  const ids = bookmarks.map(b => b.insightId);
  const insights = await db
    .select()
    .from(journalInsightsTable)
    .where(inArray(journalInsightsTable.id, ids))
    .orderBy(desc(journalInsightsTable.syncedAt));

  res.json({ insights: insights.map(r => ({ ...r, bookmarked: true })) });
});

// ─── POST /api/journal-insights/:id/bookmark ─────────────────────────────────
router.post("/journal-insights/:id/bookmark", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const insightId = String(req.params.id);
  const [existing] = await db
    .select({ id: journalInsightBookmarksTable.id })
    .from(journalInsightBookmarksTable)
    .where(and(
      eq(journalInsightBookmarksTable.insightId, insightId),
      eq(journalInsightBookmarksTable.userId, req.user.id),
    ))
    .limit(1);

  if (existing) {
    await db.delete(journalInsightBookmarksTable).where(eq(journalInsightBookmarksTable.id, existing.id));
    await db.update(journalInsightsTable).set({ bookmarkCount: sql`bookmark_count - 1` }).where(eq(journalInsightsTable.id, insightId));
    res.json({ bookmarked: false });
  } else {
    await db.insert(journalInsightBookmarksTable).values({ insightId, userId: req.user.id });
    await db.update(journalInsightsTable).set({ bookmarkCount: sql`bookmark_count + 1` }).where(eq(journalInsightsTable.id, insightId));
    res.json({ bookmarked: true });
  }
});

// ─── POST /api/journal-insights/admin/sync ───────────────────────────────────
router.post("/journal-insights/admin/sync", async (req: Request, res: Response) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { journalId, daysBack } = req.body as { journalId?: string; daysBack?: number };
  const days = daysBack ?? 730;
  const journals = journalId ? [journalId] : INSIGHT_JOURNALS.map(j => j.id);

  const results: Array<{ journalId: string; found: number; inserted: number; error?: string }> = [];

  for (const jid of journals) {
    req.log.info({ journalId: jid }, "Syncing journal insights from PubMed");
    const result = await syncJournal(jid, days);
    results.push({ journalId: jid, ...result });

    // Log to DB
    await db.insert(journalSyncLogTable).values({
      journalId: jid,
      articlesFound: result.found,
      articlesInserted: result.inserted,
      error: result.error ?? null,
    });

    if (journals.length > 1) await sleep(500); // space out journal queries
  }

  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  req.log.info({ results, totalInserted }, "Journal insights sync complete");
  res.json({ results, totalInserted });
});

// ─── POST /api/journal-insights/admin/curate ─────────────────────────────────
// Manually add a curated insight (not from PubMed)
router.post("/journal-insights/admin/curate", async (req: Request, res: Response) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { pmid, title, abstract, authors, journalId, pubDate, doi, url, designationIds, healthTopicIds } = req.body as Record<string, any>;

  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }
  if (!url?.trim()) { res.status(400).json({ error: "url required" }); return; }

  const journal = INSIGHT_JOURNALS.find(j => j.id === journalId);

  const [insight] = await db.insert(journalInsightsTable).values({
    pmid: pmid ?? `curated-${Date.now()}`,
    title: title.trim(),
    abstract: abstract?.trim() ?? null,
    authors: Array.isArray(authors) ? authors : [],
    journalId: journalId ?? "curated",
    journalLabel: journal?.label ?? journalId,
    journalAbbrev: journal?.abbrev ?? null,
    pubDate: pubDate ?? null,
    doi: doi ?? null,
    url: url.trim(),
    designationIds: Array.isArray(designationIds) ? designationIds : [],
    healthTopicIds: Array.isArray(healthTopicIds) ? healthTopicIds : [],
    isCurated: true,
  }).returning();

  res.json({ insight });
});

// ─── GET /api/journal-insights/admin/sync-log ─────────────────────────────────
router.get("/journal-insights/admin/sync-log", async (req: Request, res: Response) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const log = await db
    .select()
    .from(journalSyncLogTable)
    .orderBy(desc(journalSyncLogTable.ranAt))
    .limit(50);

  res.json({ log });
});

export default router;
