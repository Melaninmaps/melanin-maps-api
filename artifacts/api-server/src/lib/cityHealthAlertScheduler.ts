/**
 * cityHealthAlertScheduler.ts
 *
 * Runs every 30 minutes and checks the health level of every live / soft_launch city.
 * When a city crosses into "warning" or "critical", an alert fires to the founder via:
 *   1. Email — sent to ADMIN_EMAILS (comma-separated) via the existing Resend infrastructure
 *   2. SMS   — sent via Twilio if TWILIO_FROM_NUMBER and FOUNDER_PHONE are configured
 *
 * A 2-hour cooldown (last_alerted_at) prevents alert floods.
 * Planning / pre_launch cities are never alerted.
 */

import cron from "node-cron";
import { pool, getPoolStats } from "@workspace/db";
import { logger } from "./logger";
import { Resend } from "resend";
import twilio from "twilio";

// ── Constants ─────────────────────────────────────────────────────────────────
const ALERT_COOLDOWN_HOURS = 2;
const LIVE_STATUSES = ["live", "soft_launch"];
const FROM = "Mapping With Melanin™ <hello@mappingwithmelanin.com>";

// ── Types ─────────────────────────────────────────────────────────────────────
type HealthLevel = "ok" | "warning" | "critical";

interface CityHealthResult {
  slug: string;
  city: string;
  state: string;
  level: HealthLevel;
  signals: { level: HealthLevel; message: string }[];
}

// ── Health computation (mirrors city-launch.ts logic, no HTTP round-trip) ─────
async function computeCityHealth(
  slug: string,
  cityName: string,
  cityStatus: string,
): Promise<CityHealthResult & { city: string; state: string }> {
  const ps = getPoolStats();

  // DB round-trip probe
  const probeStart = Date.now();
  await pool.query(`SELECT 1`);
  const probeMs = Date.now() - probeStart;

  // City-scoped activity (sequential to avoid pool pressure)
  const nameLower = cityName.toLowerCase();
  const { rows: s7d } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM users
     WHERE LOWER(TRIM(home_city)) = $1 AND created_at > NOW() - INTERVAL '7 days'`,
    [nameLower],
  );
  const { rows: p7d } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM community_posts
     WHERE LOWER(TRIM(location_city)) = $1 AND created_at > NOW() - INTERVAL '7 days'`,
    [nameLower],
  );

  const signups7d = parseInt(s7d[0]?.cnt ?? "0", 10);
  const posts7d = parseInt(p7d[0]?.cnt ?? "0", 10);

  const signals: { level: HealthLevel; message: string }[] = [];

  if (ps.waiting > 3)
    signals.push({ level: "critical", message: `DB pool pressure: ${ps.waiting} connections waiting` });
  else if (ps.waiting > 0)
    signals.push({ level: "warning", message: `DB pool elevated: ${ps.waiting} waiting (${ps.total} total)` });

  if (probeMs > 1000)
    signals.push({ level: "critical", message: `DB slow: ${probeMs}ms round-trip` });
  else if (probeMs > 300)
    signals.push({ level: "warning", message: `DB response elevated: ${probeMs}ms` });

  if (LIVE_STATUSES.includes(cityStatus)) {
    if (signups7d === 0)
      signals.push({ level: "warning", message: "No new member sign-ups in the last 7 days" });
    if (posts7d === 0)
      signals.push({ level: "warning", message: "No community posts in the last 7 days" });
  }

  if (signals.length === 0) signals.push({ level: "ok", message: "All systems healthy" });

  const level: HealthLevel = signals.some((s) => s.level === "critical")
    ? "critical"
    : signals.some((s) => s.level === "warning")
    ? "warning"
    : "ok";

  return { slug, city: cityName, state: "", level, signals };
}

// ── Notification helpers ───────────────────────────────────────────────────────
async function sendAlertEmail(
  cities: { city: string; state: string; slug: string; level: HealthLevel; signals: { level: HealthLevel; message: string }[] }[],
) {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!resendKey || !adminEmails) return;

  const resend = new Resend(resendKey);
  const recipients = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
  if (!recipients.length) return;

  const rows = cities
    .map((c) => {
      const color = c.level === "critical" ? "#c0392b" : "#e67e22";
      const badge = `<span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase">${c.level}</span>`;
      const signalList = c.signals
        .map((s) => `<li style="margin:4px 0;color:#4a3728">${s.message}</li>`)
        .join("");
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0e8dc;font-weight:600;color:#2B1507">
            ${c.city}, ${c.state}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0e8dc">${badge}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0e8dc">
            <ul style="margin:0;padding-left:16px">${signalList}</ul>
          </td>
        </tr>`;
    })
    .join("");

  const hasCritical = cities.some((c) => c.level === "critical");
  const subject = hasCritical
    ? `🚨 CRITICAL: City health alert — ${cities.map((c) => c.city).join(", ")}`
    : `⚠️ City health warning — ${cities.map((c) => c.city).join(", ")}`;

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;background:#FAF6EF;padding:32px;border-radius:16px">
      <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:36px;margin-bottom:24px" />
      <h2 style="color:#2B1507;margin:0 0 8px">City Health Alert</h2>
      <p style="color:#6b5240;margin:0 0 24px;font-size:14px">
        The following live cities have health signals that need your attention.
        This alert fires when a city crosses into <strong>warning</strong> or <strong>critical</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#2B1507;color:#fff">
            <th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.5px">City</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.5px">Level</th>
            <th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.5px">Signals</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center">
        Sent automatically by the MWM City Health Monitor · alerts repeat at most every ${ALERT_COOLDOWN_HOURS} hours
      </p>
    </div>`;

  await resend.emails.send({ from: FROM, to: recipients, subject, html });
}

async function sendAlertSms(
  cities: { city: string; state: string; level: HealthLevel }[],
) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const founderPhone = process.env.FOUNDER_PHONE;

  if (!sid || !token || !fromNumber || !founderPhone) return;

  const client = twilio(sid, token);
  const hasCritical = cities.some((c) => c.level === "critical");
  const prefix = hasCritical ? "🚨 CRITICAL" : "⚠️ WARNING";
  const cityList = cities.map((c) => `${c.city} (${c.level})`).join(", ");
  const body = `${prefix} — MWM city health alert\n${cityList}\nCheck the admin dashboard for details.`;

  await client.messages.create({ from: fromNumber, to: founderPhone, body });
}

