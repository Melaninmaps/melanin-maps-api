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

const WEB_STATIC = fs.existsSync(dirnamePath)
  ? dirnamePath
  : fs.existsSync(cwdPath)
  ? cwdPath
  : null;

process.stderr.write(`Using web-static: ${WEB_STATIC}\n`);

// ── Startup DB migration: ensure waitlist_signups table exists ────────────────
async function runWaitlistMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    process.stderr.write("DB_MIGRATION: DATABASE_URL not set, skipping\n");
    return;
  }
  try {
    let url;
    try { url = new URL(dbUrl); } catch { process.stderr.write("DB_MIGRATION: invalid DATABASE_URL\n"); return; }
    const noSsl = url.hostname.includes("localhost") || url.hostname.includes("127.0.0.1") || url.hostname.includes(".internal");
    const ssl = noSsl ? false : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: dbUrl, ssl, connectionTimeoutMillis: 10000 });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(50),
        is_business_owner BOOLEAN NOT NULL DEFAULT false,
        website_url VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        referral_code VARCHAR(20),
        referred_by VARCHAR(20),
        family_group_id VARCHAR(36),
        notes TEXT,
        city_nomination VARCHAR(150),
        welcome_email_sent BOOLEAN NOT NULL DEFAULT false,
        launch_email_sent BOOLEAN NOT NULL DEFAULT false,
        beta_email_sent BOOLEAN NOT NULL DEFAULT false,
        approved_at TIMESTAMP,
        last_nudge_sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        import_batch_id VARCHAR(100)
      )
    `);
    process.stderr.write("DB_MIGRATION: waitlist_signups table ensured\n");

    const seeds = [
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,is_business_owner,website_url,status,referral_code,referred_by,family_group_id,notes,city_nomination,welcome_email_sent,launch_email_sent,beta_email_sent,approved_at,last_nudge_sent_at,created_at,import_batch_id) VALUES ('2db6dd96-1629-436b-ab1e-8f9b2b2f69f3','test@example.com',NULL,NULL,NULL,NULL,false,NULL,'pending','TESTEXAM',NULL,NULL,NULL,NULL,true,false,false,NULL,NULL,'2026-06-19 00:46:35.92888',NULL) ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,is_business_owner,website_url,status,referral_code,referred_by,family_group_id,notes,city_nomination,welcome_email_sent,launch_email_sent,beta_email_sent,approved_at,last_nudge_sent_at,created_at,import_batch_id) VALUES ('f8e1cbdb-436e-42f1-9f85-870075579fef','hello@melaninmaps.app',NULL,NULL,NULL,NULL,false,NULL,'pending','HELLOMEL',NULL,NULL,NULL,NULL,true,false,false,NULL,NULL,'2026-06-19 00:47:18.150516',NULL) ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,is_business_owner,website_url,status,referral_code,referred_by,family_group_id,notes,city_nomination,welcome_email_sent,launch_email_sent,beta_email_sent,approved_at,last_nudge_sent_at,created_at,import_batch_id) VALUES ('a045ce9c-fa43-47f2-b00b-849599b1d661','demo@example.com','Jordan','Williams','Atlanta','GA',false,NULL,'pending','DEMOEXAM',NULL,NULL,NULL,NULL,true,false,false,NULL,NULL,'2026-06-27 03:28:28.35042',NULL) ON CONFLICT (id) DO NOTHING`,
      `INSERT INTO waitlist_signups (id,email,first_name,last_name,city,state,is_business_owner,website_url,status,referral_code,referred_by,family_group_id,notes,city_nomination,welcome_email_sent,launch_email_sent,beta_email_sent,approved_at,last_nudge_sent_at,created_at,import_batch_id) VALUES ('10db70f8-4f18-4da6-b464-1ee1131185bf','regression_test_delete_me@example.com','RegressionTest','DeleteMe','Atlanta','GA',false,NULL,'pending','REGRESSI',NULL,NULL,NULL,NULL,false,false,false,NULL,NULL,'2026-07-20 13:12:28.523315',NULL) ON CONFLICT (id) DO NOTHING`,
    ];
    for (const sql of seeds) { await pool.query(sql); }
    process.stderr.write(`DB_MIGRATION: seeded ${seeds.length} waitlist rows\n`);
    await pool.end();
  } catch (err) {
    process.stderr.write(`DB_MIGRATION: ERROR ${err.message}\n`);
  }
}
runWaitlistMigration();

const api = spawn(process.execPath, ["dist/index.mjs"], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: "inherit",
});
api.on("exit", (code) => {
  process.stderr.write(`API server exited: ${code}\n`);
  process.exit(code || 1);
});

const clientErrors = [];
const app = express();

app.post("/__client-error", (req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const entry = { ts: new Date().toISOString(), ua: req.headers["user-agent"] || "", body };
    clientErrors.unshift(entry);
    if (clientErrors.length > 50) clientErrors.pop();
    process.stderr.write(`[CLIENT-ERROR] ${body.slice(0, 500)}\n`);
    res.status(204).end();
  });
});

app.get("/__errors", (req, res) => {
  res.json({ count: clientErrors.length, errors: clientErrors });
});

app.get("/__debug", (req, res) => {
  const info = {
    cwd: process.cwd(),
    __dirname,
    WEB_STATIC,
    cwdContents: (() => { try { return fs.readdirSync(process.cwd()); } catch { return "error"; } })(),
    webStaticContents: WEB_STATIC ? (() => { try { return fs.readdirSync(WEB_STATIC); } catch { return "error"; } })() : "not set",
  };
  res.json(info);
});

app.get("/api/db-probe", (req, res) => {
  if (process.env.DB_PROBE_ENABLED !== "true") return res.status(404).end();
  const probeKey = process.env.DB_PROBE_KEY;
  if (!probeKey || req.headers["x-probe-key"] !== probeKey) return res.status(401).json({ error: "Unauthorized" });

  let databaseUrl;
  try { databaseUrl = new URL(process.env.DATABASE_URL ?? ""); }
  catch { return res.json({ connected: false, elapsedMs: 0, hostCategory: "unknown", error: { code: "INVALID_DATABASE_URL" } }); }

  const host = databaseUrl.hostname;
  const port = Number(databaseUrl.port || 5432);
  const hostCategory = host.endsWith(".internal") ? "internal" : "public-proxy";
  const startedAt = Date.now();
  const socket = net.createConnection({ host, port });
  let finished = false;

  const finish = (payload) => {
    if (finished) return;
    finished = true;
    socket.destroy();
    if (!res.headersSent) res.json({ ...payload, elapsedMs: Date.now() - startedAt, hostCategory, host, port });
  };

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
  app.get("*", (req, res) => { res.sendFile(path.join(WEB_STATIC, "index.html")); });
} else {
  app.get("*", (req, res) => { res.status(503).send(`Web app not found. WEB_STATIC is null.`); });
}

app.listen(PORT, () => {
  process.stderr.write(`Listening on port ${PORT} — API on ${API_PORT}\n`);
});
