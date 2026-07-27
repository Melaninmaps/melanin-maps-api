import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

interface IncidentCount {
  type: string;
  count: number;
}

interface SafetyContext {
  city: string;
  source: string;
  period: string;
  totalIncidents: number;
  topConcerns: IncidentCount[];
  trend: "improving" | "stable" | "worsening";
  lastUpdated: string;
}

interface CacheEntry {
  data: SafetyContext;
  fetchedAt: number;
}

const contextCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const CITY_SOURCES: Record<
  string,
  { label: string; url: string; typeField: string; source: string }
> = {
  chicago: {
    label: "Chicago",
    url: "https://data.cityofchicago.org/resource/crimes.json?$select=primary_type,count(*)%20as%20count&$group=primary_type&$where=year=2026&$order=count%20DESC&$limit=10",
    typeField: "primary_type",
    source: "City of Chicago Open Data",
  },
  "new-york": {
    label: "New York",
    url: "https://data.cityofnewyork.us/resource/qgea-i56i.json?$select=ofns_desc,count(*)%20as%20count&$group=ofns_desc&$order=count%20DESC&$limit=10&$where=arrest_date%3E'2026-01-01'",
    typeField: "ofns_desc",
    source: "NYC Open Data (NYPD)",
  },
  philadelphia: {
    label: "Philadelphia",
    url: "https://phl.carto.com/api/v2/sql?q=SELECT%20text_general_code%20as%20primary_type%2Ccount(*)%20as%20count%20FROM%20incidents_part1_part2%20WHERE%20dispatch_date_time%20%3E%20'2026-01-01'%20GROUP%20BY%20text_general_code%20ORDER%20BY%20count%20DESC%20LIMIT%2010",
    typeField: "primary_type",
    source: "Philadelphia Police Department",
  },
  "washington-dc": {
    label: "Washington DC",
    url: "https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/MapServer/2/query?where=REPORT_DAT+%3E%3D+date+'2026-01-01'+00%3A00%3A00&outFields=OFFENSE&returnGeometry=false&f=json&resultRecordCount=1000",
    typeField: "OFFENSE",
    source: "DC Metropolitan Police",
  },
};

function formatIncidentType(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/And\b/, "and");
}

async function fetchChicagoOrNYC(config: {
  label: string;
  url: string;
  typeField: string;
  source: string;
}): Promise<SafetyContext | null> {
  const res = await fetch(config.url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<Record<string, string>>;
  if (!Array.isArray(data) || data.length === 0) return null;

  const counts: IncidentCount[] = data
    .map((row) => ({
      type: formatIncidentType(row[config.typeField] ?? "Unknown"),
      count: parseInt(row["count"] ?? "0", 10),
    }))
    .filter((r) => r.count > 0);

  const total = counts.reduce((s, r) => s + r.count, 0);

  return {
    city: config.label,
    source: config.source,
    period: "2026 YTD",
    totalIncidents: total,
    topConcerns: counts.slice(0, 5),
    trend: "stable",
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchDCData(config: {
  label: string;
  url: string;
  typeField: string;
  source: string;
}): Promise<SafetyContext | null> {
  const res = await fetch(config.url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { features?: Array<{ attributes: Record<string, string> }> };
  if (!json.features) return null;

  const tally: Record<string, number> = {};
  for (const f of json.features) {
    const key = f.attributes[config.typeField] ?? "Other";
    tally[key] = (tally[key] ?? 0) + 1;
  }

  const counts: IncidentCount[] = Object.entries(tally)
    .map(([type, count]) => ({ type: formatIncidentType(type), count }))
    .sort((a, b) => b.count - a.count);

  const total = counts.reduce((s, r) => s + r.count, 0);

  return {
    city: config.label,
    source: config.source,
    period: "2026 YTD",
    totalIncidents: total,
    topConcerns: counts.slice(0, 5),
    trend: "stable",
    lastUpdated: new Date().toISOString(),
  };
}

router.get("/safety-context", async (req: Request, res: Response) => {
  const cityKey =
    typeof req.query.city === "string" ? req.query.city.toLowerCase().replace(/\s+/g, "-") : "";

  const config = CITY_SOURCES[cityKey];
  if (!config) {
    const supported = Object.keys(CITY_SOURCES);
    res.status(400).json({
      error: `Unsupported city. Supported: ${supported.join(", ")}`,
      supported,
    });
    return;
  }

  const cached = contextCache.get(cityKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    res.json({ ...cached.data, cached: true });
    return;
  }

  try {
    let context: SafetyContext | null = null;
    if (cityKey === "washington-dc") {
      context = await fetchDCData(config);
    } else {
      context = await fetchChicagoOrNYC(config);
    }

    if (!context) {
      res.status(200).json({
        available: false,
        city: config.label,
        source: config.source,
        message: "Live crime data is temporarily unavailable for this city. Check back soon.",
      });
      return;
    }

    contextCache.set(cityKey, { data: context, fetchedAt: Date.now() });
    res.json({ ...context, cached: false });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safety context");
    res.status(500).json({ error: "Failed to fetch safety context" });
  }
});

router.get("/safety-context/supported", (_req: Request, res: Response) => {
  res.json({
    cities: Object.entries(CITY_SOURCES).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      source: cfg.source,
    })),
  });
});

export default router;
