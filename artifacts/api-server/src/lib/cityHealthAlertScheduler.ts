/**
 * cityHealthAlertScheduler.ts
 *
 * Runs every 30 minutes and checks the health level of every live / soft_launch city.
 * When a city crosses into "warning" or "critical", an alert fires to the founder via:
 *   1. Email — sent to ADMIN_EMAILS (comma-separated) via Resend
 *   2. SMS   — optional, via Twilio if TWILIO_FROM_NUMBER + FOUNDER_PHONE are set
 *
 * ── Delivery / cooldown guarantee ──────────────────────────────────────────────
 *
 * Two DB columns implement a two-phase ownership protocol:
 *
 *   alert_claim_token      TEXT        — UUID identifying the owning process/tick
 *   alert_lease_expires_at TIMESTAMPTZ — hard expiry for the lease (default: 10 min)
 *   last_alerted_at        TIMESTAMPTZ — written ONLY after confirmed email delivery
 *
 * Phase 1 — Acquire lease (claimAlertLease):
 *   Conditional UPDATE sets token + lease expiry only when:
 *     - last_alerted_at is NULL or older than the 2-hour cooldown, AND
 *     - no unexpired lease is held (alert_claim_token IS NULL OR lease expired)
 *   Returns the UUID if this process won, null otherwise.
 *   Concurrent processes both writing at the same instant: only one UPDATE wins
 *   the DB write (row-level lock during UPDATE), so exactly one gets a UUID back.
 *
 * Phase 2a — Finalize on success (finalizeAlertLease):
 *   Conditional UPDATE: sets last_alerted_at = NOW(), clears token + expiry
 *   WHERE alert_claim_token = $token (ownership check).
 *   Safe no-op if a later process stole an expired lease before delivery finished.
 *
 * Phase 2b — Release on failure (releaseAlertLease):
 *   Conditional UPDATE: clears token + expiry WHERE alert_claim_token = $token.
 *   If a different process has already re-claimed an expired lease and delivered
 *   successfully, the token won't match — this is a safe no-op that preserves
 *   the successful cooldown.
 *
 * Crash / stall recovery:
 *   A process that claims a lease then crashes or times out leaves the lease fields
 *   set but last_alerted_at unchanged. The next tick's claimAlertLease condition
 *   treats an expired lease as unclaimed (alert_lease_expires_at < NOW()), so the
 *   city becomes eligible for re-alert after LEASE_TTL_MINUTES — not after the full
 *   2-hour cooldown.
 *
 * Planning / pre_launch cities are never checked or alerted.
 */

import cron from "node-cron";
import { randomUUID } from "crypto";
import { pool, getPoolStats } from "@workspace/db";
import { logger } from "./logger";
import { Resend } from "resend";
import twilio from "twilio";

// ── Constants ─────────────────────────────────────────────────────────────────
const ALERT_COOLDOWN_HOURS = 2;
const LEASE_TTL_MINUTES = 10; // crashed/stalled leases expire after this
// Email send must complete within this window — safely below the lease TTL —
// so an in-progress send cannot outlive the lease and allow a competing
// instance to claim, send a duplicate, and finalize ahead of us.
const EMAIL_TIMEOUT_MS = (LEASE_TTL_MINUTES - 2) * 60 * 1000; // 8 minutes
const LIVE_STATUSES = ["live", "soft_launch"];
const FROM = "Mapping With Melanin™ <hello@mappingwithmelanin.com>";

// ── Types ─────────────────────────────────────────────────────────────────────
type HealthLevel = "ok" | "warning" | "critical";

interface DegradedCity {
  slug: string;
  city: string;
  state: string;
  level: HealthLevel;
  signals: { level: HealthLevel; message: string }[];
}

export interface HealthCheckResult {
  checked: number;
  alerted: string[];  // slugs for which an alert was successfully sent
  skipped: string[];  // slugs within cooldown or holding valid lease
  failed: string[];   // slugs where health check, lease, or send failed
}

