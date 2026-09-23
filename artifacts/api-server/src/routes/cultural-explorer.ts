import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

export const CULTURAL_EXPLORER_TABS = [
  "all",
  "hbcus",
  "landmarks",
  "historic_districts",
  "markets",
  "curated_events",
  "heritage_resources",
] as const;

export type CulturalExplorerTab = (typeof CULTURAL_EXPLORER_TABS)[number];

type ExplorerKind = "cultural_site" | "market" | "recurring_event" | "resource";
type ExplorerAction =
  | { type: "map"; culturalSiteId?: string; latitude: number; longitude: number }
  | { type: "cultural_detail"; culturalSiteId: string }
  | { type: "library"; question: string }
  | { type: "event_list" }
  | { type: "external"; url: string };

type ExplorerItem = {
  id: string;
  kind: ExplorerKind;
  tab: Exclude<CulturalExplorerTab, "all">;
  name: string;
  description: string | null;
  category: string;
  city: string | null;
  state: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  externalUrl: string | null;
  sourceLabel: string;
  actions: ExplorerAction[];
};

function isTab(value: unknown): value is CulturalExplorerTab {
  return typeof value === "string" && (CULTURAL_EXPLORER_TABS as readonly string[]).includes(value);
}

function searchMatches(input: { name?: unknown; description?: unknown; city?: unknown; state?: unknown }, query: string): boolean {
  if (!query) return true;
  const candidate = [input.name, input.description, input.city, input.state]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase();
  return candidate.includes(query.toLocaleLowerCase());
}

function finiteCoordinate(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function validHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function counts(items: ExplorerItem[]): Record<CulturalExplorerTab, number> {
  const result = Object.fromEntries(CULTURAL_EXPLORER_TABS.map((tab) => [tab, 0])) as Record<CulturalExplorerTab, number>;
  result.all = items.length;
  for (const item of items) result[item.tab] += 1;
  return result;
}

export function culturalSiteExplorerItem(row: Record<string, unknown>): ExplorerItem {
  const heritageCategory = typeof row.heritageCategory === "string" ? row.heritageCategory : "";
  const tab: ExplorerItem["tab"] = heritageCategory === "HBCU"
    ? "hbcus"
    : heritageCategory === "Cultural Neighborhood"
      ? "historic_districts"
      : "landmarks";
  const latitude = finiteCoordinate(row.latitude);
  const longitude = finiteCoordinate(row.longitude);
  const id = String(row.id);
  const name = String(row.name ?? "Cultural site");
  const actions: ExplorerAction[] = [
    { type: "cultural_detail", culturalSiteId: id },
    { type: "library", question: `${name}: history, context, and reputable sources` },
  ];
  if (latitude !== null && longitude !== null) actions.unshift({ type: "map", culturalSiteId: id, latitude, longitude });
  const externalUrl = validHttpsUrl(row.externalUrl);
  if (externalUrl) actions.push({ type: "external", url: externalUrl });
  return {
    id,
    kind: "cultural_site",
    tab,
    name,
    description: typeof row.description === "string" ? row.description : null,
    category: heritageCategory || (typeof row.category === "string" ? row.category : "Cultural heritage"),
    city: typeof row.city === "string" ? row.city : null,
    state: typeof row.state === "string" ? row.state : null,
    address: typeof row.address === "string" ? row.address : null,
    latitude,
    longitude,
    externalUrl,
    sourceLabel: "Cultural site",
    actions,
  };
}

function recurringEventExplorerItem(row: Record<string, unknown>): ExplorerItem {
  const category = typeof row.category === "string" ? row.category : "event";
  const tab: ExplorerItem["tab"] = category.toLocaleLowerCase() === "market" ? "markets" : "curated_events";
  const latitude = finiteCoordinate(row.latitude);
  const longitude = finiteCoordinate(row.longitude);
  const actions: ExplorerAction[] = [{ type: "event_list" }];
  if (latitude !== null && longitude !== null) actions.unshift({ type: "map", latitude, longitude });
  return {
    id: String(row.id),
    kind: tab === "markets" ? "market" : "recurring_event",
    tab,
    name: String(row.name ?? "Community event"),
    description: typeof row.description === "string" ? row.description : null,
    category,
    city: typeof row.city === "string" ? row.city : null,
    state: typeof row.state === "string" ? row.state : null,
    address: typeof row.address === "string" ? row.address : typeof row.venue === "string" ? row.venue : null,
    latitude,
    longitude,
    externalUrl: null,
    sourceLabel: tab === "markets" ? "Recurring market" : "Recurring event",
    actions,
  };
}

function resourceExplorerItem(row: Record<string, unknown>): ExplorerItem {
  const externalUrl = validHttpsUrl(row.url);
  const actions: ExplorerAction[] = [];
  if (externalUrl) actions.push({ type: "external", url: externalUrl });
  return {
    id: String(row.id),
    kind: "resource",
    tab: "heritage_resources",
    name: String(row.title ?? "Heritage resource"),
    description: typeof row.description === "string" ? row.description : null,
    category: typeof row.category === "string" ? row.category : "resource",
    city: typeof row.city === "string" ? row.city : null,
    state: typeof row.state === "string" ? row.state : null,
    address: null,
    latitude: null,
    longitude: null,
    externalUrl,
    sourceLabel: "Curated resource",
    actions,
  };
}

/**
 * An authenticated adapter for the Explorer. It keeps cultural sites, recurring
 * events/markets, and curated resources truthful as distinct record kinds, rather
 * than pretending they share a legacy cultural-site detail route.
 */
router.get("/cultural-explorer", async (req: Request, res: Response, next) => {
  try {
    const tab = isTab(req.query.tab) ? req.query.tab : "all";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 250;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500) : 250;

    const [siteResult, eventResult, resourceResult] = await Promise.all([
      pool.query(
        `SELECT id, name, description, category, heritage_category AS "heritageCategory",
                city, state, address, latitude, longitude, external_url AS "externalUrl"
         FROM cultural_sites
         WHERE COALESCE(is_published, TRUE) = TRUE
         ORDER BY name ASC
         LIMIT $1`,
        [limit],
      ),
      pool.query(
        `SELECT id, name, city, state, venue, address, description, category, latitude, longitude
         FROM recurring_events
         WHERE is_active = TRUE AND (active_until IS NULL OR active_until >= CURRENT_DATE)
         ORDER BY city ASC, category ASC, name ASC
         LIMIT $1`,
        [limit],
      ),
      pool.query(
        `SELECT id, title, description, category, city, state, url
         FROM resources
         WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY title ASC
         LIMIT $1`,
        [limit],
      ),
    ]);

    const allItems = [
      ...siteResult.rows.map(culturalSiteExplorerItem),
      ...eventResult.rows.map(recurringEventExplorerItem),
      ...resourceResult.rows.map(resourceExplorerItem),
    ].filter((item) => searchMatches(item, search));
    const items = tab === "all" ? allItems : allItems.filter((item) => item.tab === tab);

    res.setHeader("Cache-Control", "no-store");
    res.json({ items, counts: counts(allItems), tab, search });
  } catch (error) {
    next(error);
  }
});

export default router;

export { recurringEventExplorerItem, resourceExplorerItem };

export type { ExplorerAction, ExplorerItem };
