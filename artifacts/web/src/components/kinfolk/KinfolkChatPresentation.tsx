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
