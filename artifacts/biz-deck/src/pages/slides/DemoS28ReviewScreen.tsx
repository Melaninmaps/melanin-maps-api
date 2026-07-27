const base = import.meta.env.BASE_URL;

const chips = ["Welcoming Vibe","Safe Space","Great Food","Authentic","Community Hub","Clean","Owner Response","Local Favorite"];
const selected = [0,1,2,4];

export default function DemoS28ReviewScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>28</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Voice.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara's review will be read by the next diaspora member who searches here.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          The compliment chips she selects — Welcoming Vibe, Safe Space, Great Food, Community Hub — become the "Community Says" section on Copper &amp; Oak's profile. Not the owner's marketing. The community's truth.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Every review is an act of community care.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-[0.6vw]">
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#3A1F0E" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                <span className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#1C0E06" }}>Write a Review</span>
              </div>
              <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.52vw", color: "#A87A40" }}>Copper &amp; Oak Bistro · Shaw, DC</div>
            </div>

            {/* Star rating */}
            <div className="px-[1vw] pb-[0.55vw]" style={{ flexShrink: 0 }}>
              <div className="font-body mb-[0.3vw]" style={{ fontSize: "0.48vw", color: "#A87A40", fontWeight: 600 }}>YOUR RATING</div>
              <div className="flex gap-[0.4vw]">
                {[1,2,3,4,5].map(s => (
                  <div key={s} style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="#FFF" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliment chips */}
            <div className="px-[1vw] pb-[0.55vw]" style={{ flexShrink: 0 }}>
              <div className="font-body mb-[0.35vw]" style={{ fontSize: "0.48vw", color: "#A87A40", fontWeight: 600 }}>COMMUNITY SAYS — SELECT ALL THAT APPLY</div>
              <div className="flex flex-wrap gap-[0.38vw]">
                {chips.map((c, i) => (
                  <div key={i} className="rounded-[2vw] px-[0.6vw] py-[0.28vw]" style={{ background: selected.includes(i) ? "#CA922B" : "#FFFFFF", border: selected.includes(i) ? "none" : "1px solid #DDD0B8" }}>
                    <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: selected.includes(i) ? 700 : 500, color: selected.includes(i) ? "#FFF" : "#7A5530" }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Written review */}
            <div className="px-[1vw] pb-[0.55vw] flex-1">
              <div className="font-body mb-[0.3vw]" style={{ fontSize: "0.48vw", color: "#A87A40", fontWeight: 600 }}>YOUR REVIEW</div>
              <div className="rounded-[0.7vw] p-[0.65vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8", minHeight: "5vw" }}>
                <span className="font-body" style={{ fontSize: "0.55vw", color: "#3A1F0E", lineHeight: 1.6 }}>Best Sunday brunch I've had in DC. The jerk eggs benedict were incredible. Marcus (the owner) came to our table and made us feel so welcome. This is what we mean when we say minority-owned businesses deserve our support. Will be back every week.</span>
              </div>
              <div className="flex justify-between mt-[0.25vw]">
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>221 / 500 characters</span>
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#CA922B", fontWeight: 600 }}>Add photo +</span>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="px-[1vw] pb-[1.2vw]" style={{ flexShrink: 0 }}>
              <div className="w-full flex items-center justify-center rounded-[0.8vw] py-[0.7vw]" style={{ background: "#CA922B" }}>
                <span className="font-body" style={{ fontSize: "0.72vw", fontWeight: 700, color: "#FFF" }}>Submit Review & Earn 50 Points</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>8 community chips</strong> — selected by members, not written by owners.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Points reward</strong> — members earn for every verified review submitted.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Feeds the Trust Score</strong> — review quality and recency are key inputs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
