export type KinfolkAnswerBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "steps"; items: string[] }
  | { kind: "code"; text: string };

/**
 * Formats ordinary assistant text into safe visual blocks. It does not parse
 * HTML or invoke links, leaving any navigation to the guarded renderer.
 */
export function kinfolkAnswerBlocks(content: string): KinfolkAnswerBlock[] {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks: KinfolkAnswerBlock[] = [];
  for (const group of normalized.split(/\n\s*\n/)) {
    const lines = group.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    if (/^```(?:[A-Za-z0-9_-]+)?$/.test(lines[0] ?? "") && lines.at(-1) === "```") {
      const text = lines.slice(1, -1).join("\n").trim();
      if (text) blocks.push({ kind: "code", text });
      continue;
    }

    const bullets = lines.map((line) => line.match(/^[-*•]\s+(.+)$/)?.[1]?.trim() ?? null);
    if (bullets.every((item): item is string => Boolean(item))) {
      blocks.push({ kind: "bullets", items: bullets });
      continue;
    }

    const steps = lines.map((line) => line.match(/^\d+[.)]\s+(.+)$/)?.[1]?.trim() ?? null);
    if (steps.every((item): item is string => Boolean(item))) {
      blocks.push({ kind: "steps", items: steps });
      continue;
    }

    blocks.push({ kind: "paragraph", text: lines.join("\n") });
  }
  return blocks;
}
