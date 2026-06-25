import React from "react";

export default function Slide13BusinessModel() {
  const STREAMS = [
    {
      num: "01",
      title: "Memberships",
      sub: "Consumer + Business",
      detail: "Consumer: Free → $7.99/mo Premium",
      detail2: "Business: Free → $29 → $79 → $199/mo",
      note: "Recurring SaaS revenue across two audiences",
    },
    {
      num: "02",
      title: "Marketplace Fees",
      sub: "Transaction Revenue",
      detail: "6–10% on every product & service sale",
      detail2: "Founding members lock rates for 3 years",
      note: "Revenue grows automatically with GMV",
    },
    {
      num: "03",
      title: "Business Listings",
      sub: "Visibility & Growth Tools",
      detail: "Featured placement & city spotlights",
      detail2: "Growth promotions & cultural spotlight ads",
      note: "À la carte spend on top of subscription",
    },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", bottom: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", right: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

      <div style={{ padding: "7vh 8vw", display: "flex", flexDirection: "column", height: "100%", position: "relative", boxSizing: "border-box" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6vh" }}>
          <div>
            <div style={{ fontSize: "1.1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1vh" }}>Revenue</div>
            <h2 style={{ fontSize: "5vw", fontWeight: 700, margin: 0, color: "#FFFFFF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Business Model</h2>
          </div>
          <div style={{ fontSize: "2vw", color: "rgba(212,175,55,0.4)" }}>&#9670;</div>
        </div>

        {/* Revenue streams */}
        <div style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "stretch", gap: "0" }}>
          {STREAMS.map((stream, idx) => (
            <React.Fragment key={stream.num}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 3vw" }}>
                <div style={{ fontSize: "4vw", color: "#D4AF37", marginBottom: "2.5vh" }}>&#9670;</div>
                <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "1.5vh" }}>Stream {stream.num}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.8vw", margin: "0 0 0.5vh 0", letterSpacing: "0.1em", color: "#FFFFFF" }}>{stream.title}</h3>
                <div style={{ fontSize: "1.1vw", color: "#D4AF37", marginBottom: "2vh", letterSpacing: "0.1em" }}>{stream.sub}</div>
                <div style={{ width: "4vw", height: "2px", background: "#D4AF37", marginBottom: "2.5vh" }} />
                <div style={{ fontSize: "1.5vw", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: "0.5vh" }}>{stream.detail}</div>
                <div style={{ fontSize: "1.5vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "2vh" }}>{stream.detail2}</div>
                <div style={{ fontSize: "1vw", color: "rgba(212,175,55,0.6)", fontStyle: "italic", border: "1px solid rgba(212,175,55,0.15)", padding: "0.6vh 1.2vw" }}>{stream.note}</div>
              </div>
              {idx < STREAMS.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginBottom: "1vh" }} />
                  <div style={{ width: "1px", height: "28vh", background: "linear-gradient(180deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))" }} />
                  <div style={{ width: "0.5vw", height: "0.5vw", background: "#D4AF37", transform: "rotate(45deg)", marginTop: "1vh" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Fee schedule callout */}
        <div style={{ marginTop: "4vh", border: "1px solid rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.03)", padding: "1.5vh 2vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)" }}>Marketplace Fee Schedule</div>
          {[
            { tier: "Community", std: "10%", founding: "9%" },
            { tier: "Growth", std: "8%", founding: "7%" },
            { tier: "Premium", std: "6%", founding: "5%" },
            { tier: "Enterprise", std: "4%", founding: "4%" },
          ].map((f, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.5)", marginBottom: "0.3vh" }}>{f.tier}</div>
              <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF" }}>{f.std}</div>
              <div style={{ fontSize: "0.85vw", color: "#D4AF37" }}>Founding: {f.founding}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)" }}>Mapping With Melanin / Confidential</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}>13</div>
        </div>
      </div>
    </div>
  );
}
