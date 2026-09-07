import { openai } from "@workspace/integrations-openai-ai-server";
import { kinfolkEmbeddingConfig } from "./model-config";

export type KinfolkEmbeddingCreate = (body: unknown) => Promise<unknown>;

function embeddingVector(value: unknown, dimensions: number): number[] | null {
  const vector = (value as { data?: Array<{ embedding?: unknown }> })?.data?.[0]?.embedding;
  return Array.isArray(vector)
    && vector.length === dimensions
    && vector.every((entry) => typeof entry === "number" && Number.isFinite(entry))
    ? vector
    : null;
}

/**
 * The single Kinfolk embedding boundary. Runtime retrieval and provider
 * readiness share the same validated model, dimensions request, input bound,
 * and exact response-vector contract.
 */
export async function createKinfolkEmbedding(
  input: string,
  env: NodeJS.ProcessEnv = process.env,
  create: KinfolkEmbeddingCreate = (body) => openai.embeddings.create(body as never),
): Promise<number[] | null> {
  const config = kinfolkEmbeddingConfig(env);
  if (!config) return null;
  const response = await create({
    model: config.model,
    dimensions: config.dimensions,
    input: input.slice(0, 8192),
  });
  return embeddingVector(response, config.dimensions);
}
