export default function DemoS52BizAnalyticsScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>52</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Insight.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus knows who's finding him, how, and from where.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Not just page views. Traffic source breakdown: search vs. KinfolkAI vs. circle shares vs. direct. Neighborhood origin of visitors. Conversion from view to save to review. This is what community-powered analytics looks like.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Not just data. Community intelligence.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 800, color: "#1C0E06" }}>Analytics — July 2026</div>
              <div className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>Copper &amp; Oak Bistro · All traffic sources</div>
            </div>

            {/* Key metrics */}
            <div className="flex gap-[0.5vw] px-[1vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              {[["1,204","Profile Views"],["98","Saves"],["53","Reviews"],["4.9","Avg ★"]].map(([v,l], i) => (
                <div key={i} className="flex-1 rounded-[0.55vw] p-[0.45vw] flex flex-col items-center" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                  <span className="font-display" style={{ fontSize: "0.88vw", fontWeight: 800, color: "#CA922B" }}>{v}</span>
                  <span className="font-body" style={{ fontSize: "0.38vw", color: "#A87A40", textAlign: "center" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Traffic sources */}
            <div className="px-[1vw] flex-1">
              <div className="font-body mb-[0.38vw]" style={{ fontSize: "0.44vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>TRAFFIC SOURCES</div>
              {[
                { source: "Search", pct: 42, count: 505, color: "#CA922B" },
                { source: "KinfolkAI Recommendations", pct: 28, count: 337, color: "#A6720F" },
                { source: "Kinfolk Circle Shares", pct: 18, count: 217, color: "#16A34A" },
                { source: "Direct Profile Link", pct: 8, count: 96, color: "#2563EB" },
                { source: "Promoted Placement", pct: 4, count: 49, color: "#7C3AED" },
              ].map((item, i) => (
                <div key={i} className="mb-[0.5vw]">
                  <div className="flex justify-between mb-[0.1vw]">
                    <span className="font-body" style={{ fontSize: "0.5vw", fontWeight: 600, color: "#1C0E06" }}>{item.source}</span>
                    <span className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>{item.count} · {item.pct}%</span>
                  </div>
                  <div style={{ height: "0.32vw", background: "#E8DDC8", borderRadius: "0.2vw" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "0.2vw" }} />
                  </div>
                </div>
              ))}

              {/* Conversion funnel */}
              <div className="mt-[0.5vw] rounded-[0.7vw] p-[0.6vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                <div className="font-body mb-[0.35vw]" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#1C0E06" }}>Conversion Funnel</div>
                <div className="flex items-end gap-[0.5vw]">
                  {[["1,204","Views",100],["337","Clicks",28],["98","Saves",8],["53","Reviews",4]].map(([v,l,pct],i)=>(
                    <div key={i} className="flex-1 flex flex-col items-center gap-[0.12vw]">
                      <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#1C0E06" }}>{v}</span>
                      <div style={{ width: "100%", background: "#CA922B", borderRadius: "0.1vw 0.1vw 0 0", opacity: 0.3 + (pct/100)*0.7, height: `${pct * 0.022}vw` }} />
                      <span className="font-body" style={{ fontSize: "0.38vw", color: "#A87A40" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitor neighborhoods */}
              <div className="mt-[0.5vw]">
                <div className="font-body mb-[0.3vw]" style={{ fontSize: "0.44vw", fontWeight: 600, color: "#A87A40", letterSpacing: "0.08em" }}>TOP VISITOR NEIGHBORHOODS</div>
                <div className="flex flex-wrap gap-[0.35vw]">
                  {["Shaw","U Street","Columbia Heights","H Street","Capitol Hill"].map((n,i) => (
                    <div key={i} className="rounded-[2vw] px-[0.55vw] py-[0.18vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                      <span className="font-body" style={{ fontSize: "0.44vw", color: "#7A5530" }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>KinfolkAI is the 2nd largest traffic source</strong> — 28% of visits are AI-driven recommendations.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Circle shares</strong> — 18% of traffic from members recommending to their crews.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Conversion funnel</strong> — from view to review, every drop-off is visible.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
