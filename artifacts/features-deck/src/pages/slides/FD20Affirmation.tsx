/* ─── "You belong here." — single statement, maximum weight ─────────────────
   Warm deep brown — distinct from both the directional gradient and near-black.
   This is a pause. A breath. A statement that needs nothing else.
──────────────────────────────────────────────────────────────────────────── */
export default function FD20Affirmation() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#2C1510" }}>
      {/* Warm center glow — the statement glows from within */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.13) 0%, transparent 62%)" }} />

      <h2 className="relative font-display text-center"
        style={{ fontSize: "6.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05,
          textShadow: "0 2px 16px rgba(0,0,0,0.5), 0 1px 6px rgba(0,0,0,0.4)" }}>
        You belong here.
      </h2>
    </div>
  );
}
