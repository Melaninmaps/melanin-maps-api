import crypto from "crypto";

export type PersistedAnswerPlanDomain =
  | "general"
  | "culture"
  | "education"
  | "local_discovery"
  | "current_events"
  | "health"
  | "legal"
  | "financial"
  | "safety"
  | "relationships"
  | "religion_culture";

export type PersistedAnswerPlanAgeBand =
  | "unknown"
  | "under_13"
  | "13_15"
  | "16_17"
  | "18_plus";

export type PersistedAnswerPlanState = {
  depth: "brief" | "standard" | "deep";
};

export function answerPlanDomainForIntent(intentClass: string): PersistedAnswerPlanDomain {
  switch (intentClass) {
    case "culture_entertainment": return "culture";
    case "education_discovery": return "education";
    case "business_discovery": return "local_discovery";
    case "current_information": return "current_events";
    case "medical_health": return "health";
    case "legal_regulated": return "legal";
    case "financial_regulated": return "financial";
    case "safety_emergency": return "safety";
    default: return "general";
  }
}

export interface AnswerPlanQuery {
  query<T extends { [key: string]: unknown } = { [key: string]: unknown }>(
    sql: string,
    values: unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
}

export interface AnswerPlanPersistenceLogger {
  warn(data: object, message: string): void;
}

export async function persistAnswerPlan(input: {
  query: AnswerPlanQuery;
  logger: AnswerPlanPersistenceLogger;
  userId: string;
  sessionId: string | undefined;
  domainClass: PersistedAnswerPlanDomain;
  isSensitive: boolean;
  audienceBand: PersistedAnswerPlanAgeBand;
  plan: PersistedAnswerPlanState;
}): Promise<string | null> {
  const id = crypto.randomUUID();
  try {
    // Keep retention bounded without making an already-complete answer depend
    // on a separate worker. The expiry index keeps this cleanup inexpensive.
    await input.query.query(
      `DELETE FROM kinfolk_answer_plans
        WHERE id IN (
          SELECT id FROM kinfolk_answer_plans
           WHERE expires_at <= now()
           ORDER BY expires_at ASC
           LIMIT 200
        )`,
      [],
    );
    await input.query.query(
      `INSERT INTO kinfolk_answer_plans
        (id, user_id, session_id, domain_class, is_sensitive, audience_band, plan_json, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb,
         now() + CASE WHEN $5 THEN interval '15 minutes' ELSE interval '24 hours' END)`,
      [
        id,
        input.userId,
        input.sessionId ?? null,
        input.domainClass,
        input.isSensitive,
        input.audienceBand,
        JSON.stringify({ depth: input.plan.depth }),
      ],
    );
    return id;
  } catch (err) {
    // Answer-plan persistence enhances an already-complete answer. A missing
    // migration or transient DB issue must not turn that answer into a 500.
    input.logger.warn({ err }, "Kinfolk answer-plan persistence unavailable");
    return null;
  }
}

export async function updateOwnedAnswerPlanDepth(input: {
  query: AnswerPlanQuery;
  answerPlanId: string;
  userId: string;
  action: "show_more" | "show_less";
}): Promise<{
  domainClass: PersistedAnswerPlanDomain;
  isSensitive: boolean;
  audienceBand: PersistedAnswerPlanAgeBand;
} | null> {
  const depth = input.action === "show_more" ? "deep" : "brief";
  const result = await input.query.query<{
    domain_class: string;
    is_sensitive: boolean;
    audience_band: string;
  }>(
    `UPDATE kinfolk_answer_plans
        SET plan_json = jsonb_set(plan_json, '{depth}', to_jsonb($3::text), true)
      WHERE id = $1
        AND user_id = $2
        AND expires_at > now()
      RETURNING domain_class, is_sensitive, audience_band`,
    [input.answerPlanId, input.userId, depth],
  );
  const row = result.rows[0];
  return row
    ? {
        domainClass: row.domain_class as PersistedAnswerPlanDomain,
        isSensitive: row.is_sensitive,
        audienceBand: row.audience_band as PersistedAnswerPlanAgeBand,
      }
    : null;
}
