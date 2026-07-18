export default function DemoS84ResourcesHubScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>84</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Resources.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marketplace. Wellness. Wealth.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Three independent tools in the Resources tab: a community marketplace for buying and trading within the diaspora; a private wellness tracker with streak-based accountability; and a financial hub for goal-setting and curated wealth resources.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Everything you need to thrive, in one tab.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[0.9vw] pb-[0.6vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 700 }}>Resources</span>
            </div>

            {/* Marketplace card */}
            <div className="mx-[0.55vw] mt-[0.55vw] rounded-[0.85vw] overflow-hidden" style={{ border: "1px solid rgba(202,146,43,0.25)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] px-[0.65vw] py-[0.5vw]" style={{ background: "#1C0E06" }}>
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#FAF6EF" }}>Community Marketplace</span>
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40", marginLeft: "auto" }}>47 listings</span>
              </div>
              <div className="flex gap-[0.4vw] p-[0.5vw]" style={{ background: "#FAF6EF" }}>
                {[
                  { label: "Natural hair care set", price: "$25", cat: "Goods" },
                  { label: "Logo design services", price: "$150", cat: "Services" },
                  { label: "Room in Shaw DC", price: "$1,200/mo", cat: "Housing" },
                ].map((item, i) => (
                  <div key={i} className="flex-1 rounded-[0.6vw] p-[0.45vw]" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)", minWidth: 0 }}>
                    <div className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.3 }}>{item.label}</div>
                    <div className="font-body" style={{ fontSize: "0.5vw", color: "#CA922B", fontWeight: 800, marginTop: "0.2vw" }}>{item.price}</div>
                    <div className="font-body" style={{ fontSize: "0.38vw", color: "#A87A40" }}>{item.cat}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellness card */}
            <div className="mx-[0.55vw] mt-[0.4vw] rounded-[0.85vw] overflow-hidden" style={{ border: "1px solid rgba(45,122,79,0.3)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] px-[0.65vw] py-[0.5vw]" style={{ background: "#0D2E1A" }}>
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2.2" strokeLinecap="round"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#3FD97F" }}>Wellness Tracker</span>
                <div className="flex items-center gap-[0.3vw]" style={{ marginLeft: "auto" }}>
                  <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 800, color: "#CA922B" }}>12</span>
                  <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V20a1 1 0 0 0 1 1h4v-5h8v5h4a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732l-7.5-4.33z"/></svg>
                  <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>day streak</span>
                </div>
              </div>
              <div className="flex items-center gap-[0.5vw] px-[0.65vw] py-[0.4vw]" style={{ background: "#FAF6EF" }}>
                <div className="flex gap-[0.3vw]">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, di) => (
                    <div key={d} className="flex flex-col items-center gap-[0.15vw]">
                      <div style={{ width: "0.85vw", height: "0.85vw", borderRadius: "50%", background: di < 5 ? "#2D7A4F" : "rgba(45,122,79,0.2)", border: di < 5 ? "none" : "1px solid rgba(45,122,79,0.3)" }} />
                      <span className="font-body" style={{ fontSize: "0.36vw", color: "#A87A40" }}>{d[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Hub card */}
            <div className="mx-[0.55vw] mt-[0.4vw] rounded-[0.85vw] overflow-hidden" style={{ border: "1px solid rgba(90,111,202,0.3)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] px-[0.65vw] py-[0.5vw]" style={{ background: "#0D0F2E" }}>
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#5A6FCA" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
                <span className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#8B9FFF" }}>Financial Hub</span>
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#5A6FCA", marginLeft: "auto" }}>2 active goals</span>
              </div>
              <div className="flex flex-col gap-[0.3vw] px-[0.65vw] py-[0.45vw]" style={{ background: "#FAF6EF" }}>
                {[
                  { label: "Emergency Fund", progress: 62, target: "$10,000" },
                  { label: "Down Payment", progress: 28, target: "$40,000" },
                ].map((g, gi) => (
                  <div key={gi}>
                    <div className="flex justify-between">
                      <span className="font-body" style={{ fontSize: "0.5vw", fontWeight: 600, color: "#1C0E06" }}>{g.label}</span>
                      <span className="font-body" style={{ fontSize: "0.46vw", color: "#5A6FCA", fontWeight: 700 }}>{g.progress}%</span>
                    </div>
                    <div className="mt-[0.15vw] rounded-full overflow-hidden" style={{ height: "0.35vw", background: "rgba(90,111,202,0.15)" }}>
                      <div style={{ width: `${g.progress}%`, height: "100%", background: "#5A6FCA", borderRadius: "9999px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Marketplace", rest: " — buy, sell, trade within the diaspora. 6 categories, 47+ live listings." },
            { bold: "Wellness streak", rest: " — 12-day streak shown at a glance. Private check-ins with mood and notes." },
            { bold: "Financial goals", rest: " — progress bars, target amounts, and 10 curated wealth resources." },
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
