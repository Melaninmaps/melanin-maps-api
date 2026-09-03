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
