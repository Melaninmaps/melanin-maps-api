import {
  deliverOfficialPublicAlert,
  type OfficialAlertKind,
  type OfficialAlertSource,
  upsertOfficialPublicAlert,
} from "./officialPublicAlerts";
import { logger } from "../lib/logger";

type SourceRefreshResult = Readonly<{
  source: OfficialAlertSource;
  status: "disabled" | "ok" | "failed";
  candidates: number;
  delivered: number;
  pushed: number;
  reason?: string;
}>;

const CPSC_RECALLS_URL = "https://www.saferproducts.gov/RestWebServices/Recall?format=json";
const CDC_HAN_INDEX_URL = "https://www.cdc.gov/han/php/notices/index.html";
const MAX_ALERTS_PER_SOURCE = 25;
const REQUEST_TIMEOUT_MS = 12_000;

function plainText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function bounded(value: unknown, max: number): string {
  return plainText(value).slice(0, max).trim();
}

function valueOf(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function officialCpscUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" && ["cpsc.gov", "www.cpsc.gov"].includes(url.hostname.toLowerCase())
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function officialCdcUrl(value: string): string | null {
  try {
    const url = new URL(value, CDC_HAN_INDEX_URL);
    return url.protocol === "https:" && ["cdc.gov", "www.cdc.gov", "emergency.cdc.gov"].includes(url.hostname.toLowerCase())
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

async function fetchOfficial(url: string): Promise<Response> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json, application/xml, text/html;q=0.9" },
  });
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
  return response;
}

function cpscRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
  if (!payload || typeof payload !== "object") return [];
  const candidate = payload as Record<string, unknown>;
  for (const key of ["Recall", "Recalls", "results", "Items"]) {
    if (Array.isArray(candidate[key])) {
      return candidate[key].filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
    }
  }
  return [];
}

function cpscSummary(row: Record<string, unknown>): string {
  const pieces = [
    valueOf(row, "Description", "description", "ProductDescription"),
    valueOf(row, "Hazard", "Hazards", "hazard"),
    valueOf(row, "Remedy", "remedy"),
  ].map((value) => bounded(value, 700)).filter(Boolean);
  return bounded(pieces.join(" "), 1200);
}

async function refreshCpsc(): Promise<SourceRefreshResult> {
  try {
    const response = await fetchOfficial(CPSC_RECALLS_URL);
    const payload = await response.json();
    const rows = cpscRows(payload);
    let candidates = 0;
    let delivered = 0;
    let pushed = 0;

    for (const row of rows.slice(0, MAX_ALERTS_PER_SOURCE)) {
      const externalId = bounded(valueOf(row, "RecallID", "RecallNumber", "id"), 160);
      const officialUrl = officialCpscUrl(valueOf(row, "RecallURL", "URL", "url", "Link"));
      const title = bounded(valueOf(row, "RecallTitle", "Title", "title", "Name"), 500);
      const summary = cpscSummary(row);
      if (!externalId || !officialUrl || !title || !summary) continue;

      // A valid API record is not enough: resolve the listed primary CPSC page
      // before creating or sending an alert.
      const notice = await fetchOfficial(officialUrl);
      if (!officialCpscUrl(notice.url)) continue;

      candidates += 1;
      const alert = await upsertOfficialPublicAlert({
        source: "cpsc",
        externalId,
        kind: "product_recall",
        title,
        summary,
        officialUrl: notice.url,
        issuedAt: parseDate(valueOf(row, "LastPublishDate", "RecallDate", "PublishDate")),
        sourcePayload: {
          recallNumber: bounded(valueOf(row, "RecallNumber"), 120) || null,
          lastPublishDate: bounded(valueOf(row, "LastPublishDate"), 80) || null,
        },
      });
      const outcome = await deliverOfficialPublicAlert(alert);
      delivered += outcome.delivered;
      pushed += outcome.pushed;
    }
    return { source: "cpsc", status: "ok", candidates, delivered, pushed };
  } catch (error) {
    logger.error({ error }, "Official CPSC recall refresh failed; no alerts were sent from this source");
    return { source: "cpsc", status: "failed", candidates: 0, delivered: 0, pushed: 0, reason: "source_unavailable_or_invalid" };
  }
}

