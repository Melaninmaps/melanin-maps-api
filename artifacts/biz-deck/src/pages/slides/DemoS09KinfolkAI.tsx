const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS09KinfolkAI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.12), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>KINFOLKAI™</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Your AI that actually<br /><span style={{ color: "#CA922B" }}>knows the culture.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Generic AI gives generic answers. KinfolkAI is trained on actual community behavior — what gets saved, which neighborhoods score highest, which businesses earn trust, and what the melanated diaspora actually values. It's the difference between a search engine and a trusted guide.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Community data + lived culture = recommendations that actually fit", "Multi-turn chat learns your preferences over time", "Trip planning surfaces minority-owned options others miss entirely", "Personalization depth scales with your membership tier", "No sponsored answers — every result is merit-based"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Chat for discovery */}
        <Phone>
          <div style={{ padding: "0.7vw 0.8vw", display: "flex", alignItems: "center", gap: "0.4vw", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
            <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
            </div>
            <div>
              <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>KinfolkAI™</div>
              <div style={{ color: "#4CAF50", fontSize: "0.42vw" }}>Online</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "0.7vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.55vw", overflowY: "hidden" }}>
            {/* User message */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.8vw 0.8vw 0.1vw 0.8vw", padding: "0.45vw 0.6vw", maxWidth: "80%", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.52vw" }}>Natural hair salon near Capitol Hill with great community reviews?</span>
              </div>
            </div>
            {/* AI response */}
            <div style={{ display: "flex", gap: "0.35vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>K</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw 0.8vw 0.8vw 0.1vw", padding: "0.5vw 0.6vw", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.5 }}>Found 3 near you with Trust Scores above 90. All verified, all community-recommended:</span>
              </div>
            </div>
            {/* Recommendations */}
            {[
              { name: "The Crown Salon", score: 96, note: "Highly welcoming, specializes in locs" },
              { name: "Melanin & More", score: 94, note: "47 five-star reviews this month" },
              { name: "Zuri's Naturals", score: 91, note: "0.4 mi · Open now until 7 PM" },
            ].map((rec, i) => (
              <div key={i} style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.45vw 0.55vw", border: "1px solid rgba(202,146,43,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>{rec.name}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{rec.note}</div>
                </div>
                <div style={{ background: "#CA922B", borderRadius: "0.35vw", padding: "0.1vw 0.35vw", flexShrink: 0 }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 800 }}>{rec.score}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{ padding: "0.5vw 0.7vw", display: "flex", gap: "0.4vw", borderTop: "1px solid rgba(202,146,43,0.12)", flexShrink: 0 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "2vw", padding: "0.4vw 0.7vw", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "#5C3A1A", fontSize: "0.48vw" }}>Ask anything...</span>
            </div>
            <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Trip planning */}
        <Phone>
          <div style={{ padding: "0.7vw 0.8vw", display: "flex", alignItems: "center", gap: "0.4vw", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
            <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>KinfolkAI™ — Trip Planning</div>
          </div>
          <div style={{ flex: 1, padding: "0.7vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.8vw 0.8vw 0.1vw 0.8vw", padding: "0.45vw 0.6vw", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.52vw" }}>Plan a girls weekend in Atlanta. Black-owned everything.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.35vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>K</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw 0.8vw 0.8vw 0.1vw", padding: "0.5vw 0.6vw", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.5 }}>ATL weekend itinerary — all Black-owned, community verified:</span>
              </div>
            </div>
            {[
              { day: "Friday PM", item: "Check-in: The Gathering Spot (co-working + social)" },
              { day: "Sat AM", item: "Breakfast: The Breakfast Club · Trust 95" },
              { day: "Sat PM", item: "Hair: Throne ATL salon + shopping on Auburn" },
              { day: "Sat Eve", item: "Dinner: Slutty Vegan · Live at the Vinyl" },
              { day: "Sunday", item: "Brunch: Home2Suites rooftop + West End market" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "0.4vw", alignItems: "flex-start" }}>
                <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700, whiteSpace: "nowrap", minWidth: "4vw" }}>{item.day}</span>
                <span style={{ color: "#D9C4A3", fontSize: "0.48vw", lineHeight: 1.4 }}>{item.item}</span>
              </div>
            ))}
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.5vw", padding: "0.4vw", border: "1px solid rgba(202,146,43,0.25)", textAlign: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>Save Itinerary to Circles →</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
