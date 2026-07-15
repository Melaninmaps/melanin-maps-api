export default function DemoS54BizPlansScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>54</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Upgrade.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus upgrades to Growth. He's building a presence, not just a listing.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          KinfolkAI response assist alone saves him two hours a week. The chip analytics showed him "Safe Space" ranked second — so he added a neighborhood safety post to his community feed. Trust Score went up four points.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Community intelligence is the product.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#0D0805" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.8vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 800, color: "#FAF6EF" }}>Business Plans</div>
              <div className="flex items-center gap-[0.4vw] mt-[0.25vw] inline-flex rounded-[0.45vw] px-[0.6vw] py-[0.22vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "inline-flex" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B" }} />
                <span className="font-body" style={{ fontSize: "0.46vw", fontWeight: 700, color: "#CA922B" }}>Growth Plan — Active · $29/mo</span>
              </div>
            </div>

            {/* Plan cards */}
            <div className="flex flex-col gap-[0.5vw] px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              {[
                { name: "Community", price: "Free", active: false, features: ["Basic profile","Trust Score tracking","View-only analytics"] },
                { name: "Growth", price: "$29/mo", active: true, features: ["KinfolkAI response assist","Full analytics","Promotion access","Chip analytics","Verification badge"] },
                { name: "Trailblazer Business", price: "$79/mo", active: false, features: ["Priority KinfolkAI placement","Event hosting tools","Multi-location","Community digest featured"] },
              ].map((plan, i) => (
                <div key={i} className="rounded-[0.8vw] p-[0.75vw]" style={{ background: plan.active ? "rgba(202,146,43,0.12)" : "rgba(255,255,255,0.04)", border: plan.active ? "1px solid rgba(202,146,43,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-[0.38vw]">
                    <div>
                      <span className="font-display" style={{ fontSize: "0.82vw", fontWeight: 800, color: plan.active ? "#CA922B" : "#FAF6EF" }}>{plan.name}</span>
                      {plan.active && <span className="font-body ml-[0.5vw]" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#16A34A" }}>CURRENT</span>}
                    </div>
                    <span className="font-body" style={{ fontSize: "0.72vw", fontWeight: 800, color: plan.active ? "#CA922B" : "#7B5408" }}>{plan.price}</span>
                  </div>
                  <div className="flex flex-wrap gap-[0.3vw]">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="rounded-[0.35vw] px-[0.45vw] py-[0.12vw]" style={{ background: plan.active ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.06)" }}>
                        <span className="font-body" style={{ fontSize: "0.42vw", color: plan.active ? "#D9C4A3" : "#7B5408" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {!plan.active && (
                    <div className="w-full flex items-center justify-center rounded-[0.55vw] py-[0.5vw] mt-[0.5vw]" style={{ background: i === 2 ? "rgba(202,146,43,0.15)" : "transparent", border: "1px solid rgba(202,146,43,0.3)" }}>
                      <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#CA922B" }}>{i === 2 ? "Upgrade to Trailblazer →" : "Downgrade"}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Usage stat */}
              <div className="rounded-[0.7vw] px-[0.7vw] py-[0.55vw] flex items-center gap-[0.55vw]" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)" }}>
                <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "#16A34A", fontWeight: 600 }}>Trust Score +4 pts since upgrading to Growth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Free plan is real</strong> — community listing, Trust Score tracking, and basic analytics included.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>No annual contract</strong> — monthly billing, cancel anytime, upgrade in two taps.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Plans grow with the business</strong> — from first listing to multi-location at community scale.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
