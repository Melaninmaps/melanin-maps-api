export default function BizSlide03WhyMWM() {
  const CONTRASTS = [
    {
      them: "They rank you by how much you spend.",
      us: "We rank you by how much your community trusts you.",
    },
    {
      them: "They put your ad in front of strangers.",
      us: "We put your name in front of people already looking.",
    },
    {
      them: "Their algorithm decides who sees you.",
      us: "Your community decides who recommends you.",
    },
    {
      them: "Your visibility stops when your budget does.",
      us: "Your reputation grows even when you're not spending.",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 100%, rgba(202,146,43,0.1), transparent 55%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] right-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.7vw" }}>WHY THIS IS DIFFERENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0 }}>
            Not another directory.
          </div>
          <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.0 }}>
            A community.
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "13.5vw", display: "grid", gridTemplateColumns: "1fr 2.4vw 1fr" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#5C3A1A", fontWeight: 700, letterSpacing: "0.16em" }}>WHAT YOU'VE ALREADY TRIED</div>
        <div />
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.16em" }}>WHAT'S DIFFERENT HERE</div>
      </div>

      {/* Horizontal rule */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "15.2vw", height: "1px", background: "rgba(202,146,43,0.15)" }} />

      {/* Contrast rows */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16.2vw", display: "flex", flexDirection: "column", gap: "0" }}>
        {CONTRASTS.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2.4vw 1fr",
              alignItems: "center",
              padding: "1.5vw 0",
              borderBottom: i < CONTRASTS.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none",
            }}
          >
            {/* Left — muted */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
              <div style={{ width: "0.3vw", height: "0.3vw", borderRadius: "50%", background: "#3D2417", flexShrink: 0, marginTop: "0.7vw" }} />
              <span className="font-body" style={{ fontSize: "1.15vw", color: "#4A2810", lineHeight: 1.5, fontStyle: "italic" }}>{row.them}</span>
            </div>

            {/* Divider arrow */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="rgba(202,146,43,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            {/* Right — bright */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
              <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.3vw" }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.45 }}>{row.us}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Closing statement */}
      <div className="absolute left-[6vw] right-[6vw]" style={{ bottom: "3.5vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.15)", marginBottom: "1.8vw" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
          <div style={{ flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>The difference</div>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1 }}>isn't a feature.</div>
          </div>
          <div style={{ width: "1px", height: "2.5vw", background: "rgba(202,146,43,0.25)", flexShrink: 0 }} />
          <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", lineHeight: 1.65 }}>
            Yelp, Google, and Facebook were built to sell attention. We were built to build trust. Those aren't the same thing — and your customers already know the difference.
          </div>
        </div>
      </div>
    </div>
  );
}
