/**
 * cityHealthAlertScheduler.ts
 *
 * Runs every 30 minutes and checks the health level of every live / soft_launch city.
 * When a city crosses into "warning" or "critical", an alert fires to the founder via:
 *   1. Email — sent to ADMIN_EMAILS (comma-separated) via the existing Resend infrastructure
 *   2. SMS   — sent via Twilio if TWILIO_FROM_NUMBER and FOUNDER_PHONE are configured (optional)
 *
 * Delivery / cooldown semantics
 * ──────────────────────────────
 * - Cooldown is enforced with an atomic conditional UPDATE on city_launches.last_alerted_at.
 *   Only the process that wins the DB claim proceeds to send — prevents duplicate alerts when
 *   multiple instances run concurrently (e.g. during a Railway rolling deploy).
 * - last_alerted_at is written AFTER the required channel (email) succeeds.
 *   If email fails the stamp is not written, so the next cron tick can retry.
 * - SMS is optional: a Twilio failure does not block the email stamp or retry.
 * - If the atomic claim succeeds but email fails, we clear the stamp so the next tick retries.
 * - Planning / pre_launch cities are never checked or alerted.
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

interface CityRow {
  slug: string;
  city: string;
  state: string;
  status: string;
  last_alerted_at: string | null;
}

interface DegradedCity {
  slug: string;
  city: string;
  state: string;
  level: HealthLevel;
  signals: { level: HealthLevel; message: string }[];
}

export interface HealthCheckResult {
  checked: number;
  alerted: string[];   // slugs for which an alert was successfully sent
  skipped: string[];   // slugs within cooldown window
  failed: string[];    // slugs where health check or send failed
}

// ── Health computation (mirrors city-launch.ts logic — no HTTP round-trip) ───
async function computeCityHealth(
  slug: string,
  cityName: string,
  cityStatus: string,
): Promise<{ slug: string; level: HealthLevel; signals: { level: HealthLevel; message: string }[] }> {
  const ps = getPoolStats();

  // DB round-trip probe
  const probeStart = Date.now();
  await pool.query(`SELECT 1`);
  const probeMs = Date.now() - probeStart;

  // City-scoped activity — run sequentially to avoid pool pressure
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

  return { slug, level, signals };
}

// ── Atomic cooldown claim ─────────────────────────────────────────────────────
// Returns the exact timestamp written by THIS process (ownership token), or null
// if the cooldown window is still active or the row no longer exists.
// Uses a conditional UPDATE + RETURNING so concurrent scheduler instances
// (e.g. during a Railway rolling deploy) cannot both win — only the first
// UPDATE to execute gets rowCount > 0, and it returns the precise timestamp it
// wrote. The caller must pass that timestamp to releaseAlertSlot to guarantee
// that only this exact claim is cleared on failure.
async function claimAlertSlot(slug: string): Promise<Date | null> {
  const { rows } = await pool.query<{ last_alerted_at: Date }>(
    `UPDATE city_launches
     SET last_alerted_at = NOW()
     WHERE slug = $1
       AND (last_alerted_at IS NULL
            OR last_alerted_at < NOW() - ($2 || ' hours')::INTERVAL)
     RETURNING last_alerted_at`,
    [slug, String(ALERT_COOLDOWN_HOURS)],
  );
  return rows[0]?.last_alerted_at ?? null;
}

// Clears the stamp so the next cron tick can retry after a send failure.
// Conditions the UPDATE on the exact ownership token (claimedAt) returned by
// claimAlertSlot. This prevents a delayed cleanup from clearing a competing
// instance's successful cooldown stamp.
async function releaseAlertSlot(slug: string, claimedAt: Date): Promise<void> {
  try {
    await pool.query(
      `UPDATE city_launches
       SET last_alerted_at = NULL
       WHERE slug = $1
         AND last_alerted_at = $2`,
      [slug, claimedAt],
    );
  } catch (err) {
    logger.error({ err, slug }, "city-health-alert: failed to release alert slot after send failure — next retry may be delayed");
  }
}

// ── Notification helpers ───────────────────────────────────────────────────────
async function sendAlertEmail(cities: DegradedCity[]): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");
  if (!adminEmails) throw new Error("ADMIN_EMAILS not configured");

  const recipients = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
  if (!recipients.length) throw new Error("ADMIN_EMAILS is empty after parsing");

  const resend = new Resend(resendKey);

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

  const { error } = await resend.emails.send({ from: FROM, to: recipients, subject, html });
  if (error) throw new Error(`Resend send failed: ${error.name} — ${error.message}`);
}

// SMS is optional: configured via TWILIO_FROM_NUMBER + FOUNDER_PHONE env vars.
// Returns true if sent, false if skipped (not configured), throws if configured but failed.
async function sendAlertSms(cities: DegradedCity[]): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const founderPhone = process.env.FOUNDER_PHONE;

  if (!fromNumber || !founderPhone) return false; // optional channel — not configured
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing but TWILIO_FROM_NUMBER is set");

  const client = twilio(sid, token);
  const hasCritical = cities.some((c) => c.level === "critical");
  const prefix = hasCritical ? "🚨 CRITICAL" : "⚠️ WARNING";
  const cityList = cities.map((c) => `${c.city} (${c.level})`).join(", ");
  const body = `${prefix} — MWM city health alert\n${cityList}\nCheck the admin dashboard for details.`;

  await client.messages.create({ from: fromNumber, to: founderPhone, body });
  return true;
}

// ── Core check function (exported so it can be called manually / from a route) ─
export async function runCityHealthCheck(): Promise<HealthCheckResult> {
  const alerted: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  // Fetch all live/soft_launch cities
  const { rows: cities } = await pool.query<CityRow>(
    `SELECT slug, city, state, status, last_alerted_at
     FROM city_launches
     WHERE status = ANY($1::text[])
     ORDER BY sequence_order ASC`,
    [LIVE_STATUSES],
  );

  if (!cities.length) {
    return { checked: 0, alerted: [], skipped: [], failed: [] };
  }

  // Compute health for all cities, then group degraded ones to send a single
  // batched alert rather than one email per city.
  const degraded: DegradedCity[] = [];

  for (const city of cities) {
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
      failed.push(city.slug);
    }
  }

  if (!degraded.length) {
    return { checked: cities.length, alerted: [], skipped, failed };
  }

  // For each degraded city, attempt an atomic cooldown claim.
  // Cities still within the cooldown window are skipped — their UPDATE finds no
  // eligible row and returns null. The returned Date is the ownership token: it
  // must be passed to releaseAlertSlot so that a delayed cleanup cannot clear a
  // competing instance's successful cooldown stamp.
  const claimedCities: Array<DegradedCity & { claimedAt: Date }> = [];

  for (const city of degraded) {
    try {
      const claimedAt = await claimAlertSlot(city.slug);
      if (claimedAt) {
        claimedCities.push({ ...city, claimedAt });
      } else {
        skipped.push(city.slug);
      }
    } catch (err) {
      logger.error({ err, slug: city.slug }, "city-health-alert: failed to claim alert slot");
      failed.push(city.slug);
    }
  }

  if (!claimedCities.length) {
    return { checked: cities.length, alerted: [], skipped, failed };
  }

  // Send email (required channel). On failure: release the DB claim — conditioned
  // on the ownership token — so the next tick can retry without risk of clearing
  // a competing instance's successful stamp.
  let emailSent = false;
  try {
    await sendAlertEmail(claimedCities);
    emailSent = true;
  } catch (err) {
    logger.error({ err, cities: claimedCities.map((c) => c.slug) }, "city-health-alert: email send failed — releasing claims for retry");
    for (const city of claimedCities) {
      await releaseAlertSlot(city.slug, city.claimedAt);
      failed.push(city.slug);
    }
    return { checked: cities.length, alerted: [], skipped, failed };
  }

  // Email succeeded — record all claimed cities as alerted.
  for (const city of claimedCities) {
    alerted.push(city.slug);
  }

  // Send SMS (optional channel). A Twilio failure is logged but does not affect
  // the cooldown stamp or the alerted set — email is the source of truth.
  if (emailSent) {
    try {
      const smsSent = await sendAlertSms(claimedCities);
      if (smsSent) {
        logger.info({ cities: alerted }, "city-health-alert: SMS alert sent");
      }
    } catch (err) {
      logger.error({ err }, "city-health-alert: optional SMS send failed (email was delivered; cooldown stands)");
    }
  }

  return { checked: cities.length, alerted, skipped, failed };
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
          failed: result.failed.length,
        },
        "city-health-alert: check complete",
      );
      if (result.alerted.length > 0) {
        logger.warn({ cities: result.alerted }, "city-health-alert: alerts fired for degraded cities");
      }
      if (result.failed.length > 0) {
        logger.warn({ cities: result.failed }, "city-health-alert: some cities failed health check or send");
      }
    } catch (err) {
      logger.error({ err }, "city-health-alert: health check batch failed");
    }
  });

  logger.info({ schedule }, "city-health-alert: scheduler started (every 30 min by default)");
}
