import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  normalizeEntertainmentCountry,
  parseEntertainmentAvailabilityRequest,
} from "../kinfolk/entertainment-availability";
import { resolveEntertainmentAvailabilityWithWebSources } from "../kinfolk/entertainment-web-research";
import {
  applyEntertainmentConsentPlan,
  buildEntertainmentConsentPlan,
  normalizeEntertainmentCostPolicy,
  normalizeStreamingService,
  type EntertainmentConsentPlan,
  type EntertainmentPreferenceSnapshot,
} from "../kinfolk/entertainment-personalization";
import { ensureKinfolkEntertainmentSchemaOnly } from "../lib/startup-migrations";

const router: IRouter = Router();

type PreferenceRow = {
  entertainment_country: string | null;
  streaming_services: unknown;
  entertainment_cost_policy: unknown;
};

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

function snapshot(
  row: PreferenceRow | undefined,
): EntertainmentPreferenceSnapshot {
  const streamingServices = Array.isArray(row?.streaming_services)
    ? row.streaming_services
        .map(normalizeStreamingService)
        .filter((service): service is string => Boolean(service))
    : [];
  return {
    streamingServices: [...new Set(streamingServices)],
    entertainmentCountry: normalizeEntertainmentCountry(
      row?.entertainment_country,
    ),
    entertainmentCostPolicy: normalizeEntertainmentCostPolicy(
      row?.entertainment_cost_policy,
    ),
  };
}

async function readPreferences(
  userId: string,
): Promise<EntertainmentPreferenceSnapshot> {
  const result = await pool.query<PreferenceRow>(
    `SELECT entertainment_country, streaming_services, entertainment_cost_policy
       FROM user_preferences WHERE user_id = $1`,
    [userId],
  );
  return snapshot(result.rows[0]);
}

async function writePreferences(
  userId: string,
  next: EntertainmentPreferenceSnapshot,
): Promise<EntertainmentPreferenceSnapshot> {
  const result = await pool.query<PreferenceRow>(
    `UPDATE user_preferences
        SET streaming_services = $2::jsonb,
            entertainment_country = $3,
            entertainment_cost_policy = $4,
            updated_at = NOW()
      WHERE user_id = $1
      RETURNING entertainment_country, streaming_services, entertainment_cost_policy`,
    [
      userId,
      JSON.stringify(next.streamingServices),
      next.entertainmentCountry,
      next.entertainmentCostPolicy,
    ],
  );
  if (!result.rows[0]) throw new Error("ENTERTAINMENT_PREFERENCES_NOT_FOUND");
  return snapshot(result.rows[0]);
}

function parsePlan(
  body: Record<string, unknown>,
): EntertainmentConsentPlan | null {
  const operation = body.operation;
  const add = Array.isArray(body.add)
    ? body.add
        .map(normalizeStreamingService)
        .filter((service): service is string => Boolean(service))
    : [];
  const remove = Array.isArray(body.remove)
    ? body.remove
        .map(normalizeStreamingService)
        .filter((service): service is string => Boolean(service))
    : [];
  const costPolicy =
    body.costPolicy === "included_only" || body.costPolicy === "any"
      ? body.costPolicy
      : null;
  if (
    operation !== "add" &&
    operation !== "remove" &&
    operation !== "replace" &&
    operation !== "set_cost_policy"
  )
    return null;
  if (operation === "set_cost_policy" && !costPolicy) return null;
  if (operation !== "set_cost_policy" && add.length + remove.length === 0)
    return null;
  return {
    operation,
    add: [...new Set(add)],
    remove: [...new Set(remove)],
    costPolicy,
    summary: "Member-confirmed entertainment preference update.",
  };
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

router.get("/kinfolk/entertainment/preferences", async (req, res) => {
  const userId = memberId(req, res);
  if (!userId || !(await schemaReady(res))) return;
  res.json({ preferences: await readPreferences(userId) });
});

/** Settings changes are an explicit member action; no chat text is written here. */
router.put("/kinfolk/entertainment/preferences", async (req, res) => {
  const userId = memberId(req, res);
  if (!userId || !(await schemaReady(res))) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const current = await readPreferences(userId);
  const services = Array.isArray(body.streamingServices)
    ? body.streamingServices
        .map(normalizeStreamingService)
        .filter((service): service is string => Boolean(service))
        .slice(0, 20)
    : current.streamingServices;
  const country =
    body.entertainmentCountry === undefined
      ? current.entertainmentCountry
      : normalizeEntertainmentCountry(body.entertainmentCountry);
  if (
    body.entertainmentCountry !== undefined &&
    body.entertainmentCountry !== null &&
    !country
  ) {
    return void res.status(400).json({ error: "INVALID_COUNTRY" });
  }
  const costPolicy =
    body.entertainmentCostPolicy === undefined
      ? current.entertainmentCostPolicy
      : normalizeEntertainmentCostPolicy(body.entertainmentCostPolicy);
  const preferences = await writePreferences(userId, {
    streamingServices: [...new Set(services)],
    entertainmentCountry: country,
    entertainmentCostPolicy: costPolicy,
  });
  res.json({ preferences });
});

/** Natural language only produces a plan. This endpoint applies a visibly confirmed plan. */
router.post("/kinfolk/entertainment/consent", async (req, res) => {
  const userId = memberId(req, res);
  if (!userId || !(await schemaReady(res))) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (body.consent !== true)
    return void res
      .status(400)
      .json({ error: "ENTERTAINMENT_CONSENT_REQUIRED" });
  const plan = parsePlan(body) ?? buildEntertainmentConsentPlan(body.message);
  if (!plan)
    return void res
      .status(400)
      .json({ error: "INVALID_ENTERTAINMENT_CONSENT_PLAN" });
  const preferences = await writePreferences(
    userId,
    applyEntertainmentConsentPlan(await readPreferences(userId), plan),
  );
  res.json({ saved: true, preferences });
});

router.post("/kinfolk/entertainment/availability", async (req, res) => {
  const userId = memberId(req, res);
  if (!userId || !(await schemaReady(res))) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const preferences = await readPreferences(userId);
  const request = parseEntertainmentAvailabilityRequest({
    message: body.message ?? body.query,
    title: body.title,
    countryCode: body.countryCode ?? preferences.entertainmentCountry,
    city: body.city,
    requestedDate: body.requestedDate,
  });
  if (!request) {
    return void res.status(400).json({
      error: "CURRENT_ENTERTAINMENT_REQUEST_REQUIRED",
      message:
        "Provide an explicit current availability or showtime question. Kinfolk does not turn ordinary entertainment conversation into a live lookup.",
    });
  }
  const availability = await resolveEntertainmentAvailabilityWithWebSources({
    request,
    preferences,
  });
  res.json({ availability, preferences });
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
