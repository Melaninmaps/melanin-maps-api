const cascade = [
  { num: "01", who: "One person joins.", outcome: "" },
  { num: "02", who: "One business grows.", outcome: "" },
  { num: "03", who: "One recommendation is shared.", outcome: "" },
  { num: "04", who: "One newcomer feels welcome.", outcome: "" },
  { num: "05", who: "The entire community becomes stronger.", outcome: "", highlight: true },
];

export default function CB09WhatHappensWhenMoreJoin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 10%, rgba(202,146,43,0.12) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>09</div>

      {/* Left label */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "28vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.6vw" }}>THE NETWORK EFFECT</div>
        <h1 className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2vw" }}>
          What happens<br />when more people<br />join?
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <p className="font-body" style={{ fontSize: "1.1vw", color: "#8B6030", lineHeight: 1.65 }}>
          This is your flywheel explained for everyday people. Every member multiplies the value for everyone else.
        </p>
      </div>

      {/* Right: cascade */}
      <div className="absolute flex flex-col justify-center" style={{ right: "7vw", top: "8%", bottom: "8%", width: "46vw", gap: 0 }}>
        {cascade.map((step, i) => (
          <div key={step.num} className="flex flex-col">
            <div className="flex items-center" style={{ gap: "1.4vw", padding: "0.9vw 1.4vw", borderRadius: "0.6vw", background: step.highlight ? "rgba(202,146,43,0.12)" : "transparent", border: step.highlight ? "1px solid rgba(202,146,43,0.4)" : "transparent" }}>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "rgba(202,146,43,0.5)", width: "2.5vw", flexShrink: 0 }}>{step.num}</div>
              <div className="font-display" style={{ fontSize: step.highlight ? "1.7vw" : "1.55vw", fontWeight: 700, color: step.highlight ? "#CA922B" : "#FAF6EF", lineHeight: 1.3 }}>
                {step.who}
              </div>
            </div>
            {i < cascade.length - 1 && (
              <div className="flex items-center" style={{ paddingLeft: "3.9vw", paddingTop: "0.2vw", paddingBottom: "0.2vw" }}>
                <svg width="1vw" height="1.4vw" viewBox="0 0 12 20" fill="none">
                  <path d="M6 0v16M1 11l5 7 5-7" stroke="rgba(202,146,43,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
