/* ─── WHY NOW — Layout Exploration 1 (Sacred Space) ─────────────────────────
   Three-level hierarchy. Large thesis statement dominates the page. Evidence
   below as paired contrasts. Gold conclusion separated beneath a rule.
   This is Exploration 1 of 3 — do not finalize without reviewing alternatives.
──────────────────────────────────────────────────────────────────────────── */
const contrasts: [string, string][] = [
  ["Communities are more connected online than ever", "but loneliness is rising."],
  ["Travel is growing", "but trust is declining."],
  ["Businesses owned by our communities are easier to support", "but harder to discover."],
  ["People have more information than ever before.", "But less confidence in where to find belonging."],
  ["Technology has made the world smaller.", "Belonging still feels farther away."],
];

export default function FD17WhyNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 38%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "7%", bottom: "6%" }}>

        {/* Level 1 — Chapter label */}
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2vw" }}>
          WHY NOW?
        </div>

        {/* Level 2 — Thesis. Large, dominant, breathing room. */}
        <h2 className="font-display text-center"
          style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15,
            maxWidth: "70vw", marginBottom: "3vw",
            textShadow: "0 2px 10px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)" }}>
          The world grew closer.<br />
          <span style={{ color: "#CA922B",
            textShadow: "0 2px 8px rgba(202,146,43,0.22), 0 1px 3px rgba(0,0,0,0.4)" }}>
            Belonging didn&rsquo;t.
          </span>
        </h2>

        {/* Divider — separates thesis from evidence */}
        <div style={{ width: "4vw", height: "2px",
          background: "linear-gradient(90deg,transparent,#CA922B,transparent)",
          boxShadow: "0 1px 6px rgba(202,146,43,0.20)", marginBottom: "2.6vw" }} />

        {/* Level 3 — Evidence: contrast pairs with gold outline bullets */}
        <div className="flex flex-col" style={{ gap: "1.3vw", maxWidth: "72vw", width: "100%", marginBottom: "2.6vw" }}>
          {contrasts.map(([before, after], i) => (
            <div key={i} className="flex items-start" style={{ gap: "1.2vw" }}>
              {/* Gold outline bullet ◌ */}
              <div style={{
                width: "0.5vw", height: "0.5vw", borderRadius: "50%", flexShrink: 0,
                border: "1.5px solid rgba(202,146,43,0.65)", background: "transparent",
                marginTop: "0.6vw"
              }} />
              <p className="font-body" style={{ fontSize: "1.15vw", lineHeight: 1.65, margin: 0 }}>
                <span style={{ color: "#FAF6EF" }}>{before} </span>
                <span style={{ color: "#5A3A18" }}>— {after}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Separator before conclusion */}
        <div style={{ width: "40vw", height: "1px",
          background: "rgba(202,146,43,0.18)", marginBottom: "2vw" }} />

        {/* Gold conclusion — clearly separated, typographically elevated */}
        <p className="font-display text-center"
          style={{ fontSize: "1.7vw", color: "#CA922B", fontWeight: 600, lineHeight: 1.5,
            maxWidth: "60vw",
            textShadow: "0 2px 8px rgba(202,146,43,0.18), 0 1px 3px rgba(0,0,0,0.3)" }}>
          People don&rsquo;t need another app.<br />They need a trusted guide.
        </p>
      </div>
    </div>
  );
}
