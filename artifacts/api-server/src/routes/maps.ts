import { Router, type IRouter, type Request, type Response } from "express";
import { mapsLimiter } from "../middleware/rateLimiter";

const router: IRouter = Router();

router.get("/maps/embed-url", mapsLimiter, (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(q)}&zoom=16`;
  res.json({ url });
});

// Exposes the Maps JS API key so the frontend can load the interactive map.
// The key should have HTTP referrer restrictions set in Google Cloud Console.
router.get("/maps/js-key", mapsLimiter, (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  res.json({ key: apiKey });
});

export default router;
