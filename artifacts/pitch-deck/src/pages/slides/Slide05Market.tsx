export default function Slide05Market() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", bottom: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", right: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

      <div style={{ padding: "7vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>The Landscape</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Market Opportunity</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "0" }}>
          <div style={{ flex: 1, textAlign: "center", paddingRight: "4vw', borderRight: '1px solid rgba(212,175,55,0.25)" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Annual Spending Power</div>
            <div style={{ fontSize: "10vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>$1.4T</div>
            <div style={{ width: "6vw", height: "2px", background: "#D4AF37", margin: "2.5vh auto" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Black consumer market in the United States</div>
          </div>

          <div style={{ width: "1px", height: "45vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)", flexShrink: 0 }} />

          <div style={{ flex: 1, textAlign: "center", padding: "0 4vw" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Businesses Nationwide</div>
            <div style={{ fontSize: "10vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>3.1M+</div>
            <div style={{ width: "6vw", height: "2px", background: "#D4AF37", margin: "2.5vh auto" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Black-owned businesses in America</div>
          </div>

          <div style={{ width: "1px", height: "45vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)", flexShrink: 0 }} />

          <div style={{ flex: 1, textAlign: "center", paddingLeft: "4vw" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Direct Competition</div>
            <div style={{ fontSize: "10vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>0</div>
            <div style={{ width: "6vw", height: "2px", background: "#D4AF37", margin: "2.5vh auto" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Competitors at the intersection of culture, map, and safety</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>05</div>
        </div>
      </div>
    </div>
  );
}
