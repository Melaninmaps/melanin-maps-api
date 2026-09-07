import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const kinfolkDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routeFile = resolve(kinfolkDirectory, "../routes/kinfolk.ts");
const libraryWriterFile = resolve(kinfolkDirectory, "../library/openAiLibraryWriter.ts");

function runtimeSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : runtimeSources(path);
    }
    return path.endsWith(".ts") && !path.endsWith("model-config.ts") ? [path] : [];
  });
}

describe("Kinfolk runtime model boundary", () => {
  it("rejects hardcoded model values at Kinfolk provider call sites", () => {
    const violations = [...runtimeSources(kinfolkDirectory), routeFile]
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return /model\s*:\s*["'][^"']+["']/g.test(source) ? [path] : [];
      });
    expect(violations).toEqual([]);
  });

  it("centralizes every runtime embedding request behind validated model and dimensions", () => {
    const embeddingCallSites = runtimeSources(kinfolkDirectory)
      .filter((path) => readFileSync(path, "utf8").includes("openai.embeddings.create"));
    expect(embeddingCallSites).toEqual([resolve(kinfolkDirectory, "embedding-provider.ts")]);

    const culturalRetrieval = readFileSync(resolve(kinfolkDirectory, "cultural-retrieval.ts"), "utf8");
    expect(culturalRetrieval).toContain("createKinfolkEmbedding(text)");
    expect(culturalRetrieval).not.toContain("process.env.KINFOLK_EMBEDDING_DIMENSIONS");
    expect(culturalRetrieval).not.toContain('kinfolkModel("embedding")');
  });

  it("routes every Kinfolk Chat Completions call through a family-compatible non-streaming builder", () => {
    const routeSource = readFileSync(routeFile, "utf8");
    const completionCalls = routeSource.match(/await openai\.chat\.completions\.create\s*\(/g) ?? [];
    const guardedCalls = routeSource.match(
      /await openai\.chat\.completions\.create\s*\(\s*buildKinfolk(?:ChatCompletion|Probe)Request\s*\(/g,
    ) ?? [];
    expect(completionCalls).toHaveLength(6);
    expect(guardedCalls).toHaveLength(completionCalls.length);
    expect(routeSource).not.toContain("as Parameters<typeof openai.chat.completions.create>[0]");

    const libraryWriterSource = readFileSync(libraryWriterFile, "utf8");
    expect(libraryWriterSource).toContain("JSON.stringify(buildKinfolkChatCompletionRequest({");
    expect(libraryWriterSource).not.toMatch(/JSON\.stringify\(\{\s*model:/);
  });
});
