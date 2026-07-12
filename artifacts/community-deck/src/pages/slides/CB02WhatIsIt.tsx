const connectionLabels = ["Businesses", "Events", "Safety", "Friends", "Neighborhoods", "Employers", "Local Knowledge"];

export default function CB02WhatIsIt() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(202,146,43,0.12) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>02</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "42vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>WHAT IS IT?</div>
        <h1 className="font-display" style={{ fontSize: "4.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.4vw" }}>
          One platform.<br />Every part of<br />belonging.
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.2vw" }} />
        <p className="font-body" style={{ fontSize: "1.2vw", color: "#C4935A", lineHeight: 1.75, fontWeight: 300 }}>
          Mapping with Melanin&trade; brings together the people, businesses, local knowledge, and trusted recommendations that help someone feel connected&mdash;whether they&rsquo;re exploring a new city or deepening roots where they already live.
        </p>
      </div>

      {/* Right: cascade People → Connection → Community → Belonging */}
      <div className="absolute flex items-center justify-center" style={{ right: "6vw", top: "8%", bottom: "8%", width: "36vw" }}>
        <div className="flex flex-col items-center w-full" style={{ gap: 0 }}>

          {/* People */}
          <div style={{ padding: "0.85vw 0", width: "100%", textAlign: "center", borderRadius: "0.5vw", border: "1px solid rgba(202,146,43,0.28)", background: "rgba(250,246,239,0.04)" }}>
            <span className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#FAF6EF" }}>People</span>
          </div>

          {/* Arrow */}
          <Arrow />

          {/* Connection — expanded with micro-labels */}
          <div style={{ width: "100%", borderRadius: "0.6vw", border: "1px solid rgba(202,146,43,0.45)", background: "rgba(202,146,43,0.06)", padding: "0.9vw 1.4vw" }}>
            <div style={{ textAlign: "center", marginBottom: "0.7vw" }}>
              <span className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#FAF6EF" }}>Connection</span>
            </div>
            <div className="flex flex-wrap justify-center" style={{ gap: "0.35vw 0.55vw" }}>
              {connectionLabels.map((label) => (
                <span key={label} className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", letterSpacing: "0.06em", fontWeight: 500, padding: "0.18vw 0.55vw", borderRadius: "0.3vw", border: "1px solid rgba(202,146,43,0.3)", background: "rgba(202,146,43,0.06)" }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <Arrow />

          {/* Community */}
          <div style={{ padding: "0.85vw 0", width: "100%", textAlign: "center", borderRadius: "0.5vw", border: "1px solid rgba(202,146,43,0.28)", background: "rgba(250,246,239,0.04)" }}>
            <span className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#FAF6EF" }}>Community</span>
          </div>

          {/* Arrow */}
          <Arrow />

          {/* Belonging — gold highlight */}
          <div style={{ padding: "0.9vw 0", width: "100%", textAlign: "center", borderRadius: "0.6vw", border: "1.5px solid #CA922B", background: "rgba(202,146,43,0.11)" }}>
            <span className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B" }}>Belonging</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col items-center" style={{ padding: "0.45vw 0" }}>
      <div style={{ width: "1px", height: "0.9vw", background: "rgba(202,146,43,0.4)" }} />
      <svg width="1.1vw" height="1.1vw" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v10M3 8l4 4 4-4" stroke="#CA922B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ width: "1px", height: "0.5vw", background: "rgba(202,146,43,0.4)" }} />
    </div>
  );
}