// ── Health computation (mirrors city-launch.ts logic — no HTTP round-trip) ───
async function computeCityHealth(
  slug: string,
  cityName: string,
  cityStatus: string,
): Promise<{ slug: string; level: HealthLevel; signals: { level: HealthLevel; message: string }[] }> {
  const ps = getPoolStats();

  const probeStart = Date.now();
  await pool.query(`SELECT 1`);
  const probeMs = Date.now() - probeStart;

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

  if (signals.length === 0)
    signals.push({ level: "ok", message: "All systems healthy" });

  const level: HealthLevel =
    signals.some((s) => s.level === "critical") ? "critical"
    : signals.some((s) => s.level === "warning") ? "warning"
    : "ok";

  return { slug, level, signals };
}

// ── Two-phase lease: acquire ───────────────────────────────────────────────────
// Writes a UUID token + lease expiry ONLY when:
//   1. The 2-hour cooldown (last_alerted_at) has elapsed, AND
//   2. No valid unexpired lease is held by another process.
// Returns the UUID if this process won the lease, null otherwise.
// Note: last_alerted_at is NOT touched here — it is written exclusively on
// confirmed delivery via finalizeAlertLease.
async function claimAlertLease(slug: string): Promise<string | null> {
  const token = randomUUID();
  const { rowCount } = await pool.query(
    `UPDATE city_launches
     SET alert_claim_token    = $2,
         alert_lease_expires_at = NOW() + ($3 || ' minutes')::INTERVAL
     WHERE slug = $1
       AND (last_alerted_at IS NULL
            OR last_alerted_at < NOW() - ($4 || ' hours')::INTERVAL)
       AND (alert_claim_token IS NULL
            OR alert_lease_expires_at IS NULL
            OR alert_lease_expires_at < NOW())`,
    [slug, token, String(LEASE_TTL_MINUTES), String(ALERT_COOLDOWN_HOURS)],
  );
  return (rowCount ?? 0) > 0 ? token : null;
}

// ── Two-phase lease: finalize on delivery success ─────────────────────────────
// Writes last_alerted_at = NOW() and clears the lease, conditioned on the
// ownership token. Returns true if THIS process owned the row and finalized it;
// false if the lease had already expired and been reclaimed by a competing
// instance (in which case that instance's cooldown stamp is preserved).
// Callers MUST check the return value — only a true result means confirmed
// cooldown and a delivered alert.
async function finalizeAlertLease(slug: string, token: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE city_launches
     SET last_alerted_at      = NOW(),
         alert_claim_token    = NULL,
         alert_lease_expires_at = NULL
     WHERE slug = $1
       AND alert_claim_token = $2`,
    [slug, token],
  );
  return (rowCount ?? 0) > 0;
}

// ── Two-phase lease: release on delivery failure ──────────────────────────────
// Clears the lease so the next tick can retry. Conditioned on the ownership
// token — safe no-op if a competing process has already claimed and finalized.
async function releaseAlertLease(slug: string, token: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE city_launches
       SET alert_claim_token    = NULL,
           alert_lease_expires_at = NULL
       WHERE slug = $1
         AND alert_claim_token = $2`,
      [slug, token],
    );
  } catch (err) {
    logger.error(
      { err, slug },
      "city-health-alert: failed to release lease after send failure — lease will expire naturally",
    );
  }
}

