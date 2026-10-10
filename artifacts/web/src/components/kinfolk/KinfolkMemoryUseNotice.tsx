import React from "react";
import { Lock } from "lucide-react";

export type KinfolkMemoryUse = {
  applied: true;
  message: string;
};

/**
 * Member-facing acknowledgement only. The server sends this only after an
 * approved preference materially influenced a usable reply; this renderer never
 * exposes the preference itself.
 */
export function KinfolkMemoryUseNotice({
  memoryUse,
}: {
  memoryUse: KinfolkMemoryUse;
}) {
  const message = memoryUse.message === "Your saved preference helped tailor this answer."
    ? memoryUse.message
    : "Your saved preference helped tailor this answer.";

  return (
    <aside
      data-testid="kinfolk-memory-use-notice"
      aria-label="Saved Kinfolk preference used"
      className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#CA922B]/30 bg-[#FFF8EC] px-3 py-2 text-xs text-[#3A1F0E]/70"
    >
      <Lock size={13} aria-hidden="true" className="shrink-0 text-[#8D5C17]" />
      <span>{message}</span>
    </aside>
  );
}
