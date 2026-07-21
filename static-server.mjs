import express from "express";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import net from "node:net";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8080");
const API_PORT = 3001;
const cwdPath = path.join(process.cwd(), "web-static");
const dirnamePath = path.join(__dirname, "web-static");
const WEB_STATIC = fs.existsSync(dirnamePath) ? dirnamePath : fs.existsSync(cwdPath) ? cwdPath : null;
process.stderr.write(`Using web-static: ${WEB_STATIC}\n`);

function buildPool() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  let url;
  try { url = new URL(dbUrl); } catch { return null; }
  const noSsl = url.hostname.includes("localhost") || url.hostname.includes("127.0.0.1") || url.hostname.includes(".internal");
  const ssl = noSsl ? false : { rejectUnauthorized: false };
  return new Pool({ connectionString: dbUrl, ssl, connectionTimeoutMillis: 10000 });
}

async function runMigration() {
  const pool = buildPool();
  if (!pool) { process.stderr.write("DB_MIGRATION: no DATABASE_URL\n"); return; }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS waitlist_signups (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(100), last_name VARCHAR(100),
      city VARCHAR(100), state VARCHAR(50),
      is_business_owner BOOLEAN NOT NULL DEFAULT false,
      website_url VARCHAR(500), status VARCHAR(20) NOT NULL DEFAULT 'pending',
      referral_code VARCHAR(20), referred_by VARCHAR(20),
      family_group_id VARCHAR(36), notes TEXT, city_nomination VARCHAR(150),
      welcome_email_sent BOOLEAN NOT NULL DEFAULT false,
      launch_email_sent BOOLEAN NOT NULL DEFAULT false,
      beta_email_sent BOOLEAN NOT NULL DEFAULT false,
      approved_at TIMESTAMP, last_nudge_sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), import_batch_id VARCHAR(100)
    )`);
    process.stderr.write("DB_MIGRATION: waitlist_signups table ensured\n");
    const addCols = [
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS city_nomination VARCHAR(150)`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS launch_email_sent BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS beta_email_sent BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS last_nudge_sent_at TIMESTAMP`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100)`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS family_group_id VARCHAR(36)`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS city VARCHAR(100)`,
      `ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS state VARCHAR(50)`,
    ];
    for (const sql of addCols) { try { await pool.query(sql); } catch(e) { process.stderr.write(`DB_MIGRATION: col skip: ${e.message}\n`); } }
    process.stderr.write("DB_MIGRATION: columns backfilled\n");
    const seeds = [
      `INSERT INTO waitlist_signups (id,email,status,referral_code,welcome_email_sent,created_at) VALUES ('2db6dd96-1629-436b-ab1e-8f9b2b2f69f3','test@example.com','pending','TESTEXAM',true,'2026-06-19 00:46:35') ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,status,referral_code,welcome_email_sent,created_at) VALUES ('f8e1cbdb-436e-42f1-9f85-870075579fef','hello@melaninmaps.app','pending','HELLOMEL',true,'2026-06-19 00:47:18') ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,status,referral_code,welcome_email_sent,created_at) VALUES ('a045ce9c-fa43-47f2-b00b-849599b1d661','demo@example.com','Jordan','Williams','Atlanta','GA','pending','DEMOEXAM',true,'2026-06-27 03:28:28') ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,status,referral_code,created_at) VALUES ('10db70f8-4f18-4da6-b464-1ee1131185bf','regression_test_delete_me@example.com','RegressionTest','DeleteMe','Atlanta','GA','pending','REGRESSI','2026-07-20 13:12:28') ON CONFLICT (id) DO NOTHING`,
    ];
    for (const sql of seeds) { try { await pool.query(sql); } catch(e) { /* ignore dups */ } }
    process.stderr.write(`DB_MIGRATION: seeded rows\n`);

    // Add missing columns to businesses table (schema drift fix)
    const businessCols = [
      `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS profile_status VARCHAR(30) NOT NULL DEFAULT 'community_listed'`,
      `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS community_audience_type VARCHAR(30) NOT NULL DEFAULT 'unknown'`,
    ];
    for (const sql of businessCols) {
      try { await pool.query(sql); } catch(e) { process.stderr.write(`DB_MIGRATION: biz col skip: ${e.message}\n`); }
    }
    process.stderr.write("DB_MIGRATION: businesses columns ensured\n");

    await pool.end();
  } catch(err) { process.stderr.write(`DB_MIGRATION: FATAL ${err.message}\n`); }
}
runMigration();

