const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const msgs = [
  { from: "ai", text: "Hey Zara — I'm KinfolkAI. I'm not a generic assistant. I know DC, I know our community, and I know what matters to you. Let's get started." },
  { from: "user", text: "I'm looking for a great brunch spot near Shaw — somewhere Black-owned with a vibe." },
  { from: "ai", text: "Perfect. Copper & Oak Bistro on U Street is your top match — 97 Trust Score, outdoor patio, known for their jerk eggs benedict. Saved for you. Want directions?" },
];

export default function DemoS06KinfolkIntro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 50%, rgba(202,146,43,0.12), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 5 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Meet<br />KinfolkAI™.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Not ChatGPT with a new coat of paint. KinfolkAI knows the culture, the lingo, and the community. It is trained on the context that generic AI ignores — and it gets sharper with every interaction.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Culture-aware recommendations — no explaining yourself",
            "Remembers your preferences across every session",
            "Multi-turn planning: trip itineraries, group dinners, event discovery",
            "Free tier gets 10 queries/month — Navigator and Trailblazer get unlimited",
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
          <div style={{ padding: "0.6vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>
          {/* Header */}
          <div style={{ padding: "0.5vw 0.9vw", borderBottom: "1px solid rgba(202,146,43,0.15)", display: "flex", alignItems: "center", gap: "0.7vw" }}>
            <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: "linear-gradient(135deg, #CA922B, #7B5408)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#1C0E06", fontSize: "0.7vw", fontWeight: 800 }}>K</span>
            </div>
            <div>
              <div style={{ color: "#FAF6EF", fontSize: "0.65vw", fontWeight: 800 }}>KinfolkAI™</div>
              <div style={{ color: "#CA922B", fontSize: "0.42vw" }}>Online · Culture-aware</div>
            </div>
          </div>
          {/* Chat */}
          <div style={{ flex: 1, padding: "0.8vw 0.9vw", display: "flex", flexDirection: "column", gap: "0.8vw", overflowY: "hidden" }}>
            {/* Onboarding card */}
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.8vw", padding: "0.7vw", border: "1px solid rgba(202,146,43,0.25)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.2vw" }}>STEP 3 OF 4 — MEET YOUR AI</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>Your personalization is ready</div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginTop: "0.15vw", lineHeight: 1.4 }}>Based on your interests, KinfolkAI has already found 14 recommendations near Shaw.</div>
            </div>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", background: m.from === "user" ? "#CA922B" : "rgba(255,255,255,0.06)", borderRadius: m.from === "user" ? "0.8vw 0.8vw 0.15vw 0.8vw" : "0.8vw 0.8vw 0.8vw 0.15vw", padding: "0.6vw 0.75vw" }}>
                  <span style={{ color: m.from === "user" ? "#1C0E06" : "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.5 }}>{m.text}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{ padding: "0.6vw 0.8vw 0.8vw", borderTop: "1px solid rgba(202,146,43,0.15)" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "2vw", padding: "0.55vw 0.9vw", border: "1px solid rgba(202,146,43,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#3A2010", fontSize: "0.52vw" }}>Ask anything about DC...</span>
              <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
          {/* Nav */}
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: "rgba(250,246,239,0.25)", fontWeight: 400 }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
