export type LibraryResearchBlock =
  | Readonly<{ kind: "heading"; text: string }>
  | Readonly<{ kind: "paragraph"; text: string }>
  | Readonly<{ kind: "bullets"; items: readonly string[] }>;

const MEMBER_FACING_LENS_LABELS: Readonly<Record<string, string>> = {
  Diaspora: "Diaspora",
  BlackWomen: "Black women",
  BlackMen: "Black men & boys",
  BlackStudents: "Black students",
  HBCUStudents: "HBCU students & alumni",
};

const KNOWN_SECTION_LABELS = [
  "At a glance",
  "Key terms and context",
  "What the evidence says",
  "Why this matters",
  "What to consider next",
] as const;

function cleanDisplayText(value: string): string {
  return value
    .replace(/^\s*#{1,6}\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitKnownInlineHeading(value: string): { heading: string; copy: string } | null {
  const normalized = cleanDisplayText(value);
  for (const heading of KNOWN_SECTION_LABELS) {
    if (!normalized.toLocaleLowerCase("en-US").startsWith(heading.toLocaleLowerCase("en-US"))) continue;
    const remainder = normalized.slice(heading.length).replace(/^[\s:—–-]+/, "").trim();
    return { heading, copy: remainder };
  }
  return null;
}

function addTextBlock(blocks: LibraryResearchBlock[], lines: string[]): void {
  const text = cleanDisplayText(lines.join(" "));
  if (text) blocks.push({ kind: "paragraph", text });
}

/**
 * Converts stored Library prose into a small, safe presentation model. It also
 * repairs older entries written with Markdown so no # or ** tokens are shown
 * to members while those older records remain readable.
 */
export function formatLibraryResearchBody(body: string): readonly LibraryResearchBlock[] {
  const blocks: LibraryResearchBlock[] = [];
  const paragraphs = body.replace(/\r\n?/g, "\n").split(/\n\s*\n/);

  for (const rawParagraph of paragraphs) {
    const lines = rawParagraph.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const first = lines.shift()!;
    const explicitHeading = first.match(/^\s*#{1,6}\s+(.+)$/);
    const knownHeading = explicitHeading ? splitKnownInlineHeading(explicitHeading[1]) : splitKnownInlineHeading(first);
    if (explicitHeading && knownHeading) {
      blocks.push({ kind: "heading", text: knownHeading.heading });
      const copyLines = [knownHeading.copy, ...lines].filter(Boolean);
      if (copyLines.length > 0) addTextBlock(blocks, copyLines);
      continue;
    }
    if (explicitHeading) {
      blocks.push({ kind: "heading", text: cleanDisplayText(explicitHeading[1]) });
      if (lines.length > 0) addTextBlock(blocks, lines);
      continue;
    }
    if (knownHeading && knownHeading.copy.length === 0) {
      blocks.push({ kind: "heading", text: knownHeading.heading });
      if (lines.length > 0) addTextBlock(blocks, lines);
      continue;
    }
    if (knownHeading) {
      blocks.push({ kind: "heading", text: knownHeading.heading });
      addTextBlock(blocks, [knownHeading.copy, ...lines]);
      continue;
    }

    const bulletItems = [first, ...lines]
      .filter((line) => /^\s*(?:[-*]|\d+[.)])\s+/.test(line))
      .map((line) => cleanDisplayText(line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "")));
    if (bulletItems.length === lines.length + 1) {
      blocks.push({ kind: "bullets", items: bulletItems });
      continue;
    }

    addTextBlock(blocks, [first, ...lines]);
  }

  return blocks;
}

/** Keeps internal query tokens out of member-facing Library labels. */
export function formatLibraryLensLabels(tags: readonly string[]): string {
  return tags
    .map((tag) => {
      const normalized = tag.replace(/^#/, "");
      return MEMBER_FACING_LENS_LABELS[normalized] ?? normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
    })
    .filter(Boolean)
    .join(" · ");
}
