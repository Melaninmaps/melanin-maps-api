export default function CB02WhatIsIt() {
  const steps = ["People", "Community", "Businesses", "Belonging"];
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
        <p className="font-body" style={{ fontSize: "1.25vw", color: "#C4935A", lineHeight: 1.7, fontWeight: 300 }}>
          Mapping with Melanin&trade; helps people discover trusted businesses, safer neighborhoods, meaningful connections, and local community&mdash;before they arrive, or wherever they already call home.
        </p>
      </div>

      {/* Right: vertical flow */}
      <div className="absolute flex items-center justify-center" style={{ right: "7vw", top: "10%", bottom: "10%", width: "34vw" }}>
        <div className="flex flex-col items-center" style={{ gap: 0 }}>
          {steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div style={{
                padding: "0.9vw 2.8vw",
                borderRadius: "0.6vw",
                border: i === steps.length - 1 ? "1.5px solid #CA922B" : "1px solid rgba(202,146,43,0.35)",
                background: i === steps.length - 1 ? "rgba(202,146,43,0.12)" : "rgba(250,246,239,0.04)",
                textAlign: "center",
              }}>
                <div className="font-display" style={{ fontSize: "2.1vw", fontWeight: i === steps.length - 1 ? 800 : 700, color: i === steps.length - 1 ? "#CA922B" : "#FAF6EF" }}>
                  {step}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center" style={{ padding: "0.5vw 0" }}>
                  <div style={{ width: "1px", height: "1vw", background: "rgba(202,146,43,0.45)" }} />
                  <svg width="1.2vw" height="1.2vw" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M3 9l5 5 5-5" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ width: "1px", height: "0.5vw", background: "rgba(202,146,43,0.45)" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
