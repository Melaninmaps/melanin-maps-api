import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import satori from "satori";
// Dynamic import so native module absence doesn't crash startup
let _Resvg: typeof import("@resvg/resvg-js").Resvg | null = null;
async function getResvg() {
  if (!_Resvg) {
    const mod = await import("@resvg/resvg-js").catch(() => null);
    _Resvg = mod?.Resvg ?? null;
  }
  return _Resvg;
}
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const router: IRouter = Router();

const FALLBACK_URL = "/api/og/fallback";

let fontCache: Buffer | null = null;

async function loadFont(): Promise<Buffer | null> {
  if (fontCache) return fontCache;
  try {
    const fontPath = join(dirname(fileURLToPath(import.meta.url)), "NotoSans-Regular.ttf");
    fontCache = await readFile(fontPath);
    return fontCache;
  } catch {
    return null;
  }
}

function buildElement(name: string, category: string, city: string, state: string) {
  const fontSize = name.length > 30 ? "52px" : "64px";
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        width: "1200px",
        height: "630px",
        background: "#2B1507",
        fontFamily: "Inter",
        padding: "64px 80px",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: "12px" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    background: "#CA922B",
                    borderRadius: "50%",
                    width: "12px",
                    height: "12px",
                    display: "flex",
                  },
                  children: [],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#CA922B",
                    fontSize: "18px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    display: "flex",
                  },
                  children: "MAPPING WITH MELANIN\u2122",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column" as const, gap: "16px" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    background: "#CA922B",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    padding: "6px 18px",
                    borderRadius: "100px",
                    display: "flex",
                    alignSelf: "flex-start",
                  },
                  children: category.toUpperCase(),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#F5EBD8",
                    fontSize,
                    fontWeight: "700",
                    lineHeight: "1.15",
                    display: "flex",
                    flexWrap: "wrap" as const,
                    maxWidth: "900px",
                  },
                  children: name,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#CA922B",
                    fontSize: "24px",
                    fontWeight: "400",
                    display: "flex",
                  },
                  children: `${city}, ${state}`,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { color: "#F5EBD8", fontSize: "16px", display: "flex" },
                  children: "Black-Owned Business Discovery",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "#CA922B",
                    fontSize: "16px",
                    fontWeight: "600",
                    display: "flex",
                  },
                  children: "melaninmaps.com",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

router.get("/og/business/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const [business] = await db
      .select({
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!business) {
      res.redirect(302, FALLBACK_URL);
      return;
    }

    const fontData = await loadFont();
    if (!fontData) {
      res.redirect(302, FALLBACK_URL);
      return;
    }

    const element = buildElement(
      business.name,
      business.category,
      business.city,
      business.state ?? "",
    );

    const svg = await (satori as any)(element, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    });

    const ResvgClass = await getResvg();
    if (!ResvgClass) {
      req.log.error("@resvg/resvg-js not available — OG image generation disabled");
      res.redirect(302, FALLBACK_URL);
      return;
    }
    const resvg = new ResvgClass(svg, {
      fitTo: { mode: "width" as const, value: 1200 },
    });
    const pngBuffer = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800",
    );
    res.send(pngBuffer);
  } catch (err) {
    req.log.error({ err }, "OG image generation failed");
    res.redirect(302, FALLBACK_URL);
  }
});

router.get("/og/fallback", (_req: Request, res: Response) => {
  res.redirect(302, "https://www.melaninmaps.com/images/og-share.jpg");
});

export default router;
