const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

export default function DemoS05Interests() {
  const interests = [
    { label: "Food & Dining", active: true },
    { label: "Beauty & Hair", active: true },
    { label: "Wellness", active: true },
    { label: "Events", active: false },
    { label: "Art & Culture", active: false },
    { label: "Travel", active: true },
    { label: "Shopping", active: false },
    { label: "Fitness", active: false },
    { label: "Nightlife", active: false },
    { label: "Mentorship", active: false },
    { label: "Family", active: true },
    { label: "Finance", active: false },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 40%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 4 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Choose what<br />you care about.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Most apps treat personalization as an afterthought. We treat it as the foundation. These interest chips become the engine behind every recommendation, filter, and KinfolkAI suggestion from this point forward.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Selections persist and evolve — update any time from settings",
            "Gold-highlighted chips become your permanent recommendation lens",
            "KinfolkAI™ reads these to calibrate tone, content, and urgency",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "2.2vw 1.2vw 1.2vw" }}>
            <div style={{ marginBottom: "1.5vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5vw" }}>STEP 2 OF 4 — YOUR INTERESTS</div>
              <div style={{ height: "0.25vw", background: "rgba(202,146,43,0.2)", borderRadius: "0.2vw" }}>
                <div style={{ width: "50%", height: "100%", background: "#CA922B", borderRadius: "0.2vw" }} />
              </div>
            </div>

            <div style={{ color: "#FAF6EF", fontSize: "1vw", fontWeight: 800, marginBottom: "0.3vw" }}>What matters to you?</div>
            <div style={{ color: "#5C3A1A", fontSize: "0.52vw", marginBottom: "1.5vw" }}>Select all that apply — at least 3</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5vw", marginBottom: "1.5vw" }}>
              {interests.map((chip, i) => (
                <div key={i} style={{ padding: "0.38vw 0.7vw", borderRadius: "2vw", background: chip.active ? "rgba(202,146,43,0.22)" : "rgba(255,255,255,0.04)", border: `1px solid ${chip.active ? "#CA922B" : "rgba(255,255,255,0.1)"}` }}>
                  <span style={{ color: chip.active ? "#CA922B" : "#5C3A1A", fontSize: "0.52vw", fontWeight: chip.active ? 700 : 400 }}>{chip.label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.8vw", padding: "0.7vw", border: "1px solid rgba(202,146,43,0.2)", marginBottom: "1.2vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.25vw" }}>5 INTERESTS SELECTED</div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.4 }}>Great start. KinfolkAI will personalize your feed, map, and recommendations based on these.</div>
            </div>

            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.8vw", padding: "0.75vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.7vw", fontWeight: 800 }}>Continue</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
