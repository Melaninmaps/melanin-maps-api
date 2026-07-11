export default function SlideInv48Reputation() {
  const steps = ["Verified", "Recommended", "Chosen", "Remembered", "Shared"];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(202,146,43,0.07), transparent 60%)" }} />

      {/* Section label */}
      <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.6vw", position: "relative", zIndex: 10 }}>
        YOUR COMPETITIVE ADVANTAGE
      </div>

      {/* Headline */}
      <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, textAlign: "center", marginBottom: "3.2vw", position: "relative", zIndex: 10 }}>
        Reputation becomes your<br />
        <span style={{ color: "#CA922B" }}>competitive advantage.</span>
      </div>

      {/* Vertical chain */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", position: "relative", zIndex: 10 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="font-display" style={{
              fontSize: "1.9vw",
              fontWeight: 800,
              color: i === steps.length - 1 ? "#CA922B" : "#1C0E06",
              letterSpacing: "0.04em",
              opacity: 0.35 + (i * 0.165),
            }}>
              {step}
            </div>
            {i < steps.length - 1 && (
              <div style={{ margin: "0.5vw 0" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer — standout line, bolded */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "1.2vw" }} />
        <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 800, color: "#1C0E06", textAlign: "center" }}>
          Every business on every other platform rents attention.{" "}
          <span style={{ color: "#CA922B" }}>Here, you build it.</span>
        </div>
      </div>
    </div>
  );
}
