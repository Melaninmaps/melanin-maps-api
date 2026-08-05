/**
 * Renders the two MWM business card HTML files to high-res JPG images
 * using Playwright + a local HTTP server.
 */
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const CARDS_DIR = join(process.cwd(), "artifacts/web/public/cards");
const OUT_DIR   = join(process.cwd(), "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css",
  ".js":   "application/javascript",
  ".png":  "image/png",
};

// Minimal static file server for the cards directory
const server = createServer((req, res) => {
  try {
    const file = join(CARDS_DIR, req.url === "/" ? "/index.html" : req.url);
    const body = readFileSync(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "text/plain" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});

await new Promise(r => server.listen(0, "127.0.0.1", r));
const { port } = server.address();
console.log(`Server on :${port}`);

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const cards = [
  { file: "business-card-design-1.html", out: "business-card-design-1.jpg" },
  { file: "business-card-design-2.html", out: "business-card-design-2.jpg" },
];

for (const { file, out } of cards) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: "networkidle" });

  // Wait for the QR code canvas to be drawn
  await page.waitForFunction(() => {
    const c = document.querySelector("canvas");
    return c && c.width > 0;
  }, { timeout: 10000 }).catch(() => console.log(`QR timeout on ${file} — continuing`));

  // Small additional buffer for fonts
  await page.waitForTimeout(1500);

  const outPath = join(OUT_DIR, out);
  await page.screenshot({ path: outPath, type: "jpeg", quality: 97, fullPage: true });
  console.log(`Saved: ${outPath}`);
  await page.close();
}

await browser.close();
server.close();
console.log("Done.");
