const base = import.meta.env.BASE_URL;

const results = [
  { name: "Copper & Oak Bistro", cat: "Restaurant · Soul Food", dist: "0.4 mi", score: 97, open: true, price: "$$" },
  { name: "Melanin & More Salon", cat: "Beauty · Natural Hair", dist: "0.7 mi", score: 94, open: true, price: "$$" },
  { name: "The Root Collective", cat: "Bookstore · Community", dist: "1.1 mi", score: 91, open: true, price: "$" },
  { name: "SoulFit DC", cat: "Fitness · Gym", dist: "1.3 mi", score: 88, open: false, price: "$$" },
  { name: "Alchemy Coffee", cat: "Coffee · Café", dist: "0.9 mi", score: 85, open: true, price: "$" },
];

export default function DemoS26SearchScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Results.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Ranked by the community. Not the highest bidder.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Copper &amp; Oak Bistro (97) sits at the top because the community put it there — not because Marcus paid for placement. Every score is earned. Zara taps the listing.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The best minority-owned spot wins.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Search bar */}
            <div className="px-[0.9vw] pt-[1.3vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] rounded-[0.75vw] px-[0.75vw] py-[0.55vw]" style={{ background: "#FFFFFF", border: "1px solid #DDD0B8" }}>
                <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span className="font-body" style={{ fontSize: "0.6vw", color: "#3A1F0E", fontWeight: 600 }}>brunch near U Street</span>
                <div className="ml-auto rounded-full" style={{ width: "0.6vw", height: "0.6vw", background: "#CA922B" }} />
              </div>
              {/* Filters */}
              <div className="flex gap-[0.38vw] mt-[0.5vw]">
                {["Restaurants","Score 90+","$-$$","Open now"].map((f, i) => (
                  <div key={i} className="rounded-[2vw] px-[0.55vw] py-[0.2vw]" style={{ background: i === 0 || i === 1 ? "#CA922B" : "#FFFFFF", border: i === 0 || i === 1 ? "none" : "1px solid #DDD0B8", flexShrink: 0 }}>
                    <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: i === 0 || i === 1 ? "#FFF" : "#7A5530" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 px-[0.9vw] flex flex-col gap-[0.42vw]" style={{ overflow: "hidden" }}>
              <div className="font-body mb-[0.1vw]" style={{ fontSize: "0.45vw", color: "#A87A40", fontWeight: 600 }}>14 minority-owned spots · Shaw/U Street</div>
              {results.map((r, i) => (
                <div key={i} className="rounded-[0.7vw] px-[0.7vw] py-[0.55vw]" style={{ background: i === 0 ? "linear-gradient(135deg,#FEF9EE,#FFFFFF)" : "#FFFFFF", border: i === 0 ? "1px solid #CA922B" : "1px solid #E8DDC8" }}>
                  <div className="flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-[0.35vw]">
                        <span className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#1C0E06" }}>{r.name}</span>
                        {i < 3 && <div className="rounded-full flex items-center justify-center" style={{ width: "0.7vw", height: "0.7vw", background: "#CA922B" }}><svg width="0.4vw" height="0.4vw" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg></div>}
                      </div>
                      <div className="font-body mt-[0.05vw]" style={{ fontSize: "0.48vw", color: "#A87A40" }}>{r.cat} · {r.price} · {r.dist}</div>
                      <div className="font-body mt-[0.05vw]" style={{ fontSize: "0.42vw", color: r.open ? "#16A34A" : "#DC2626", fontWeight: 600 }}>{r.open ? "Open now" : "Closed"}</div>
                    </div>
                    <div className="rounded-[0.4vw] px-[0.45vw] py-[0.18vw]" style={{ background: r.score >= 90 ? "#CA922B" : "#A87A40" }}>
                      <span className="font-body" style={{ fontSize: "0.62vw", fontWeight: 800, color: "#FFF" }}>{r.score}</span>
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
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Highlighted top result</strong> — the community's #1 pick is instantly visible.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Verified check</strong> on every minority-owned listing in the top 3.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>No paid ranking</strong> — Trust Score is the only algorithm that matters here.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
