export default function DemoS51BizGrowthScreen() {
  const placements = [
    { name: "Search Feature Spot", desc: "First result above organic rankings when members search your category", price: "$149/mo", tag: "Most Popular" },
    { name: "Category Front Page", desc: "Featured card on the Restaurants category landing page", price: "$79/mo" },
    { name: "Map Pin Highlight", desc: "Gold map pin with label visible in all zoom levels in your area", price: "$59/mo" },
    { name: "KinfolkAI Injection", desc: "Included in AI recommendations when members ask about your category", price: "$199/mo", tag: "Premium" },
    { name: "Community Feed Sponsored Post", desc: "Native post in the community feed, labeled Promoted", price: "$49/mo" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>51</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Visibility.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Marcus activates a Search Feature Spot for $149/month.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          He doesn't need a sales call. No annual contract. He selects his placement type, sets his duration, and checks out through Stripe in under two minutes. His Trust Score still shows as earned — "Promoted" appears as a separate label.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Visibility is for sale. Trust is earned.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.2vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "0.95vw", fontWeight: 800, color: "#1C0E06" }}>Growth Tools</div>
              <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.5vw", color: "#A87A40" }}>Copper &amp; Oak Bistro — Promote your listing</div>
            </div>

            {/* Active promotion */}
            <div className="mx-[1vw] mb-[0.6vw] rounded-[0.7vw] p-[0.7vw]" style={{ background: "linear-gradient(135deg,rgba(202,146,43,0.12),rgba(202,146,43,0.05))", border: "1px solid rgba(202,146,43,0.45)", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw] mb-[0.2vw]">
                <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#16A34A" }} />
                <span className="font-body" style={{ fontSize: "0.5vw", fontWeight: 700, color: "#CA922B" }}>ACTIVE PROMOTION</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>Search Feature Spot · Restaurants · DC</div>
              <div className="flex justify-between mt-[0.25vw]">
                <span className="font-body" style={{ fontSize: "0.48vw", color: "#7A5530" }}>Started Jul 1 · Renews Aug 1</span>
                <span className="font-body" style={{ fontSize: "0.48vw", color: "#CA922B", fontWeight: 700 }}>$149/mo</span>
              </div>
              <div className="flex items-center gap-[1vw] mt-[0.4vw]">
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B" }}>+847</div>
                  <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>Profile views</div>
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B" }}>+12</div>
                  <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>New saves</div>
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B" }}>+4</div>
                  <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>New reviews</div>
                </div>
              </div>
            </div>

            {/* Placement options */}
            <div className="px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              <div className="font-body mb-[0.35vw]" style={{ fontSize: "0.44vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>ADD A PLACEMENT</div>
              <div className="flex flex-col gap-[0.38vw]">
                {placements.map((p, i) => (
                  <div key={i} className="rounded-[0.65vw] px-[0.65vw] py-[0.5vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                    <div className="flex items-start justify-between gap-[0.4vw]">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-[0.35vw]">
                          <span className="font-body" style={{ fontSize: "0.54vw", fontWeight: 700, color: "#1C0E06" }}>{p.name}</span>
                          {p.tag && <div className="rounded-[0.25vw] px-[0.3vw] py-[0.05vw]" style={{ background: "#CA922B" }}><span className="font-body" style={{ fontSize: "0.38vw", fontWeight: 700, color: "#FFF" }}>{p.tag}</span></div>}
                        </div>
                        <div className="font-body mt-[0.08vw]" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{p.desc}</div>
                      </div>
                      <div>
                        <div className="font-body" style={{ fontSize: "0.6vw", fontWeight: 800, color: "#CA922B", whiteSpace: "nowrap" }}>{p.price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>5 placement types</strong> — each targets a distinct moment in the member's journey.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Performance visible in dashboard</strong> — views, saves, and reviews from paid reach.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>No sales call required</strong> — self-serve checkout via Stripe from the app.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
