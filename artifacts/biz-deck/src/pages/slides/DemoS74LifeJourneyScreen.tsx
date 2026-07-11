const stages = [
  { label: "Research", done: true },
  { label: "First Visit", done: true },
  { label: "Move-In", done: true },
  { label: "Settle In", active: true },
  { label: "Thriving", done: false },
];

const resources = [
  { stage: "Settle In", biz: "Copper & Oak Bistro", cat: "Restaurant", score: 97, note: "Zara's first local spot" },
  { stage: "Settle In", biz: "Shaw Community Market", cat: "Grocery", score: 95, note: "Neighborhood staple" },
  { stage: "Settle In", biz: "Nubian Heritage Spa", cat: "Wellness", score: 94, note: "Self-care after move" },
];

export default function DemoS74LifeJourneyScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>ZARA'S JOURNEY</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Moving to DC.<br /><span style={{ color: "#CA922B" }}>Not alone.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Zara created a "Moving to DC" Life Journey when she decided to relocate. The platform mapped her progress through 5 stages and connected her to community-vetted businesses at each step — movers, markets, restaurants, and wellness spots.
        </div>
        <div style={{ marginTop: "1.5vw", display: "flex", flexDirection: "column", gap: "0.6vw" }}>
          {[["Started June 2026","Journey creation date"],["Stage 4 of 5","Currently in Settle In"],["8 businesses connected","To stages across the journey"]].map(([a,b],i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
              <span style={{ color: "#CA922B", fontSize: "0.78vw", fontWeight: 800 }}>{a}</span>
              <span style={{ color: "#8C6A3A", fontSize: "0.68vw" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", left: "40vw", top: "50%", transform: "translateY(-50%)", width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <span style={{ color: "#1C0E06", fontSize: "0.58vw", fontWeight: 700 }}>My Journeys</span>
          <div style={{ background: "#CA922B", borderRadius: "0.35vw", padding: "0.15vw 0.45vw" }}>
            <span style={{ color: "#fff", fontSize: "0.42vw", fontWeight: 700 }}>+ New</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.55vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {/* Active journey card */}
          <div style={{ background: "linear-gradient(135deg,#1C0E06,#3A2210)", borderRadius: "0.8vw", padding: "0.7vw 0.8vw", boxShadow: "0 0.15vw 0.6vw rgba(28,14,6,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4vw" }}>
              <div>
                <div style={{ color: "#FAF6EF", fontSize: "0.62vw", fontWeight: 800 }}>Moving to DC</div>
                <div style={{ color: "#A87A40", fontSize: "0.42vw" }}>Started June 2026</div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.2vw", background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.1vw 0.35vw" }}>
                <div style={{ width: "0.35vw", height: "0.35vw", borderRadius: "50%", background: "#CA922B" }} />
                <span style={{ color: "#CA922B", fontSize: "0.4vw", fontWeight: 700 }}>ACTIVE</span>
              </div>
            </div>
            {/* Stage progress */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.2vw", marginBottom: "0.45vw" }}>
              {stages.map((s, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vw" }}>
                  <div style={{ width: "100%", height: "0.3vw", background: s.done ? "#CA922B" : s.active ? "linear-gradient(90deg,#CA922B,rgba(202,146,43,0.3))" : "rgba(202,146,43,0.15)", borderRadius: "0.5vw" }} />
                  <div style={{ color: s.active ? "#CA922B" : s.done ? "#8C6A3A" : "#4A3020", fontSize: "0.38vw", fontWeight: s.active ? 800 : 500, textAlign: "center" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>Currently: Settle In · Stage 4 of 5</div>
          </div>
          {/* Resources for current stage */}
          <div style={{ color: "#5C3A1A", fontSize: "0.5vw", fontWeight: 700 }}>Connected this stage</div>
          {resources.map((r, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.6vw", padding: "0.52vw 0.65vw", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 0.05vw 0.2vw rgba(28,14,6,0.06)" }}>
              <div>
                <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700 }}>{r.biz}</div>
                <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>{r.cat} · {r.note}</div>
              </div>
              <div style={{ background: "#1C0E06", borderRadius: "0.35vw", padding: "0.1vw 0.3vw" }}>
                <span style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 800 }}>{r.score}</span>
              </div>
            </div>
          ))}
          {/* KinfolkAI integration */}
          <div style={{ background: "#FFF3E0", border: "0.08vw solid #CA922B", borderRadius: "0.6vw", padding: "0.5vw 0.65vw" }}>
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.2vw" }}>✦ KinfolkAI knows your journey</div>
            <div style={{ color: "#5C3A1A", fontSize: "0.42vw", lineHeight: 1.55 }}>All KinfolkAI conversations reference your Move to DC journey — advice is stage-aware, not generic.</div>
          </div>
          {/* Add note */}
          <div style={{ background: "#F5EEE4", borderRadius: "0.55vw", padding: "0.45vw 0.65vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
            <span style={{ color: "#CA922B", fontSize: "0.55vw" }}>+</span>
            <span style={{ color: "#8C6A3A", fontSize: "0.46vw" }}>Add a business or milestone</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["5-stage journey arc", "Research → First Visit → Move-In → Settle In → Thriving — a complete relocation narrative."],
          ["8 businesses linked", "Each business Zara saved during her move can be tagged to the stage it helped her with."],
          ["KinfolkAI is journey-aware", "When Zara asks KinfolkAI anything, it knows she's in the Settle In stage — advice stays in context."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>74</div>
    </div>
  );
}
