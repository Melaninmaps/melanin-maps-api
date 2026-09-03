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
      for (let index = 0; index < providers.length; index += 1) {
        try {
          const result = await providers[index].search(input);
          const documents = validResearchDocuments(result.documents, input.allowedDomains);
          if (documents.length < 2) {
            errors.push(new Error(`${providers[index].name} returned insufficient safe, cited sources.`));
            continue;
          }
          return {
            ...result,
            documents,
            status: index === 0 ? result.status : "degraded",
          };
        } catch (error) {
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
