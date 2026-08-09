/**
 * MWM Visual Language — Icon System
 *
 * All system-generated icons use the approved MWM visual treatment:
 *   fill="none" · stroke="#CA922B" (MWM gold) · strokeWidth="1.8"
 *   strokeLinecap="round" · strokeLinejoin="round" · viewBox="0 0 24 24"
 *
 * These are Lucide-compatible SVG paths rendered in MWM gold.
 * Use these anywhere the UI needs a system icon — never plain emoji.
 *
 * Members may use emoji freely in posts, reviews, messages, and captions.
 * This library is for MWM-generated chrome only.
 */

import { type SVGProps } from "react";

interface MwmIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  /** Override the gold stroke color — defaults to MWM gold #CA922B */
  color?: string;
  "aria-label"?: string;
}

function MwmSvg({ size = 20, color = "#CA922B", "aria-label": label, children, ...props }: MwmIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Home / Relocation / Moving */
export function MwmHome(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </MwmSvg>
  );
}

/** Travel / Airplane */
export function MwmPlane(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.5.5-3.5 2.5L9 8 4.9 6.1C4 5.7 3 6 2.5 7l-.5 1a2 2 0 0 0 .5 2.2L6.5 13 4 20l2 1 5-3 5 3 2-1-1.2-1.8z" />
    </MwmSvg>
  );
}

/** Career / Briefcase */
export function MwmBriefcase(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </MwmSvg>
  );
}

/** Find Businesses / Store */
export function MwmStore(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v11h14V9" />
      <path d="M9 14h6v6H9z" />
    </MwmSvg>
  );
}

/** Community / People */
export function MwmCommunity(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </MwmSvg>
  );
}

/** Safety / Shield */
export function MwmShield(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </MwmSvg>
  );
}

/** Healthcare / Heart */
export function MwmHeart(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </MwmSvg>
  );
}

/** Schools / Education / Graduation cap */
export function MwmGraduationCap(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </MwmSvg>
  );
}

/** Map pin / Location */
export function MwmMapPin(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </MwmSvg>
  );
}

/** Trending / Activity spark */
export function MwmTrending(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </MwmSvg>
  );
}

/** Featured / Star */
export function MwmStar(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </MwmSvg>
  );
}

/** Culture / Compass (for heritage/exploration) */
export function MwmCompass(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </MwmSvg>
  );
}

/** Relocation concierge — truck */
export function MwmTruck(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </MwmSvg>
  );
}

/** Health hub — cross */
export function MwmHealthCross(props: MwmIconProps) {
  return (
    <MwmSvg {...props}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      <path d="M12 8v8M8 12h8" />
    </MwmSvg>
  );
}
