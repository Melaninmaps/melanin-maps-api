export default function Slide07Discover() {
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
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Discover</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        <div style={{ display: "flex", gap: "5vw", flex: 1, alignItems: "stretch" }}>
          <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(212,175,55,0.25)", paddingRight: "5vw" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.2vw", fontWeight: 400, color: "rgba(212,175,55,0.9)", lineHeight: 1.5, margin: "0 0 3vh 0", fontStyle: "italic" }}>
              "The most comprehensive Black-owned business search ever built"
            </p>
            <div style={{ width: "6vw", height: "2px", background: "#D4AF37", marginBottom: "3vh" }} />
            <div style={{ fontSize: "2.4vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              Search and filter across hundreds of Black-owned businesses with community-verified data
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3.5vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.5vh" }}>Category Filters</div>
                <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.65)" }}>Food, Beauty, Retail, Health, Services and more</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.5vh" }}>Confidence Scoring</div>
                <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.65)" }}>Community-verified business legitimacy ratings</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.5vh" }}>Ownership Badges</div>
                <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.65)" }}>Minority, Women, Veteran, LGBTQ+, Indigenous, Immigrant</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.5vw", marginTop: "0.3vh", flexShrink: 0 }}>&#9670;</div>
              <div>
                <div style={{ fontSize: "2.8vw", fontWeight: 700, color: "#D4AF37", marginBottom: "0.5vh" }}>Price &amp; Proximity</div>
                <div style={{ fontSize: "2.3vw", color: "rgba(255,255,255,0.65)" }}>Filter by budget range and distance from your location</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>07</div>
        </div>
      </div>
    </div>
  );
}
