import { Router, type IRouter, type Request, type Response } from "express";
import { requireMembership } from "../middleware/requireMembership";
import { pool } from "@workspace/db";

const router: IRouter = Router();

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").trim();
}

const ALERT_LABEL: Record<string, string> = {
  police: "Police Activity",
  ice: "ICE / Immigration Activity",
  checkpoint: "Checkpoint Reported",
  road_closure: "Road Closure",
  construction: "Construction Zone",
  protest: "Protest / Demonstration",
  severe_weather: "Severe Weather",
  emergency: "Emergency Alert",
  transit_disruption: "Transit Disruption",
  avoid_area: "Area to Avoid",
  other: "Community Alert",
};

// ── GET /directions ──────────────────────────────────────────────────────────
// Navigator+ tier.
// Query params: lat, lng, destLat, destLng, destName, mode (driving|walking)
// Returns: steps + sampled waypoints for safety-context enrichment.
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

    const travelMode = mode === "walking" ? "walking" : "driving";
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
      startLat: step.start_location?.lat ?? null,
      startLng: step.start_location?.lng ?? null,
    }));

    // Build waypoints from step start-locations, capped at 12 for safety-context queries
    const rawWaypoints: Array<{ lat: number; lng: number }> = [
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      ...(leg.steps ?? [])
        .map((s: any) => ({ lat: s.start_location?.lat as number, lng: s.start_location?.lng as number }))
        .filter((w: any) => w.lat && w.lng),
      { lat: parseFloat(destLat), lng: parseFloat(destLng) },
    ];
    const stride = Math.max(1, Math.ceil(rawWaypoints.length / 12));
    const waypoints = rawWaypoints.filter((_, i) => i % stride === 0 || i === rawWaypoints.length - 1);

    res.json({
      destinationName: destName ?? "Destination",
      totalDistance: leg.distance?.text ?? "",
      totalDuration: leg.duration?.text ?? "",
      totalDistanceMeters: leg.distance?.value ?? 0,
      mode: travelMode,
      steps,
      waypoints,
    });
  } catch (err) {
    req.log.error({ err }, "Directions route error");
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

// ── POST /directions/safety-context ─────────────────────────────────────────
// Navigator+ tier. Accepts sampled waypoints from the current route. Returns:
//   alerts         — active community alerts along the route
//   sundownWarnings — discrimination/sundown-town reports near route
//   suggestedStops  — minority-owned stops (gas, grocery, food) near route
//   flaggedBusinesses — non-minority businesses with 3+ reports in last 6 months
router.post("/directions/safety-context", requireMembership("navigator"), async (req: Request, res: Response) => {
  try {
    const { waypoints } = req.body as { waypoints?: Array<{ lat: number; lng: number }> };

    if (!waypoints?.length) {
      res.status(400).json({ error: "waypoints array is required" });
      return;
    }

    const lats = waypoints.map((w) => w.lat);
    const lngs = waypoints.map((w) => w.lng);

    // Bounding box with ~5 mile buffer (~0.07° lat / ~0.09° lng)
    const minLat = Math.min(...lats) - 0.07;
    const maxLat = Math.max(...lats) + 0.07;
    const minLng = Math.min(...lngs) - 0.09;
    const maxLng = Math.max(...lngs) + 0.09;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    const [alertsResult, sundownResult, stopsResult, flaggedResult] = await Promise.all([

      // 1. Active community alerts inside the route bounding box
      pool.query<{
        id: string; type: string; lat: string; lng: string;
        description: string | null; confirmed_count: number; expires_at: string;
      }>(
        `SELECT id, type, lat, lng, description, confirmed_count, expires_at
         FROM community_alerts
         WHERE is_active = true AND expires_at > NOW()
           AND lat::float BETWEEN $1 AND $2
           AND lng::float BETWEEN $3 AND $4
         ORDER BY confirmed_count DESC, created_at DESC
         LIMIT 20`,
        [minLat, maxLat, minLng, maxLng],
      ),

      // 2. Sundown town / discrimination reports near route (joined to businesses for coords)
      pool.query<{
        id: string; target_name: string; description: string | null;
        latitude: string; longitude: string;
      }>(
        `SELECT DISTINCT ON (sr.target_id)
            sr.id, sr.target_name, sr.description,
            b.latitude, b.longitude
         FROM safety_reports sr
         JOIN businesses b ON sr.target_id = b.id AND sr.target_type = 'business'
         WHERE sr.category = 'sundown'
           AND sr.status != 'rejected'
           AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
           AND b.latitude::float BETWEEN $1 AND $2
           AND b.longitude::float BETWEEN $3 AND $4
         ORDER BY sr.target_id, sr.created_at DESC
         LIMIT 8`,
        [minLat, maxLat, minLng, maxLng],
      ),

      // 3. Minority-owned stops near route (gas, convenience, grocery, food, pharmacy)
      pool.query<{
        id: string; name: string; address: string; city: string; state: string;
        category: string; latitude: string; longitude: string;
        hours_of_operation: string | null; distance_km: number;
      }>(
        `SELECT b.id, b.name, b.address, b.city, b.state, b.category,
            b.latitude, b.longitude, b.hours_of_operation,
            (6371 * acos(GREATEST(-1, LEAST(1,
              cos(radians($5)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($6))
              + sin(radians($5)) * sin(radians(b.latitude::float))
            )))) AS distance_km
         FROM businesses b
         WHERE b.black_owned = true
           AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
           AND b.latitude::float BETWEEN $1 AND $2
           AND b.longitude::float BETWEEN $3 AND $4
           AND (
             b.category ILIKE '%gas%' OR b.category ILIKE '%fuel%'    OR
             b.category ILIKE '%convenience%'                          OR
             b.category ILIKE '%grocery%' OR b.category ILIKE '%market%' OR
             b.category ILIKE '%pharmacy%' OR b.category ILIKE '%drug%' OR
             b.category ILIKE '%food%'    OR b.category ILIKE '%cafe%' OR
             b.category ILIKE '%restaurant%' OR b.category ILIKE '%store%'
           )
         ORDER BY distance_km ASC
         LIMIT 8`,
        [minLat, maxLat, minLng, maxLng, centerLat, centerLng],
      ),

      // 4. Non-minority businesses with 3+ community alerts in the last 6 months near route
      pool.query<{
        id: string; name: string; address: string; city: string; state: string;
        category: string; latitude: string; longitude: string;
        alert_count: string; distance_km: number;
      }>(
        `SELECT b.id, b.name, b.address, b.city, b.state, b.category,
            b.latitude, b.longitude,
            COUNT(ca.id) AS alert_count,
            (6371 * acos(GREATEST(-1, LEAST(1,
              cos(radians($5)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($6))
              + sin(radians($5)) * sin(radians(b.latitude::float))
            )))) AS distance_km
         FROM businesses b
         LEFT JOIN community_alerts ca ON (
           ca.is_active = true
           AND ca.created_at > NOW() - INTERVAL '6 months'
           AND ca.lat::float BETWEEN b.latitude::float - 0.0015 AND b.latitude::float + 0.0015
           AND ca.lng::float BETWEEN b.longitude::float - 0.0015 AND b.longitude::float + 0.0015
         )
         WHERE b.black_owned = false
           AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL
           AND b.latitude::float BETWEEN $1 AND $2
           AND b.longitude::float BETWEEN $3 AND $4
         GROUP BY b.id, b.name, b.address, b.city, b.state, b.category, b.latitude, b.longitude
         HAVING COUNT(ca.id) >= 3
         ORDER BY COUNT(ca.id) DESC, distance_km ASC
         LIMIT 6`,
        [minLat, maxLat, minLng, maxLng, centerLat, centerLng],
      ),
    ]);

    res.json({
      alerts: alertsResult.rows.map((r) => ({
        id: r.id,
        type: r.type,
        label: ALERT_LABEL[r.type] ?? "Community Alert",
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        description: r.description,
        confirmedCount: r.confirmed_count,
        status: r.confirmed_count >= 3 ? "confirmed" : "possible",
        expiresAt: r.expires_at,
      })),
      sundownWarnings: sundownResult.rows.map((r) => ({
        id: r.id,
        area: r.target_name,
        description: r.description,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      })),
      suggestedStops: stopsResult.rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        category: r.category,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
        hoursOfOperation: r.hours_of_operation,
        distanceMiles: Math.round((r.distance_km / 1.60934) * 10) / 10,
      })),
      flaggedBusinesses: flaggedResult.rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        category: r.category,
        alertCount: parseInt(r.alert_count, 10),
        distanceMiles: Math.round((r.distance_km / 1.60934) * 10) / 10,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "POST /directions/safety-context error");
    res.status(500).json({ error: "Failed to fetch safety context" });
  }
});

export default router;
