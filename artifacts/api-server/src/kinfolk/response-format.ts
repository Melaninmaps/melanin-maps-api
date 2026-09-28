/**
 * Kinfolk responses are rendered as plain text across web and mobile. This
 * converts accidental Markdown into the product's quiet bullet language
 * without interpreting untrusted text as HTML.
 */
export function normalizeKinfolkMemberReply(value: string): string {
  const bulletHeading = (label: string, trailing = "") => {
    const cleanLabel = label.trim().replace(/:\s*$/, "");
    const cleanTrailing = trailing.trim();
    return `• ${cleanLabel}${cleanTrailing ? `: ${cleanTrailing}` : ""}`;
  };

  return value
    .replace(/^[ \t]*(?:\*\*|__)([^*_\n]+?)(?:\*\*|__):?[ \t]+(.+)$/gm, (_match, label: string, trailing: string) => bulletHeading(label, trailing))
    .replace(/^[ \t]*(?:\*\*|__)([^*_\n]+?)(?:\*\*|__):?[ \t]*$/gm, (_match, label: string) => bulletHeading(label))
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, (_match, label: string) => bulletHeading(label))
    .replace(/^[ \t]*[-*+][ \t]+(.+)$/gm, "• $1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    // A model can occasionally start emphasis without closing it. The markers
    // are decorative in this interface, so omit the remaining literal tokens.
    .replace(/\*\*|__/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
