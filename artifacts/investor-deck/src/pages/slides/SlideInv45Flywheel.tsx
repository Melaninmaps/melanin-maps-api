export default function SlideInv45Flywheel() {
  const cx = 220, cy = 328, r = 148;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const steps = [
    { angle: -90, label: ["Customer", "finds you"] },
    { angle: -30, label: ["Visits your", "business"] },
    { angle:  30, label: ["Leaves", "a review"] },
    { angle:  90, label: ["Shares with", "others"] },
    { angle: 150, label: ["Trust score", "grows"] },
    { angle: 210, label: ["More people", "discover you"] },
  ];

  const outcomes = [
    {
      title: "Community Recommendations",
      body: "More recommendations = more discovery.",
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    },
    {
      title: "Saves & Favorites",
      body: "People who save you often become future customers.",
      icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></>,
    },
    {
      title: "Reviews",
      body: "Trust compounds with every positive experience.",
      icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    },
    {
      title: "KinfolkAI™",
      body: "Learns what works and helps you attract more of the right customers.",
      icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></>,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 32% 58%, rgba(202,146,43,0.13), transparent 52%)" }} />

      {/* Section label + headline — top left, above the circle */}
      <div className="absolute" style={{ left: "4.5vw", top: "3.2vw", right: "53vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "0.55vw" }}>THE GROWTH ENGINE</div>
        <div className="font-display" style={{ fontSize: "2.55vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.12 }}>
          Every customer helps you<br />
          <span style={{ color: "#CA922B" }}>find the next one.</span>
        </div>
      </div>

      {/* Circle SVG — left half, circle center pushed below headline */}
      <div className="absolute" style={{ left: "0", top: "0", bottom: "0", width: "53vw" }}>
        <svg viewBox="-60 60 560 490" width="100%" height="100%" overflow="visible">
          <defs>
            <marker id="inv45-arr" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
              <path d="M 0,1 L 4.5,3 L 0,5" fill="none" stroke="#CA922B" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {/* Background ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(202,146,43,0.14)" strokeWidth="1.5" />

          {/* Arc arrows between nodes */}
          {steps.map((step, i) => {
            const a1 = step.angle + 14;
            const a2 = steps[(i + 1) % steps.length].angle - 14 + (i === steps.length - 1 ? 360 : 0);
            const s = pt(a1, r);
            const e2 = pt(a2 < a1 ? a2 + 360 : a2, r);
            const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
            return (
              <path key={i}
                d={`M ${s.x},${s.y} A ${r},${r} 0 ${large},1 ${e2.x},${e2.y}`}
                fill="none" stroke="#CA922B" strokeWidth="2.2"
                strokeLinecap="round" markerEnd="url(#inv45-arr)" opacity="0.82"
              />
            );
          })}

          {/* Node markers */}
          {steps.map((step, i) => {
            const p = pt(step.angle, r);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={9} fill="#3D2417" stroke="#CA922B" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r={4} fill="#CA922B" />
              </g>
            );
          })}

          {/* Step labels */}
          {steps.map((step, i) => {
            const lp = pt(step.angle, r + 42);
            const a = step.angle;
            const anchor =
              (a > -110 && a < -70) || (a > 70 && a < 110) ? "middle" :
              (a >= -70 && a <= 70) ? "start" : "end";
            return (
              <text key={i} textAnchor={anchor} fill="#FAF6EF" fontSize="13.5"
                fontFamily="sans-serif" fontWeight="600">
                {step.label.map((line, li) => (
                  <tspan key={li} x={lp.x} y={lp.y + (li - (step.label.length - 1) / 2) * 17}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}

          {/* Center circle */}
          <circle cx={cx} cy={cy} r={62} fill="rgba(28,14,6,0.92)" stroke="rgba(202,146,43,0.55)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={54} fill="none" stroke="rgba(202,146,43,0.12)" strokeWidth="1" />
          <text x={cx} y={cy - 14} textAnchor="middle" fill="#CA922B" fontSize="12"
            fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5">YOUR</text>
          <text x={cx} y={cy} textAnchor="middle" fill="#CA922B" fontSize="12"
            fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5">BUSINESS</text>
          <text x={cx} y={cy + 13} textAnchor="middle" fill="rgba(202,146,43,0.5)"
            fontSize="8.5" fontFamily="sans-serif">Every interaction</text>
          <text x={cx} y={cy + 24} textAnchor="middle" fill="rgba(202,146,43,0.5)"
            fontSize="8.5" fontFamily="sans-serif">starts here.</text>
        </svg>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "53vw", top: "10%", bottom: "9%", width: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Right — 4 outcome callouts, vertically centered */}
      <div className="absolute" style={{ left: "55vw", right: "4.5vw", top: "0", bottom: "0", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.8vw" }}>
        {outcomes.map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.35vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <div style={{ flexShrink: 0, width: "2vw", height: "2vw", borderRadius: "50%", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.95vw" height="0.95vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              </div>
              <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.04em" }}>{item.title}</div>
            </div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#D9C4A3", lineHeight: 1.55, paddingLeft: "2.7vw" }}>{item.body}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute left-[4.5vw] right-[4.5vw] bottom-[2.2vw]">
        <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          The businesses that earn trust become the businesses everyone finds.
        </div>
      </div>
    </div>
  );
}
