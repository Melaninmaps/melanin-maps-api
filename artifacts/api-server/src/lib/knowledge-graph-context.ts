/**
 * Layer 3 — Kinfolk Knowledge Graph Context Retrieval
 *
 * getKnowledgeGraphContext(userMessage, geographyRef) resolves a user message
 * into structured, provenance-aware graph context that Kinfolk can reason over.
 *
 * Contract:
 *   - Never dump raw Library text into the system prompt.
 *   - Returns only what is relevant to the user's question.
 *   - Every source carries its authority_tier, confidence, and URL.
 *   - Community and Ambassador tiers remain empty until real content exists.
 *   - The retrieval_log documents every step for auditability.
 *
 * Big Cousin rule:
 *   A "next_connection" is surfaced when a related topic with weight ≥ 0.7
 *   exists AND has connected entities or sources worth mentioning. This gives
 *   Kinfolk the raw material to surface a useful adjacent connection — but
 *   Kinfolk must explain WHY it's relevant, never manufacture it.
 *
 * Layer 4 (future) will expand geography resolution beyond Philadelphia.
 */

import { pool } from "@workspace/db";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  topic_name: string;
  node_type: string;
  category: string;
  geography_ref: string | null;
  description: string | null;
}

export interface ProvenanceSource {
  authority_tier: "authoritative" | "professional" | "community" | "ambassador";
  source_name: string;
  source_url: string | null;
  claim: string | null;
  evidence_section: string | null;
  confidence: string | null;
  is_primary: boolean;
  retrieved_at: string | null;
}

export interface GraphEntity {
  entity_id: string;
  entity_type: string;
  entity_label: string | null;
  relevance_weight: number;
  name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

export interface RetrievedTopic {
  node: GraphNode;
  matched_intent: string;
  sources: ProvenanceSource[];
  entities: GraphEntity[];
  related_topics: Array<{
    topic_name: string;
    relationship_type: string;
    weight: number;
    direction: "parent" | "child";
  }>;
}

export interface NextConnection {
  topic_name: string;
  relationship_type: string;
  weight: number;
  reason: string;
  entity?: { name: string; entity_type: string; city: string | null } | null;
}

export interface KnowledgeGraphContext {
  geography: {
    ref: string;
    node: GraphNode;
  } | null;
  topics: RetrievedTopic[];
  provenance_summary: {
    tiers_present: string[];
    has_authoritative: boolean;
    has_professional: boolean;
    has_community: boolean;
    has_ambassador: boolean;
  };
  next_connection: NextConnection | null;
  retrieval_log: {
    intent: string;
    geography_ref: string | null;
    topic_ids_queried: string[];
    total_sources: number;
    total_entities: number;
    freshness: string;
    permission_filtered: boolean;
  };
}

// ── Intent → Topic mapping (grows as graph grows) ────────────────────────────
//
// Each entry maps a topic_name to the keywords that should trigger its retrieval.
// This is deliberately keyword-based for Phase 1 — semantic resolution lives in Layer 4.

const TOPIC_INTENT_PATTERNS: Array<{ topic_name: string; keywords: string[] }> = [
  {
    topic_name: "Philadelphia Black History",
    keywords: [
      "black history", "african american history", "history here", "historically",
      "historical", "civil rights", "slavery", "underground railroad", "abolition",
      "freedom", "reconstruction", "great migration", "segregation", "mother bethel",
      "richard allen", "free african society", "what happened here",
    ],
  },
  {
    topic_name: "Philadelphia Nightlife",
    keywords: [
      "tonight", "go out", "nightlife", "club", "bar", "live music", "entertainment",
      "party", "where should i go", "where to go", "what to do tonight", "shows",
      "what's happening", "fun tonight", "going out",
    ],
  },
  {
    topic_name: "Philadelphia Real Estate",
    keywords: [
      "housing", "real estate", "rent", "apartment", "house", "housing market",
      "buy a home", "home prices", "property", "landlord", "mortgage", "moving here",
      "cost of living", "neighborhoods to live",
    ],
  },
  {
    topic_name: "Philadelphia Faith",
    keywords: [
      "church", "faith", "religion", "worship", "mosque", "temple", "synagogue",
      "spiritual", "sunday service", "prayer", "ame", "bethel", "congregation",
      "religious", "place of worship",
    ],
  },
  {
    topic_name: "Philadelphia Employment",
    keywords: [
      "job", "jobs", "work", "employment", "career", "hire", "hiring", "workforce",
      "opportunity", "professional network", "find work", "unemployment",
    ],
  },
  {
    topic_name: "Philadelphia Businesses",
    keywords: [
      "restaurant", "food", "eat", "dining", "business", "shop", "store", "service",
      "salon", "barber", "bookstore", "where to eat", "places to eat", "recommend",
    ],
  },
];

// ── Geography resolution ───────────────────────────────────────────────────────
//
// Finds a geography node in the knowledge graph matching the destination string.
// Returns null if no node exists (graph only has Philadelphia today).

async function resolveGeographyNode(
  geographyRef: string,
): Promise<GraphNode | null> {
  // Normalize: "philadelphia" → match "Philadelphia,PA,USA"
  const r = await pool.query(
    `SELECT id, topic_name, node_type, category, geography_ref, description
     FROM knowledge_topics
     WHERE node_type = 'geography'
       AND LOWER(geography_ref) LIKE LOWER($1)
       AND status = 'published'
     LIMIT 1`,
    [`%${geographyRef.split(",")[0].trim()}%`],
  );
  if (!r.rows[0]) return null;
  return {
    id: r.rows[0].id as string,
    topic_name: r.rows[0].topic_name as string,
    node_type: r.rows[0].node_type as string,
    category: r.rows[0].category as string,
    geography_ref: r.rows[0].geography_ref as string | null,
    description: r.rows[0].description as string | null,
  };
}

// ── Intent detection ──────────────────────────────────────────────────────────

function detectIntents(userMessage: string): string[] {
  const lower = userMessage.toLowerCase();
  const matched: string[] = [];
  for (const { topic_name, keywords } of TOPIC_INTENT_PATTERNS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(topic_name);
    }
  }
  return matched;
}

