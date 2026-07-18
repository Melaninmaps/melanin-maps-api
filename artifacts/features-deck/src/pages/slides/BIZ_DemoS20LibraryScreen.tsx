const topics = [
  { name: "Health Equity", count: 3, color: "#16A34A" },
  { name: "Know Your Rights", count: 7, color: "#DC2626" },
  { name: "Financial Literacy", count: 2, color: "#CA922B" },
  { name: "Homeownership", count: 5, color: "#2563EB" },
  { name: "Entrepreneurship", count: 1, color: "#7C3AED" },
  { name: "Cultural History", count: 4, color: "#A6720F" },
];

const articles = [
  { title: "How to dispute a credit report error — step by step", topic: "Financial Literacy", read: "4 min", rating: "Everyone" },
  { title: "Your rights when stopped by police: a legal guide for diaspora members", topic: "Know Your Rights", read: "6 min", rating: "Adult" },
  { title: "HBCUs with the best graduate aid packages in 2026", topic: "Education", read: "3 min", rating: "Teen" },
];

export default function DemoS20LibraryScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>20</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Learn.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          70+ topics. Curated by the community.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Health equity, legal rights, financial literacy, homeownership, entrepreneurship — every topic submitted and vetted by diaspora members. Community guidance ratings keep content age-appropriate and in context.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Information that was always yours to have.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header + tabs */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.5vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>Library</div>
              <div className="flex gap-[0] mt-[0.6vw]" style={{ borderBottom: "1px solid #DDD0B8" }}>
                {["Library","Browse","Issues"].map((t, i) => (
                  <div key={i} className="px-[0.7vw] pb-[0.4vw]" style={{ borderBottom: i === 0 ? "2px solid #CA922B" : "2px solid transparent", marginBottom: "-1px" }}>
                    <span className="font-body" style={{ fontSize: "0.55vw", fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "#CA922B" : "#A87A40" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Following topics */}
            <div className="px-[1vw] pb-[0.5vw]" style={{ flexShrink: 0 }}>
              <div className="font-body mb-[0.35vw]" style={{ fontSize: "0.45vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>FOLLOWING</div>
              <div className="flex flex-wrap gap-[0.35vw]">
                {topics.map((t, i) => (
                  <div key={i} className="flex items-center gap-[0.3vw] rounded-[2vw] px-[0.5vw] py-[0.22vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                    <div className="rounded-full" style={{ width: "0.55vw", height: "0.55vw", background: t.color }} />
                    <span className="font-body" style={{ fontSize: "0.44vw", color: "#3A1F0E", fontWeight: 600 }}>{t.name}</span>
                    {t.count > 0 && <div className="rounded-full flex items-center justify-center" style={{ width: "0.8vw", height: "0.8vw", background: "#CA922B" }}><span style={{ fontSize: "0.38vw", color: "#FFF", fontWeight: 700 }}>{t.count}</span></div>}
                  </div>
                ))}
              </div>
            </div>
            {/* Articles */}
            <div className="flex flex-col gap-[0.4vw] px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              <div className="font-body mb-[0.2vw]" style={{ fontSize: "0.45vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>UNREAD IN YOUR TOPICS</div>
              {articles.map((a, i) => (
                <div key={i} className="rounded-[0.7vw] px-[0.7vw] py-[0.55vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                  <div className="flex justify-between items-start gap-[0.5vw]">
                    <div style={{ flex: 1 }}>
                      <div className="font-body" style={{ fontSize: "0.56vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.3 }}>{a.title}</div>
                      <div className="flex items-center gap-[0.5vw] mt-[0.2vw]">
                        <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{a.topic}</span>
                        <span style={{ width: "0.25vw", height: "0.25vw", borderRadius: "50%", background: "#DDD0B8" }} />
                        <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{a.read} read</span>
                      </div>
                    </div>
                    <div className="rounded-[0.3vw] px-[0.4vw] py-[0.1vw]" style={{ background: "#F0E8D8", border: "1px solid #DDD0B8", flexShrink: 0 }}>
                      <span className="font-body" style={{ fontSize: "0.38vw", color: "#7A5530", fontWeight: 600 }}>{a.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Unread badges</strong> on followed topics — members never lose the thread.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Guidance ratings</strong> on every article — family-safe filtering built in.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Weekly digest</strong> for paid members — relevant content delivered, not chased.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
