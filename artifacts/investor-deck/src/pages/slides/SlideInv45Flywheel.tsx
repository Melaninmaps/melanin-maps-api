export default function SlideInv45Flywheel() {
  const cx = 210, cy = 210, r = 140;
  const nodes = [
    { angle: -90, label: "Customer discovers you" },
    { angle: -30, label: "Visits your business" },
    { angle: 30,  label: "Leaves a recommendation" },
    { angle: 90,  label: "Friends discover you" },
    { angle: 150, label: "Trust score grows" },
    { angle: 210, label: "More searches surface your business" },
  ];
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 35% 50%, rgba(202,146,43,0.12), transparent 55%)" }} />

      <div className="absolute left-[6vw] right-[54vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.6vw" }}>THE GROWTH LOOP</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>
          Your business grows with<br />every interaction.
        </div>
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.6, marginTop: "0.8vw" }}>
          Every recommendation, review, save, and visit strengthens<br />your visibility and reputation over time.
        </div>
      </div>

      <div className="absolute" style={{ left: "3vw", top: "14vw", width: "46vw", height: "46vw" }}>
        <svg viewBox="0 0 420 420" width="100%" height="100%">
          <defs>
            <marker id="inv45-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M 0,1 L 5,3.5 L 0,6" fill="none" stroke="#CA922B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(202,146,43,0.18)" strokeWidth="1.5" />
          {nodes.map((node, i) => {
            const a1 = node.angle + 13;
            const a2 = nodes[(i + 1) % nodes.length].angle - 13 + (i === nodes.length - 1 ? 360 : 0);
            const s = pt(a1, r);
            const e = pt(a2 < a1 ? a2 + 360 : a2, r);
            const largeArc = Math.abs(a2 - a1) > 180 ? 1 : 0;
            return (
              <path key={i} d={`M ${s.x},${s.y} A ${r},${r} 0 ${largeArc},1 ${e.x},${e.y}`}
                fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"
                markerEnd="url(#inv45-arrow)" opacity="0.85" />
            );
          })}
          {nodes.map((node, i) => {
            const p = pt(node.angle, r);
            return <circle key={i} cx={p.x} cy={p.y} r={7} fill="#CA922B" />;
          })}
          {nodes.map((node, i) => {
            const labelR = r + 36;
            const lp = pt(node.angle, labelR);
            const anchor = node.angle > 90 && node.angle < 270 ? "end" : node.angle === -90 || node.angle === 90 ? "middle" : "start";
            const words = node.label.split(" ");
            const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
            const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
            return (
              <text key={i} x={lp.x} y={lp.y} textAnchor={anchor} fill="#D9C4A3" fontSize="10.5" fontFamily="sans-serif" fontWeight="500">
                <tspan x={lp.x} dy="-0.5em">{line1}</tspan>
                {line2 && <tspan x={lp.x} dy="1.3em">{line2}</tspan>}
              </text>
            );
          })}
          <circle cx={cx} cy={cy} r={48} fill="rgba(28,14,6,0.9)" stroke="rgba(202,146,43,0.5)" strokeWidth="1.5" />
          <text x={cx} y={cy - 7} textAnchor="middle" fill="#CA922B" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">YOUR</text>
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#CA922B" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">BUSINESS</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(202,146,43,0.5)" fontSize="8" fontFamily="sans-serif">at the center</text>
          <text x={cx} y={cy - 178} textAnchor="middle" fill="rgba(202,146,43,0.6)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">↺ REPEAT</text>
        </svg>
      </div>

      <div className="absolute right-[5vw] flex flex-col justify-center" style={{ left: "52vw", top: "14vw", bottom: "8vw" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2.2vw" }}>
          {[
            { label: "Community Recommendations", body: "Recommendations become discovery.", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
            { label: "Saves & Favorites", body: "Interest becomes future customers.", icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></> },
            { label: "Reviews", body: "Every review strengthens trust.", icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
            { label: "KinfolkAI™", body: "Learns what makes your business successful.", icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></> },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
              <div style={{ flexShrink: 0, marginTop: "0.1vw", width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              </div>
              <div>
                <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "0.25vw" }}>{item.label}</div>
                <div className="font-body" style={{ fontSize: "1.05vw", color: "#D9C4A3", lineHeight: 1.55 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          Your business becomes stronger every time someone interacts with it.
        </div>
      </div>
    </div>
  );
}
