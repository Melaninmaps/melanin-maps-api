const RATINGS: { label: string; color: string; desc: string }[] = [
  { label: "Everyone", color: "#2D7A4F", desc: "All ages — safe for families" },
  { label: "Teen", color: "#5A6FCA", desc: "13+ · mild themes" },
  { label: "Young Adult", color: "#CA922B", desc: "17+ · mature discussion" },
  { label: "Adult", color: "#A0251E", desc: "18+ · explicit content" },
];

export default function DemoS86GuidanceScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>86</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Guidance.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          One platform. Every generation.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Audience ratings appear on every post, event, and article before the member opens it. Family Mode applies a single Everyone-only filter across all tabs instantly. Parents stay in control without managing each piece of content individually.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Bring the whole family in.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[0.9vw] pb-[0.6vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 700 }}>Family Settings</span>
            </div>

            {/* Family mode toggle */}
            <div className="flex items-center justify-between px-[0.8vw] py-[0.65vw]" style={{ background: "#FAF6EF", borderBottom: "1px solid #E8DDC8", flexShrink: 0 }}>
              <div>
                <div className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#1C0E06" }}>Family Mode</div>
                <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>Filter all content to Everyone-rated only</div>
              </div>
              <div style={{ width: "1.8vw", height: "0.9vw", borderRadius: "0.9vw", background: "#CA922B", padding: "0.1vw", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ width: "0.68vw", height: "0.68vw", borderRadius: "50%", background: "#FAF6EF" }} />
              </div>
            </div>

            {/* Rating legend */}
            <div className="px-[0.7vw] py-[0.5vw]" style={{ flexShrink: 0 }}>
              <div className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#A87A40", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4vw" }}>Audience Rating Scale</div>
              <div className="flex flex-col gap-[0.28vw]">
                {RATINGS.map((r, i) => (
                  <div key={i} className="flex items-center gap-[0.5vw] rounded-[0.5vw] px-[0.5vw] py-[0.3vw]" style={{ background: i === 0 ? `${r.color}18` : "transparent", border: i === 0 ? `1px solid ${r.color}44` : "none" }}>
                    <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                    <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: r.color }}>{r.label}</span>
                    <span className="font-body" style={{ fontSize: "0.44vw", color: "#7B5408" }}>{r.desc}</span>
                    {i === 0 && <span className="font-body" style={{ fontSize: "0.38vw", color: "#2D7A4F", background: "rgba(45,122,79,0.15)", padding: "0.08vw 0.3vw", borderRadius: "0.4vw", marginLeft: "auto" }}>Active</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-content settings */}
            <div className="px-[0.7vw]" style={{ borderTop: "1px solid #E8DDC8", flexShrink: 0 }}>
              <div className="font-body pt-[0.4vw]" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#A87A40", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4vw" }}>Custom Thresholds</div>
              {[
                { type: "Community Posts", level: "Everyone" },
                { type: "Events", level: "Teen" },
                { type: "Library Articles", level: "Young Adult" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-[0.35vw]" style={{ borderBottom: i < 2 ? "1px solid #F0E8D8" : "none" }}>
                  <span className="font-body" style={{ fontSize: "0.52vw", color: "#3A1F0E", fontWeight: 600 }}>{item.type}</span>
                  <div className="flex items-center gap-[0.3vw] rounded-[0.4vw] px-[0.45vw] py-[0.12vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
                    <span className="font-body" style={{ fontSize: "0.46vw", color: "#CA922B", fontWeight: 700 }}>{item.level}</span>
                    <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample content card with badge */}
            <div className="mx-[0.55vw] mt-[0.45vw] rounded-[0.8vw] overflow-hidden" style={{ border: "1px solid rgba(58,31,14,0.08)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.4vw] px-[0.6vw] py-[0.4vw]" style={{ background: "#FFFFFF" }}>
                <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "#CA922B" }} />
                <div style={{ flex: 1 }}>
                  <div className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#1C0E06" }}>Aisha R.</div>
                  <div className="font-body" style={{ fontSize: "0.4vw", color: "#A87A40" }}>Shaw, DC</div>
                </div>
                <div className="flex items-center gap-[0.25vw] rounded-[0.4vw] px-[0.4vw] py-[0.12vw]" style={{ background: "rgba(45,122,79,0.15)", border: "1px solid rgba(45,122,79,0.3)" }}>
                  <div style={{ width: "0.35vw", height: "0.35vw", borderRadius: "50%", background: "#2D7A4F" }} />
                  <span className="font-body" style={{ fontSize: "0.38vw", color: "#2D7A4F", fontWeight: 700 }}>Everyone</span>
                </div>
              </div>
              <div className="px-[0.6vw] pb-[0.45vw]" style={{ background: "#FFFFFF" }}>
                <p className="font-body" style={{ fontSize: "0.52vw", color: "#3A1F0E", lineHeight: 1.35 }}>Six months in and this city finally feels like home. #DCMoves #Community</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Family Mode ON", rest: " — one toggle filters the entire app to Everyone-only content across all tabs." },
            { bold: "Custom thresholds", rest: " — set different rating limits for posts, events, and articles independently." },
            { bold: "Badge-first display", rest: " — audience rating visible on every content card before the member opens it." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4, marginTop: "0.55vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}>
                <strong style={{ fontWeight: 700, color: "#A6720F" }}>{item.bold}</strong>{item.rest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
