export default function Slide08MapSafety() {
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
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Feature</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Map &amp; Safety</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "4vw", flex: 1, alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "2vh" }}>Layer One</div>
            <div style={{ fontSize: "3.5vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Business Pins</div>
            <div style={{ width: "5vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.55, marginBottom: "4vh" }}>
              Full-screen interactive map showing Black-owned businesses as pins with quick-view profile cards on tap
            </div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "2vh" }}>Layer Two</div>
            <div style={{ fontSize: "3.5vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Safety Overlay</div>
            <div style={{ width: "5vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
              Neighborhood safety scores rendered as a color gradient, powered entirely by community-submitted survey data
            </div>
          </div>

          <div style={{ width: "1px", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)", flexShrink: 0 }} />

          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "2vw" }}>
            <div style={{ padding: "4vh 3vw", border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.05)", marginBottom: "3vh" }}>
              <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Community Powered</div>
              <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>Users submit safety reports — the community protects itself</div>
            </div>
            <div style={{ padding: "4vh 3vw", border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.05)" }}>
              <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5vh" }}>Real-Time Data</div>
              <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>WMATA transit integration and live neighborhood survey aggregation</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>08</div>
        </div>
      </div>
    </div>
  );
}
