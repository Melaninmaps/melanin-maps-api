import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/travel/flights", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const result = await pool.query<{
      id: string; user_id: string; flight_number: string; airline: string | null;
      departure_date: string; origin: string | null; destination: string | null;
      notes: string | null; created_at: Date;
    }>(
      `SELECT id, user_id, flight_number, airline, departure_date, origin, destination, notes, created_at
       FROM travel_flights WHERE user_id = $1 ORDER BY departure_date DESC, created_at DESC`,
      [userId],
    );
    res.json({ flights: result.rows });
  } catch (err) {
    req.log.error({ err }, "GET /api/travel/flights error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/travel/flights", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { flightNumber, airline, departureDate, origin, destination, notes } = req.body as {
      flightNumber?: string;
      airline?: string;
      departureDate?: string;
      origin?: string;
      destination?: string;
      notes?: string;
    };

    if (!flightNumber || !departureDate) {
      res.status(400).json({ error: "flightNumber and departureDate are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO travel_flights (user_id, flight_number, airline, departure_date, origin, destination, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        flightNumber.toUpperCase().trim(),
        airline ?? null,
        departureDate,
        origin ? origin.toUpperCase().trim() : null,
        destination ? destination.toUpperCase().trim() : null,
        notes ?? null,
      ],
    );
    res.status(201).json({ flight: result.rows[0] });
  } catch (err) {
    req.log.error({ err }, "POST /api/travel/flights error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/travel/flights/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const flightId = String(req.params.id);

    const result = await pool.query(
      `DELETE FROM travel_flights WHERE id = $1 AND user_id = $2 RETURNING id`,
      [flightId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Flight not found" });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/travel/flights/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/flights/status", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().slice(0, 10);

    const result = await pool.query<{
      id: string; flight_number: string; airline: string | null;
      departure_date: string; origin: string | null; destination: string | null;
    }>(
      `SELECT id, flight_number, airline, departure_date, origin, destination
       FROM travel_flights WHERE user_id = $1 AND departure_date >= $2
       ORDER BY departure_date ASC LIMIT 20`,
      [userId, today],
    );

    const flights = result.rows;
    if (flights.length === 0) {
      res.json({ flights: [], checked: 0 });
      return;
    }

    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey) {
      res.json({
        flights: flights.map((f) => ({ ...f, status: "upcoming", statusMessage: "Upcoming" })),
        checked: 0,
        requiresKey: true,
      });
      return;
    }

    const toCheck = flights.slice(0, 5);
    const statuses = await Promise.allSettled(
      toCheck.map(async (f) => {
        const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${f.flight_number}&flight_date=${f.departure_date}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return { id: f.id, status: "unknown" as const, statusMessage: "Unavailable", delay: 0 };
        const json = (await r.json()) as {
          data?: Array<{
            flight_status: string;
            departure?: { delay?: number | null };
            arrival?: { delay?: number | null };
          }>;
        };
        const entry = json.data?.[0];
        if (!entry) return { id: f.id, status: "unknown" as const, statusMessage: "No data", delay: 0 };

        const depDelay = entry.departure?.delay ?? 0;
        const arrDelay = entry.arrival?.delay ?? 0;
        const maxDelay = Math.max(depDelay, arrDelay);

        if (entry.flight_status === "cancelled") return { id: f.id, status: "cancelled" as const, statusMessage: "Cancelled", delay: 0 };
        if (entry.flight_status === "diverted") return { id: f.id, status: "diverted" as const, statusMessage: "Diverted", delay: maxDelay };
        if (maxDelay >= 15) return { id: f.id, status: "delayed" as const, statusMessage: `Delayed ~${maxDelay} min`, delay: maxDelay };
        return { id: f.id, status: "on_time" as const, statusMessage: "On time", delay: 0 };
      }),
    );

    const statusMap = new Map<string, { status: string; statusMessage: string; delay: number }>();
    statuses.forEach((r, i) => {
      statusMap.set(
        toCheck[i].id,
        r.status === "fulfilled" ? r.value : { status: "unknown", statusMessage: "Check failed", delay: 0 },
      );
    });

    res.json({
      flights: flights.map((f) => ({
        ...f,
        ...(statusMap.get(f.id) ?? { status: "upcoming", statusMessage: "Upcoming", delay: 0 }),
      })),
      checked: toCheck.length,
    });
  } catch (err) {
    req.log.error({ err }, "GET /api/travel/flights/status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