// ── Fetch a single topic with its sources, entities, and relationships ─────────

async function fetchTopicContext(
  topicName: string,
  geographyRef: string | null,
): Promise<RetrievedTopic | null> {
  // Find the topic node
  const whereClause = geographyRef
    ? `topic_name = $1 AND (geography_ref = $2 OR geography_ref IS NULL) AND status = 'published'`
    : `topic_name = $1 AND status = 'published'`;
  const params = geographyRef ? [topicName, geographyRef] : [topicName];

  const nodeResult = await pool.query(
    `SELECT id, topic_name, node_type, category, geography_ref, description
     FROM knowledge_topics WHERE ${whereClause} LIMIT 1`,
    params,
  );
  if (!nodeResult.rows[0]) return null;

  const node: GraphNode = {
    id: nodeResult.rows[0].id as string,
    topic_name: nodeResult.rows[0].topic_name as string,
    node_type: nodeResult.rows[0].node_type as string,
    category: nodeResult.rows[0].category as string,
    geography_ref: nodeResult.rows[0].geography_ref as string | null,
    description: nodeResult.rows[0].description as string | null,
  };

  // Fetch sources, entities, relationships in parallel
  const [sourcesResult, entitiesResult, relsResult] = await Promise.all([
    pool.query(
      `SELECT authority_tier, source_name, source_url, claim, evidence_section,
              confidence, is_primary, retrieved_at
       FROM knowledge_sources
       WHERE topic_id = $1 AND status = 'active'
       ORDER BY
         CASE authority_tier
           WHEN 'authoritative' THEN 1 WHEN 'professional' THEN 2
           WHEN 'community'     THEN 3 WHEN 'ambassador'   THEN 4 ELSE 5
         END, is_primary DESC`,
      [node.id],
    ),
    pool.query(
      `SELECT lec.entity_id, lec.entity_type, lec.entity_label, lec.relevance_weight,
              cs.name AS cs_name, cs.category AS cs_category,
              cs.city AS cs_city, cs.state AS cs_state,
              cs.latitude AS cs_lat, cs.longitude AS cs_lng,
              cs.description AS cs_desc,
              b.name AS b_name, b.category AS b_category,
              b.city AS b_city, b.state AS b_state,
              b.latitude AS b_lat, b.longitude AS b_lng
       FROM library_entity_connections lec
       LEFT JOIN cultural_sites cs
         ON lec.entity_type = 'cultural_site' AND cs.id::text = lec.entity_id::text
       LEFT JOIN businesses b
         ON lec.entity_type = 'business' AND b.id::text = lec.entity_id::text
       WHERE lec.topic_id = $1
       ORDER BY lec.relevance_weight DESC`,
      [node.id],
    ),
    pool.query(
      `SELECT tr.relationship_type, tr.weight, tr.parent_topic_id, tr.child_topic_id,
              kt.topic_name AS related_name
       FROM topic_relationships tr
       JOIN knowledge_topics kt ON (
         CASE WHEN tr.parent_topic_id = $1 THEN tr.child_topic_id
              ELSE tr.parent_topic_id END = kt.id
       )
       WHERE tr.parent_topic_id = $1 OR tr.child_topic_id = $1
       ORDER BY tr.weight DESC`,
      [node.id],
    ),
  ]);

  const sources: ProvenanceSource[] = sourcesResult.rows.map((r) => ({
    authority_tier: r.authority_tier as ProvenanceSource["authority_tier"],
    source_name: r.source_name as string,
    source_url: r.source_url as string | null,
    claim: r.claim as string | null,
    evidence_section: r.evidence_section as string | null,
    confidence: r.confidence as string | null,
    is_primary: Boolean(r.is_primary),
    retrieved_at: r.retrieved_at ? String(r.retrieved_at) : null,
  }));

  const entities: GraphEntity[] = entitiesResult.rows.map((r) => {
    const isSite = r.entity_type === "cultural_site";
    return {
      entity_id: r.entity_id as string,
      entity_type: r.entity_type as string,
      entity_label: r.entity_label as string | null,
      relevance_weight: Number(r.relevance_weight),
      name: (isSite ? r.cs_name : r.b_name) as string | null,
      category: (isSite ? r.cs_category : r.b_category) as string | null,
      city: (isSite ? r.cs_city : r.b_city) as string | null,
      state: (isSite ? r.cs_state : r.b_state) as string | null,
      latitude: (isSite ? r.cs_lat : r.b_lat) != null ? Number(isSite ? r.cs_lat : r.b_lat) : null,
      longitude: (isSite ? r.cs_lng : r.b_lng) != null ? Number(isSite ? r.cs_lng : r.b_lng) : null,
      description: isSite ? (r.cs_desc as string | null) : null,
    };
  });

  const related_topics = relsResult.rows.map((r) => ({
    topic_name: r.related_name as string,
    relationship_type: r.relationship_type as string,
    weight: Number(r.weight),
    direction: (r.parent_topic_id === node.id ? "child" : "parent") as "parent" | "child",
  }));

  return { node, matched_intent: topicName, sources, entities, related_topics };
}

