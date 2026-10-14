import type { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { ensureRequiredSafetyReportSchema } from "../ensureSafetyReportSchema";

type Nullability = {
  incident_location_source: boolean;
  incident_location_precision: boolean;
};

type RecordedQuery = {
  text: string;
  values?: unknown;
};

const REQUIRED_SAFETY_REPORT_COLUMNS = [
  "encounter_type",
  "incident_city",
  "incident_region",
  "incident_area",
  "incident_location_source",
  "incident_location_precision",
  "display_expires_at",
  "withdrawn_at",
  "withdrawn_by",
  "withdrawal_reason",
  "corrected_at",
  "corrected_by",
  "correction_note",
];

const REQUIRED_COMMUNITY_ALERT_COLUMNS = [
  "withdrawn_at",
  "withdrawn_by",
  "withdrawal_reason",
  "corrected_at",
  "corrected_by",
  "correction_note",
];

function createPool(nullability: Nullability, failCatalogRead = false): {
  pool: Pool;
  queries: RecordedQuery[];
} {
  const queries: RecordedQuery[] = [];
  const pool = {
    async query(text: string, values?: unknown) {
      queries.push({ text, values });

      if (text.includes("FROM pg_attribute AS a")) {
        if (failCatalogRead) throw new Error("catalog read failed");
        return {
          rows: [
            {
              attname: "incident_location_source",
              attnotnull: nullability.incident_location_source,
            },
            {
              attname: "incident_location_precision",
              attnotnull: nullability.incident_location_precision,
            },
          ],
        };
      }

      if (text.includes("table_name = 'safety_reports'")) {
        return {
          rows: REQUIRED_SAFETY_REPORT_COLUMNS.map((column_name) => ({
            column_name,
          })),
        };
      }
      if (text.includes("table_name = 'safety_incidents'")) {
        return { rows: [{ column_name: "region" }] };
      }
      if (text.includes("table_name = 'community_alerts'")) {
        return {
          rows: REQUIRED_COMMUNITY_ALERT_COLUMNS.map((column_name) => ({
            column_name,
          })),
        };
      }

      return { rows: [] };
    },
  } as unknown as Pool;

  return { pool, queries };
}

function enforcementStatements(queries: RecordedQuery[]): string[] {
  return queries
    .map((query) => query.text.trim().replace(/\s+/g, " "))
    .filter((text) =>
      text.startsWith("ALTER TABLE safety_reports ALTER COLUMN"),
    );
}

describe("required safety-report schema bootstrap", () => {
  it.each([
    {
      name: "skips both already-non-null columns",
      nullability: {
        incident_location_source: true,
        incident_location_precision: true,
      },
      expected: [],
    },
    {
      name: "retains source enforcement when only source is nullable",
      nullability: {
        incident_location_source: false,
        incident_location_precision: true,
      },
      expected: [
        "ALTER TABLE safety_reports ALTER COLUMN incident_location_source SET NOT NULL",
      ],
    },
    {
      name: "retains precision enforcement when only precision is nullable",
      nullability: {
        incident_location_source: true,
        incident_location_precision: false,
      },
      expected: [
        "ALTER TABLE safety_reports ALTER COLUMN incident_location_precision SET NOT NULL",
      ],
    },
    {
      name: "retains both enforcements when both columns are nullable",
      nullability: {
        incident_location_source: false,
        incident_location_precision: false,
      },
      expected: [
        "ALTER TABLE safety_reports ALTER COLUMN incident_location_source SET NOT NULL",
        "ALTER TABLE safety_reports ALTER COLUMN incident_location_precision SET NOT NULL",
      ],
    },
  ])("$name", async ({ nullability, expected }) => {
    const { pool, queries } = createPool(nullability);

    await ensureRequiredSafetyReportSchema(pool);

    const bootstrap = queries[0]?.text ?? "";
    expect(bootstrap).toContain(
      "ALTER COLUMN incident_location_source SET DEFAULT 'manual_area'",
    );
    expect(bootstrap).toContain(
      "ALTER COLUMN incident_location_precision SET DEFAULT 'city'",
    );
    expect(bootstrap).not.toContain("SET NOT NULL");
    expect(queries[1]).toMatchObject({
      values: [["incident_location_source", "incident_location_precision"]],
    });
    expect(enforcementStatements(queries)).toEqual(expected);
  });

  it("leaves unrelated safety lifecycle and incident initialization unchanged", async () => {
    const { pool, queries } = createPool({
      incident_location_source: true,
      incident_location_precision: true,
    });

    await ensureRequiredSafetyReportSchema(pool);

    const remainingBootstrap = queries.find((query) =>
      query.text.includes("ALTER TABLE community_alerts"),
    )?.text;
    expect(remainingBootstrap).toContain(
      "ADD COLUMN IF NOT EXISTS display_expires_at timestamptz",
    );
    expect(remainingBootstrap).toContain(
      "ADD COLUMN IF NOT EXISTS region varchar(100)",
    );
    expect(remainingBootstrap).toContain(
      "CREATE INDEX IF NOT EXISTS safety_incidents_region_identity_idx",
    );
  });

  it("fails closed when the nullability catalog cannot be read", async () => {
    const { pool, queries } = createPool(
      {
        incident_location_source: true,
        incident_location_precision: true,
      },
      true,
    );

    await expect(ensureRequiredSafetyReportSchema(pool)).rejects.toThrow(
      "catalog read failed",
    );
    expect(enforcementStatements(queries)).toEqual([]);
    expect(
      queries.some((query) =>
        query.text.includes("ALTER TABLE community_alerts"),
      ),
    ).toBe(false);
  });
});
