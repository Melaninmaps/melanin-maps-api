export default function Slide12Membership() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "7vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Access</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Membership Tiers</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "2vw", flex: 1, alignItems: "stretch" }}>
          <div style={{ flex: 1, padding: "3vh 2vw", border: "1px solid rgba(212,175,55,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "1.5vh" }}>Tier 01</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Free</div>
            <div style={{ width: "3vw", height: "2px", background: "rgba(212,175,55,0.4)", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.1vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>Browse and discover minority-owned businesses</div>
          </div>

          <div style={{ flex: 1, padding: "3vh 2vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.03)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "1.5vh" }}>Tier 02</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Community</div>
            <div style={{ width: "3vw", height: "2px", background: "rgba(212,175,55,0.5)", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.1vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Save favorites, write reviews, and attend community events</div>
          </div>

          <div style={{ flex: 1, padding: "3vh 2vw", border: "2px solid #D4AF37", background: "rgba(212,175,55,0.07)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "1.5vh" }}>Tier 03</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#D4AF37", marginBottom: "1vh" }}>Premium</div>
            <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.1vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>Early access, exclusive deals from minority-owned businesses, and priority features</div>
          </div>

          <div style={{ flex: 1, padding: "3vh 2vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.03)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "1.5vh" }}>Tier 04–07</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Business</div>
            <div style={{ width: "3vw", height: "2px", background: "rgba(212,175,55,0.5)", marginBottom: "2vh" }} />
            <div style={{ fontSize: "2.1vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>Listings, analytics dashboards, verification badges, and featured placement</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>12</div>
        </div>
      </div>
    </div>
  );
}
