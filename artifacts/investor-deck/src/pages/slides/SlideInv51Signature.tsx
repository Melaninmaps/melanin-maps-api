export default function SlideInv51Signature() {
  const cx = 450, cy = 310, r = 210;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const satellites = [
    { angle: -90,  label: "Community\nRecommendations" },
    { angle: -50,  label: "Reviews" },
    { angle: -10,  label: "Events" },
    { angle: 30,   label: "Saved by\nCustomers" },
    { angle: 70,   label: "Followers" },
    { angle: 110,  label: "KinfolkAI™\nInsights" },
    { angle: 150,  label: "Business\nCollaborations" },
    { angle: 190,  label: "Creator\nFeatures" },
    { angle: 230,  label: "Local\nPartnerships" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 58%, rgba(202,146,43,0.18), transparent 55%)" }} />

      <div className="absolute left-[6vw] right-[6vw] top-[2.8vw] text-center" style={{ zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "0.5vw" }}>WHY BUSINESSES STAY</div>
        <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          The more your community grows,<br />
          <span style={{ color: "#CA922B" }}>the more your business grows.</span>
        </div>
      </div>

      <div className="absolute inset-0">
        <svg viewBox="0 0 900 620" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke="rgba(202,146,43,0.07)" strokeWidth="18" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(202,146,43,0.2)" strokeWidth="1.2" />
          {satellites.map((sat, i) => {
            const outer = pt(sat.angle, r - 16);
            const inner = pt(sat.angle, 68);
            return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="rgba(202,146,43,0.2)" strokeWidth="1" strokeDasharray="3,5" />;
          })}
          {satellites.map((sat, i) => {
            const p = pt(sat.angle, r);
            const labelR = r + 35;
            const lp = pt(sat.angle, labelR);
            const a = sat.angle;
            const anchor =
              (a > -110 && a < -70) || (a > 70 && a < 110) ? "middle" :
              a >= -70 && a <= 70 ? "start" : "end";
            const lines = sat.label.split("\n");
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={11} fill="rgba(28,14,6,0.95)" stroke="#CA922B" strokeWidth="1.5" />
                <circle cx={p.x} cy={p.y} r={4} fill="#CA922B" />
                <text x={lp.x} y={lp.y} textAnchor={anchor} fill="#D9C4A3" fontSize="10" fontFamily="sans-serif" fontWeight="600">
                  {lines.map((line, li) => <tspan key={li} x={lp.x} dy={li === 0 ? "-0.4em" : "1.3em"}>{line}</tspan>)}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={72} fill="rgba(202,146,43,0.08)" stroke="rgba(202,146,43,0.4)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={58} fill="#1C0E06" stroke="rgba(202,146,43,0.6)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={46} fill="none" stroke="rgba(202,146,43,0.12)" strokeWidth="1" />
          <path d={`M ${cx} ${cy - 22} c-9,0 -14,7 -14,14 c0,10 14,26 14,26 s14,-16 14,-26 c0,-7 -5,-14 -14,-14 z`} fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={cx} cy={cy - 8} r="5" fill="none" stroke="#CA922B" strokeWidth="1.6" />
          <text x={cx} y={cy + 20} textAnchor="middle" fill="#CA922B" fontSize="10" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.2">YOUR</text>
          <text x={cx} y={cy + 33} textAnchor="middle" fill="#CA922B" fontSize="10" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.2">BUSINESS</text>
          {satellites.map((sat, i) => {
            const midR = r * 0.55;
            const mp = pt(sat.angle, midR);
            const tangentAngle = sat.angle + 180;
            const tx = Math.cos(toRad(tangentAngle)), ty = Math.sin(toRad(tangentAngle));
            const px2 = -ty, py2 = tx;
            const size = 5;
            return (
              <path key={i}
                d={`M ${mp.x + tx * size * 1.2 + px2 * size * 0.6},${mp.y + ty * size * 1.2 + py2 * size * 0.6} L ${mp.x - tx * size * 0.8},${mp.y - ty * size * 0.8} L ${mp.x + tx * size * 1.2 - px2 * size * 0.6},${mp.y + ty * size * 1.2 - py2 * size * 0.6}`}
                fill="none" stroke="rgba(202,146,43,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              />
            );
          })}
        </svg>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]" style={{ zIndex: 10 }}>
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic", textAlign: "center" }}>
          You're not just buying a listing. You're becoming part of a living, growing community.
        </div>
      </div>
    </div>
  );
}
