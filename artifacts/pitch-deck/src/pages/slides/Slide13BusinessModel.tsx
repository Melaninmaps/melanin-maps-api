export default function Slide13BusinessModel() {
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
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Revenue</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Business Model</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "stretch", gap: "0" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
            <div style={{ fontSize: "4vw", color: "#D4AF37", marginBottom: "2.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Stream 01</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3vw", margin: "0 0 2vh 0", letterSpacing: "0.1em", color: "#FFFFFF" }}>Membership</h3>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>Freemium consumer tiers from free discovery to premium access and exclusive business deals</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginBottom: "1vh" }} />
            <div style={{ width: "1px", height: "28vh", background: "linear-gradient(180deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))" }} />
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginTop: "1vh" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
            <div style={{ fontSize: "4vw", color: "#D4AF37", marginBottom: "2.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Stream 02</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3vw", margin: "0 0 2vh 0", letterSpacing: "0.1em", color: "#FFFFFF" }}>Business Listings</h3>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>Featured placement, analytics dashboards, and verified ownership badges for business owners</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginBottom: "1vh" }} />
            <div style={{ width: "1px", height: "28vh", background: "linear-gradient(180deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))" }} />
            <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginTop: "1vh" }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
            <div style={{ fontSize: "4vw", color: "#D4AF37", marginBottom: "2.5vh" }}>&#9670;</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Stream 03</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3vw", margin: "0 0 2vh 0", letterSpacing: "0.1em", color: "#FFFFFF" }}>Advertising</h3>
            <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>Culturally-targeted in-app placements reaching an engaged Black consumer audience</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>13</div>
        </div>
      </div>
    </div>
  );
}
