export default function DemoS53BizPlansText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(202,146,43,0.13), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "8%", bottom: "8%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>BUSINESS OWNER JOURNEY · BUSINESS PLANS</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw" }}>
          A plan for every stage<br />of your growth.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" }}>
          {[
            {
              name: "Community", price: "Free", color: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.1)",
              for: "Just getting started",
              features: ["Basic business profile","Community reviews (receive & read)","Trust Score tracking","Basic analytics (views + saves)","One photo gallery"],
            },
            {
              name: "Merchant", price: "$29/mo", color: "rgba(202,146,43,0.1)", border: "rgba(202,146,43,0.5)", highlight: true,
              for: "Building your community presence",
              features: ["Everything in Community","KinfolkAI response assist","Full analytics + traffic sources","All compliment chip analytics","Promotion placement access","Business verification badge","Manage promotions + billing history"],
            },
            {
              name: "Trailblazer Business", price: "$79/mo", color: "rgba(202,146,43,0.05)", border: "rgba(202,146,43,0.3)",
              for: "Operating at community scale",
              features: ["Everything in Merchant","Priority placement in KinfolkAI","Featured in community digest","Event hosting tools","Multi-location support","DocuSign document access (seller/verification agreements)","Dedicated community liaison"],
            },
          ].map((tier, i) => (
            <div key={i} className="rounded-[1vw] p-[1.4vw]" style={{ background: tier.color, border: `1px solid ${tier.border}`, position: "relative" }}>
              {tier.highlight && (
                <div className="absolute top-[-0.6vw] left-[50%]" style={{ transform: "translateX(-50%)", background: "#CA922B", borderRadius: "2vw", padding: "0.15vw 0.9vw", whiteSpace: "nowrap" }}>
                  <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#FFF" }}>MOST POPULAR</span>
                </div>
              )}
              <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 800, color: tier.highlight ? "#CA922B" : "#FAF6EF" }}>{tier.name}</div>
              <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.2vw" }}>{tier.price}</div>
              <div className="font-body mb-[0.9vw] mt-[0.15vw]" style={{ fontSize: "0.65vw", color: "#7B5408", fontStyle: "italic" }}>Best for: {tier.for}</div>
              <div className="flex flex-col gap-[0.45vw]">
                {tier.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-[0.5vw]">
                    <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", background: tier.highlight ? "#CA922B" : "rgba(202,146,43,0.4)", flexShrink: 0, marginTop: "0.15vw" }} />
                    <span className="font-body" style={{ fontSize: "0.65vw", color: tier.highlight ? "#D9C4A3" : "#7B5408", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="font-body mt-[2.5vw] text-center" style={{ fontSize: "0.9vw", color: "rgba(202,146,43,0.6)" }}>
          Business plans billed monthly · No annual commitment required · Cancel anytime
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>53 / 58</div>
    </div>
  );
}
