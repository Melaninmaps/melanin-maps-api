const base = import.meta.env.BASE_URL;

export default function DemoS29SaveScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>29</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Saved.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara taps the heart. Copper &amp; Oak is hers now.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Saved places sync to her profile, appear on her map, get shared to her Kinfolk Circles, and surface in KinfolkAI trip planning. One tap creates a persistent connection between Zara and a minority-owned business.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The places you love, always with you.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Hero with photo */}
            <div className="relative" style={{ height: "38%", flexShrink: 0 }}>
              <img src={`${base}photos/marcus-restaurant-cover.png`} crossOrigin="anonymous" alt="Restaurant" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(250,246,239,0.95) 100%)" }} />
              {/* Score badge */}
              <div className="absolute top-[0.8vw] right-[0.8vw] rounded-[0.6vw] px-[0.55vw] py-[0.22vw]" style={{ background: "#CA922B" }}>
                <span className="font-body" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#FFF" }}>97</span>
              </div>
              {/* Save button — ACTIVE */}
              <div className="absolute top-[0.8vw] left-[0.8vw] rounded-full flex items-center justify-center" style={{ width: "2.2vw", height: "2.2vw", background: "#CA922B", boxShadow: "0 0 0 0.25vw rgba(202,146,43,0.35)" }}>
                <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="#FFF" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
            </div>

            {/* Save confirmation toast */}
            <div className="mx-[1vw] mt-[0.8vw] rounded-[0.7vw] px-[0.8vw] py-[0.6vw]" style={{ background: "linear-gradient(135deg,#CA922B,#A6720F)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw]">
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                <span className="font-body" style={{ fontSize: "0.62vw", fontWeight: 700, color: "#FFF" }}>Saved to your favorites!</span>
              </div>
              <div className="font-body mt-[0.12vw]" style={{ fontSize: "0.5vw", color: "rgba(255,255,255,0.8)" }}>Synced to your map, profile, and DC Crew circle</div>
            </div>

            {/* Save options */}
            <div className="px-[1vw] pt-[0.8vw] flex-1">
              <div className="font-body mb-[0.4vw]" style={{ fontSize: "0.48vw", color: "#A87A40", fontWeight: 600 }}>ALSO SAVE TO</div>
              <div className="flex flex-col gap-[0.38vw]">
                {[
                  { label: "DC Crew Circle", sub: "Shared with your travel squad", checked: true },
                  { label: "Want to Visit", sub: "Your personal bucket list", checked: true },
                  { label: "Brunch Spots", sub: "Your custom collection", checked: false },
                ].map((opt, i) => (
                  <div key={i} className="flex items-center gap-[0.6vw] rounded-[0.6vw] px-[0.7vw] py-[0.5vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                    <div className="rounded-[0.25vw] flex items-center justify-center" style={{ width: "1.1vw", height: "1.1vw", background: opt.checked ? "#CA922B" : "#FFF", border: opt.checked ? "none" : "1px solid #DDD0B8", flexShrink: 0 }}>
                      {opt.checked && <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                    </div>
                    <div>
                      <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>{opt.label}</div>
                      <div className="font-body" style={{ fontSize: "0.46vw", color: "#A87A40" }}>{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Points toast */}
              <div className="flex items-center gap-[0.5vw] rounded-[0.6vw] px-[0.7vw] py-[0.5vw] mt-[0.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
                <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.45vw", color: "#FFF", fontWeight: 800 }}>+</span>
                </div>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "#A6720F", fontWeight: 600 }}>+10 points earned for supporting the community</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>One tap saves</strong> to profile, map, and any Kinfolk Circle simultaneously.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Custom collections</strong> — members organize saves their own way.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Points for every save</strong> — community support is rewarded, not just reviewed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
