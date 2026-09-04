import React from "react";

/**
 * UI metadata returned only for the controlled staff demo. This is a product
 * presentation hint, not an authorization or access-control mechanism.
 */
export interface KinfolkStaffDemoExperience {
  mode: "staff_demo";
  label: "Staff demo";
  qualityTier: "quality";
  contextTurns: number;
}

export interface KinfolkPresentationSource {
  title: string;
  url: string;
}

export type KinfolkStructuredContent =
  | { kind: "recipe_options"; options: Array<{ title: string; description: string; keyIngredients: string[]; timeLabel: string | null }> }
  | { kind: "recipe_instructions"; title: string; ingredients: string[]; steps: string[]; foodSafety: string[] }
  | { kind: "cultural_consensus"; subject: string; conclusion: string; criteria: string[]; evidenceFor: string[]; otherDefensibleViews: string[]; asOf: string | null }
  | { kind: "ranked_perspectives"; criteria: string[]; entries: Array<{ name: string; reason: string; evidenceSummary: string }> }
  | { kind: "entity_explorer"; canonicalName: string; overview: string; pathways: Array<{ label: string; description: string; libraryHref: string | null }> };

export interface KinfolkMediaLink { title: string; creator: string | null; platform: string; url: string; reason: string }
export interface KinfolkRelatedConnection { title: string; relationship: string; reason: string; href: string | null; evidenceUrl: string | null }
export interface KinfolkResearchStatus { usedInternal: boolean; usedLiveWeb: boolean; degraded: boolean; asOf: string }

/**
 * Additive chat contract for structured itinerary responses. The API keeps its
 * conversational `reply` field; this payload lets the web client present the
 * day plan without ever exposing serialized JSON to a member.
 */
export interface KinfolkItineraryActivity {
  time: string;
  title: string;
  description: string;
  canonicalVenue?: string | null;
}

export interface KinfolkItineraryDay {
  day: number;
  theme: string;
  activities: KinfolkItineraryActivity[];
  safetyNote?: string | null;
  packingTips?: string[] | null;
}

export interface KinfolkItinerary {
  days: KinfolkItineraryDay[];
  safetyNote?: string | null;
  packingTips?: string[] | null;
}

/** Status copy is deliberately limited to client-side request elapsed time. */
export const KINFOLK_RESPONSE_STATUS_STAGES = [
  "Understanding your question…",
  "Connecting the conversation…",
  "Putting your answer together…",
] as const;

export const KINFOLK_RESPONSE_STATUS_DELAYS_MS = {
  connectingConversation: 1_500,
  puttingAnswerTogether: 4_000,
} as const;

export function responseStatusForElapsedTime(elapsedMs: number): (typeof KINFOLK_RESPONSE_STATUS_STAGES)[number] {
  if (elapsedMs >= KINFOLK_RESPONSE_STATUS_DELAYS_MS.puttingAnswerTogether) return KINFOLK_RESPONSE_STATUS_STAGES[2];
  if (elapsedMs >= KINFOLK_RESPONSE_STATUS_DELAYS_MS.connectingConversation) return KINFOLK_RESPONSE_STATUS_STAGES[1];
  return KINFOLK_RESPONSE_STATUS_STAGES[0];
}

export function isStaffDemoExperience(
  experience: KinfolkStaffDemoExperience | null | undefined,
): boolean {
  return experience?.mode === "staff_demo" && experience.qualityTier === "quality";
}

