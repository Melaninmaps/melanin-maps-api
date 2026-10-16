/**
 * Kinfolk replies travel as safe Markdown-like plain text. The web client
 * renders a limited, trusted subset without ever interpreting HTML, while
 * native and copied replies retain their clear text structure.
 */
export function normalizeKinfolkMemberReply(value: string): string {
  return value
    // One bullet marker and one ordered-list separator prevent mixed model
    // syntax without turning an intentional sequence into a generic bullet.
    .replace(/^[ \t]*\*[ \t]+(.+)$/gm, "- $1")
    .replace(/^[ \t]*(\d+)[)][ \t]+(.+)$/gm, "$1. $2")
    .replace(/^[ \t]*•[ \t]*(\d+)[.)][ \t]+(.+)$/gm, "$1. $2")
    // A model can occasionally start emphasis without closing it. Remove only
    // the unpaired marker; paired emphasis stays available to the renderer.
    .replace(/^(?:\*\*|__)([^*_\n]*)$/gm, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
