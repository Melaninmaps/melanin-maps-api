import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// ─── Keyword filters for type-specific searches ─────────────────────────────
const TYPE_KEYWORDS: Record<string, string[]> = {
  aa:     ["alcoholics anonymous", "aa meeting", "alcohol", "12-step"],
  na:     ["narcotics anonymous", "na meeting", "narcotics", "substance"],
  alanon: ["al-anon", "alateen", "family support"],
  smart:  ["smart recovery"],
  ca:     ["cocaine anonymous"],
  oa:     ["overeaters anonymous"],
};

// SAMHSA BHTSL service codes for substance abuse / recovery support
// SA = Substance Abuse, MH = Mental Health, DT = Detox
const SAMHSA_SUBSTANCE_TYPES = "SA";

function scoreResult(name: string, type: string): boolean {
  if (type === "all") return true;
  const keywords = TYPE_KEYWORDS[type] ?? [];
  const nameLower = name.toLowerCase();
  return keywords.some((kw) => nameLower.includes(kw));
}

// ─── GET /wellness/meetings ──────────────────────────────────────────────────
// ?location=ZIP_OR_CITY&radius=25&type=aa|na|alanon|smart|ca|oa|all
router.get("/wellness/meetings", async (req: Request, res: Response) => {
  const location = (req.query["location"] as string | undefined)?.trim() ?? "";
  const radius = Number(req.query["radius"] ?? 25);
  const type = (req.query["type"] as string | undefined) ?? "all";

  if (!location) {
    res.status(400).json({ error: "location is required" });
    return;
  }

  try {
    // SAMHSA Behavioral Health Treatment Services Locator (public, no API key)
    const url = new URL("https://findtreatment.gov/locator/api/v1/facilities");
    url.searchParams.set("location", location);
    url.searchParams.set("distance", String(Math.min(radius, 100)));
    url.searchParams.set("type", SAMHSA_SUBSTANCE_TYPES);
    url.searchParams.set("pageSize", "50");

    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MappingWithMelanin/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      res.json({ facilities: [] });
      return;
    }

    const raw = (await upstream.json()) as {
      rows?: Array<{
        name1?: string;
        street1?: string;
        city?: string;
        state?: string;
        zip?: string;
        phone?: string;
        distance?: number;
        latitude?: number;
        longitude?: number;
        services?: string[];
        website?: string;
      }>;
    };

    const rows = raw.rows ?? [];

    const facilities = rows
      .filter((r) => scoreResult(r.name1 ?? "", type))
      .map((r) => ({
        name: r.name1 ?? "Unknown",
        address: r.street1 ?? "",
        city: r.city ?? "",
        state: r.state ?? "",
        zip: r.zip ?? "",
        phone: r.phone,
        distance: r.distance,
        lat: r.latitude,
        lng: r.longitude,
        services: r.services,
        website: r.website,
      }));

    res.json({ facilities });
  } catch {
    // Return empty on upstream errors rather than 500 — client handles gracefully
    res.json({ facilities: [] });
  }
});

// ─── GET /wellness/crisis-resources ──────────────────────────────────────────
// Returns static list of crisis hotlines — allows future CMS control
router.get("/wellness/crisis-resources", (_req: Request, res: Response) => {
  res.json({
    resources: [
      { id: "988",          name: "988 Suicide & Crisis Lifeline",        phone: "988",           text: "988",        available: "24/7" },
      { id: "crisis-text",  name: "Crisis Text Line",                      phone: null,            text: "741741",     textKeyword: "HOME", available: "24/7" },
      { id: "samhsa",       name: "SAMHSA National Helpline",              phone: "1-800-662-4357",text: null,         available: "24/7" },
      { id: "nami",         name: "NAMI Helpline",                         phone: "1-800-950-6264",text: "741741",     textKeyword: "NAMI", available: "Mon–Fri 10am–10pm ET" },
      { id: "trevor",       name: "The Trevor Project (LGBTQ+ Youth)",    phone: "1-866-488-7386",text: "678678",     textKeyword: "START", available: "24/7" },
      { id: "veterans",     name: "Veterans Crisis Line",                  phone: "988",           text: "838255",     available: "24/7 · Press 1 after dialing" },
      { id: "domestic",     name: "Domestic Violence Hotline",             phone: "1-800-799-7233",text: "88788",      textKeyword: "START", available: "24/7" },
    ],
  });
});

export default router;
