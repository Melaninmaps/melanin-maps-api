export default function DemoS46ZaraReviewScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>46</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Seen.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus reads Zara's review. He understands exactly what she experienced.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          The chips. The written words. Her member reputation score. And a KinfolkAI prompt ready to help him craft a response that actually sounds like him — not a form letter.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The community spoke. The owner responds.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-[0.6vw]">
                <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#3A1F0E" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                <span className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#1C0E06" }}>New Review</span>
                <div className="ml-auto rounded-[0.4vw] px-[0.5vw] py-[0.1vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
                  <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#CA922B" }}>JUST NOW</span>
                </div>
              </div>
            </div>

            {/* Reviewer info */}
            <div className="mx-[1vw] mb-[0.6vw] rounded-[0.7vw] p-[0.7vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.6vw]">
                <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#FFF" }}>ZM</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#1C0E06" }}>Zara M.</div>
                  <div className="font-body" style={{ fontSize: "0.46vw", color: "#A87A40" }}>Navigator Member · 7 reviews · Reputation: High</div>
                </div>
                {/* Stars */}
                <div className="flex gap-[0.12vw]">
                  {[1,2,3,4,5].map(s => <svg key={s} width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-[0.32vw] mt-[0.5vw]">
                {["Welcoming Vibe","Safe Space","Great Food","Community Hub"].map((c, i) => (
                  <div key={i} className="rounded-[2vw] px-[0.55vw] py-[0.2vw]" style={{ background: "#CA922B" }}>
                    <span className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#FFF" }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* Review text */}
              <div className="font-body mt-[0.5vw]" style={{ fontSize: "0.52vw", color: "#3A1F0E", lineHeight: 1.6 }}>
                "Best Sunday brunch I've had in DC. The jerk eggs benedict were incredible. Marcus came to our table and made us feel so welcome. This is what we mean when we say minority-owned businesses deserve our support. Will be back every week."
              </div>
            </div>

            {/* Trust Score impact */}
            <div className="mx-[1vw] mb-[0.6vw] rounded-[0.7vw] px-[0.7vw] py-[0.5vw] flex items-center gap-[0.5vw]" style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.3)", flexShrink: 0 }}>
              <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#16A34A" }} />
              <span className="font-body" style={{ fontSize: "0.52vw", color: "#16A34A", fontWeight: 700 }}>Trust Score +0.4 pts from this review</span>
            </div>

            {/* KinfolkAI response assist */}
            <div className="mx-[1vw] flex-1">
              <div className="rounded-[0.7vw] p-[0.65vw]" style={{ background: "linear-gradient(135deg,#FEF9EE,#FAF6EF)", border: "1px solid #DDD0B8" }}>
                <div className="flex items-center gap-[0.4vw] mb-[0.35vw]">
                  <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "0.25vw", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.4vw", color: "#FFF", fontWeight: 800 }}>K</span>
                  </div>
                  <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#CA922B" }}>KinfolkAI — Draft a Response</span>
                </div>
                <div className="font-body" style={{ fontSize: "0.5vw", color: "#7A5530" }}>KinfolkAI has analyzed Zara's review and the chips she selected. Tap to generate a personalized response that sounds like Marcus, not a template.</div>
                <div className="w-full flex items-center justify-center rounded-[0.6vw] py-[0.55vw] mt-[0.5vw]" style={{ background: "#CA922B" }}>
                  <span className="font-body" style={{ fontSize: "0.62vw", fontWeight: 700, color: "#FFF" }}>Generate My Response →</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Reviewer reputation shown</strong> — high-rep reviewers signal quality feedback.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Trust Score impact visible</strong> — the owner sees exactly what moved the needle.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>KinfolkAI response assist</strong> — one tap to draft a reply that feels personal.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
