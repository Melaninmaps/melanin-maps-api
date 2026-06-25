export default function Slide11Events() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", bottom: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", right: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

      <div style={{ padding: "7vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Feature</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Events &amp; Community</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <p style={{ fontSize: "2.8vw", color: "rgba(212,175,55,0.8)", fontFamily: "'Playfair Display', serif", fontStyle: "italic", margin: "0 0 5vh 0", lineHeight: 1.4 }}>
          Beyond directories — a living community platform where the culture gathers
        </p>

        <div style={{ display: "flex", gap: "3vw", flex: 1 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3vh" }}>
            <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Events &amp; RSVP</div>
              <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "1.5vh" }} />
              <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Browse and RSVP to local events hosted by minority-owned venues and community groups</div>
            </div>
            <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Community Feed</div>
              <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "1.5vh" }} />
              <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>A social feed of posts, check-ins, and stories from community members</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3vh" }}>
            <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Groups &amp; Circles</div>
              <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "1.5vh" }} />
              <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Join interest-based groups organized around neighborhoods, categories, and culture</div>
            </div>
            <div style={{ flex: 1, padding: "3vh 2.5vw", border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "1.5vw", marginBottom: "1.5vh" }}>&#9670;</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>Points &amp; Rewards</div>
              <div style={{ width: "3vw", height: "2px", background: "#D4AF37", marginBottom: "1.5vh" }} />
              <div style={{ fontSize: "2.2vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Earn points for check-ins, safety reports, and reviews — redeemable for perks</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>11</div>
        </div>
      </div>
    </div>
  );
}
