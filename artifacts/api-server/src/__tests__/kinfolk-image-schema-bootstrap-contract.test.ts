import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const startup = readFileSync(fileURLToPath(new URL("../index.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const kinfolkRoute = readFileSync(fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)), "utf8");

describe("Kinfolk private image schema bootstrap", () => {
  it("runs only an idempotent schema prerequisite before accepting configured image traffic", () => {
    const start = migrations.indexOf("export async function ensureKinfolkQuestionImageSchemaOnly");
    const end = migrations.indexOf("// ── Reversible public-discovery", start);
    const helper = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(helper).toContain("ADD COLUMN IF NOT EXISTS vision_consent_granted_at");
    expect(helper).toContain("ADD COLUMN IF NOT EXISTS retention_expires_at");
    expect(helper).toContain("ADD COLUMN IF NOT EXISTS deleted_at");
    expect(helper).toContain("CREATE INDEX IF NOT EXISTS media_assets_kinfolk_question_cleanup_idx");
    expect(helper).not.toContain("UPDATE media_assets");

    const bootstrap = startup.indexOf("await ensureKinfolkQuestionImageSchemaOnly()");
    const listen = startup.indexOf("const server = host");
    const gate = startup.lastIndexOf("if (process.env.KINFOLK_MEDIA_BUCKET_ID", bootstrap);
    expect(bootstrap).toBeGreaterThan(-1);
    expect(bootstrap).toBeLessThan(listen);
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(bootstrap);
  });

  it("uses a structured, compatibility-model response for a private image turn", () => {
    expect(kinfolkRoute).toContain('name: "kinfolk_visible_image_answer"');
    expect(kinfolkRoute).toContain('primaryModel: kinfolkModel("fallback")');
    expect(kinfolkRoute).toContain("responseModelPolicyForCall");
    expect(kinfolkRoute).toContain("visionResponseFormat");
    expect(kinfolkRoute).toContain("additionalProperties: false");
  });
});
