const contrasts = [
  { instead: "AI Search", say: "Before You Even Arrive", desc: "Leave uncertainty at home before you ever pack a bag" },
  { instead: "Safety Overlay", say: "The Confidence Layer", desc: "We don\u2019t replace your judgment. We strengthen it." },
  { instead: "Interactive Map", say: "See a City Through Your Community", desc: "Map the feeling, not just the route" },
  { instead: "Historical Sites", say: "Walk Through Living History", desc: "Stories, movements, and moments that continue to inspire" },
  { instead: "Community Feed", say: "Find Your People", desc: "Community isn\u2019t something you stumble into. It\u2019s something you build." },
  { instead: "Our AI Assistant", say: "Meet Kinfolk", desc: "Most AI tells you what exists. Kinfolk helps you understand what belongs." },
];

export default function CB05WhatMakesItDifferent() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        05
      </div>

      {/* Header */}
      <div className="absolute left-[7vw]" style={{ top: "5.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>
          WHAT MAKES IT DIFFERENT
        </div>
        <h1 className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          We changed the language.<br />
          <span style={{ color: "#CA922B" }}>Because we changed the category.</span>
        </h1>
      </div>

      {/* Column headers */}
      <div
        className="absolute left-[7vw] right-[7vw]"
        style={{ top: "18vw", display: "grid", gridTemplateColumns: "1fr 0.08fr 1fr", gap: "0 1vw", marginBottom: "0.8vw" }}
      >
        <div className="font-body" style={{ fontSize: "0.8vw", color: "rgba(202,146,43,0.55)", letterSpacing: "0.22em", fontWeight: 700 }}>
          INSTEAD OF
        </div>
        <div />
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700 }}>
          SAY
        </div>
      </div>

      {/* Contrast rows */}
      <div
        className="absolute left-[7vw] right-[7vw]"
        style={{ top: "20.5vw", display: "flex", flexDirection: "column", gap: "0.85vw" }}
      >
        {contrasts.map((c, i) => (
          <div
            key={i}
            style={{ display: "grid", gridTemplateColumns: "1fr 0.08fr 1fr", gap: "0 1vw", alignItems: "center" }}
          >
            {/* Left — old language */}
            <div
              style={{ padding: "0.7vw 1.2vw", background: "rgba(250,246,239,0.03)", border: "1px solid rgba(202,146,43,0.15)", display: "flex", alignItems: "center", gap: "0.8vw" }}
            >
              <svg width="0.8vw" height="0.8vw" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="rgba(202,146,43,0.35)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-body" style={{ fontSize: "1.1vw", color: "rgba(250,246,239,0.45)", fontWeight: 400 }}>{c.instead}</span>
            </div>
            {/* Arrow */}
            <div className="flex justify-center">
              <svg width="1vw" height="1vw" viewBox="0 0 16 12" fill="none">
                <path d="M0 6h12M8 2l6 4-6 4" stroke="#CA922B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* Right — new language */}
            <div
              style={{ padding: "0.7vw 1.2vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.3)" }}
            >
              <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.2vw" }}>{c.say}</div>
              <div className="font-body" style={{ fontSize: "0.8vw", color: "#8B6030", lineHeight: 1.4 }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
