const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const businesses = [
  { name: "Copper & Oak Bistro", cat: "Restaurant · $$", dist: "0.4 mi", score: 97, verified: true },
  { name: "Melanin & More Salon", cat: "Beauty · $$", dist: "0.8 mi", score: 94, verified: true },
  { name: "The Root Collective", cat: "Wellness · $$$", dist: "1.2 mi", score: 91, verified: false },
  { name: "Black & Bold Coffee", cat: "Cafe · $", dist: "0.2 mi", score: 88, verified: true },
];

export default function DemoS07HomeActive() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 30%, rgba(202,146,43,0.11), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 6 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          The home<br />screen.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          This is what an active, signed-in user sees. Not a demo — a real, personalized feed for Zara in Washington, DC. Trust Scores surface instantly. Verified businesses rise to the top. Every card is actionable.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Trending card is geo-aware — refreshes hourly based on real search volume",
            "Trust Score badge on every card — no hidden information",
            "Verification shield appears only on businesses that passed our review",
            "4-tab nav keeps the experience simple and focused",
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
          {/* Status */}
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ display: "flex", gap: "0.25vw", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.1vw", alignItems: "flex-end" }}>
                {[1,2,3,4].map(h => <div key={h} style={{ width: "0.18vw", height: `${h*0.13}vw`, background: "#E8D5B7", borderRadius: "0.03vw" }} />)}
              </div>
              <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
                <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
              </div>
            </div>
          </div>
          {/* Content */}
          <div style={{ flex: 1, overflowY: "hidden", padding: "0.5vw 0.9vw 0", display: "flex", flexDirection: "column", gap: "0.65vw" }}>
            {/* Greeting */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Good afternoon,</div>
                <div style={{ color: "#FAF6EF", fontSize: "1.1vw", fontWeight: 800 }}>Zara</div>
              </div>
              <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: "linear-gradient(135deg,#CA922B,#7B5408)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#1C0E06", fontSize: "0.75vw", fontWeight: 800 }}>Z</span>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw", padding: "0.55vw 0.8vw", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#5C3A1A" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ color: "#3A2010", fontSize: "0.52vw" }}>Search businesses, events, neighborhoods...</span>
            </div>

            {/* Trending card */}
            <div style={{ background: "linear-gradient(135deg, rgba(202,146,43,0.2), rgba(202,146,43,0.08))", borderRadius: "0.8vw", padding: "0.7vw", border: "1px solid rgba(202,146,43,0.4)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700, letterSpacing: "0.1em" }}>TRENDING NEAR YOU · SHAW / U STREET</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800, marginTop: "0.2vw" }}>Minority-owned brunch spots</div>
              <div style={{ color: "#A87A40", fontSize: "0.45vw", marginTop: "0.1vw" }}>14 spots · Updated 1 hour ago</div>
            </div>

            {/* Category chips */}
            <div style={{ display: "flex", gap: "0.4vw" }}>
              {["All", "Food", "Beauty", "Wellness", "Events"].map((c, i) => (
                <div key={i} style={{ padding: "0.25vw 0.55vw", borderRadius: "2vw", background: i === 0 ? "#CA922B" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.1)"}`, flexShrink: 0 }}>
                  <span style={{ color: i === 0 ? "#1C0E06" : "#5C3A1A", fontSize: "0.45vw", fontWeight: i === 0 ? 800 : 400 }}>{c}</span>
                </div>
              ))}
            </div>

            {/* Business cards */}
            {businesses.map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.75vw", padding: "0.6vw", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35vw" }}>
                    <span style={{ color: "#FAF6EF", fontSize: "0.62vw", fontWeight: 700 }}>{b.name}</span>
                    {b.verified && (
                      <div style={{ width: "0.75vw", height: "0.75vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ color: "#A87A40", fontSize: "0.47vw", marginTop: "0.08vw" }}>{b.cat} · {b.dist}</div>
                </div>
                <div style={{ background: "#CA922B", borderRadius: "0.4vw", padding: "0.18vw 0.5vw", flexShrink: 0 }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.6vw", fontWeight: 800 }}>{b.score}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Nav */}
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.5vw 0.3vw 0.65vw", display: "flex", justifyContent: "space-around" }}>
            {[
              { label: "Home", active: true },
              { label: "Map", active: false },
              { label: "Community", active: false },
              { label: "Profile", active: false },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.12vw" }}>
                <div style={{ width: "1vw", height: "1vw", borderRadius: "0.2vw", background: t.active ? "rgba(202,146,43,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: t.active ? "#CA922B" : "rgba(250,246,239,0.15)" }} />
                </div>
                <span style={{ fontSize: "0.4vw", color: t.active ? "#CA922B" : "rgba(250,246,239,0.2)", fontWeight: t.active ? 700 : 400 }}>{t.label}</span>
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
