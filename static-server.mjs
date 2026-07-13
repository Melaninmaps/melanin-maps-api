import express from "express";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8080");
const API_PORT = 3001;

// Diagnose paths
const cwdPath = path.join(process.cwd(), "web-static");
const dirnamePath = path.join(__dirname, "web-static");

process.stderr.write(`CWD: ${process.cwd()}\n`);
process.stderr.write(`__dirname: ${__dirname}\n`);
process.stderr.write(`cwd/web-static exists: ${fs.existsSync(cwdPath)}\n`);
process.stderr.write(`__dirname/web-static exists: ${fs.existsSync(dirnamePath)}\n`);

// Try to list files in various locations
const candidates = [
  "/app",
  "/app/web-static",
  process.cwd(),
  cwdPath,
  __dirname,
  dirnamePath,
];
for (const c of candidates) {
  try {
    const entries = fs.readdirSync(c).slice(0, 5).join(", ");
    process.stderr.write(`ls ${c}: ${entries}\n`);
  } catch {
    process.stderr.write(`ls ${c}: ERROR\n`);
  }
}

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

const app = express();

// Debug route — hit this to see filesystem state
app.get("/__debug", (req, res) => {
  const info = {
    cwd: process.cwd(),
    __dirname,
    cwdWebStatic: fs.existsSync(cwdPath),
    dirnameWebStatic: fs.existsSync(dirnamePath),
    WEB_STATIC,
    cwdContents: (() => { try { return fs.readdirSync(process.cwd()); } catch { return "error"; } })(),
    webStaticContents: WEB_STATIC ? (() => { try { return fs.readdirSync(WEB_STATIC); } catch { return "error"; } })() : "not set",
  };
  res.json(info);
});

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
    res.status(503).send(`Web app not found. WEB_STATIC is null. cwd=${process.cwd()} __dirname=${__dirname}`);
  });
}

app.listen(PORT, () => {
  process.stderr.write(`Listening on port ${PORT} — API on ${API_PORT}\n`);
});
