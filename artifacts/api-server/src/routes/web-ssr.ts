import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const BASE_DOMAIN = "https://www.melaninmaps.com";

function isBot(ua: string): boolean {
  return /facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|pinterest|googlebot|bingbot|applebot|iframely|opengraph|embedly/i.test(
    ua,
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

router.get("/web/businesses/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const ua = String(req.headers["user-agent"] ?? "");

  try {
    const [business] = await db
      .select({
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        description: businessesTable.description,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!business) {
      res.redirect(302, "/web/");
      return;
    }

    const title = escapeHtml(`${business.name} — Mapping With Melanin™`);
    const description = escapeHtml(
      business.description
        ? business.description.slice(0, 200)
        : `${business.category} in ${business.city}, ${business.state} — Black-owned business on Mapping With Melanin™`,
    );
    const ogImageUrl = `${BASE_DOMAIN}/api/og/business/${encodeURIComponent(id)}`;
    const canonicalUrl = `${BASE_DOMAIN}/web/businesses/${encodeURIComponent(id)}`;
    const safeId = JSON.stringify(id);
    const botDetected = isBot(ua);

    const redirectScript = botDetected
      ? ""
      : `<script>
  try {
    sessionStorage.setItem('_og_business_id', ${safeId});
  } catch(e) {}
  window.location.replace('/web/');
</script>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="business.business" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="Mapping With Melanin™" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(`${business.name} — Black-owned ${business.category} in ${business.city}, ${business.state}`)}" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@melaninmaps" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />

  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  ${redirectScript}
</head>
<body style="font-family:sans-serif;background:#2B1507;color:#F5EBD8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;">
  <div style="max-width:480px;text-align:center;">
    <div style="color:#CA922B;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Mapping With Melanin™</div>
    <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;color:#F5EBD8;">${escapeHtml(business.name)}</h1>
    <p style="color:#CA922B;margin:0 0 16px;">${escapeHtml(business.category)} · ${escapeHtml(business.city)}, ${escapeHtml(business.state)}</p>
    <p style="color:#F5EBD8;opacity:0.7;margin:0 0 28px;">${description}</p>
    <a href="/web/businesses/${encodeURIComponent(id)}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;">View Full Details →</a>
  </div>
</body>
</html>`;

    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600")
      .send(html);
  } catch (err) {
    req.log.error({ err }, "web-ssr: failed to render business page");
    res.redirect(302, "/web/");
  }
});

export default router;
