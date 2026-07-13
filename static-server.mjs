import express from "express";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8080");
const API_PORT = 3001;

// Diagnose paths at startup
const cwdPath = path.join(process.cwd(), "web-static");
const dirnamePath = path.join(__dirname, "web-static");
console.log(`CWD: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);
console.log(`cwd/web-static exists: ${fs.existsSync(cwdPath)}`);
console.log(`__dirname/web-static exists: ${fs.existsSync(dirnamePath)}`);

// Pick whichever path has the files
const WEB_STATIC = fs.existsSync(dirnamePath)
  ? dirnamePath
  : fs.existsSync(cwdPath)
  ? cwdPath
  : null;

console.log(`Using web-static at: ${WEB_STATIC}`);

const api = spawn(process.execPath, ["dist/index.mjs"], {
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: "inherit",
});
api.on("exit", (code) => {
  console.error("API server exited with code", code);
  process.exit(code || 1);
});

const app = express();

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
    res.status(503).send("Web app not found — web-static directory missing");
  });
}

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} — API on ${API_PORT}`);
});