// ── Build next_connection (Big Cousin) ─────────────────────────────────────────

function buildNextConnection(
  topics: RetrievedTopic[],
): NextConnection | null {
  // Find the highest-weighted cross-topic relationship not already in topics
  const retrievedNames = new Set(topics.map((t) => t.node.topic_name));

  type Candidate = { name: string; type: string; weight: number; entity?: GraphEntity };
  let best: Candidate | null = null;

  for (const topic of topics) {
    for (const rel of topic.related_topics) {
      if (retrievedNames.has(rel.topic_name)) continue;
      if (rel.weight < 0.7) continue;
      if (!best || rel.weight > best.weight) {
        best = { name: rel.topic_name, type: rel.relationship_type, weight: rel.weight };
      }
    }
  }

  if (!best) return null;

  // Find an entity that bridges the topics (entity connected to both the active topic
  // AND the next connection topic) — this gives Kinfolk a concrete example to surface.
  // For now, surface the first entity from the topic that has this cross-link.
  const bridgeEntity = topics
    .flatMap((t) => t.entities)
    .find((e) => e.name && e.entity_type === "cultural_site");

  // Generate a reason that explains WHY this connection is relevant
  const REASONS: Record<string, string> = {
    "Philadelphia Faith":
      "Philadelphia's Black history is inseparable from its faith communities — Mother Bethel AME Church (congregation 1794, denomination 1816) is where both stories live simultaneously.",
    "Philadelphia Black History":
      "Understanding Philadelphia's faith communities requires knowing their deep historical roots, including the founding of the AME denomination at Mother Bethel in 1816.",
    "Philadelphia Businesses":
      "Philadelphia's community businesses are the living continuation of the economic self-determination tradition stretching back to the Free African Society (1787).",
    "Philadelphia Real Estate":
      "The neighborhood geography of Philadelphia's Black community has always been tied to economic and political history — the same forces shaped both.",
    "Philadelphia Nightlife":
      "Philadelphia's cultural scene is shaped by its community history — the venues and spaces reflect where Black residents built their social life.",
    "Philadelphia Employment":
      "Economic opportunity in Philadelphia has always been tied to the institutions and networks built by the Black community since the 18th century.",
  };

  return {
    topic_name: best.name,
    relationship_type: best.type,
    weight: best.weight,
    reason: REASONS[best.name] ?? `${best.name} is directly related to this topic (${best.type}, weight ${best.weight}).`,
    entity: bridgeEntity
      ? { name: bridgeEntity.name!, entity_type: bridgeEntity.entity_type, city: bridgeEntity.city }
      : null,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getKnowledgeGraphContext(
  userMessage: string,
  geographyRef: string | null,
): Promise<KnowledgeGraphContext | null> {
  try {
    // 1. Detect intents from the user message
    const intents = detectIntents(userMessage);
    if (intents.length === 0 && !geographyRef) return null;

    // 2. Resolve geography node
    let geography: KnowledgeGraphContext["geography"] = null;
    if (geographyRef) {
      const geoNode = await resolveGeographyNode(geographyRef);
      if (geoNode) {
        geography = { ref: geoNode.geography_ref ?? geographyRef, node: geoNode };
      }
    }

    // 3. Fetch topic contexts in parallel — cap at 2 topics per message to avoid
    //    overwhelming the system prompt with too much context
    const topTopics = intents.slice(0, 2);
    const topicResults = await Promise.all(
      topTopics.map((intent) =>
        fetchTopicContext(intent, geography?.ref ?? null),
      ),
    );
    const topics = topicResults.filter((t): t is RetrievedTopic => t !== null);

    // If we have a geography ref but no topic intents, still include geography
    // so Kinfolk knows it's talking about a known city
    if (topics.length === 0 && !geography && intents.length === 0) {
      return null;
    }

    // 4. Provenance summary
    const allSources = topics.flatMap((t) => t.sources);
    const tiersPresent = [...new Set(allSources.map((s) => s.authority_tier))];
    const provenanceSummary = {
      tiers_present: tiersPresent,
      has_authoritative: tiersPresent.includes("authoritative"),
      has_professional: tiersPresent.includes("professional"),
      has_community: tiersPresent.includes("community"),
      has_ambassador: tiersPresent.includes("ambassador"),
    };

    // 5. Big Cousin — next connection
    const nextConnection = topics.length > 0 ? buildNextConnection(topics) : null;

    // 6. Retrieval log (for internal audit + proof)
    const retrievalLog = {
      intent: intents.join(", ") || "(geography only)",
      geography_ref: geography?.ref ?? null,
      topic_ids_queried: topics.map((t) => t.node.id),
      total_sources: allSources.length,
      total_entities: topics.reduce((acc, t) => acc + t.entities.length, 0),
      freshness: new Date().toISOString(),
      permission_filtered: false, // Phase 1 — no user-level filtering yet; Layer 4 adds this
    };

    return {
      geography,
      topics,
      provenance_summary: provenanceSummary,
      next_connection: nextConnection,
      retrieval_log: retrievalLog,
    };
  } catch {
    // Knowledge graph context is enhancement — never block a Kinfolk response
    return null;
  }
}

// ── Render to system prompt string ────────────────────────────────────────────
//
// Called by buildSystemPrompt. Converts the structured context into a
// clearly-delimited section Kinfolk can read, reason over, and cite from.

export function renderKnowledgeGraphContext(ctx: KnowledgeGraphContext): string {
  const lines: string[] = [];

  lines.push("=== MWM KNOWLEDGE GRAPH — VERIFIED CONTEXT ===");
  lines.push(
    "The following knowledge has been retrieved from the MWM platform's verified knowledge graph.",
    "Kinfolk MUST distinguish between evidence tiers when speaking.",
    "Do NOT invent community or ambassador evidence — show those tiers as empty if they are.",
    "",
  );

  // Geography
  if (ctx.geography) {
    lines.push(`GEOGRAPHY: ${ctx.geography.node.topic_name}`);
    if (ctx.geography.node.description) {
      lines.push(`Context: ${ctx.geography.node.description}`);
    }
    lines.push("");
  }

  // Topics
  for (const topic of ctx.topics) {
    lines.push(`TOPIC: ${topic.node.topic_name} [${topic.node.category.toUpperCase()}]`);
    if (topic.node.description) {
      lines.push(`Description: ${topic.node.description}`);
    }

    // Sources by tier
    // CITATION RULE: Kinfolk must only present a source as DIRECT PROOF of a
    // specific claim when confidence = 'verified'. Any lower confidence means
    // the source provides context or corroboration, NOT a verbatim citation.
    if (topic.sources.length === 0) {
      lines.push("Evidence: No verified sources on this topic yet.");
    } else {
      lines.push("Evidence:");
      for (const src of topic.sources) {
        const tierLabel = src.authority_tier.toUpperCase();
        // Map confidence → citation strength Kinfolk must honor
        let citationType: string;
        if (src.confidence === "verified") {
          citationType = "DIRECT CITATION";
        } else if (src.confidence === "high") {
          citationType = "CONTEXTUAL SUPPORT";
        } else if (src.confidence === "medium") {
          citationType = "BACKGROUND REFERENCE";
        } else {
          // low, unverified, or missing
          citationType = "BACKGROUND ONLY — do not cite for specific claims";
        }
        lines.push(`  [${tierLabel}] [${citationType}] ${src.source_name}`);
        if (src.claim) {
          lines.push(`    Claim supported: "${src.claim}"`);
        }
        if (src.source_url) {
          lines.push(`    Source: ${src.source_url}`);
        }
        if (src.evidence_section) {
          // Only first 200 chars of evidence section to keep prompt tight
          const section = src.evidence_section.length > 200
            ? src.evidence_section.slice(0, 200) + "…"
            : src.evidence_section;
          lines.push(`    Evidence note: ${section}`);
        }
        // Explicit guidance per confidence level so Kinfolk knows exactly how to use it
        if (src.confidence === "verified") {
          lines.push(`    → Kinfolk may cite this source as direct proof of the claim above.`);
        } else if (src.confidence === "high") {
          lines.push(`    → Kinfolk: use "historical records suggest" or "sources indicate" — do NOT say this source directly documents the specific claim.`);
        } else {
          lines.push(`    → Kinfolk: background context only — do NOT cite as evidence for any specific claim.`);
        }
      }
    }

    // Check which tiers are missing — be explicit
    const missingTiers = (["community", "ambassador"] as const).filter(
      (t) => !topic.sources.some((s) => s.authority_tier === t),
    );
    if (missingTiers.length > 0) {
      lines.push(
        `  [EMPTY TIERS — DO NOT INVENT]: ${missingTiers.map((t) => t.toUpperCase()).join(", ")} — no real evidence exists yet for this topic.`,
      );
    }

    // Connected MWM entities
    if (topic.entities.length > 0) {
      lines.push("Connected MWM Platform Entities:");
      for (const entity of topic.entities) {
        const name = entity.name ?? entity.entity_id;
        const loc = [entity.city, entity.state].filter(Boolean).join(", ");
        lines.push(`  • ${name} [${entity.entity_type}]${loc ? ` — ${loc}` : ""}`);
        if (entity.entity_label) {
          lines.push(`    "${entity.entity_label}"`);
        }
        if (entity.latitude && entity.longitude) {
          lines.push(`    Location: ${entity.latitude.toFixed(4)}°N, ${Math.abs(entity.longitude).toFixed(4)}°W`);
        }
        if (entity.description) {
          const desc = entity.description.length > 200
            ? entity.description.slice(0, 200) + "…"
            : entity.description;
          lines.push(`    About: ${desc}`);
        }
      }
    }

    // Related topics
    if (topic.related_topics.length > 0) {
      const related = topic.related_topics
        .filter((r) => r.weight >= 0.7)
        .slice(0, 3);
      if (related.length > 0) {
        lines.push(`Related Topics: ${related.map((r) => `${r.topic_name} (${r.relationship_type}, weight ${r.weight})`).join(" | ")}`);
      }
    }

    lines.push("");
  }

  // Big Cousin connection
  if (ctx.next_connection) {
    const nc = ctx.next_connection;
    lines.push("BIG COUSIN OPPORTUNITY (surface if relevant — explain why):");
    lines.push(`  Topic: ${nc.topic_name}`);
    lines.push(`  Why it's connected: ${nc.reason}`);
    if (nc.entity) {
      lines.push(`  Concrete example: ${nc.entity.name} (${nc.entity.entity_type}${nc.entity.city ? ` in ${nc.entity.city}` : ""})`);
    }
    lines.push(
      "  RULE: Only surface this if it genuinely adds value to the user's question.",
      "  RULE: Explain the connection. Do not manufacture 'you might also like'.",
      "",
    );
  }

  // Provenance footer
  lines.push("KINFOLK CITATION RULES FOR THIS RESPONSE:");
  lines.push("  FACT = comes from [AUTHORITATIVE] or [PROFESSIONAL] [DIRECT CITATION] sources above.");
  lines.push("  CONTEXTUAL = comes from [CONTEXTUAL SUPPORT] sources. Say 'historical records indicate' or 'sources suggest' — never 'X source directly proves'.");
  lines.push("  INFERENCE = Kinfolk's own reasoning from verified facts. Label it as such.");
  lines.push("  COMMUNITY EXPERIENCE = empty until real MWM members contribute. Do not invent.");
  lines.push("  AMBASSADOR CONTENT = empty until a local Ambassador guide exists. Do not invent.");
  lines.push("");
  lines.push("  CLAIM-LEVEL RULE: a source's confidence rating governs HOW you cite it, not whether");
  lines.push("  you mention it. DIRECT CITATION = may be presented as specific proof. CONTEXTUAL");
  lines.push("  SUPPORT = provides corroborating evidence for the broader topic but does not");
  lines.push("  verbatim prove the specific claim. Never conflate the two.");
  lines.push("  When uncertain: say so clearly. When citing: name the source and its citation type.");
  lines.push("=== END KNOWLEDGE GRAPH CONTEXT ===");

  return lines.join("\n");
}
