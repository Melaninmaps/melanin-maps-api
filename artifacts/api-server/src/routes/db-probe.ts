import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/db-probe", async (req: Request, res: Response) => {
  const probeKey = process.env.DB_PROBE_KEY;
  if (!probeKey || req.headers["x-probe-key"] !== probeKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const url = process.env.DATABASE_URL ?? "";
  const hostCategory = url.includes(".internal") ? "internal" : "public-proxy";

  const start = Date.now();

  try {
    const result = await Promise.race([
      pool.query("SELECT 1 AS ok"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timed out after 3000ms")), 3000)
      ),
    ]);

    const elapsedMs = Date.now() - start;
    const row = (result as { rows: { ok: number }[] }).rows[0];

    res.json({
      connected: row?.ok === 1,
      elapsedMs,
      hostCategory,
    });
  } catch (err: unknown) {
    const elapsedMs = Date.now() - start;
    const e = err as { name?: string; code?: string; message?: string };
    res.json({
      connected: false,
      elapsedMs,
      hostCategory,
      error: {
        name: e?.name ?? "UnknownError",
        code: e?.code ?? null,
        message: e?.message ?? "Unknown error",
      },
    });
  }
});

export default router;
