import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const BRAND_GOLD = "#CA922B";
const BRAND_DARK = "#2B1507";
const BRAND_CREAM = "#FAF6EF";

function buildSvg(name: string, category: string, city: string, state: string): string {
  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeCategory = category.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeLocation = [city, state].filter(Boolean).join(", ").replace(/&/g, "&amp;");
  const nameFontSize = safeName.length > 30 ? 44 : safeName.length > 20 ? 52 : 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND_DARK}" />
      <stop offset="100%" stop-color="#4A2810" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BRAND_GOLD}" />
      <stop offset="100%" stop-color="#E6A83C" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Decorative circles -->
  <circle cx="1100" cy="80" r="200" fill="${BRAND_GOLD}" opacity="0.06" />
  <circle cx="1050" cy="560" r="150" fill="${BRAND_GOLD}" opacity="0.04" />
  <circle cx="100" cy="550" r="120" fill="${BRAND_GOLD}" opacity="0.04" />

  <!-- Gold accent bar -->
  <rect x="80" y="80" width="6" height="160" rx="3" fill="url(#accent)" />

  <!-- Category pill -->
  <rect x="96" y="88" width="${Math.min(safeCategory.length * 14 + 32, 300)}" height="40" rx="20" fill="${BRAND_GOLD}" opacity="0.2" />
  <text x="112" y="114" font-family="Georgia, serif" font-size="20" font-weight="700" fill="${BRAND_GOLD}" letter-spacing="1">${safeCategory.toUpperCase()}</text>

  <!-- Business name -->
  <text x="96" y="${nameFontSize > 52 ? 200 : 210}" font-family="Georgia, serif" font-size="${nameFontSize}" font-weight="700" fill="${BRAND_CREAM}" width="900">${safeName}</text>

  <!-- Location -->
  ${safeLocation ? `<text x="96" y="${nameFontSize > 52 ? 260 : 275}" font-family="Arial, sans-serif" font-size="28" fill="${BRAND_GOLD}" opacity="0.9">📍 ${safeLocation}</text>` : ""}

  <!-- Divider -->
  <rect x="80" y="490" width="1040" height="1" fill="${BRAND_GOLD}" opacity="0.2" />

  <!-- Brand mark -->
  <text x="80" y="560" font-family="Georgia, serif" font-size="26" font-weight="700" font-style="italic" fill="${BRAND_CREAM}" opacity="0.9">Mapping With Melanin™</text>
  <text x="80" y="592" font-family="Arial, sans-serif" font-size="18" fill="${BRAND_GOLD}" opacity="0.7">mappingwithmelanin.com</text>

  <!-- Black-owned badge -->
  <rect x="920" y="530" width="220" height="48" rx="24" fill="${BRAND_GOLD}" />
  <text x="1030" y="562" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${BRAND_DARK}" text-anchor="middle">✊🏾 Black-Owned</text>
</svg>`;
}

router.get("/og/business/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const [biz] = await db
      .select({
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!biz) {
      res.redirect("https://mappingwithmelanin.com/images/og-share.jpg");
      return;
    }

    const svg = buildSvg(biz.name ?? "Business", biz.category ?? "", biz.city ?? "", biz.state ?? "");

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.send(svg);
  } catch (err) {
    req.log.error({ err }, "OG image generation failed");
    res.redirect("https://mappingwithmelanin.com/images/og-share.jpg");
  }
});

export default router;
