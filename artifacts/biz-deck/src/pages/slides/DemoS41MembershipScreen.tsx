export default function DemoS41MembershipScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>41</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Upgrade.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara's been Navigator for 3 months. She's considering Trailblazer.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          The upgrade screen shows her exactly what she'd gain — unlimited circles, priority KinfolkAI, the annual city guide. Her current points balance is displayed. She can upgrade in two taps.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>More tools. Deeper community. Worth it.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#0D0805" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.8vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#FAF6EF" }}>Membership</div>
              <div className="flex items-center gap-[0.5vw] mt-[0.3vw] rounded-[0.5vw] px-[0.65vw] py-[0.28vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "inline-flex" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B" }} />
                <span className="font-body" style={{ fontSize: "0.5vw", fontWeight: 700, color: "#CA922B" }}>Navigator · Active · Renews Aug 1</span>
              </div>
              <div className="flex items-center gap-[0.5vw] mt-[0.4vw]">
                <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", background: "rgba(202,146,43,0.5)" }} />
                <span className="font-body" style={{ fontSize: "0.5vw", color: "#7B5408" }}>340 points · Redeem for perks</span>
              </div>
            </div>

            {/* Upgrade banner */}
            <div className="mx-[1vw] mb-[0.7vw] rounded-[0.8vw] p-[0.8vw]" style={{ background: "linear-gradient(135deg,rgba(202,146,43,0.18),rgba(202,146,43,0.06))", border: "1px solid rgba(202,146,43,0.45)", flexShrink: 0 }}>
              <div className="font-display mb-[0.35vw]" style={{ fontSize: "0.85vw", fontWeight: 800, color: "#CA922B" }}>Trailblazer — $19.99/mo</div>
              <div className="flex flex-col gap-[0.3vw]">
                {["Unlimited Kinfolk Circles","Priority KinfolkAI — deeper responses","Annual DC City Guide PDF","Early access to all new features","Trailblazer badge on your profile"].map((f, i) => (
                  <div key={i} className="flex items-center gap-[0.4vw]">
                    <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
                    <span className="font-body" style={{ fontSize: "0.52vw", color: "#D9C4A3" }}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="w-full flex items-center justify-center rounded-[0.7vw] py-[0.65vw] mt-[0.7vw]" style={{ background: "#CA922B" }}>
                <span className="font-body" style={{ fontSize: "0.68vw", fontWeight: 700, color: "#FFF" }}>Upgrade to Trailblazer →</span>
              </div>
            </div>

            {/* Current plan summary */}
            <div className="px-[1vw] flex-1">
              <div className="font-body mb-[0.4vw]" style={{ fontSize: "0.45vw", color: "#7B5408", fontWeight: 600, letterSpacing: "0.08em" }}>YOUR NAVIGATOR PLAN INCLUDES</div>
              <div className="flex flex-col gap-[0.32vw]">
                {["Unlimited KinfolkAI queries","Unlimited saved places","5 Kinfolk Circles","Weekly Library digest","Move Alerts"].map((f, i) => (
                  <div key={i} className="flex items-center gap-[0.4vw]">
                    <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <span className="font-body" style={{ fontSize: "0.52vw", color: "#A87A40" }}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-[0.5vw] mt-[0.8vw]">
                <div className="flex-1 flex items-center justify-center rounded-[0.6vw] py-[0.5vw]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 600, color: "rgba(250,246,239,0.4)" }}>Manage plan</span>
                </div>
                <div className="flex-1 flex items-center justify-center rounded-[0.6vw] py-[0.5vw]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 600, color: "rgba(250,246,239,0.4)" }}>Billing history</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Points balance visible</strong> — community contribution has tangible value.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Two-tap upgrade</strong> — no friction between the decision and the action.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Current plan always visible</strong> — members are never confused about what they have.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
