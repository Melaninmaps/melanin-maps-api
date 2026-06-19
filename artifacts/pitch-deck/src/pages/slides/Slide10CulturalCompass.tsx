export default function Slide10CulturalCompass() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "3vw", right: "3vw", bottom: "3vh", border: "1px solid rgba(212,175,55,0.15)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 10vw", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: "1.1vw", letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "3vh" }}>AI Feature</div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw", marginBottom: "3vh" }}>
          <div style={{ width: "8vw", height: "1px", background: "#D4AF37" }} />
          <div style={{ fontSize: "2.5vw" }}>&#9670;</div>
          <div style={{ width: "8vw", height: "1px", background: "#D4AF37" }} />
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "6vw", fontWeight: 700, margin: "0 0 1vh 0", color: "#FFFFFF", letterSpacing: "0.05em", lineHeight: 1, textTransform: "uppercase" }}>
          Cultural
        </h2>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "6vw", fontWeight: 700, margin: "0 0 4vh 0", color: "#D4AF37", letterSpacing: "0.05em", lineHeight: 1, textTransform: "uppercase" }}>
          Compass
        </h2>

        <div style={{ width: "10vw", height: "2px", background: "#D4AF37", margin: "0 auto 4vh" }} />

        <div style={{ display: "flex", justifyContent: "center", gap: "4vw" }}>
          <div style={{ textAlign: "left", maxWidth: "22vw" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh", lineHeight: 1.2 }}>Business &amp; Event Q&amp;A</div>
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Answers questions about any business, neighborhood, or event in context</div>
          </div>
          <div style={{ width: "1px", background: "rgba(212,175,55,0.3)" }} />
          <div style={{ textAlign: "left", maxWidth: "22vw" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh", lineHeight: 1.2 }}>Travel Recommendations</div>
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Culturally-informed itineraries built from community and business data</div>
          </div>
          <div style={{ width: "1px", background: "rgba(212,175,55,0.3)" }} />
          <div style={{ textAlign: "left", maxWidth: "22vw" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh", lineHeight: 1.2 }}>Always In Context</div>
            <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>'Ask me anything' — the assistant knows your location and preferences</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", left: "8vw", right: "8vw", display: "flex", justifyContent: "space-between", fontSize: "1vw", letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)" }}>
        <span style={{ textTransform: "uppercase" }}>Mapping With Melanin / Confidential</span>
        <span>10</span>
      </div>
    </div>
  );
}
