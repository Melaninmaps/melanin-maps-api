export default function Slide12Membership() {
  const BUSINESS_TIERS = [
    {
      num: "01",
      emoji: "🆓",
      name: "Community",
      tagline: "Be discovered.",
      price: "Free",
      fee: "10% fee",
      features: ["Business profile & story", "Verification", "Photos & videos", "Marketplace access", "Receive & respond to reviews", "Basic analytics"],
      highlight: false,
    },
    {
      num: "02",
      emoji: "🚀",
      name: "Growth",
      tagline: "Reach more customers.",
      price: "$29 / mo",
      fee: "8% fee",
      features: ["Priority search placement", "8 broadcasts / month", "Customer demographics", "AI marketing tools", "Featured events & promotions", "Sales trend analytics"],
      highlight: false,
    },
    {
      num: "03",
      emoji: "👑",
      name: "Premium",
      tagline: "Build a thriving business.",
      price: "$79 / mo",
      fee: "6% fee",
      features: ["Highest search priority", "20 broadcasts / month", "Business Health Score™", "AI business consultant", "Homepage feature eligibility", "Revenue & repeat customer insights"],
      highlight: true,
    },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      {/* Corner marks */}
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "3vw", height: "3vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "3vw", height: "3vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ padding: "6vh 7vw", display: "flex", flexDirection: "column", height: "100%", position: "relative", boxSizing: "border-box" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "0.8vh" }}>Access</div>
            <h2 style={{ fontSize: "4.5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Business Tiers</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "0.5vh" }}>Upgrade promise</div>
            <div style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>Make more money. Save time. Increase visibility.</div>
          </div>
        </div>

        {/* Three business tier columns */}
        <div style={{ display: "flex", gap: "2vw", flex: 1, alignItems: "stretch", marginBottom: "3vh" }}>
          {BUSINESS_TIERS.map((tier) => (
            <div
              key={tier.num}
              style={{
                flex: 1,
                padding: "3vh 2.2vw",
                border: tier.highlight ? "2px solid #D4AF37" : "1px solid rgba(212,175,55,0.2)",
                background: tier.highlight ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.02)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {tier.highlight && (
                <div style={{ position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)", background: "#D4AF37", padding: "0.3vh 1.5vw", fontSize: "0.75vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "#0A0A0A", fontWeight: 700, whiteSpace: "nowrap" }}>
                  Full Access
                </div>
              )}
              <div style={{ fontSize: "0.85vw", letterSpacing: "0.3em", textTransform: "uppercase", color: tier.highlight ? "#D4AF37" : "rgba(212,175,55,0.5)", marginBottom: "1vh" }}>
                Tier {tier.num}
              </div>
              <div style={{ fontSize: "2vw", marginBottom: "0.3vh" }}>{tier.emoji}</div>
              <div style={{ fontSize: "2.5vw", fontWeight: 700, color: tier.highlight ? "#D4AF37" : "#FFFFFF", marginBottom: "0.3vh" }}>
                {tier.name}
              </div>
              <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: "1.5vh" }}>
                {tier.tagline}
              </div>
              <div style={{ width: "3vw", height: "2px", background: tier.highlight ? "#D4AF37" : "rgba(212,175,55,0.3)", marginBottom: "2vh" }} />

              {/* Price + fee */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.8vw", marginBottom: "0.5vh" }}>
                <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#FFFFFF" }}>{tier.price}</div>
                <div style={{ fontSize: "1vw", color: "#D4AF37", background: "rgba(212,175,55,0.12)", padding: "0.2vh 0.6vw", borderRadius: "2px" }}>{tier.fee}</div>
              </div>
              <div style={{ fontSize: "0.85vw", color: "rgba(212,175,55,0.5)", marginBottom: "2vh" }}>
                {tier.name === "Community" ? "Founding rate: 6%" : tier.name === "Growth" ? "Founding rate: 5%" : "Founding rate: 3%"}
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.7vh", flex: 1 }}>
                {tier.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6vw", fontSize: "1.05vw", color: tier.highlight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    <span style={{ color: tier.highlight ? "#D4AF37" : "rgba(212,175,55,0.5)", marginTop: "0.1vh", flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Founding program strip */}
        <div style={{ border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", padding: "1.5vh 2vw", display: "flex", alignItems: "center", gap: "2vw", marginBottom: "3vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D4AF37", flexShrink: 0 }}>🔒 Founding Business Program</div>
          <div style={{ width: "1px", height: "2.5vh", background: "rgba(212,175,55,0.3)" }} />
          <div style={{ fontSize: "1.05vw", color: "rgba(255,255,255,0.6)", flex: 1 }}>
            First 500 businesses lock their marketplace fee for 3 years — Community 9% · Growth 7% · Premium 5%
          </div>
          <div style={{ fontSize: "1.05vw", color: "#D4AF37", flexShrink: 0 }}>Enterprise from $199/mo · 4% fee</div>
        </div>

        {/* Consumer tiers note + footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", color: "rgba(255,255,255,0.4)" }}>
            Consumer tiers: Community Member (Free) · Community Premium ($7.99/mo) — KinfolkAI, Smart Pathways™, relocation intelligence
          </div>
          <div style={{ display: "flex", gap: "3vw", alignItems: "center" }}>
            <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>12</div>
          </div>
        </div>
      </div>
    </div>
  );
}
