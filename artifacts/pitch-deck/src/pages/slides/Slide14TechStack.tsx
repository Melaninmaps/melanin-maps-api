export default function Slide14TechStack() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Infrastructure</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Tech Stack</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "5vw", flex: 1, alignItems: "stretch" }}>
          <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(212,175,55,0.25)", paddingRight: "5vw" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "3vw", color: "rgba(212,175,55,0.85)", lineHeight: 1.5, margin: "0 0 3vh 0", fontStyle: "italic" }}>
              "Built for scale from day one — mobile-first, API-driven, and production-deployed"
            </p>
            <div style={{ width: "6vw", height: "2px", background: "#D4AF37" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.5vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.4vh" }}>Mobile</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.7)" }}>Expo / React Native — iOS and Android from one codebase</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.5vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.4vh" }}>API</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.7)" }}>Node.js + Express 5, PostgreSQL + Drizzle ORM</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.5vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.4vh" }}>Auth</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.7)" }}>OpenID Connect with secure token storage via SecureStore</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.5vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.4vh" }}>AI</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.7)" }}>OpenAI-powered Cultural Compass assistant</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.5vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.4vh" }}>Infrastructure</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.7)" }}>Replit Autoscale deployment — production live today</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>14</div>
        </div>
      </div>
    </div>
  );
}
