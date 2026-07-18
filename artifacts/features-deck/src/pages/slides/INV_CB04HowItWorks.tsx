const steps = [
  { word: "Discover", sub: "Find trusted businesses and safe neighborhoods" },
  { word: "Connect", sub: "Meet community members and join circles" },
  { word: "Support", sub: "Engage with minority-owned businesses" },
  { word: "Recommend", sub: "Share your experiences with others" },
  { word: "Strengthen", sub: "The whole community becomes stronger" },
];

export default function CB04HowItWorks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>04</div>

      <div className="absolute left-0 right-0 text-center" style={{ top: "7vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.8vw" }}>HOW DOES IT WORK?</div>
        <h1 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          One beautiful cycle.
        </h1>
      </div>

      {/* Horizontal flywheel */}
      <div className="absolute left-0 right-0 flex items-center justify-center" style={{ top: "32%", bottom: "12%", gap: 0, paddingLeft: "4vw", paddingRight: "4vw" }}>
        {steps.map((step, i) => (
          <div key={step.word} className="flex items-center" style={{ flex: 1 }}>
            <div className="flex flex-col items-center text-center" style={{ flex: 1, padding: "0 0.5vw" }}>
              <div style={{
                width: "6.5vw", height: "6.5vw", borderRadius: "50%",
                border: i === 4 ? "2px solid #CA922B" : "1px solid rgba(202,146,43,0.4)",
                background: i === 4 ? "rgba(202,146,43,0.15)" : "rgba(202,146,43,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.1vw", flexShrink: 0,
              }}>
                <div className="font-display" style={{ fontSize: "1.0vw", fontWeight: 800, color: "#CA922B", letterSpacing: "0.05em" }}>{String(i + 1).padStart(2, "0")}</div>
              </div>
              <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 800, color: i === 4 ? "#CA922B" : "#FAF6EF", marginBottom: "0.6vw" }}>{step.word}</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#8B6030", lineHeight: 1.45, fontWeight: 400 }}>{step.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-shrink-0 flex items-center" style={{ paddingBottom: "3.5vw" }}>
                <svg width="2vw" height="1.2vw" viewBox="0 0 32 16" fill="none">
                  <path d="M0 8h28M22 2l8 6-8 6" stroke="rgba(202,146,43,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loop back label */}
      <div className="absolute left-0 right-0 text-center" style={{ bottom: "4.5vw" }}>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "rgba(202,146,43,0.55)", letterSpacing: "0.18em", fontWeight: 600 }}>
          COMMUNITY GROWTH FLYWHEEL
        </div>
      </div>
    </div>
  );
}
