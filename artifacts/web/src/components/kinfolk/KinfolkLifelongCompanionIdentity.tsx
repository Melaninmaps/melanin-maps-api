import React from "react";

export const KINFOLK_LIFELONG_COMPANION_COPY = {
  identity: "Kinfolk is your lifelong cultural companion.",
  platformQuestion: "Who do you hope to become?",
  definingSentence: "Mapping With Melanin™ doesn't ask people to prove where they come from. It gives them opportunities to discover where others come from — and, if they choose, reconnect with parts of their own story.",
  guidingPhrase: "Your story is still unfolding.",
  finalPromise: "Kinfolk will never rush your journey. It will simply remember where you left off, celebrate what you've discovered, and be ready whenever you're curious to take the next step.",
} as const;

/** A read-only, non-gamified statement of Kinfolk's founding promise. */
export function KinfolkLifelongCompanionIdentity() {
  return (
    <details
      data-testid="kinfolk-lifelong-companion-identity"
      className="group mt-4 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] px-4 py-3"
    >
      <summary className="cursor-pointer list-none text-left marker:hidden">
        <span className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8D5C17]">About Kinfolk</span>
            <span className="mt-1 block font-serif text-base font-bold text-[#2B1507]">{KINFOLK_LIFELONG_COMPANION_COPY.identity}</span>
          </span>
          <span aria-hidden="true" className="text-lg leading-none text-[#8D5C17] transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <div className="mt-4 border-t border-[#CA922B]/20 pt-4 text-sm leading-6 text-[#3A1F0E]/72">
        <p className="font-serif text-lg font-bold text-[#2B1507]">{KINFOLK_LIFELONG_COMPANION_COPY.platformQuestion}</p>
        <p className="mt-2">{KINFOLK_LIFELONG_COMPANION_COPY.definingSentence}</p>
        <blockquote className="mt-4 border-l-2 border-[#CA922B] pl-3">
          <p className="font-serif text-base font-bold text-[#2B1507]">{KINFOLK_LIFELONG_COMPANION_COPY.guidingPhrase}</p>
          <p className="mt-2">{KINFOLK_LIFELONG_COMPANION_COPY.finalPromise}</p>
        </blockquote>
      </div>
    </details>
  );
}
