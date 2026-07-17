import express from "express";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import net from "node:net";

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

const api = spawn(process.execPath, ["dist/index.mjs"], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: "inherit",
});
api.on("exit", (code) => {
  process.stderr.write(`API server exited: ${code}\n`);
  process.exit(code || 1);
});

// In-memory error store (last 50 client errors)
const clientErrors = [];

const app = express();

// Client error beacon receiver — browsers send window.onerror payloads here
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

// Error store read endpoint — curl this to see recent browser JS errors
app.get("/__errors", (req, res) => {
  res.json({ count: clientErrors.length, errors: clientErrors });
});

// Debug route
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

// Temporary diagnostic route — remove immediately after one controlled test.
app.get("/api/db-probe", (req, res) => {
  if (process.env.DB_PROBE_ENABLED !== "true") {
    return res.status(404).end();
  }

  const probeKey = process.env.DB_PROBE_KEY;

  if (!probeKey || req.headers["x-probe-key"] !== probeKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  } catch {
    return res.json({
      connected: false,
      elapsedMs: 0,
      hostCategory: "unknown",
      error: { code: "INVALID_DATABASE_URL" },
    });
  }

  const host = databaseUrl.hostname;
  const port = Number(databaseUrl.port || 5432);
  const hostCategory = host.endsWith(".internal")
    ? "internal"
    : "public-proxy";

  const startedAt = Date.now();
  const socket = net.createConnection({ host, port });

  let finished = false;

  const finish = (payload) => {
    if (finished) return;
    finished = true;
    socket.destroy();

    if (!res.headersSent) {
      res.json({
        ...payload,
        elapsedMs: Date.now() - startedAt,
        hostCategory,
      });
    }
  };

  socket.setTimeout(3000);

  socket.once("connect", () => {
    finish({ connected: true });
  });

  socket.once("timeout", () => {
    finish({
      connected: false,
      error: { code: "ETIMEDOUT" },
    });
  });

  socket.once("error", (error) => {
    finish({
      connected: false,
      error: {
        code: typeof error.code === "string" ? error.code : "SOCKET_ERROR",
      },
    });
  });
});

// Proxy all /api/* to the Express API
app.use("/api", (req, res) => {
  const proxyReq = httpRequest(
    {
      hostname: "localhost",
      port: API_PORT,
      path: "/api" + req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${API_PORT}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", () =>
    res.status(502).json({ error: "API starting, please retry" })
  );
  req.pipe(proxyReq);
});

if (WEB_STATIC) {
  app.use(express.static(WEB_STATIC));
  app.get("*", (req, res) => {
    res.sendFile(path.join(WEB_STATIC, "index.html"));
  });
} else {
  app.get("*", (req, res) => {
    res.status(503).send(`Web app not found. WEB_STATIC is null.`);
  });
}

app.listen(PORT, () => {
  process.stderr.write(`Listening on port ${PORT} — API on ${API_PORT}\n`);
});