const api = spawn(process.execPath, ["dist/index.mjs"], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: "inherit",
});
api.on("exit", (code) => { process.stderr.write(`API server exited: ${code}\n`); process.exit(code || 1); });

const clientErrors = [];
const app = express();

app.post("/__client-error", (req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const entry = { ts: new Date().toISOString(), ua: req.headers["user-agent"] || "", body };
    clientErrors.unshift(entry); if (clientErrors.length > 50) clientErrors.pop();
    res.status(204).end();
  });
});

app.get("/__errors", (req, res) => { res.json({ count: clientErrors.length, errors: clientErrors }); });
app.get("/__debug", (req, res) => {
  res.json({ cwd: process.cwd(), __dirname, WEB_STATIC,
    cwdContents: (() => { try { return fs.readdirSync(process.cwd()); } catch { return "error"; } })() });
});

// Full table counts for reconciliation — probe-key protected
app.get("/api/waitlist-diag", async (req, res) => {
  if (req.headers["x-probe-key"] !== process.env.DB_PROBE_KEY) return res.status(401).end();
  const pool = buildPool();
  if (!pool) return res.json({ error: "no DATABASE_URL" });
  const dbUrl = process.env.DATABASE_URL ?? "";
  let hostRedacted = "unknown";
  try { const u = new URL(dbUrl); hostRedacted = u.hostname.replace(/^[^.]+/, "***"); } catch {}
  const tables = ["users","sessions","waitlist_signups","businesses","community_posts","reviews","messages","saved_places","neighborhood_surveys","knowledge_articles"];
  const counts = {};
  try {
    for (const t of tables) {
      try { const r = await pool.query(`SELECT count(*) FROM ${t}`); counts[t] = parseInt(r.rows[0].count); }
      catch(e) { counts[t] = `ERR: ${e.message.slice(0,80)}`; }
    }
    let cityRows = [];
    try { const r2 = await pool.query(`SELECT city, count(*) AS total FROM waitlist_signups WHERE city IS NOT NULL GROUP BY city ORDER BY count(*) DESC`); cityRows = r2.rows; } catch {}
    await pool.end();
    res.json({ db_host: hostRedacted, counts, waitlist_cities: cityRows });
  } catch(err) {
    try { await pool.end(); } catch {}
    res.json({ error: err.message });
  }
});

app.get("/api/db-probe", (req, res) => {
  if (process.env.DB_PROBE_ENABLED !== "true") return res.status(404).end();
  if (!process.env.DB_PROBE_KEY || req.headers["x-probe-key"] !== process.env.DB_PROBE_KEY) return res.status(401).json({ error: "Unauthorized" });
  let databaseUrl;
  try { databaseUrl = new URL(process.env.DATABASE_URL ?? ""); } catch { return res.json({ connected: false, elapsedMs: 0, hostCategory: "unknown", error: { code: "INVALID_DATABASE_URL" } }); }
  const host = databaseUrl.hostname; const port = Number(databaseUrl.port || 5432);
  const hostCategory = host.endsWith(".internal") ? "internal" : "public-proxy";
  const startedAt = Date.now();
  const socket = net.createConnection({ host, port });
  let finished = false;
  const finish = (payload) => { if (finished) return; finished = true; socket.destroy(); if (!res.headersSent) res.json({ ...payload, elapsedMs: Date.now() - startedAt, hostCategory, host, port }); };
  socket.setTimeout(3000);
  socket.once("connect", () => finish({ connected: true }));
  socket.once("timeout", () => finish({ connected: false, error: { code: "ETIMEDOUT" } }));
  socket.once("error", (error) => finish({ connected: false, error: { code: typeof error.code === "string" ? error.code : "SOCKET_ERROR" } }));
});


app.use("/api", (req, res) => {
  const proxyReq = httpRequest(
    { hostname: "localhost", port: API_PORT, path: "/api" + req.url, method: req.method, headers: { ...req.headers, host: `localhost:${API_PORT}` } },
    (proxyRes) => { res.writeHead(proxyRes.statusCode, proxyRes.headers); proxyRes.pipe(res); }
  );
  proxyReq.on("error", () => res.status(502).json({ error: "API starting, please retry" }));
  req.pipe(proxyReq);
});

if (WEB_STATIC) {
  app.use(express.static(WEB_STATIC));
  app.get("/{*path}", (req, res) => { res.sendFile(path.join(WEB_STATIC, "index.html")); });
} else {
  app.get("/{*path}", (req, res) => { res.status(503).send(`Web app not found.`); });
}

app.listen(PORT, () => { process.stderr.write(`Listening on port ${PORT} — API on ${API_PORT}\n`); });