// ── Notification: email (required channel) ────────────────────────────────────
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
          <td style="padding:12px 16px;border-bottom:1px solid #f0e8dc;font-weight:600;color:#2B1507">${c.city}, ${c.state}</td>
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
        Alerts repeat at most every ${ALERT_COOLDOWN_HOURS} hours per city.
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
        MWM City Health Monitor · alerts repeat at most every ${ALERT_COOLDOWN_HOURS} hours
      </p>
    </div>`;

  const { error } = await resend.emails.send({ from: FROM, to: recipients, subject, html });
  if (error) throw new Error(`Resend send failed: ${error.name} — ${error.message}`);
}

// ── Notification: SMS (optional channel) ─────────────────────────────────────
// Returns true if sent, false if not configured, throws if configured but failed.
async function sendAlertSms(cities: DegradedCity[]): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const founderPhone = process.env.FOUNDER_PHONE;

  if (!fromNumber || !founderPhone) return false;
  if (!sid || !token)
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing but TWILIO_FROM_NUMBER is set");

  const client = twilio(sid, token);
  const hasCritical = cities.some((c) => c.level === "critical");
  const prefix = hasCritical ? "🚨 CRITICAL" : "⚠️ WARNING";
  const cityList = cities.map((c) => `${c.city} (${c.level})`).join(", ");
  const body = `${prefix} — MWM city health alert\n${cityList}\nCheck the admin dashboard for details.`;

  await client.messages.create({ from: fromNumber, to: founderPhone, body });
  return true;
}

// ── Core check function (exported for manual trigger / testing) ───────────────
export async function runCityHealthCheck(): Promise<HealthCheckResult> {
  const alerted: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  const { rows: cities } = await pool.query<{
    slug: string;
    city: string;
    state: string;
    status: string;
  }>(
    `SELECT slug, city, state, status
     FROM city_launches
     WHERE status = ANY($1::text[])
     ORDER BY sequence_order ASC`,
    [LIVE_STATUSES],
  );

  if (!cities.length) return { checked: 0, alerted: [], skipped: [], failed: [] };

  // Compute health for all cities first (no leases held yet)
  const degraded: DegradedCity[] = [];

  for (const city of cities) {
    try {
      const health = await computeCityHealth(city.slug, city.city, city.status);
      if (health.level !== "ok") {
        degraded.push({ slug: city.slug, city: city.city, state: city.state, level: health.level, signals: health.signals });
      }
    } catch (err) {
      logger.error({ err, slug: city.slug }, "city-health-alert: health computation failed");
      failed.push(city.slug);
    }
  }

  if (!degraded.length) return { checked: cities.length, alerted: [], skipped, failed };

  // Attempt to acquire a time-bounded lease for each degraded city.
  // Leases are held only as long as delivery takes (bounded by LEASE_TTL_MINUTES).
  const leasedCities: Array<DegradedCity & { leaseToken: string }> = [];

  for (const city of degraded) {
    try {
      const leaseToken = await claimAlertLease(city.slug);
      if (leaseToken) {
        leasedCities.push({ ...city, leaseToken });
      } else {
        skipped.push(city.slug);
      }
    } catch (err) {
      logger.error({ err, slug: city.slug }, "city-health-alert: lease acquisition failed");
      failed.push(city.slug);
    }
  }

  if (!leasedCities.length) return { checked: cities.length, alerted: [], skipped, failed };

  // Send email (required channel) with a hard timeout safely below the lease TTL.
  //
  // IMPORTANT: on timeout we do NOT release the lease. Releasing would allow the
  // next tick to claim and send a new alert while the original Resend request may
  // still complete in the background — producing a duplicate founder notification.
  // Instead, the lease expires naturally after LEASE_TTL_MINUTES. The original
  // request cannot finalize (we return early from this function), so no cooldown
  // stamp is written. After the lease expires the next tick re-claims and retries.
  // At worst the founder receives the alert with a delay of up to LEASE_TTL_MINUTES
  // rather than instantly — an acceptable trade-off for guaranteed no-duplicate.
  //
  // If the send genuinely fails (network error, bad API key, etc.) the lease IS
  // released so the next tick can retry immediately.
  const emailTimeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`__TIMEOUT__: email timed out after ${EMAIL_TIMEOUT_MS / 1000}s`)), EMAIL_TIMEOUT_MS),
  );
  try {
    await Promise.race([sendAlertEmail(leasedCities), emailTimeoutPromise]);
  } catch (err) {
    const isTimeout = err instanceof Error && err.message.startsWith("__TIMEOUT__");
    if (isTimeout) {
      // Let leases expire naturally — do NOT release. See comment above.
      logger.warn(
        { leaseTtlMinutes: LEASE_TTL_MINUTES, cities: leasedCities.map((c) => c.slug) },
        "city-health-alert: email timed out — retaining leases until natural expiry to prevent duplicate sends",
      );
    } else {
      // Genuine send failure — release leases so the next tick retries promptly.
      logger.error(
        { err, cities: leasedCities.map((c) => c.slug) },
        "city-health-alert: email failed — releasing leases for retry",
      );
      for (const city of leasedCities) {
        await releaseAlertLease(city.slug, city.leaseToken);
      }
    }
    for (const city of leasedCities) failed.push(city.slug);
    return { checked: cities.length, alerted: [], skipped, failed };
  }

  // Email confirmed. Finalize each city: write last_alerted_at + clear lease,
  // conditioned on the ownership token. Only cities where THIS process still
  // owns the token (rowCount > 0) count as successfully alerted — if the lease
  // expired and was reclaimed by another instance that already finalized, the
  // predicate matches 0 rows and we do not double-count or overwrite.
  for (const city of leasedCities) {
    try {
      const owned = await finalizeAlertLease(city.slug, city.leaseToken);
      if (owned) {
        alerted.push(city.slug);
      } else {
        // Lease was reclaimed — competing instance already delivered and finalized.
        logger.warn({ slug: city.slug }, "city-health-alert: lease lost before finalization — competing instance delivered");
      }
    } catch (err) {
      logger.error({ err, slug: city.slug }, "city-health-alert: finalize failed — lease will expire naturally");
      failed.push(city.slug);
    }
  }

  // SMS is optional — a failure does not affect the cooldown or the alerted set.
  try {
    const smsSent = await sendAlertSms(leasedCities);
    if (smsSent) logger.info({ cities: alerted }, "city-health-alert: SMS alert sent");
  } catch (err) {
    logger.error({ err }, "city-health-alert: optional SMS failed (email delivered; cooldown intact)");
  }

  return { checked: cities.length, alerted, skipped, failed };
}

// ── Required schema columns ───────────────────────────────────────────────────
// Verified explicitly before the scheduler starts. runStartupMigrations() catches
// individual migration errors and always resolves — a failed ADD COLUMN leaves
// the scheduler starting against a table with missing columns, causing every
// lease claim to fail silently. This DB probe is the authoritative gate.
const REQUIRED_COLUMNS = ["last_alerted_at", "alert_claim_token", "alert_lease_expires_at"] as const;

async function verifyAlertSchema(): Promise<boolean> {
  try {
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'city_launches'
         AND column_name = ANY($1::text[])`,
      [REQUIRED_COLUMNS],
    );
    const found = new Set(rows.map((r) => r.column_name));
    const missing = (REQUIRED_COLUMNS as readonly string[]).filter((c) => !found.has(c));
    if (missing.length > 0) {
      logger.error(
        { missing },
        "city-health-alert: required columns missing from city_launches — scheduler NOT started",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "city-health-alert: schema verification query failed — scheduler NOT started");
    return false;
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Called from index.ts after runStartupMigrations resolves. Verifies the three
// required lease columns actually exist in the DB before registering the cron
// job — guards against a migration runner that resolves despite partial failure.
export async function startCityHealthAlertScheduler(): Promise<void> {
  const schedule = process.env.CITY_HEALTH_CRON_SCHEDULE ?? "*/30 * * * *";

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, "city-health-alert: invalid schedule — scheduler not started");
    return;
  }

  const schemaReady = await verifyAlertSchema();
  if (!schemaReady) return;

  cron.schedule(schedule, async () => {
    logger.info("city-health-alert: running health check");
    try {
      const result = await runCityHealthCheck();
      logger.info(
        { checked: result.checked, alerted: result.alerted.length, skipped: result.skipped.length, failed: result.failed.length },
        "city-health-alert: check complete",
      );
      if (result.alerted.length > 0)
        logger.warn({ cities: result.alerted }, "city-health-alert: alerts fired for degraded cities");
      if (result.failed.length > 0)
        logger.warn({ cities: result.failed }, "city-health-alert: some cities failed health check or delivery");
    } catch (err) {
      logger.error({ err }, "city-health-alert: batch failed");
    }
  });

  logger.info({ schedule }, "city-health-alert: scheduler started");
}
