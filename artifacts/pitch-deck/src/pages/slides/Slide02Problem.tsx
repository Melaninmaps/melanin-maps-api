export default function Slide02Problem() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "3vw", right: "3vw", bottom: "3vh", border: "1px solid rgba(212,175,55,0.2)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>The Challenge</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1 }}>
              The Problem
            </h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "5vw", flex: 1, alignItems: "stretch" }}>
          <div style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(212,175,55,0.25)", paddingRight: "5vw" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Black consumer market</div>
            <div style={{ fontSize: "11vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.02em" }}>$1.4T</div>
            <div style={{ width: "8vw", height: "2px", background: "#D4AF37", margin: "2.5vh 0" }} />
            <p style={{ fontSize: "2.2vw", lineHeight: 1.5, color: "rgba(255,255,255,0.7)", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              Annual spending power with no dedicated discovery platform
            </p>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "4vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: "0.8vh" }}>Businesses are invisible</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>Standard discovery apps surface no cultural context or ownership data</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: "0.8vh" }}>Travelers lack safety context</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>No community-powered neighborhood intelligence for Black travelers</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: "0.8vh" }}>No cultural intelligence layer</div>
                <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>Navigation tools are built without the culture in mind</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>02</div>
        </div>
      </div>
    </div>
  );
}
