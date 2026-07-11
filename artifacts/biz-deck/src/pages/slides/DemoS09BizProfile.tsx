const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

export default function DemoS09BizProfile() {
  const compliments = ["Great Food", "Welcoming Vibe", "Community Space", "Clean", "Quick Service"];
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 8 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Business<br />profile.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Every business profile is built around trust, not advertising. The Trust Score is calculated from 14 signals — not just reviews. Compliment chips give qualitative texture. The verified badge means they went through our process.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Trust Score (0–100) blends reviews, recency, verification, and community signals",
            "Compliment chips — community-curated qualitative tags, not editable by owners",
            "Hero image auto-pulled from business verification submission",
            "Call, save, share, and directions in one tap each",
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
          {/* Hero image */}
          <div style={{ height: "9vw", background: "linear-gradient(135deg, #2A1A0E, #3D2A12, #1C0E06)", position: "relative", flexShrink: 0 }}>
            {/* Pattern overlay */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(circle at 20% 30%, #CA922B 1px, transparent 1px), radial-gradient(circle at 80% 70%, #CA922B 1px, transparent 1px)", backgroundSize: "1.5vw 1.5vw" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, #0D0805)" }} />
            {/* Back arrow */}
            <div style={{ position: "absolute", top: "1vw", left: "0.8vw", width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </div>
            {/* Save */}
            <div style={{ position: "absolute", top: "1vw", right: "0.8vw", width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" strokeWidth="2.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            {/* Score badge */}
            <div style={{ position: "absolute", bottom: "0.8vw", right: "0.8vw", background: "#CA922B", borderRadius: "0.5vw", padding: "0.3vw 0.6vw" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.85vw", fontWeight: 800 }}>97</span>
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: 1, padding: "0.7vw 0.9vw", display: "flex", flexDirection: "column", gap: "0.6vw", overflowY: "hidden" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.88vw", fontWeight: 800 }}>Copper & Oak Bistro</span>
                <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
              </div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw", marginTop: "0.1vw" }}>Restaurant · Soul Food / American · $$ · 0.4 mi</div>
              <div style={{ color: "#5C3A1A", fontSize: "0.47vw", marginTop: "0.1vw" }}>1209 U St NW, Washington, DC · Open until 10 PM</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5vw" }}>
              {["Call", "Directions", "Share"].map((a, i) => (
                <div key={i} style={{ flex: 1, background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.1)", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center", border: i === 0 ? "none" : "1px solid rgba(202,146,43,0.3)" }}>
                  <span style={{ color: i === 0 ? "#1C0E06" : "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>{a}</span>
                </div>
              ))}
            </div>

            {/* About */}
            <div>
              <div style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700, marginBottom: "0.3vw" }}>ABOUT</div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.55 }}>A Black-owned restaurant celebrating Southern heritage and innovation. Community gathering space with weekly live music and brunch specials.</div>
            </div>

            {/* Compliment chips */}
            <div>
              <div style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700, marginBottom: "0.35vw" }}>COMMUNITY SAYS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35vw" }}>
                {compliments.map((c, i) => (
                  <div key={i} style={{ padding: "0.28vw 0.6vw", borderRadius: "2vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 600 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.6vw", padding: "0.55vw", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.3vw" }}>HOURS</div>
              {[["Mon–Fri", "11am – 10pm"], ["Sat–Sun", "9am – 11pm (Brunch)"]].map(([d, h], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C3A1A", fontSize: "0.47vw" }}>{d}</span>
                  <span style={{ color: "#A87A40", fontSize: "0.47vw" }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 0 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
