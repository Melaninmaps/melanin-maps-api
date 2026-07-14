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

// Proxies Google Directions API so the key stays server-side.
// ?origin=lat,lng  &destination=lat,lng  (&mode=driving|walking|bicycling|transit)
router.get("/maps/directions", mapsLimiter, async (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Maps not configured" });
    return;
  }
  const origin = typeof req.query.origin === "string" ? req.query.origin.trim() : "";
  const destination = typeof req.query.destination === "string" ? req.query.destination.trim() : "";
  const mode = typeof req.query.mode === "string" ? req.query.mode.trim() : "driving";
  if (!origin || !destination) {
    res.status(400).json({ error: "origin and destination are required" });
    return;
  }
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=${encodeURIComponent(mode)}` +
      `&key=${apiKey}`;
    const upstream = await fetch(url);
    const data = await upstream.json() as unknown;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

export default router;
