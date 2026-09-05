import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { getBusinessExperiencePolicy } from "@workspace/constants";

const manifest = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-04/directory-import-candidates.jsonl",
  import.meta.url,
));

type Candidate = { category?: string; subcategory?: string | null };
const counts = new Map<string, { rows: number; policyCategory: string; vibes: number; reactions: number }>();
const lines = createInterface({ input: createReadStream(manifest, { encoding: "utf8" }), crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  const candidate = JSON.parse(line) as Candidate;
  const category = candidate.category?.trim() || "(blank)";
  const policy = getBusinessExperiencePolicy(category, candidate.subcategory);
  const current = counts.get(category) ?? {
    rows: 0,
    policyCategory: policy.category,
    vibes: policy.vibeChoices.length,
    reactions: policy.reactionChoices.length,
  };
  current.rows += 1;
  counts.set(category, current);
}

const categories = [...counts.entries()]
  .map(([sourceCategory, value]) => ({ sourceCategory, ...value }))
  .sort((a, b) => b.rows - a.rows || a.sourceCategory.localeCompare(b.sourceCategory));
console.log(JSON.stringify({ categories, totalCategories: categories.length }, null, 2));
