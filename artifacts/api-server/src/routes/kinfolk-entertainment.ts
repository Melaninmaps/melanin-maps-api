import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  normalizeEntertainmentCountry,
  parseEntertainmentAvailabilityRequest,
  resolveEntertainmentAvailability,
} from "../kinfolk/entertainment-availability";
import { ensureKinfolkEntertainmentSchemaOnly } from "../lib/startup-migrations";

const router: IRouter = Router();

function memberId(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
    return null;
  }
  return req.user.id;
}

async function schemaReady(res: Response): Promise<boolean> {
  try {
    await ensureKinfolkEntertainmentSchemaOnly();
    return true;
  } catch {
    res.status(503).json({ error: "ENTERTAINMENT_SETTINGS_UNAVAILABLE" });
    return false;
  }
}

router.get("/kinfolk/entertainment/readiness", async (_req, res) => {
  if (!(await schemaReady(res))) return;
  res.json({
    ready: false,
    status: "provider_not_configured",
    streamingProvider: null,
    showtimeProvider: null,
    message:
      "No live entertainment provider is configured. Kinfolk will not guess current availability or showtimes.",
  });
});

router.post("/kinfolk/entertainment/availability", async (req, res) => {
  const userId = memberId(req, res);
  if (!userId || !(await schemaReady(res))) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const preferences = await pool.query<{
    entertainment_country: string | null;
    streaming_services: unknown;
  }>(
    `SELECT entertainment_country, streaming_services FROM user_preferences WHERE user_id = $1`,
    [userId],
  );
  const saved = preferences.rows[0];
  const savedStreamingServices = Array.isArray(saved?.streaming_services)
    ? saved.streaming_services.filter(
        (service): service is string => typeof service === "string",
      )
    : [];
  const request = parseEntertainmentAvailabilityRequest({
    message: body.message ?? body.query,
    title: body.title,
    countryCode: body.countryCode ?? saved?.entertainment_country,
    city: body.city,
  });
  if (!request) {
    return void res.status(400).json({
      error: "CURRENT_ENTERTAINMENT_REQUEST_REQUIRED",
      message:
        "Provide an explicit current availability or showtime question and an exact title. Kinfolk does not infer a title from ordinary conversation.",
    });
  }
  const result = await resolveEntertainmentAvailability(request);
  res.json({ availability: result, savedStreamingServices });
});

router.get(
  "/kinfolk/entertainment/countries/:countryCode",
  async (req, res) => {
    if (!memberId(req, res) || !(await schemaReady(res))) return;
    const raw = Array.isArray(req.params.countryCode)
      ? req.params.countryCode[0]
      : req.params.countryCode;
    const countryCode = normalizeEntertainmentCountry(raw);
    if (!countryCode)
      return void res.status(400).json({ error: "INVALID_COUNTRY" });
    res.json({
      countryCode,
      ready: false,
      status: "provider_not_configured",
      message:
        "Country selection is saved privately in Kinfolk preferences; live provider coverage is not configured yet.",
    });
  },
);

export default router;
