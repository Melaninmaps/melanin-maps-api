import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

interface AlertItem {
  id: string;
  type: "safety" | "community" | "weather" | "travel";
  title: string;
  message: string;
  location: string;
  timeAgo: string;
  severity: "low" | "medium" | "high" | "critical";
  source: "nws" | "fema" | "septa" | "wmata" | "cta" | "bart" | "community";
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
    headers: { "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)", Accept: "application/geo+json" },
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

interface WmataAlert {
  IncidentID: string;
  Description: string;
  LinesAffected: string;
  IncidentType: string;
  DateUpdated: string;
}

async function fetchWmataAlerts(): Promise<AlertItem[]> {
  const apiKey = process.env.WMATA_API_KEY;
  if (!apiKey) return [];

  const url = "https://api.wmata.com/Incidents.svc/json/Incidents";
  const res = await fetch(url, {
    headers: { api_key: apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { Incidents?: WmataAlert[] };
  const incidents = json.Incidents ?? [];

  return incidents.slice(0, 5).map((i) => {
    const lines = i.LinesAffected.replace(/;/g, ",").replace(/,\s*$/, "").trim();
    return {
      id: `wmata-${i.IncidentID}`,
      type: "travel" as const,
      title: `DC Metro ${i.IncidentType}${lines ? ` — ${lines}` : ""}`,
      message: i.Description.trim().slice(0, 140),
      location: "Washington, DC",
      timeAgo: i.DateUpdated ? timeAgo(i.DateUpdated) : "recently",
      severity: i.IncidentType === "Alert" ? ("high" as const) : ("medium" as const),
      source: "wmata" as const,
    };
  });
}

interface SeptaRouteAlert {
  route_id: string;
  route_name: string;
  alert_text: string;
  detour_text: string | null;
  isSnow: string;
  last_updated: string;
}

async function fetchSeptaAlerts(): Promise<AlertItem[]> {
  const url = "https://www3.septa.org/api/Alerts/get_alert_data.php?route_id=all";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as { routes?: SeptaRouteAlert[] } | SeptaRouteAlert[];

  const routes: SeptaRouteAlert[] = Array.isArray(json)
    ? json
    : (json as { routes?: SeptaRouteAlert[] }).routes ?? [];

  return routes
    .filter((r) => r.alert_text && r.alert_text.trim().length > 0)
    .slice(0, 5)
    .map((r) => ({
      id: `septa-${r.route_id}`,
      type: "travel" as const,
      title: `SEPTA ${r.route_name} Alert`,
      message: r.alert_text.trim().slice(0, 140),
      location: "Philadelphia, PA",
      timeAgo: r.last_updated ? timeAgo(r.last_updated) : "recently",
      severity: r.isSnow === "1" ? ("high" as const) : ("medium" as const),
      source: "septa" as const,
    }));
}

async function fetchCtaAlerts(): Promise<AlertItem[]> {
  const url =
    "https://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&active=true&accessibility=false";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    CTAAlerts?: {
      Alert?:
        | Array<{
            AlertId?: string;
            Headline?: string;
            ShortDescription?: string;
            SeverityScore?: string;
            ImpactType?: string;
            EventStart?: string;
            Service?: Array<{ ServiceType?: string; ServiceTypeDescription?: string; ServiceName?: string }> | { ServiceType?: string; ServiceTypeDescription?: string; ServiceName?: string };
          }>
        | { AlertId?: string; Headline?: string; ShortDescription?: string; SeverityScore?: string; ImpactType?: string; EventStart?: string };
    };
  };

  const rawAlerts = json.CTAAlerts?.Alert;
  if (!rawAlerts) return [];

  const alerts = Array.isArray(rawAlerts) ? rawAlerts : [rawAlerts];

  return alerts
    .filter((a) => a.AlertId)
    .slice(0, 6)
    .map((a) => {
      const score = parseInt(String(a.SeverityScore ?? "3"), 10);
      const severity: AlertItem["severity"] =
        score >= 8 ? "high" : score >= 5 ? "medium" : "low";

      const services = a.Service
        ? Array.isArray(a.Service)
          ? a.Service
          : [a.Service]
        : [];
      const serviceNames = services
        .map((s) => s.ServiceName ?? s.ServiceTypeDescription ?? "")
        .filter(Boolean)
        .slice(0, 3)
        .join(", ");

      return {
        id: `cta-${a.AlertId ?? Math.random()}`,
        type: "travel" as const,
        title: `Chicago CTA${serviceNames ? ` — ${serviceNames}` : ""}: ${a.ImpactType ?? "Alert"}`,
        message: (a.ShortDescription ?? a.Headline ?? "Service alert").slice(0, 140),
        location: "Chicago, IL",
        timeAgo: a.EventStart ? timeAgo(a.EventStart) : "recently",
        severity,
        source: "cta" as const,
      };
    });
}

async function fetchBartAlerts(): Promise<AlertItem[]> {
  const url =
    "https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=MW9S-E7SL-26DU-VUS2&json=y";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    root?: {
      bsa?:
        | Array<{ "@id"?: string; type?: string; description?: { "#cdata-section"?: string } | string; posted?: string }>
        | { "@id"?: string; type?: string; description?: { "#cdata-section"?: string } | string; posted?: string };
    };
  };

  const rawBsa = json.root?.bsa;
  if (!rawBsa) return [];

  const bsaList = Array.isArray(rawBsa) ? rawBsa : [rawBsa];

  return bsaList
    .filter((b) => {
      const desc = typeof b.description === "object" ? b.description?.["#cdata-section"] : b.description;
      return desc && String(desc).trim().length > 0 && String(desc) !== "No delays reported.";
    })
    .slice(0, 4)
    .map((b, idx) => {
      const desc = typeof b.description === "object"
        ? (b.description?.["#cdata-section"] ?? "")
        : (b.description ?? "");
      const alertType = String(b.type ?? "").toLowerCase();
      const severity: AlertItem["severity"] =
        alertType === "delay" ? "high" : alertType === "emergency" ? "critical" : "medium";
      return {
        id: `bart-${b["@id"] ?? idx}`,
        type: "travel" as const,
        title: `BART ${b.type ?? "Alert"}`,
        message: String(desc).trim().slice(0, 140),
        location: "San Francisco Bay Area, CA",
        timeAgo: b.posted ? timeAgo(b.posted) : "recently",
        severity,
        source: "bart" as const,
      };
    });
}

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const state = typeof req.query.state === "string" ? req.query.state.toUpperCase() : "";
    const city = typeof req.query.city === "string" ? req.query.city.toLowerCase() : "";
    const cacheKey = city || state || "national";

    const cached = alertCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      res.json({ alerts: cached.data, lastUpdated: new Date(cached.fetchedAt).toISOString(), cached: true });
      return;
    }

    const isPA = state === "PA";
    const isDC = state === "DC" || state === "MD" || state === "VA";
    const isIL = state === "IL" || city === "chicago";
    const isCA = state === "CA" || city === "sf" || city === "san francisco" || city === "oakland" || city === "bay area";

    const fetches: Promise<AlertItem[]>[] = [
      state ? fetchNwsAlerts(state) : Promise.resolve([] as AlertItem[]),
      fetchFemaAlerts(),
    ];

    if (isPA) fetches.push(fetchSeptaAlerts());
    if (isDC) fetches.push(fetchWmataAlerts());
    if (isIL) fetches.push(fetchCtaAlerts());
    if (isCA) fetches.push(fetchBartAlerts());

    const results = await Promise.allSettled(fetches);

    const allAlerts: AlertItem[] = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : [],
    );

    allAlerts.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });

    alertCache.set(cacheKey, { data: allAlerts, fetchedAt: Date.now() });

    res.json({ alerts: allAlerts, lastUpdated: new Date().toISOString(), cached: false });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch alerts");
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export default router;
