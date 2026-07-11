export default function DemoS01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 55% 50%, rgba(202,146,43,0.18) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      {/* Left text */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "15%", bottom: "15%", width: "44vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "3vw" }}>MAPPING WITH MELANIN™</div>
        <div className="font-display" style={{ fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "2vw" }}>
          The complete<br /><span style={{ color: "#CA922B" }}>app experience.</span>
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.15vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "4vw", maxWidth: "36vw" }}>
          A screen-by-screen walkthrough of every feature — from first launch to active membership. Two complete journeys: community member and business owner.
        </div>
        <div style={{ display: "flex", gap: "2.5vw" }}>
          {[
            { label: "Slides 1–41", sub: "Community Member" },
            { label: "Slides 42–58", sub: "Business Owner" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.3vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.7vw", fontWeight: 800, letterSpacing: "0.1em" }}>{item.label}</div>
              <div style={{ color: "#5C3A1A", fontSize: "0.82vw" }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: three stacked phone outlines — decorative */}
      <div style={{ position: "absolute", right: "4vw", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "2vw" }}>
        {[
          { scale: 0.72, rotate: -9, opacity: 0.25 },
          { scale: 1, rotate: 0, opacity: 1 },
          { scale: 0.72, rotate: 9, opacity: 0.25 },
        ].map((p, i) => (
          <div key={i} style={{ width: `${25 * p.scale}vw`, height: `${46.8 * p.scale}vw`, background: `linear-gradient(160deg, rgba(44,44,44,${p.opacity}), rgba(26,26,26,${p.opacity}))`, borderRadius: `${3.8 * p.scale}vw`, border: `1px solid rgba(255,255,255,${p.opacity * 0.08})`, boxShadow: `0 ${4 * p.scale}vw ${12 * p.scale}vw rgba(0,0,0,${0.95 * p.opacity})`, transform: `rotate(${p.rotate}deg)`, flexShrink: 0, position: "relative", overflow: "hidden" }}>
            {/* Notch */}
            <div style={{ position: "absolute", top: `${1.5 * p.scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${5 * p.scale}vw`, height: `${0.65 * p.scale}vw`, background: "#111", borderRadius: "0.6vw", zIndex: 10 }} />
            {/* Screen fill */}
            <div style={{ position: "absolute", top: `${1.5 * p.scale}vw`, left: `${0.95 * p.scale}vw`, right: `${0.95 * p.scale}vw`, bottom: `${0.95 * p.scale}vw`, background: i === 1 ? "rgba(250,246,239,0.06)" : "rgba(202,146,43,0.03)", borderRadius: `${3 * p.scale}vw` }} />
            {i === 1 && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ width: "4vw", height: "4vw", borderRadius: "1.2vw", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.8vw" }}>
                  <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="rgba(202,146,43,0.5)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div style={{ color: "rgba(202,146,43,0.4)", fontSize: "0.55vw", fontWeight: 700, letterSpacing: "0.12em" }}>MWM</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