function cdcNoticeLinks(indexHtml: string): Array<{ hanId: string; url: string }> {
  const found = new Map<string, string>();
  for (const match of indexHtml.matchAll(/href=["']([^"']*han(\d+)\.html)["']/gi)) {
    const url = officialCdcUrl(match[1]);
    const hanId = match[2];
    if (url && hanId) found.set(hanId, url);
  }
  return [...found.entries()]
    .map(([hanId, url]) => ({ hanId, url }))
    .sort((a, b) => b.hanId.localeCompare(a.hanId, undefined, { numeric: true }))
    .slice(0, MAX_ALERTS_PER_SOURCE);
}

function cdcTitle(noticeHtml: string): string {
  const h1 = noticeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  return bounded(h1, 500);
}

async function refreshCdcHan(): Promise<SourceRefreshResult> {
  try {
    const index = await fetchOfficial(CDC_HAN_INDEX_URL);
    if (!officialCdcUrl(index.url)) throw new Error("CDC HAN index redirected outside CDC");
    const links = cdcNoticeLinks(await index.text());
    let candidates = 0;
    let delivered = 0;
    let pushed = 0;

    for (const link of links) {
      const notice = await fetchOfficial(link.url);
      if (!officialCdcUrl(notice.url)) continue;
      const title = cdcTitle(await notice.text());
      if (!title) continue;

      candidates += 1;
      const alert = await upsertOfficialPublicAlert({
        source: "cdc",
        externalId: `han-${link.hanId}`,
        kind: "public_health_alert",
        title,
        summary: "Open the official CDC Health Alert Network notice for its current audience, details, and guidance.",
        officialUrl: notice.url,
        sourcePayload: { hanId: link.hanId },
      });
      const outcome = await deliverOfficialPublicAlert(alert);
      delivered += outcome.delivered;
      pushed += outcome.pushed;
    }
    return { source: "cdc", status: "ok", candidates, delivered, pushed };
  } catch (error) {
    logger.error({ error }, "Official CDC HAN refresh failed; no alerts were sent from this source");
    return { source: "cdc", status: "failed", candidates: 0, delivered: 0, pushed: 0, reason: "source_unavailable_or_invalid" };
  }
}

/**
 * FDA iRES credentials are not provisioned here. The secondary openFDA dataset
 * is deliberately not used as a public alert trigger because FDA says it is
 * unsuitable for recall lifecycle tracking. This keeps FDA delivery fail-closed
 * until a verified iRES integration is separately configured.
 */
function disabledFda(): SourceRefreshResult {
  return {
    source: "fda",
    status: "disabled",
    candidates: 0,
    delivered: 0,
    pushed: 0,
    reason: "fda_ires_not_configured",
  };
}

export async function refreshOfficialPublicAlerts(): Promise<{ enabled: boolean; sources: SourceRefreshResult[] }> {
  if (process.env.OFFICIAL_PUBLIC_ALERTS_ENABLED !== "1") {
    return {
      enabled: false,
      sources: [
        { source: "cpsc", status: "disabled", candidates: 0, delivered: 0, pushed: 0, reason: "feature_disabled" },
        { source: "cdc", status: "disabled", candidates: 0, delivered: 0, pushed: 0, reason: "feature_disabled" },
        disabledFda(),
      ],
    };
  }

  const [cpsc, cdc] = await Promise.all([refreshCpsc(), refreshCdcHan()]);
  return { enabled: true, sources: [cpsc, cdc, disabledFda()] };
}

export const __testables = { cdcNoticeLinks, cpscRows, officialCpscUrl, officialCdcUrl };
