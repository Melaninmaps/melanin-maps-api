export default function BizSlide10Ecosystem() {
  const cx = 300, cy = 260, r = 185;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const satellites = [
    { angle: -90, label: "Community\nMembers",   icon: "people" },
    { angle: -45, label: "Creators",              icon: "star" },
    { angle: 0,   label: "Events",                icon: "calendar" },
    { angle: 45,  label: "Neighborhoods",         icon: "map" },
    { angle: 90,  label: "Travelers",             icon: "compass" },
    { angle: 135, label: "Employers",             icon: "briefcase" },
    { angle: 180, label: "Local\nOrganizations",  icon: "home" },
    { angle: 225, label: "Other\nBusinesses",     icon: "grid" },
  ];

  const iconPaths: Record<string, React.ReactNode> = {
    people:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    star:     <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    map:      <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    compass:  <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
    briefcase:<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    home:     <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 55%, rgba(202,146,43,0.1), transparent 60%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] right-[6vw] top-[3vw] text-center">
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>THE ECOSYSTEM</div>
        <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          Businesses don't grow alone.
        </div>
      </div>

      {/* Ecosystem SVG */}
      <div className="absolute" style={{ left: "10vw", right: "10vw", top: "11vw", bottom: "5.5vw" }}>
        <svg viewBox="0 0 600 520" width="100%" height="100%">

          {/* Spoke lines */}
          {satellites.map((sat, i) => {
            const outer = pt(sat.angle, r);
            const inner = pt(sat.angle, 60);
            return (
              <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(202,146,43,0.22)" strokeWidth="1" strokeDasharray="3,4" />
            );
          })}

          {/* Orbital ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(202,146,43,0.15)" strokeWidth="1" />

          {/* Satellite nodes */}
          {satellites.map((sat, i) => {
            const p = pt(sat.angle, r);
            const labelLines = sat.label.split("\n");
            const anchor =
              sat.angle > -135 && sat.angle <= -45 ? "middle" :
              sat.angle > -45  && sat.angle < 45   ? "start"  :
              sat.angle >= 45  && sat.angle < 135  ? "middle" : "end";
            const lp = pt(sat.angle, r + 32);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={14} fill="rgba(28,14,6,0.9)" stroke="rgba(202,146,43,0.5)" strokeWidth="1.2" />
                <svg x={p.x - 7} y={p.y - 7} width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {iconPaths[sat.icon]}
                </svg>
                <text x={lp.x} y={lp.y} textAnchor={anchor} fill="#D9C4A3" fontSize="11" fontFamily="sans-serif" fontWeight="600">
                  {labelLines.map((line, li) => (
                    <tspan key={li} x={lp.x} dy={li === 0 ? "-0.3em" : "1.3em"}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={cx} cy={cy} r={58} fill="rgba(28,14,6,0.95)" stroke="rgba(202,146,43,0.6)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={50} fill="none" stroke="rgba(202,146,43,0.15)" strokeWidth="1" />
          <text x={cx} y={cy - 9} textAnchor="middle" fill="#CA922B" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5">YOUR</text>
          <text x={cx} y={cy + 4} textAnchor="middle" fill="#CA922B" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5">BUSINESS</text>
          <text x={cx} y={cy + 19} textAnchor="middle" fill="rgba(202,146,43,0.45)" fontSize="8.5" fontFamily="sans-serif">at the center</text>
        </svg>
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[1.8vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          You're joining an ecosystem — not another listing site.
        </div>
      </div>
    </div>
  );
}
