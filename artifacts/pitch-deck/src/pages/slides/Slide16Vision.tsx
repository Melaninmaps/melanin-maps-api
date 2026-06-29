export default function Slide16Vision() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "3vw", right: "3vw", bottom: "3vh", border: "1px solid rgba(212,175,55,0.15)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 10vw", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: "6vh" }}>
          <div style={{ fontSize: "1.1vw", letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "2vh" }}>The Future</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw", marginBottom: "3vh" }}>
            <div style={{ width: "8vw", height: "1px", background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
            <div style={{ fontSize: "2.5vw" }}>&#9670;</div>
            <div style={{ width: "8vw", height: "1px", background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "6.5vw", fontWeight: 700, margin: "0 0 1vh 0", color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1 }}>Our Vision</h2>
        </div>

        <div style={{ display: "flex", gap: "5vw", alignItems: "stretch" }}>
          <div style={{ flex: 1, padding: "4vh 3vw", border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)", marginBottom: "1.5vh" }}>Near Term</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Every City</div>
            <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
              Mapping With Melanin operational in the top 20 US cities with the most significant Black populations and business ecosystems
            </div>
          </div>

          <div style={{ flex: 1, padding: "4vh 3vw", border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)", marginBottom: "1.5vh" }}>Mid Term</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Every Business</div>
            <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
              1 million verified minority-owned businesses on the platform — the most comprehensive minority business database ever created
            </div>
          </div>

          <div style={{ flex: 1, padding: "4vh 3vw", border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5vw", marginBottom: "2vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)", marginBottom: "1.5vh" }}>Long Term</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", lineHeight: 1.1 }}>Every Journey</div>
            <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
              The default travel companion for the global Black diaspora — wherever you go, Mapping With Melanin knows where you belong
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", left: "8vw", right: "8vw", display: "flex", justifyContent: "space-between", fontSize: "1vw", letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)" }}>
        <span style={{ textTransform: "uppercase" }}>Mapping With Melanin / Confidential</span>
        <span>16</span>
      </div>
    </div>
  );
}
