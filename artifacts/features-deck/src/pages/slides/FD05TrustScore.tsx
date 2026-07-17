const rows = [
  { them: "Sponsored listings", us: "Community Trust Score" },
  { them: "Reviews only", us: "Reviews + Safety + Verification" },
  { them: "Popularity", us: "Belonging" },
  { them: "Clicks", us: "Confidence" },
  { them: "Who paid more", us: "Who earned it" },
];

export default function FD05TrustScore() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(202,146,43,0.1) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>05</div>

      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "9%", bottom: "6%" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "1.8vw" }}>TRUST SCORE</div>
        <h2 className="font-display text-center" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Most platforms optimize for <span style={{ color: "#5A3A18" }}>advertisers.</span>
        </h2>
        <h2 className="font-display text-center" style={{ fontSize: "4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.1, marginBottom: "3vw" }}>
          We optimize for community trust.
        </h2>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "3vw" }} />

        {/* Table */}
        <div style={{ width: "68vw", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(202,146,43,0.2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "1.1vw 2.2vw", background: "rgba(90,58,24,0.25)", borderBottom: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body" style={{ fontSize: "0.9vw", color: "#5A3A18", letterSpacing: "0.2em", fontWeight: 700 }}>OTHER PLATFORMS</div>
            </div>
            <div style={{ padding: "1.1vw 2.2vw", background: "rgba(202,146,43,0.1)", borderBottom: "1px solid rgba(202,146,43,0.15)", borderLeft: "1px solid rgba(202,146,43,0.15)" }}>
              <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700 }}>MAPPING WITH MELANIN</div>
            </div>
            {rows.map((r, i) => (
              <>
                <div key={`l-${i}`} style={{ padding: "1.1vw 2.2vw", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none" }}>
                  <span className="font-body" style={{ fontSize: "1.05vw", color: "#3D2008", lineHeight: 1.5 }}>{r.them}</span>
                </div>
                <div key={`r-${i}`} style={{ padding: "1.1vw 2.2vw", background: i % 2 === 0 ? "rgba(202,146,43,0.03)" : "rgba(202,146,43,0.06)", borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none", borderLeft: "1px solid rgba(202,146,43,0.12)" }}>
                  <span className="font-body" style={{ fontSize: "1.05vw", color: "#E8B86D", fontWeight: 500, lineHeight: 1.5 }}>{r.us}</span>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
