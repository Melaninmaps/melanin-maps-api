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
  plan: Record<string, unknown>;
}): Promise<string | null> {
  const id = crypto.randomUUID();
  try {
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
        JSON.stringify(input.plan),
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
}): Promise<{ domainClass: string; isSensitive: boolean; audienceBand: string } | null> {
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
        domainClass: row.domain_class,
        isSensitive: row.is_sensitive,
        audienceBand: row.audience_band,
      }
    : null;
}