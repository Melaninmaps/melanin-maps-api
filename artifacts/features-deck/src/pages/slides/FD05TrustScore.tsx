const rows = [
  { them: "Ads", us: "Community" },
  { them: "Clicks", us: "Safety" },
  { them: "Popularity", us: "Verification" },
  { them: "Algorithms", us: "Belonging" },
];

export default function FD05TrustScore() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(202,146,43,0.12) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "8%", bottom: "6%" }}>
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "2.8vw" }}>
          CORE BRAND MESSAGE
        </div>

        <h2 className="font-display text-center"
          style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15,
            marginBottom: "0.8vw", maxWidth: "72vw",
            textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)" }}>
          Most platforms know what you <span style={{ color: "#5A3A18" }}>clicked.</span>
        </h2>
        <h2 className="font-display text-center"
          style={{ fontSize: "3.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.15,
            marginBottom: "3.8vw", maxWidth: "72vw",
            textShadow: "0 2px 8px rgba(202,146,43,0.22), 0 1px 3px rgba(0,0,0,0.4)" }}>
          We know what your community experienced.
        </h2>

        {/* Gold divider with warm shadow — breathing room before evidence */}
        <div style={{ width: "4vw", height: "2px", background: "#CA922B",
          boxShadow: "0 1px 6px rgba(202,146,43,0.25)", marginBottom: "3.8vw" }} />

        {/* Table — warm shadow beneath, left column made clearly readable */}
        <div style={{
          width: "58vw", borderRadius: "0.8vw", overflow: "hidden",
          border: "1px solid rgba(202,146,43,0.22)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "1vw 2.4vw", background: "rgba(90,58,24,0.28)",
              borderBottom: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body"
                style={{ fontSize: "0.8vw", color: "#A07840", letterSpacing: "0.22em", fontWeight: 700 }}>
                OTHER PLATFORMS
              </div>
            </div>
            <div style={{ padding: "1vw 2.4vw", background: "rgba(202,146,43,0.12)",
              borderBottom: "1px solid rgba(202,146,43,0.15)", borderLeft: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body"
                style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700 }}>
                MAPPING WITH MELANIN™
              </div>
            </div>
            {rows.map((r, i) => (
              <>
                <div key={`l-${i}`} style={{ padding: "1vw 2.4vw", background: "transparent",
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none" }}>
                  {/* Left column — now clearly readable (was #3D2008, near-invisible) */}
                  <span className="font-body"
                    style={{ fontSize: "1.15vw", color: "#A07840", lineHeight: 1.5 }}>{r.them}</span>
                </div>
                <div key={`r-${i}`} style={{ padding: "1vw 2.4vw", background: "rgba(202,146,43,0.06)",
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none",
                  borderLeft: "1px solid rgba(202,146,43,0.12)" }}>
                  <span className="font-body"
                    style={{ fontSize: "1.15vw", color: "#E8B86D", fontWeight: 600, lineHeight: 1.5 }}>
                    {r.us}
                  </span>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
