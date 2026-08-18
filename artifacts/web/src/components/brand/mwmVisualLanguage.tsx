import { type ReactNode } from "react";
import { GoldFeatherBadge, GoldFeatherIcon } from "./GoldFeatherIcon";

export type MwmOwnedSurface =
  | "navigation"
  | "directory"
  | "kinfolk"
  | "library"
  | "category-card"
  | "button"
  | "status";

/**
 * Drop-in replacement for emoji in MWM-authored UI surfaces.
 * The visual mark is always the approved gold feather outline.
 * The `surface` prop is semantic/audit only — does not change the icon.
 */
export function MwmOwnedAccent({
  label,
  surface: _surface,
  compact = false,
}: {
  label: string;
  surface: MwmOwnedSurface;
  compact?: boolean;
}) {
  return compact ? (
    <GoldFeatherIcon label={label} size={18} />
  ) : (
    <GoldFeatherBadge label={label} />
  );
}

/** Strip Unicode emoji from MWM/Kinfolk-origin text. Member text is returned unchanged. */
function stripUnicodeEmoji(value: string): string {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F|\u200D/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .trim();
}

/**
 * Render text with the correct emoji policy for its origin.
 *
 * - `origin="mwm"` or `origin="kinfolk"`: strips Unicode emoji (replaced by feather accents in chrome)
 * - `origin="member"`: member's text is returned unchanged, including any emoji they typed
 */
export function BrandedText({
  children,
  origin,
  className = "",
}: {
  children: string;
  origin: "mwm" | "kinfolk" | "member";
  className?: string;
}) {
  const text = origin === "member" ? children : stripUnicodeEmoji(children);
  return <span className={className}>{text}</span>;
}

export function MwmCardHeading({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <MwmOwnedAccent compact label={label} surface="category-card" />
      <span>{children}</span>
    </div>
  );
}
