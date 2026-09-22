import { validResearchDocuments } from "./livingLibrary";
import type { ExternalResearchProvider, ResearchProviderResult } from "./types";

export class LibraryResearchProviderUnavailableError extends Error {
  override readonly name = "LibraryResearchProviderUnavailableError";
  constructor(message = "Live Library research is temporarily unavailable.") {
    super(message);
  }
}

export function createResearchProviderChain(
  providers: ExternalResearchProvider[],
): ExternalResearchProvider {
  return {
    name: providers[0]?.name ?? "none",
    async search(input): Promise<ResearchProviderResult> {
      const errors: unknown[] = [];
      let safeDocuments: ResearchProviderResult["documents"] = [];
      let contributingProvider: ResearchProviderResult["provider"] | null = null;
      let primaryStatus: ResearchProviderResult["status"] | null = null;
      let primaryContributedEvidence = false;
      let providerFailed = false;
      for (let index = 0; index < providers.length; index += 1) {
        if (input.signal?.aborted) throw new Error("Library research was cancelled.");
        try {
          const result = await providers[index].search(input);
          const documents = validResearchDocuments(
            [...safeDocuments, ...result.documents],
            input.allowedDomains,
          );
          if (documents.length <= safeDocuments.length) {
            errors.push(new Error(`${providers[index].name} returned no additional safe, cited sources.`));
            continue;
          }
          safeDocuments = documents;
          contributingProvider = result.provider;
          if (index === 0) {
            primaryStatus = result.status;
            primaryContributedEvidence = true;
          }
          if (safeDocuments.length < 2) {
            errors.push(new Error(`${providers[index].name} returned fewer than two safe, cited sources.`));
            continue;
          }
          return {
            ...result,
            documents: safeDocuments,
            provider: contributingProvider,
            status: index === 0
              ? primaryStatus ?? result.status
              : providerFailed || !primaryContributedEvidence || primaryStatus === "degraded"
                ? "degraded"
                : "available",
          };
        } catch (error) {
          if (input.signal?.aborted) throw error;
          providerFailed = true;
          errors.push(error);
        }
      }
      const detail = errors
        .map((error) => error instanceof Error ? error.message : String(error))
        .join("; ");
      throw new LibraryResearchProviderUnavailableError(
        detail ? `Live Library research is temporarily unavailable: ${detail}` : undefined,
      );
    },
  };
}
