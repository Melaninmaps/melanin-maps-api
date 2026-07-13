import express from "express";
import { spawn } from "child_process";
import { request as httpRequest } from "http";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "8080");
const API_PORT = 3001;

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

app.use(express.static(path.join(__dirname, "web-static")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "web-static", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT} — API on ${API_PORT}`);
});
