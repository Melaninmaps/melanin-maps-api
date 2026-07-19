/* ─── Near-black — intentional transition ────────────────────────────────────
   Cream ends. Near-black opens. This should feel like walking through a door
   into another room — not a light switch. The warm horizon at the bottom
   signals you are entering something, not leaving something behind.
   Emotional arc: Curiosity → Anticipation
──────────────────────────────────────────────────────────────────────────── */
export default function FD11KinfolkTeaser() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#080404" }}>
      {/* Warm horizon glow — like candlelight through a doorway */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(202,146,43,0.09) 0%, transparent 55%)" }} />
      {/* Very subtle warm center — pulls the eye forward */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.04) 0%, transparent 60%)" }} />

      <p className="relative font-body text-center"
        style={{ fontSize: "1.3vw", color: "#5A3A18", letterSpacing: "0.2em",
          fontWeight: 400, marginBottom: "3.2vw" }}>
        You&rsquo;ve found the city.
      </p>
      <h2 className="relative font-display text-center"
        style={{ fontSize: "5.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.08,
          maxWidth: "78vw",
          textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>
        Now meet someone<br />
        who <span style={{ color: "#CA922B",
          textShadow: "0 2px 8px rgba(202,146,43,0.28), 0 1px 3px rgba(0,0,0,0.5)" }}>knows</span> it.
      </h2>
    </div>
  );
}
