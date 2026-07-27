import { Router, type IRouter, type Request, type Response } from "express";
import { getMonitorSummary } from "../lib/build97Monitor";
import { getHealthHistory } from "../lib/healthMonitor";

const router: IRouter = Router();
const CRON_SECRET = process.env.CRON_SECRET;

function auth(req: Request, res: Response): boolean {
  if (!CRON_SECRET) { res.status(503).json({ error: "Not configured" }); return false; }
  if (req.headers["x-cron-secret"] !== CRON_SECRET) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

/**
 * GET /api/monitoring/build97
 * Returns the Build 97 Apple 12-hour monitoring summary.
 * Authenticated: x-cron-secret header required.
 */
router.get("/monitoring/build97", (req: Request, res: Response) => {
  if (!auth(req, res)) return;
  const build97 = getMonitorSummary();
  const dbHealth = getHealthHistory();
  res.json({ build97, dbHealth });
});

/**
 * GET /api/readyz/history
 * Public alias — returns the DB health history ring buffer.
 * Compatible with the monitoring document's expected endpoint.
 */
router.get("/readyz/history", (req: Request, res: Response) => {
  const probeKey = process.env.DB_PROBE_KEY;
  if (!probeKey || req.headers["x-probe-key"] !== probeKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(getHealthHistory());
});

export default router;
