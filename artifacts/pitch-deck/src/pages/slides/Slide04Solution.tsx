export default function Slide04Solution() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw", marginBottom: "6vh" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "1vw", height: "1vw", background: "#D4AF37", transform: "rotate(45deg)" }} />
            <div style={{ width: "12vw", height: "1px", background: "#D4AF37" }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5vw", fontWeight: 700, margin: 0, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            The Solution
          </h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "12vw", height: "1px", background: "#D4AF37" }} />
            <div style={{ width: "1vw", height: "1vw", background: "#D4AF37", transform: "rotate(45deg)" }} />
          </div>
        </div>

        <p style={{ fontSize: "2.8vw", color: "rgba(255,255,255,0.75)", textAlign: "center", margin: "0 0 5vh 0", lineHeight: 1.4 }}>
          A mobile-first platform built where culture, commerce, and community converge
        </p>

        <div style={{ display: "flex", flex: 1, gap: "3vw", alignItems: "stretch" }}>
          <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "2vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Business Directory</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Verified minority-owned businesses with confidence scoring and ownership badges</div>
          </div>
          <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "2vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Safety Intelligence</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Community-powered neighborhood safety reports and real-time overlay maps</div>
          </div>
          <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "2vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Cultural Compass AI</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>AI assistant built for culturally-informed travel and discovery recommendations</div>
          </div>
          <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "2vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Social Platform</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Events, community feed, groups, and check-in rewards for the culture</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>04</div>
        </div>
      </div>
    </div>
  );
}