// ── Core check function (exported so it can be called manually / tested) ──────
export async function runCityHealthCheck(): Promise<{
  checked: number;
  alerted: string[];
  skipped: string[];
  errors: string[];
}> {
  const alerted: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Fetch all live/soft_launch cities not alerted within the cooldown window
  const { rows: cities } = await pool.query<{
    slug: string;
    city: string;
    state: string;
    status: string;
    last_alerted_at: string | null;
  }>(
    `SELECT slug, city, state, status, last_alerted_at
     FROM city_launches
     WHERE status = ANY($1::text[])
     ORDER BY sequence_order ASC`,
    [LIVE_STATUSES],
  );

  if (!cities.length) {
    return { checked: 0, alerted: [], skipped: [], errors: [] };
  }

  const degraded: {
    slug: string;
    city: string;
    state: string;
    level: HealthLevel;
    signals: { level: HealthLevel; message: string }[];
  }[] = [];

  for (const city of cities) {
    // Cooldown check: skip if alerted within the last ALERT_COOLDOWN_HOURS hours
    if (city.last_alerted_at) {
      const lastAlerted = new Date(city.last_alerted_at).getTime();
      const cutoff = Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;
      if (lastAlerted > cutoff) {
        skipped.push(city.slug);
        continue;
      }
    }

    try {
      const health = await computeCityHealth(city.slug, city.city, city.status);
      if (health.level !== "ok") {
        degraded.push({
          slug: city.slug,
          city: city.city,
          state: city.state,
          level: health.level,
          signals: health.signals,
        });
      }
    } catch (err) {
      logger.error({ err, slug: city.slug }, "city-health-alert: failed to compute health for city");
      errors.push(city.slug);
    }
  }

  if (!degraded.length) {
    return { checked: cities.length, alerted: [], skipped, errors };
  }

  // Stamp last_alerted_at on all degraded cities before sending (so a send failure
  // doesn't trigger an infinite re-alert loop on the next tick)
  for (const c of degraded) {
    try {
      await pool.query(
        `UPDATE city_launches SET last_alerted_at = NOW() WHERE slug = $1`,
        [c.slug],
      );
    } catch (err) {
      logger.error({ err, slug: c.slug }, "city-health-alert: failed to stamp last_alerted_at");
    }
    alerted.push(c.slug);
  }

  // Fire notifications (failures are non-fatal — the stamps are already written)
  try {
    await sendAlertEmail(degraded);
  } catch (err) {
    logger.error({ err }, "city-health-alert: email send failed");
  }

  try {
    await sendAlertSms(degraded);
  } catch (err) {
    // SMS is optional — only log at debug level if vars aren't configured
    const hasTwilioCreds =
      process.env.TWILIO_FROM_NUMBER && process.env.FOUNDER_PHONE;
    if (hasTwilioCreds) {
      logger.error({ err }, "city-health-alert: SMS send failed");
    }
  }

  return { checked: cities.length, alerted, skipped, errors };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
export function startCityHealthAlertScheduler(): void {
  // Default: every 30 minutes. Override with CITY_HEALTH_CRON_SCHEDULE env var.
  const schedule = process.env.CITY_HEALTH_CRON_SCHEDULE ?? "*/30 * * * *";

  if (!cron.validate(schedule)) {
    logger.error(
      { schedule },
      "city-health-alert: invalid CITY_HEALTH_CRON_SCHEDULE — scheduler not started",
    );
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info({ schedule }, "city-health-alert: running health check");
    try {
      const result = await runCityHealthCheck();
      logger.info(
        {
          checked: result.checked,
          alerted: result.alerted.length,
          skipped: result.skipped.length,
          errors: result.errors.length,
        },
        "city-health-alert: check complete",
      );
      if (result.alerted.length > 0) {
        logger.warn({ cities: result.alerted }, "city-health-alert: alerts fired for degraded cities");
      }
      if (result.errors.length > 0) {
        logger.warn({ cities: result.errors }, "city-health-alert: some cities failed health check");
      }
    } catch (err) {
      logger.error({ err }, "city-health-alert: health check batch failed");
    }
  });

  logger.info({ schedule }, "city-health-alert: scheduler started (every 30 min by default)");
}
