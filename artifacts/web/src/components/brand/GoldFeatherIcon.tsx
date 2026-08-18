import { type SVGProps } from "react";

type GoldFeatherIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Accessible label for meaningful marks; omit for decorative use. */
  label?: string;
  size?: number;
};

/**
 * MWM-owned interface accent — a polished gold feather-outline mark.
 *
 * Use this anywhere MWM-authored UI needs a visual accent. It intentionally
 * replaces Unicode emoji in system chrome.
 *
 * Members may use emoji freely in their own messages, posts, and captions.
 * Do NOT apply this component to member-authored text content.
 */
export function GoldFeatherIcon({
  label,
  size = 20,
  className = "",
  ...props
}: GoldFeatherIconProps) {
  const titleId = label
    ? `gold-feather-${label.replace(/[^a-z0-9]/gi, "").toLowerCase()}`
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
      {/* Feather quill body */}
      <path
        d="M18.94 3.12C13.78 2.94 8.27 5.54 6.18 10.34c-1.5 3.46-.71 7.1-3.18 10.16 3.49-.11 6.57-1.73 8.62-4.54 2.69-3.67 3.53-7.88 7.32-10.54-.03-.86-.03-1.63 0-2.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      {/* Feather barbs */}
      <path
        d="M5.39 18.7c2.9-3.27 5.68-6.43 11.46-10.3M8.07 15.73l.2 2.94M11.05 12.46l2.86.31M13.98 9.76l.16 2.42"
        stroke="currentColor"
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CA922B]/60 bg-[#CA922B]/10 text-[#CA922B]"
      role="img"
    >
      <GoldFeatherIcon size={18} />
    </span>
  );
}