export function safeExternalSourceHref(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function KinfolkAssistantText({ content }: { content: string }) {
  return (
    <p
      data-testid="kinfolk-assistant-text"
      className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[15px] leading-7"
    >
      {content}
    </p>
  );
}

export function hasItineraryDays(itinerary: KinfolkItinerary | null | undefined): boolean {
  return Array.isArray(itinerary?.days) && itinerary.days.length > 0;
}

/** Prevent a server fallback that serializes an itinerary into `reply` from leaking as chat JSON. */
export function isSerializedItineraryContent(content: string): boolean {
  const trimmed = content.trim();
  return /^```(?:json)?\s*[\s\S]*```$/i.test(trimmed)
    || (/^\{[\s\S]*\}$/.test(trimmed) && trimmed.includes('"days"'));
}

/** A compact, scan-friendly presentation for the API's structured itinerary payload. */
export function KinfolkItinerary({ itinerary }: { itinerary: KinfolkItinerary }) {
  if (!hasItineraryDays(itinerary)) return null;

  return (
    <section data-testid="kinfolk-itinerary" aria-label="Day-by-day itinerary" className="mt-3 space-y-3">
      {itinerary.days.map((day, dayIndex) => {
        const isFinalDay = dayIndex === itinerary.days.length - 1;
        const safetyNote = day.safetyNote ?? (isFinalDay ? itinerary.safetyNote : null);
        const packingTips = (day.packingTips ?? (isFinalDay ? itinerary.packingTips : null))?.filter(Boolean) ?? [];
        return (
          <article
            key={`${day.day}-${dayIndex}`}
            data-testid="kinfolk-itinerary-day"
            className="overflow-hidden rounded-2xl border border-[#3A1F0E]/10 bg-white shadow-sm"
          >
            <header className="border-b border-[#CA922B]/20 bg-[#FFF8EC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8D5C17]">Day {day.day}</p>
              <h3 className="mt-0.5 font-serif text-lg font-bold text-[#2B1507]">{day.theme}</h3>
            </header>

            <div className="divide-y divide-[#3A1F0E]/8 px-4">
              {day.activities.map((activity, activityIndex) => (
                <section key={`${activity.time}-${activity.title}-${activityIndex}`} className="py-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#CA922B]">{activity.time}</p>
                  <h4 className="mt-1 text-sm font-bold text-[#2B1507]">{activity.title}</h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#3A1F0E]/70">{activity.description}</p>
                  {activity.canonicalVenue ? (
                    <p className="mt-2 text-xs leading-5 text-[#3A1F0E]/60">
                      <span className="font-semibold text-[#8D5C17]">Venue: </span>{activity.canonicalVenue}
                    </p>
                  ) : null}
                </section>
              ))}
            </div>

            {(safetyNote || packingTips.length > 0) ? (
              <footer className="grid gap-2 border-t border-[#3A1F0E]/8 bg-[#FAF6EF] px-4 py-3 sm:grid-cols-2">
                {safetyNote ? (
                  <aside className="text-xs leading-5 text-[#3A1F0E]/70">
                    <span className="font-bold uppercase tracking-wider text-[#8D5C17]">Safety note</span>
                    <p className="mt-1">{safetyNote}</p>
                  </aside>
                ) : null}
                {packingTips.length > 0 ? (
                  <aside className="text-xs leading-5 text-[#3A1F0E]/70">
                    <span className="font-bold uppercase tracking-wider text-[#8D5C17]">Packing tips</span>
                    <ul className="mt-1 space-y-0.5">
                      {packingTips.map((tip, tipIndex) => <li key={`${tip}-${tipIndex}`}>• {tip}</li>)}
                    </ul>
                  </aside>
                ) : null}
              </footer>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function CompactList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return <ul className="mt-1 space-y-1 text-xs leading-5 text-[#3A1F0E]/70">{items.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul>;
}

/** Additive structured details. The complete conversational reply always remains the primary answer. */
export function KinfolkContextualContent({ structuredContent, mediaLinks = [], relatedConnections = [], researchStatus }: {
  structuredContent?: KinfolkStructuredContent | null; mediaLinks?: KinfolkMediaLink[]; relatedConnections?: KinfolkRelatedConnection[]; researchStatus?: KinfolkResearchStatus | null;
}) {
  const safeMedia = mediaLinks.flatMap((media) => { const href = safeExternalSourceHref(media.url); return href ? [{ ...media, href }] : []; });
  const safeConnections = relatedConnections.map((connection) => ({ ...connection, href: connection.href ? safeExternalSourceHref(connection.href) : null, evidenceHref: connection.evidenceUrl ? safeExternalSourceHref(connection.evidenceUrl) : null }));
  if (!structuredContent && safeMedia.length === 0 && safeConnections.length === 0 && !researchStatus) return null;
  return <section data-testid="kinfolk-contextual-content" aria-label="Kinfolk details" className="mt-3 space-y-3">
    {structuredContent?.kind === "recipe_options" && <div data-testid="kinfolk-recipe-options" className="grid gap-2 sm:grid-cols-2">{structuredContent.options.map((option, index) => <article key={`${option.title}-${index}`} className="rounded-xl border border-[#CA922B]/20 bg-[#FFF8EC] p-3"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold text-[#2B1507]">{option.title}</h3>{option.timeLabel && <span className="shrink-0 text-[10px] font-semibold text-[#8D5C17]">{option.timeLabel}</span>}</div><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/70">{option.description}</p><CompactList items={option.keyIngredients} /></article>)}</div>}
    {structuredContent?.kind === "recipe_instructions" && <article data-testid="kinfolk-recipe-instructions" className="rounded-xl border border-[#CA922B]/20 bg-[#FFF8EC] p-3"><h3 className="text-sm font-bold text-[#2B1507]">{structuredContent.title}</h3><div className="mt-2 grid gap-3 sm:grid-cols-2"><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Ingredients</h4><CompactList items={structuredContent.ingredients} /></div><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Steps</h4><CompactList items={structuredContent.steps} /></div></div>{structuredContent.foodSafety.length > 0 && <div className="mt-3 border-t border-[#CA922B]/20 pt-2"><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Food safety</h4><CompactList items={structuredContent.foodSafety} /></div>}</article>}
    {structuredContent?.kind === "cultural_consensus" && <article data-testid="kinfolk-cultural-consensus" className="rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3"><h3 className="text-sm font-bold text-[#2B1507]">{structuredContent.subject}</h3><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/70">{structuredContent.conclusion}</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Criteria</h4><CompactList items={structuredContent.criteria} /></div><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Evidence</h4><CompactList items={structuredContent.evidenceFor} /></div><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Other views</h4><CompactList items={structuredContent.otherDefensibleViews} /></div></div>{structuredContent.asOf && <p className="mt-2 text-[10px] text-[#3A1F0E]/50">As of {structuredContent.asOf}</p>}</article>}
    {structuredContent?.kind === "ranked_perspectives" && <article data-testid="kinfolk-ranked-perspectives" className="rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3"><h3 className="text-[10px] font-bold uppercase tracking-wider text-[#8D5C17]">Perspectives</h3><CompactList items={structuredContent.criteria} /><ol className="mt-3 space-y-2">{structuredContent.entries.map((entry, index) => <li key={`${entry.name}-${index}`} className="text-xs"><span className="font-bold text-[#2B1507]">{index + 1}. {entry.name}</span><p className="text-[#3A1F0E]/70">{entry.reason}</p><p className="text-[#3A1F0E]/50">{entry.evidenceSummary}</p></li>)}</ol></article>}
    {structuredContent?.kind === "entity_explorer" && <article data-testid="kinfolk-entity-explorer" className="rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3"><h3 className="text-sm font-bold text-[#2B1507]">{structuredContent.canonicalName}</h3><p className="mt-1 text-xs leading-5 text-[#3A1F0E]/70">{structuredContent.overview}</p><div className="mt-3 space-y-2">{structuredContent.pathways.map((pathway, index) => { const href = pathway.libraryHref ? safeExternalSourceHref(pathway.libraryHref) : null; return <div key={`${pathway.label}-${index}`} className="rounded-lg bg-white px-3 py-2 text-xs"><p className="font-bold text-[#2B1507]">{pathway.label}</p><p className="mt-0.5 text-[#3A1F0E]/70">{pathway.description}</p>{href && <a href={href} className="mt-1 inline-block font-semibold text-[#8D5C17] underline">Open in Library</a>}</div>; })}</div></article>}
    {safeMedia.length > 0 && <section data-testid="kinfolk-media-links" aria-label="Verified media"><h3 className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Verified media</h3><div className="mt-2 space-y-2">{safeMedia.map((media) => <a key={media.url} href={media.href} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#3A1F0E]/8 bg-white p-3 text-xs"><span className="font-bold text-[#8D5C17]">{media.title}</span><span className="text-[#3A1F0E]/60"> · {media.creator ?? media.platform}</span><p className="mt-1 text-[#3A1F0E]/70">{media.reason}</p></a>)}</div></section>}
    {safeConnections.length > 0 && <section data-testid="kinfolk-related-connections" aria-label="Related connections"><h3 className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Related connections</h3><div className="mt-2 space-y-2">{safeConnections.map((connection, index) => <article key={`${connection.title}-${index}`} className="rounded-xl border border-[#3A1F0E]/8 bg-white p-3 text-xs"><p className="font-bold text-[#2B1507]">{connection.title} <span className="font-normal text-[#3A1F0E]/60">· {connection.relationship}</span></p><p className="mt-1 text-[#3A1F0E]/70">{connection.reason}</p><div className="mt-1 flex gap-3">{connection.href && <a href={connection.href} className="font-semibold text-[#8D5C17] underline">Open in Library</a>}{connection.evidenceHref && <a href={connection.evidenceHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#8D5C17] underline">Supporting source</a>}</div></article>)}</div></section>}
    {researchStatus && <p data-testid="kinfolk-research-status" className="text-[10px] text-[#3A1F0E]/50">Research: {[researchStatus.usedInternal && "Library", researchStatus.usedLiveWeb && "current sources"].filter(Boolean).join(" + ") || "answer context"}{researchStatus.degraded ? " · limited evidence" : ""}{researchStatus.asOf ? ` · as of ${researchStatus.asOf}` : ""}</p>}
  </section>;
}

export function KinfolkStaffDemoBadge({
  experience,
}: {
  experience: KinfolkStaffDemoExperience | null | undefined;
}) {
  if (!isStaffDemoExperience(experience)) return null;

  return (
    <span
      data-testid="kinfolk-staff-demo-badge"
      className="mb-2 inline-flex items-center rounded-full border border-[#CA922B]/35 bg-[#FFF8EC] px-2.5 py-1 text-xs font-semibold text-[#8D5C17]"
      aria-label="Staff demo, quality conversation"
    >
      Staff demo <span className="mx-1 text-[#CA922B]" aria-hidden="true">·</span> Quality conversation
    </span>
  );
}

export function KinfolkSourceLinks({ sources }: { sources: KinfolkPresentationSource[] }) {
  const safeSources = sources.flatMap((source) => {
    const href = safeExternalSourceHref(source.url);
    return href ? [{ ...source, href }] : [];
  });

  if (safeSources.length === 0) return null;

  return (
    <section className="mt-4 space-y-2" aria-label="Sources">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Sources</h3>
      <div className="space-y-1.5">
        {safeSources.map((source) => (
          <a
            key={source.url}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-[#3A1F0E]/8 bg-[#FAF6EF] px-3 py-2 text-xs font-semibold text-[#8D5C17] transition-colors hover:border-[#CA922B]/30 hover:text-[#CA922B]"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA922B]" aria-hidden="true" />
            {source.title}
          </a>
        ))}
      </div>
    </section>
  );
}
