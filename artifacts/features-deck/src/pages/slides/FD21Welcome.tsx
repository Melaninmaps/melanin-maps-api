/* ─── "Welcome home." — the final page ──────────────────────────────────────
   Near-black. Quiet. After everything that was said, this is enough.
   The gold rule above the headline — a threshold being crossed.
──────────────────────────────────────────────────────────────────────────── */
export default function FD21Welcome() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#140805" }}>
      {/* Very faint warm glow — candlelight, not spotlight */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.06) 0%, transparent 65%)" }} />

      <div style={{ width: "4vw", height: "1px", background: "#CA922B",
        opacity: 0.6, marginBottom: "3.2vw",
        boxShadow: "0 0 8px rgba(202,146,43,0.25)" }} />

      <h2 className="relative font-display text-center"
        style={{ fontSize: "5.2vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.05,
          letterSpacing: "0.02em",
          textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)" }}>
        Welcome home.
      </h2>
    </div>
  );
}
