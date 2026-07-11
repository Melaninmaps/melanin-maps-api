const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const pins = [
  { t: 22, l: 30, name: "Copper & Oak", score: 97, color: "#CA922B" },
  { t: 38, l: 55, name: "Melanin & More", score: 94, color: "#CA922B" },
  { t: 55, l: 25, name: "The Root", score: 91, color: "#CA922B" },
  { t: 45, l: 70, name: "Bold Coffee", score: 88, color: "#A87A40" },
  { t: 65, l: 50, name: "Heritage Books", score: 85, color: "#A87A40" },
  { t: 30, l: 78, name: "Soulful Eats", score: 79, color: "#5C3A1A" },
];

export default function DemoS11MapView() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 40%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 10 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Map view<br />with safety.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          The map is not just for finding businesses. The neighborhood safety overlay — powered by community surveys — color-codes areas by reported safety level. Users see both opportunity and context on the same screen.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Gold pins = Trust Score 90+ | Amber = 75–89 | Muted = below 75",
            "Safety overlay sourced from community safety surveys — not crime statistics",
            "Tap any pin to pull the business card up from the bottom sheet",
            "Neighborhood safety score visible as a color wash — no numbers, no stigma",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>

          {/* Map area (full-screen style) */}
          <div style={{ flex: 1, position: "relative", background: "linear-gradient(145deg, #1a2518 0%, #243320 30%, #1e2a1b 60%, #162014 100%)", overflow: "hidden" }}>
            {/* Street grid */}
            {[15, 35, 55, 75].map(y => (
              <div key={y} style={{ position: "absolute", top: `${y}%`, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            ))}
            {[20, 45, 65, 85].map(x => (
              <div key={x} style={{ position: "absolute", left: `${x}%`, top: 0, bottom: 0, width: "1px", background: "rgba(255,255,255,0.06)" }} />
            ))}

            {/* Safety overlay patches */}
            <div style={{ position: "absolute", top: "10%", left: "10%", width: "40%", height: "35%", background: "rgba(76,175,80,0.12)", borderRadius: "0.5vw" }} />
            <div style={{ position: "absolute", top: "45%", left: "5%", width: "45%", height: "30%", background: "rgba(76,175,80,0.08)", borderRadius: "0.5vw" }} />
            <div style={{ position: "absolute", top: "15%", left: "55%", width: "40%", height: "40%", background: "rgba(255,193,7,0.07)", borderRadius: "0.5vw" }} />

            {/* Business pins */}
            {pins.map((p, i) => (
              <div key={i} style={{ position: "absolute", top: `${p.t}%`, left: `${p.l}%`, transform: "translate(-50%,-100%)" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: p.color, boxShadow: i === 0 ? `0 0 0.5vw ${p.color}` : "none", border: i === 0 ? `0.1vw solid rgba(255,255,255,0.3)` : "none" }}>
                  {i === 0 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(45deg)", width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#1C0E06" }} />}
                </div>
              </div>
            ))}

            {/* Active pin popup */}
            <div style={{ position: "absolute", top: "16%", left: "18%", background: "rgba(13,8,5,0.95)", borderRadius: "0.6vw", padding: "0.4vw 0.7vw", border: "1px solid rgba(202,146,43,0.5)", boxShadow: "0 0.3vw 1vw rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 800 }}>Copper & Oak Bistro</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8vw" }}>
                <span style={{ color: "#A87A40", fontSize: "0.42vw" }}>Restaurant · 0.4 mi</span>
                <span style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 800 }}>97</span>
              </div>
            </div>

            {/* Search bar overlay */}
            <div style={{ position: "absolute", top: "0.7vw", left: "0.7vw", right: "0.7vw", background: "rgba(13,8,5,0.9)", borderRadius: "0.7vw", padding: "0.5vw 0.8vw", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#5C3A1A" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ color: "#5C3A1A", fontSize: "0.5vw" }}>Search this area...</span>
            </div>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: "0.8vw", left: "0.8vw", background: "rgba(13,8,5,0.88)", borderRadius: "0.5vw", padding: "0.5vw 0.7vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700, marginBottom: "0.25vw" }}>SAFETY OVERLAY</div>
              <div style={{ display: "flex", gap: "0.5vw", alignItems: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "rgba(76,175,80,0.6)" }} />
                <span style={{ color: "#A87A40", fontSize: "0.38vw" }}>High confidence</span>
              </div>
              <div style={{ display: "flex", gap: "0.5vw", alignItems: "center", marginTop: "0.1vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "rgba(255,193,7,0.6)" }} />
                <span style={{ color: "#A87A40", fontSize: "0.38vw" }}>Moderate confidence</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ position: "absolute", right: "0.8vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "0.3vw" }}>
              {["+", "−"].map((c, i) => (
                <div key={i} style={{ width: "1.6vw", height: "1.6vw", background: "rgba(13,8,5,0.9)", borderRadius: "0.4vw", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.7vw", fontWeight: 700, lineHeight: 1 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 1 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
