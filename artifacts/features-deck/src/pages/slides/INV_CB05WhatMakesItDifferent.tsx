const nots = [
  "Not another directory.",
  "Not another review app.",
  "Not another social network.",
];

const instead = [
  { label: "Community-first", desc: "Every feature starts with the people, not the businesses" },
  { label: "Safety-first", desc: "Real neighborhood intelligence from people who live there" },
  { label: "Minority-owned discovery", desc: "Built specifically for the melanated diaspora" },
  { label: "Neighborhood intelligence", desc: "Know before you go — always" },
  { label: "Real relationships", desc: "Circles, community posts, life journeys" },
  { label: "AI that learns from community", desc: "KinfolkAI™ — not generic, deeply personal" },
];

export default function CB05WhatMakesItDifferent() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      {/* Header */}
      <div className="absolute left-[7vw]" style={{ top: "7vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.6vw" }}>WHAT MAKES IT DIFFERENT?</div>
        <h1 className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          This is its own category.
        </h1>
      </div>

      {/* Two columns */}
      <div className="absolute left-[7vw] right-[7vw] grid grid-cols-2" style={{ top: "22vw", gap: "4vw" }}>
        {/* Left: NOT */}
        <div>
          <div className="font-body" style={{ fontSize: "0.8vw", color: "rgba(202,146,43,0.6)", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.4vw" }}>NOT THIS</div>
          <div className="flex flex-col" style={{ gap: "1.1vw" }}>
            {nots.map((n) => (
              <div key={n} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", border: "1px solid rgba(202,146,43,0.25)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.7vw" height="0.7vw" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="rgba(202,146,43,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="font-body" style={{ fontSize: "1.2vw", color: "rgba(250,246,239,0.5)", fontWeight: 400 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: INSTEAD */}
        <div>
          <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.4vw" }}>INSTEAD</div>
          <div className="flex flex-col" style={{ gap: "0.9vw" }}>
            {instead.map((item) => (
              <div key={item.label} className="flex items-start" style={{ gap: "0.9vw" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.4)", flexShrink: 0, marginTop: "0.15vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", background: "#CA922B" }} />
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.1vw" }}>{item.label}</div>
                  <div className="font-body" style={{ fontSize: "0.85vw", color: "#8B6030", fontWeight: 400 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
