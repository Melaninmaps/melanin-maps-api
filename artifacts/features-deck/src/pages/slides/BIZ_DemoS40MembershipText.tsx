export default function DemoS40MembershipText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(202,146,43,0.14), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · MEMBERSHIP</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw" }}>
          Three tiers. One community.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" }}>
          {[
            {
              name: "Explorer", price: "Free", color: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.1)",
              features: ["Discover minority-owned businesses","Community feed access","Safety Hub (all 14 features)","KinfolkAI — 10 queries/month","Save up to 10 places","1 Kinfolk Circle"],
            },
            {
              name: "Navigator", price: "$9.99/mo", color: "rgba(202,146,43,0.12)", border: "rgba(202,146,43,0.5)", highlight: true,
              features: ["Everything in Explorer","KinfolkAI — unlimited queries","Save unlimited places","Up to 5 Kinfolk Circles","Weekly Library digest","Priority event registration","Move Alerts for relocating members"],
            },
            {
              name: "Trailblazer", price: "$19.99/mo", color: "rgba(202,146,43,0.06)", border: "rgba(202,146,43,0.3)",
              features: ["Everything in Navigator","KinfolkAI — priority + deeper context","Unlimited Kinfolk Circles","Early access to new features","Member badge and profile distinction","Direct business owner contact","Annual city guide PDF"],
            },
          ].map((tier, i) => (
            <div key={i} className="rounded-[1vw] p-[1.4vw]" style={{ background: tier.color, border: `1px solid ${tier.border}`, position: "relative" }}>
              {tier.highlight && <div className="absolute top-[-0.6vw] left-[50%]" style={{ transform: "translateX(-50%)", background: "#CA922B", borderRadius: "2vw", padding: "0.15vw 0.9vw" }}><span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#FFF" }}>MOST POPULAR</span></div>}
              <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 800, color: tier.highlight ? "#CA922B" : "#FAF6EF" }}>{tier.name}</div>
              <div className="font-body mt-[0.3vw] mb-[1vw]" style={{ fontSize: "1vw", color: "#A87A40", fontWeight: 600 }}>{tier.price}</div>
              <div className="flex flex-col gap-[0.5vw]">
                {tier.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-[0.5vw]">
                    <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", background: tier.highlight ? "#CA922B" : "rgba(202,146,43,0.5)", flexShrink: 0, marginTop: "0.1vw" }} />
                    <span className="font-body" style={{ fontSize: "0.68vw", color: tier.highlight ? "#D9C4A3" : "#7B5408", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>40 / 58</div>
    </div>
  );
}
