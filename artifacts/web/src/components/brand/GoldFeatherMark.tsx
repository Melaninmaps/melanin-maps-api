/**
 * GoldFeatherMark — the canonical MWM-owned visual accent.
 *
 * Use this for ALL MWM-authored UI: Kinfolk headers, Library, system chrome,
 * category cards, navigation, optional action cards, and profile controls.
 *
 * Rules:
 * - Never place Unicode emoji in MWM-authored text. Use this mark instead.
 * - Never apply this mark to community-member text or posts. Members may
 *   use emoji freely; their text must be preserved verbatim.
 *
 * The gradient version (GoldFeatherMark) is for headings and prominent accents.
 * The flat version (GoldFeatherIcon in GoldFeatherIcon.tsx) is for smaller chrome.
 */
import { type SVGProps, useId } from "react";

type GoldFeatherMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Accessible label for meaningful marks; omit for decorative use. */
  label?: string;
  size?: number;
};

export function GoldFeatherMark({
  label,
  size = 20,
  className = "",
  ...props
}: GoldFeatherMarkProps) {
  const uid = useId();
  const gradientId = `mwm-gf-grad-${uid.replace(/:/g, "")}`;
  const titleId = label
    ? `mwm-gf-title-${uid.replace(/:/g, "")}`
    : undefined;

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-labelledby={titleId}
      className={`mwm-gold-feather ${className}`.trim()}
      fill="none"
      height={size}
      role={label ? "img" : undefined}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {label ? <title id={titleId}>{label}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="3" x2="20" y1="4" y2="20">
          <stop stopColor="#F6D574" />
          <stop offset="0.48" stopColor="#CA922B" />
          <stop offset="1" stopColor="#8D5C17" />
        </linearGradient>
      </defs>
      {/* Feather quill body */}
      <path
        d="M18.94 3.12C13.78 2.94 8.27 5.54 6.18 10.34c-1.5 3.46-.71 7.1-3.18 10.16 3.49-.11 6.57-1.73 8.62-4.54 2.69-3.67 3.53-7.88 7.32-10.54-.03-.86-.03-1.63 0-2.3Z"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      {/* Feather barbs */}
      <path
        d="M5.39 18.7c2.9-3.27 5.68-6.43 11.46-10.3M8.07 15.73l.2 2.94M11.05 12.46l2.86.31M13.98 9.76l.16 2.42"
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

export function GoldFeatherBadge({ label }: { label: string }) {
  return (
    <span
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CA922B]/70 bg-[#CA922B]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
      role="img"
    >
      <GoldFeatherMark size={18} />
    </span>
  );
}
