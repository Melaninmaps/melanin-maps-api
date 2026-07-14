import { Router, type IRouter, type Request, type Response } from "express";
import { requireMembership } from "../middleware/requireMembership";

const router: IRouter = Router();

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").trim();
}

router.get("/directions", requireMembership("navigator"), async (req: Request, res: Response) => {
  try {
    const { lat, lng, destLat, destLng, destName, mode } = req.query as Record<string, string>;

    if (!lat || !lng || !destLat || !destLng) {
      res.status(400).json({ error: "origin (lat, lng) and destination (destLat, destLng) are required" });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Directions service is not configured" });
      return;
    }

    const travelMode = mode === "driving" ? "driving" : "walking";
    const origin = `${lat},${lng}`;
    const destination = `${destLat},${destLng}`;

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("mode", travelMode);
    url.searchParams.set("units", "imperial");
    url.searchParams.set("key", apiKey);

    const gRes = await fetch(url.toString());
    if (!gRes.ok) {
      req.log.error({ status: gRes.status }, "Google Directions API error");
      res.status(502).json({ error: "Failed to fetch directions" });
      return;
    }

    const data = await gRes.json() as any;

    if (data.status !== "OK" || !data.routes?.[0]) {
      res.status(404).json({ error: "No route found", status: data.status });
      return;
    }

    const route = data.routes[0];
    const leg = route.legs?.[0];
    if (!leg) {
      res.status(404).json({ error: "No route leg found" });
      return;
    }

    const steps = (leg.steps ?? []).map((step: any, i: number) => ({
      index: i,
      instruction: stripHtml(step.html_instructions ?? ""),
      distance: step.distance?.text ?? "",
      distanceMeters: step.distance?.value ?? 0,
      duration: step.duration?.text ?? "",
      maneuver: step.maneuver ?? null,
    }));

    res.json({
      destinationName: destName ?? "Destination",
      totalDistance: leg.distance?.text ?? "",
      totalDuration: leg.duration?.text ?? "",
      totalDistanceMeters: leg.distance?.value ?? 0,
      mode: travelMode,
      steps,
    });
  } catch (err) {
    req.log.error({ err }, "Directions route error");
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

export default router;
