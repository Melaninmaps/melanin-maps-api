import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

interface AlertItem {
  id: string;
  type: "safety" | "community" | "weather" | "travel";
  title: string;
  message: string;
  location: string;
  timeAgo: string;
  severity: "low" | "medium" | "high";
  source: "nws" | "fema" | "community";
  expires?: string;
  url?: string;
}

interface CacheEntry {
  data: AlertItem[];
  fetchedAt: number;
}

const alertCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function nwsSeverityToLocal(severity: string): AlertItem["severity"] {
  if (severity === "Extreme" || severity === "Severe") return "high";
  if (severity === "Moderate") return "medium";
  return "low";
}

async function fetchNwsAlerts(area: string): Promise<AlertItem[]> {
  const url = `https://api.weather.gov/alerts/active?area=${encodeURIComponent(area)}&limit=10`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MappingWithMelanin/1.0 (contact@melaninmaps.com)", Accept: "application/geo+json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    features?: Array<{
      id: string;
      properties: {
        event: string;
        headline: string | null;
        description: string | null;
        severity: string;
        areaDesc: string;
        sent: string;
        expires: string | null;
        urgency: string;
        messageType: string;
      };
    }>;
  };

  if (!json.features) return [];

  return json.features
    .filter((f) => f.properties.messageType !== "Cancel")
    .slice(0, 8)
    .map((f) => {
      const p = f.properties;
      const headline = p.headline ?? p.event;
      const desc = p.description ? p.description.split("\n")[0].trim() : headline;
      return {
        id: `nws-${f.id}`,
        type: "weather" as const,
        title: p.event,
        message: desc.length > 140 ? desc.slice(0, 137) + "…" : desc,
        location: p.areaDesc.split(";")[0].trim(),
        timeAgo: timeAgo(p.sent),
        severity: nwsSeverityToLocal(p.severity),
        source: "nws" as const,
        expires: p.expires ?? undefined,
      };
    });
}

async function fetchFemaAlerts(): Promise<AlertItem[]> {
  const url =
    "https://www.fema.gov/api/open/v2/disasterDeclarationsSummaries?$orderby=declarationDate%20desc&$top=5&$select=disasterNumber,declarationTitle,state,declarationDate,incidentType,closeoutDate";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    DisasterDeclarationsSummaries?: Array<{
      disasterNumber: number;
      declarationTitle: string;
      state: string;
      declarationDate: string;
      incidentType: string;
      closeoutDate: string | null;
    }>;
  };

  if (!json.DisasterDeclarationsSummaries) return [];

  return json.DisasterDeclarationsSummaries
    .filter((d) => !d.closeoutDate)
    .slice(0, 3)
    .map((d) => ({
      id: `fema-${d.disasterNumber}`,
      type: "safety" as const,
      title: `${d.incidentType} — Federal Disaster Declaration`,
      message: `FEMA has issued a disaster declaration for ${d.declarationTitle} in ${d.state}.`,
      location: d.state,
      timeAgo: timeAgo(d.declarationDate),
      severity: "high" as const,
      source: "fema" as const,
    }));
}

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const state = typeof req.query.state === "string" ? req.query.state.toUpperCase() : "";
    const cacheKey = state || "national";

    const cached = alertCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      res.json({ alerts: cached.data, lastUpdated: new Date(cached.fetchedAt).toISOString(), cached: true });
      return;
    }

    const [nwsAlerts, femaAlerts] = await Promise.allSettled([
      state ? fetchNwsAlerts(state) : Promise.resolve([] as AlertItem[]),
      fetchFemaAlerts(),
    ]);

    const allAlerts: AlertItem[] = [
      ...(nwsAlerts.status === "fulfilled" ? nwsAlerts.value : []),
      ...(femaAlerts.status === "fulfilled" ? femaAlerts.value : []),
    ];

    allAlerts.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

    alertCache.set(cacheKey, { data: allAlerts, fetchedAt: Date.now() });

    res.json({ alerts: allAlerts, lastUpdated: new Date().toISOString(), cached: false });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch alerts");
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export default router;
