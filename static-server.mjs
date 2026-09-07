import express from "express";
import fs from "node:fs";
import { request as httpsRequest } from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const UPSTREAM = new URL("https://mwm-staging.35.196.78.19.nip.io");
const WEB_STATIC = path.join(__dirname, "web-static");
const INDEX = path.join(WEB_STATIC, "index.html");
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function fail(message) {
  process.stderr.write(`PUBLIC_FRONTEND_BLOCKED: ${message}\n`);
  process.exit(78);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) fail("invalid PORT");
if (!fs.existsSync(INDEX) || fs.statSync(INDEX).size < 1024) fail("web-static/index.html is missing or truncated");
if (process.env.DATABASE_URL) {
  process.stderr.write("PUBLIC_FRONTEND: DATABASE_URL is intentionally ignored; this process has no database client\n");
}

function sanitizedRequestHeaders(req) {
  const headers = {};
  const connectionTokens = new Set(
    String(req.headers.connection ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  for (const [name, value] of Object.entries(req.headers)) {
    const normalizedName = name.toLowerCase();
    if (!HOP_BY_HOP.has(normalizedName) && !connectionTokens.has(normalizedName) && value !== undefined) headers[name] = value;
  }
  headers.host = UPSTREAM.host;
  headers.origin = UPSTREAM.origin;
  headers["x-forwarded-host"] = "www.mappingwithmelanin.com";
  headers["x-forwarded-proto"] = "https";
  if (req.socket.remoteAddress) headers["x-forwarded-for"] = req.socket.remoteAddress;
  return headers;
}

function proxyApi(req, res) {
  const upstreamRequest = httpsRequest({
    protocol: UPSTREAM.protocol,
    hostname: UPSTREAM.hostname,
    port: UPSTREAM.port || 443,
    method: req.method,
    path: `/api${req.url}`,
    headers: sanitizedRequestHeaders(req),
    timeout: 120_000,
  }, (upstreamResponse) => {
    const responseHeaders = {};
    for (const [name, value] of Object.entries(upstreamResponse.headers)) {
      if (!HOP_BY_HOP.has(name.toLowerCase()) && value !== undefined) responseHeaders[name] = value;
    }
    res.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
    upstreamResponse.pipe(res);
  });

  upstreamRequest.on("timeout", () => upstreamRequest.destroy(new Error("upstream timeout")));
  upstreamRequest.on("error", () => {
    if (!res.headersSent) res.status(502).json({ error: "Service temporarily unavailable. Please try again." });
    else res.destroy();
  });
  req.on("aborted", () => upstreamRequest.destroy());
  req.pipe(upstreamRequest);
}

async function assertUpstreamReady() {
  await new Promise((resolve, reject) => {
    const request = httpsRequest({
      protocol: UPSTREAM.protocol,
      hostname: UPSTREAM.hostname,
      port: UPSTREAM.port || 443,
      method: "GET",
      path: "/api/healthz",
      headers: { accept: "application/json", host: UPSTREAM.host },
      timeout: 15_000,
    }, (response) => {
      response.resume();
      response.once("end", () => {
        if ((response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300) resolve();
        else reject(new Error(`staging health returned ${response.statusCode ?? "unknown"}`));
      });
    });
    request.once("timeout", () => request.destroy(new Error("staging health timed out")));
    request.once("error", reject);
    request.end();
  });
}

await assertUpstreamReady().catch((error) => fail(error instanceof Error ? error.message : String(error)));

const app = express();
app.disable("x-powered-by");
app.post("/__client-error", (_req, res) => res.status(204).end());
app.use("/api", proxyApi);
app.use((req, res, next) => {
  if (/\.(?:zip|tar\.gz|ipa|aab|apk|dmg|pem|p12|mobileprovision)$/i.test(req.path)) return res.status(404).end();
  next();
});
app.use(express.static(WEB_STATIC, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html") || !filePath.includes(".")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));
app.use((req, res) => {
  if (path.extname(req.path)) return res.status(404).end();
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(INDEX);
});

app.listen(PORT, "0.0.0.0", () => {
  process.stderr.write(`PUBLIC_FRONTEND_READY: port=${PORT} api_upstream=isolated-staging database_access=disabled\n`);
});
