export default function Slide06HowItWorks() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "8vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw", marginBottom: "7vh" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "1vw", height: "1vw", background: "#D4AF37", transform: "rotate(45deg)" }} />
            <div style={{ width: "12vw", height: "1px", background: "#D4AF37" }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5vw", fontWeight: 700, margin: 0, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            How It Works
          </h2>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "12vw", height: "1px", background: "#D4AF37" }} />
            <div style={{ width: "1vw", height: "1vw", background: "#D4AF37", transform: "rotate(45deg)" }} />
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: "3vw", alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: "8vw", fontWeight: 700, color: "rgba(212,175,55,0.15)", lineHeight: 1, marginBottom: "2vh", letterSpacing: "-0.02em" }}>01</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "2vh" }}>Discover</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.75)", lineHeight: 1.55, maxWidth: "28vw" }}>
              Search Black-owned businesses by category, ownership type, and price
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center', justifyContent: 'center" }}>
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginBottom: "1vh" }} />
            <div style={{ width: "1px", height: "30vh", background: "linear-gradient(180deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))" }} />
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginTop: "1vh" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: "8vw", fontWeight: 700, color: "rgba(212,175,55,0.15)", lineHeight: 1, marginBottom: "2vh", letterSpacing: "-0.02em" }}>02</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "2vh" }}>Explore</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.75)", lineHeight: 1.55, maxWidth: "28vw" }}>
              View businesses on an interactive map with neighborhood safety overlay
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginBottom: "1vh" }} />
            <div style={{ width: "1px", height: "30vh", background: "linear-gradient(180deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))" }} />
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginTop: "1vh" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: "8vw", fontWeight: 700, color: "rgba(212,175,55,0.15)", lineHeight: 1, marginBottom: "2vh", letterSpacing: "-0.02em" }}>03</div>
            <div style={{ fontSize: "3vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "2vh" }}>Connect</div>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.75)", lineHeight: 1.55, maxWidth: "28vw" }}>
              Save favorites, attend events, and join the community feed
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>06</div>
        </div>
      </div>
    </div>
  );
}
