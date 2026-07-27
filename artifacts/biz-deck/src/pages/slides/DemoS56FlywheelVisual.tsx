export default function DemoS56FlywheelVisual() {
  const nodes = [
    { label: "Member\nJoins", x: 50, y: 10, color: "#CA922B" },
    { label: "Discovers\n& Explores", x: 84, y: 32, color: "#A6720F" },
    { label: "Reviews &\nSaves", x: 84, y: 68, color: "#CA922B" },
    { label: "Trust Score\nRises", x: 50, y: 90, color: "#A6720F" },
    { label: "Business\nGrows", x: 16, y: 68, color: "#CA922B" },
    { label: "Community\nDeepens", x: 16, y: 32, color: "#A6720F" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>56</div>

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", right: "5vw", top: "6%", bottom: "6%" }}>
        <div className="font-body text-center mb-[2.5vw]" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700 }}>THE COMMUNITY FLYWHEEL · EVERY FEATURE FEEDS THE LOOP</div>

        <div className="flex items-center gap-[4vw]">
          {/* Flywheel SVG */}
          <div style={{ position: "relative", width: "38vw", height: "38vw", flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {/* Outer circle */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(202,146,43,0.12)" strokeWidth="0.5" />
              {/* Inner circle */}
              <circle cx="50" cy="50" r="24" fill="rgba(202,146,43,0.08)" stroke="rgba(202,146,43,0.3)" strokeWidth="0.4" />
              {/* Arrows on the ring */}
              {[0,60,120,180,240,300].map((deg, i) => {
                const r = 44;
                const a = (deg - 90) * Math.PI / 180;
                const x = 50 + r * Math.cos(a);
                const y = 50 + r * Math.sin(a);
                const a2 = (deg - 90 + 30) * Math.PI / 180;
                const x2 = 50 + r * Math.cos(a2);
                const y2 = 50 + r * Math.sin(a2);
                return (
                  <path key={i} d={`M ${x} ${y} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none" stroke="rgba(202,146,43,0.3)" strokeWidth="0.4" />
                );
              })}
              {/* Connector lines from center to nodes */}
              {nodes.map((n, i) => (
                <line key={i} x1="50" y1="50"
                  x2={n.x} y2={n.y}
                  stroke="rgba(202,146,43,0.15)" strokeWidth="0.25" strokeDasharray="1 1.5" />
              ))}
            </svg>
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.1 }}>MWM</div>
              <div className="font-body" style={{ fontSize: "0.65vw", color: "#7B5408", fontWeight: 600 }}>PLATFORM</div>
            </div>
            {/* Node labels */}
            {nodes.map((n, i) => (
              <div key={i} className="absolute flex flex-col items-center" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)" }}>
                <div className="rounded-full flex items-center justify-center" style={{ width: "5vw", height: "5vw", background: `rgba(202,146,43,0.12)`, border: `1px solid ${n.color}50`, marginBottom: "0.3vw" }}>
                  <div className="text-center font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: n.color, lineHeight: 1.2, whiteSpace: "pre-line" }}>{n.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature list on right */}
          <div className="flex flex-col gap-[1.1vw]" style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
              Every feature feeds the loop.
            </div>
            <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "0.5vw" }}>
              No feature in Mapping With Melanin is decorative. Each one is a point on the flywheel — bringing members in, keeping them engaged, building Trust Scores that make businesses worth finding, and making the community worth belonging to.
            </div>
            {[
              { label: "Safety Hub", role: "Members come for safety. They stay for community." },
              { label: "Trust Score", role: "Community action becomes business signal." },
              { label: "KinfolkAI", role: "AI surfaces the right businesses at the right moment." },
              { label: "Kinfolk Circles", role: "Crews plan together. Businesses benefit." },
              { label: "Reviews + Chips", role: "Structured community voice builds platform intelligence." },
              { label: "Events + Library", role: "Deeper engagement extends time-in-community." },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-[1vw]">
                <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
                <span className="font-body" style={{ fontSize: "0.88vw", color: "#FAF6EF", fontWeight: 700 }}>{item.label}</span>
                <span style={{ color: "rgba(202,146,43,0.4)", fontSize: "0.7vw" }}>—</span>
                <span className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408" }}>{item.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
