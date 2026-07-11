export default function DemoS44BizDashScreen() {
  const chipData = [
    { label: "Welcoming Vibe", count: 47, pct: 89 },
    { label: "Safe Space", count: 41, pct: 78 },
    { label: "Great Food", count: 38, pct: 72 },
    { label: "Community Hub", count: 29, pct: 55 },
    { label: "Authentic", count: 26, pct: 49 },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>44</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Command.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus opens his dashboard. Everything is visible. Nothing is hidden.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Trust Score at 97. 53 reviews this month. Top chip: Welcoming Vibe (89%). Traffic up 24% since last review. A new review just came in. He taps it.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>No guessing. No black box. Real community data.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display" style={{ fontSize: "0.88vw", fontWeight: 800, color: "#1C0E06" }}>Copper &amp; Oak Bistro</div>
                  <div className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>Business Dashboard · July 2026</div>
                </div>
                <div className="rounded-[0.5vw] px-[0.6vw] py-[0.22vw]" style={{ background: "#CA922B" }}>
                  <span className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#FFF" }}>97</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-[0.5vw] px-[1vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              {[["53","Reviews"],["↑24%","Traffic"],["4.9","Avg Rating"],["12","Saves"]].map(([val, label], i) => (
                <div key={i} className="flex-1 rounded-[0.55vw] p-[0.5vw] flex flex-col items-center" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                  <span className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: i === 1 ? "#16A34A" : "#CA922B" }}>{val}</span>
                  <span className="font-body" style={{ fontSize: "0.4vw", color: "#A87A40" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* New review alert */}
            <div className="mx-[1vw] mb-[0.55vw] rounded-[0.7vw] px-[0.7vw] py-[0.55vw] flex items-center gap-[0.5vw]" style={{ background: "linear-gradient(135deg,#FEF9EE,#FAF6EF)", border: "1px solid #CA922B50", flexShrink: 0 }}>
              <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="font-body" style={{ fontSize: "0.54vw", fontWeight: 700, color: "#1C0E06" }}>New Review — Zara M. · ★★★★★</div>
                <div className="font-body" style={{ fontSize: "0.46vw", color: "#A87A40" }}>3 min ago · Chips: Welcoming Vibe, Safe Space, Great Food</div>
              </div>
              <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            {/* Community chip breakdown */}
            <div className="px-[1vw] flex-1">
              <div className="font-body mb-[0.4vw]" style={{ fontSize: "0.44vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>COMMUNITY SAYS — THIS MONTH</div>
              <div className="flex flex-col gap-[0.38vw]">
                {chipData.map((chip, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-[0.12vw]">
                      <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 600, color: "#1C0E06" }}>{chip.label}</span>
                      <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{chip.count} reviews · {chip.pct}%</span>
                    </div>
                    <div style={{ height: "0.3vw", background: "#E8DDC8", borderRadius: "0.2vw" }}>
                      <div style={{ width: `${chip.pct}%`, height: "100%", background: i === 0 ? "#CA922B" : "#A6720F50", borderRadius: "0.2vw" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Score trend mini chart */}
              <div className="mt-[0.6vw] rounded-[0.7vw] p-[0.6vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                <div className="flex justify-between items-center mb-[0.35vw]">
                  <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#1C0E06" }}>Trust Score — Last 30 Days</span>
                  <span className="font-body" style={{ fontSize: "0.44vw", color: "#16A34A", fontWeight: 700 }}>↑ +2 pts</span>
                </div>
                <div className="flex items-end gap-[0.25vw]" style={{ height: "2.2vw" }}>
                  {[85,88,87,90,91,91,93,95,97].map((v, i) => (
                    <div key={i} style={{ flex: 1, background: i === 8 ? "#CA922B" : "rgba(202,146,43,0.3)", borderRadius: "0.15vw 0.15vw 0 0", height: `${(v / 100) * 100}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-[0.18vw]">
                  <span className="font-body" style={{ fontSize: "0.38vw", color: "#A87A40" }}>Jun 1</span>
                  <span className="font-body" style={{ fontSize: "0.38vw", color: "#CA922B", fontWeight: 700 }}>Today · 97</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Instant review alerts</strong> — Marcus sees Zara's review in seconds, not days.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Chip analytics</strong> — he knows exactly how the community describes his space.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Trust Score trend</strong> — a living history of community trust, not a static number.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
