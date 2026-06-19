export default function Slide15Traction() {
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
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Progress</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Traction &amp; Milestones</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "5vw", flex: 1 }}>
          <div style={{ flex: 1, borderRight: "1px solid rgba(212,175,55,0.25)", paddingRight: "5vw" }}>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "3vh" }}>Where We Are Today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Platform built and deployed to production</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Core features live: directory, map, safety surveys, profiles, and community</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Soft launch phase — invite-only community testing</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "#D4AF37", marginBottom: "3vh" }}>Roadmap</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ flexShrink: 0, width: "4vw" }}>
                  <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>P2</div>
                </div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>In-app payments and business subscription billing</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ flexShrink: 0, width: "4vw" }}>
                  <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>P3</div>
                </div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>iOS App Store submission and Android Play Store launch</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ flexShrink: 0, width: "4vw" }}>
                  <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", lineHeight: 1 }}>P4</div>
                </div>
                <div style={{ fontSize: "2.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>National expansion, brand partnerships, and media presence</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>15</div>
        </div>
      </div>
    </div>
  );
}
