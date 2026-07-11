const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${13 * scale}vw`, height: `${24 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${0.9 * scale}vw ${0.6 * scale}vw`, boxShadow: `0 ${1.5 * scale}vw ${5 * scale}vw rgba(0,0,0,0.8)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3 * scale}vw`, height: `${0.4 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.3 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS02Onboarding() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "12%", bottom: "10%", width: "26vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>FIRST LAUNCH</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          In minutes, the app already knows what you care about.
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Most apps assume you're like everyone else. We don't. Personalization isn't a feature — it's the foundation. The community only works if it actually knows you.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["You shouldn't have to translate your identity to find belonging", "Interest matching cuts through noise from the very first session", "KinfolkAI™ uses your input to recommend proactively — not reactively"].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "1.5vw" }}>
        {/* Phone 1 — Welcome */}
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1vw 0.8vw", gap: "0.8vw" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "1vw", background: "rgba(202,146,43,0.15)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="1.8vw" height="1.8vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.9vw", fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>Good to meet you.</div>
            <div style={{ color: "#A87A40", fontSize: "0.6vw", textAlign: "center", lineHeight: 1.5 }}>Mapping With Melanin™ connects you with the community that already wants to support you.</div>
            <div style={{ width: "100%", background: "#CA922B", borderRadius: "0.6vw", padding: "0.55vw", textAlign: "center", marginTop: "0.5vw" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.65vw", fontWeight: 800 }}>Get Started</span>
            </div>
            <div style={{ color: "#5C3A1A", fontSize: "0.5vw" }}>Sign in with Apple · Google</div>
          </div>
        </Phone>

        {/* Phone 2 — Interests */}
        <Phone>
          <div style={{ padding: "1vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Step 2 of 3</div>
            <div style={{ color: "#FAF6EF", fontSize: "0.8vw", fontWeight: 800, lineHeight: 1.2 }}>What matters to you?</div>
            <div style={{ color: "#5C3A1A", fontSize: "0.5vw" }}>Choose all that apply</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vw", marginTop: "0.2vw" }}>
              {[
                { label: "Food & Dining", active: true },
                { label: "Beauty", active: true },
                { label: "Events", active: false },
                { label: "Wellness", active: true },
                { label: "Art & Culture", active: false },
                { label: "Nightlife", active: false },
                { label: "Travel", active: true },
                { label: "Shopping", active: false },
                { label: "Fitness", active: false },
                { label: "Mentorship", active: false },
              ].map((chip, i) => (
                <div key={i} style={{ padding: "0.3vw 0.55vw", borderRadius: "2vw", background: chip.active ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${chip.active ? "#CA922B" : "rgba(255,255,255,0.1)"}` }}>
                  <span style={{ color: chip.active ? "#CA922B" : "#5C3A1A", fontSize: "0.48vw", fontWeight: chip.active ? 700 : 400 }}>{chip.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Continue</span>
            </div>
          </div>
        </Phone>

        {/* Phone 3 — KinfolkAI intro */}
        <Phone>
          <div style={{ padding: "1vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Step 3 of 3</div>
            <div style={{ color: "#FAF6EF", fontSize: "0.8vw", fontWeight: 800, lineHeight: 1.2 }}>Meet KinfolkAI™</div>
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.7vw", padding: "0.6vw", border: "1px solid rgba(202,146,43,0.25)", marginTop: "0.3vw" }}>
              <div style={{ display: "flex", gap: "0.4vw", alignItems: "flex-start" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
                </div>
                <div style={{ color: "#D9C4A3", fontSize: "0.55vw", lineHeight: 1.5 }}>
                  Hey — I'm KinfolkAI. I'm here to help you discover, plan, and connect. Tell me: are you more of a food-first explorer or a vibe-first traveler?
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vw" }}>
              {["Food-first 🍽", "Vibe-first ✨", "Safety-first 🛡", "Both!"].map((opt, i) => (
                <div key={i} style={{ padding: "0.3vw 0.6vw", borderRadius: "2vw", background: i === 0 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.1)"}` }}>
                  <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.5vw" }}>{opt}</span>
                </div>
              ))}
            </div>
            <div style={{ color: "#5C3A1A", fontSize: "0.48vw", marginTop: "0.3vw", lineHeight: 1.4 }}>Your answers personalize every recommendation, route, and alert.</div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Enter the Community</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
