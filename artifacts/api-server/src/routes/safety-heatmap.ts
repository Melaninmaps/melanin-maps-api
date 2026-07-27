import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const CITY_COORDS: Record<string, { lat: number; lng: number; state: string }> = {
  "Atlanta": { lat: 33.749, lng: -84.388, state: "GA" },
  "New York": { lat: 40.7128, lng: -74.006, state: "NY" },
  "New York City": { lat: 40.7128, lng: -74.006, state: "NY" },
  "Chicago": { lat: 41.8781, lng: -87.6298, state: "IL" },
  "Houston": { lat: 29.7604, lng: -95.3698, state: "TX" },
  "Los Angeles": { lat: 34.0522, lng: -118.2437, state: "CA" },
  "Philadelphia": { lat: 39.9526, lng: -75.1652, state: "PA" },
  "Washington": { lat: 38.9072, lng: -77.0369, state: "DC" },
  "Washington DC": { lat: 38.9072, lng: -77.0369, state: "DC" },
  "Washington, DC": { lat: 38.9072, lng: -77.0369, state: "DC" },
  "Baltimore": { lat: 39.2904, lng: -76.6122, state: "MD" },
  "Detroit": { lat: 42.3314, lng: -83.0458, state: "MI" },
  "Memphis": { lat: 35.1495, lng: -90.049, state: "TN" },
  "New Orleans": { lat: 29.9511, lng: -90.0715, state: "LA" },
  "Dallas": { lat: 32.7767, lng: -96.797, state: "TX" },
  "Charlotte": { lat: 35.2271, lng: -80.8431, state: "NC" },
  "Jacksonville": { lat: 30.3322, lng: -81.6557, state: "FL" },
  "Miami": { lat: 25.7617, lng: -80.1918, state: "FL" },
  "Oakland": { lat: 37.8044, lng: -122.2712, state: "CA" },
  "Birmingham": { lat: 33.5186, lng: -86.8104, state: "AL" },
  "Columbus": { lat: 39.9612, lng: -82.9988, state: "OH" },
  "Cleveland": { lat: 41.4993, lng: -81.6944, state: "OH" },
  "Indianapolis": { lat: 39.7684, lng: -86.1581, state: "IN" },
  "Milwaukee": { lat: 43.0389, lng: -87.9065, state: "WI" },
  "Kansas City": { lat: 39.0997, lng: -94.5786, state: "MO" },
  "St. Louis": { lat: 38.627, lng: -90.1994, state: "MO" },
  "Richmond": { lat: 37.5407, lng: -77.436, state: "VA" },
  "Durham": { lat: 35.994, lng: -78.8986, state: "NC" },
  "Raleigh": { lat: 35.7796, lng: -78.6382, state: "NC" },
  "Nashville": { lat: 36.1627, lng: -86.7816, state: "TN" },
  "Cincinnati": { lat: 39.1031, lng: -84.512, state: "OH" },
  "Tampa": { lat: 27.9506, lng: -82.4572, state: "FL" },
  "Orlando": { lat: 28.5383, lng: -81.3792, state: "FL" },
  "Denver": { lat: 39.7392, lng: -104.9903, state: "CO" },
  "Phoenix": { lat: 33.4484, lng: -112.074, state: "AZ" },
  "San Antonio": { lat: 29.4241, lng: -98.4936, state: "TX" },
  "Baton Rouge": { lat: 30.4515, lng: -91.1871, state: "LA" },
  "Jackson": { lat: 32.2988, lng: -90.1848, state: "MS" },
  "Montgomery": { lat: 32.3792, lng: -86.3077, state: "AL" },
  "Selma": { lat: 32.4074, lng: -87.0211, state: "AL" },
  "Harlem": { lat: 40.8116, lng: -73.9465, state: "NY" },
  "Brooklyn": { lat: 40.6782, lng: -73.9442, state: "NY" },
  "Bronx": { lat: 40.8448, lng: -73.8648, state: "NY" },
  "Compton": { lat: 33.8958, lng: -118.2201, state: "CA" },
};

router.get("/safety/heatmap", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<{ city: string; avg_score: number; count: number }>(
      `SELECT city,
              ROUND(AVG(safety_score)::numeric, 1)::float AS avg_score,
              COUNT(*)::int AS count
       FROM neighborhood_surveys
       WHERE status = 'approved' AND city IS NOT NULL AND city <> ''
       GROUP BY city
       HAVING COUNT(*) >= 1
       ORDER BY count DESC
       LIMIT 100`
    );

    const points = result.rows
      .map((row) => {
        const coords = CITY_COORDS[row.city];
        if (!coords) return null;
        return {
          city: row.city,
          state: coords.state,
          lat: coords.lat,
          lng: coords.lng,
          avgScore: row.avg_score,
          surveyCount: row.count,
          tier:
            row.avg_score >= 70 ? "safe"
            : row.avg_score >= 50 ? "moderate"
            : "alert",
        };
      })
      .filter(Boolean);

    res.json({ points });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safety heatmap");
    res.status(500).json({ error: "Failed to fetch safety heatmap" });
  }
});

export default router;
