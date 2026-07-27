const NOMINATIONS = [
  { name: "Zara M.", nominee: "Keesha L.", category: "Mentorship", tags: ["Financial Education","Entrepreneurship"], reason: "She introduced me to my favorite local bookstore in Shaw and then connected me with three minority-owned lenders. Changed my entire approach to homeownership.", experience: "Her guides made my first investment in DC possible.", reactions: { love: 47, support: 22, saved: 11, visited: 9 } },
  { name: "Darius K.", nominee: "Copper & Oak Bistro", category: "Great Food", tags: ["Community Service","Supporting Locals"], reason: "This restaurant owner personally welcomed my family when we relocated. Has hired 6 local residents this year. The community shows up because he shows up first.", experience: null, reactions: { love: 84, support: 41, saved: 23, visited: 67 } },
  { name: "Aisha R.", nominee: "@TravelWithMelanin", category: "Travel Guides", tags: ["Travel","Storytelling"], reason: "Her travel guides made my trip to New Orleans unforgettable. Every recommendation was community-sourced and none of them were paid placements.", experience: "She introduced me to a jazz club that had been there for 60 years.", reactions: { love: 103, support: 55, saved: 38, visited: 15 } },
];

export default function DemoS90ShowLoveScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>90</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Show Love.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Recognition that means more than a number.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Nominate creators, businesses, mentors, artists, and community leaders in 3 steps. Four forms of community appreciation — Show Love, I Support, Saved, Visited. Every profile earns a "Why People Show Love" section built from real stories, not star ratings.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The community writes the testimonials.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-[1vw] py-[0.9vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <div>
                <div className="font-display" style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FAF6EF" }}>Show Love</div>
                <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>Celebrate the difference-makers</div>
              </div>
              <div className="flex items-center gap-[0.3vw] rounded-[0.7vw] px-[0.6vw] py-[0.3vw]" style={{ background: "#CA922B" }}>
                <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="#FFF" stroke="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#FFF" }}>Show Love</span>
              </div>
            </div>

            {/* Nomination cards */}
            <div className="flex flex-col gap-[0.4vw] px-[0.5vw] pt-[0.5vw] flex-1 overflow-hidden">
              {NOMINATIONS.map((nom, idx) => (
                <div key={idx} className="rounded-[0.85vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)", flexShrink: 0 }}>
                  {/* Nominator */}
                  <div className="flex items-center gap-[0.4vw] px-[0.6vw] pt-[0.5vw]">
                    <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: ["#CA922B","#2D7A4F","#5A6FCA"][idx], flexShrink: 0 }} />
                    <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#A87A40" }}>{nom.name} is showing love to</span>
                  </div>
                  {/* Nominee */}
                  <div className="flex items-center gap-[0.4vw] px-[0.6vw] pb-[0.3vw]">
                    <div style={{ width: "1.1vw", height: "1.1vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                    </div>
                    <span className="font-body" style={{ fontSize: "0.65vw", fontWeight: 800, color: "#1C0E06" }}>{nom.nominee}</span>
                    <span className="font-body" style={{ fontSize: "0.42vw", color: "#CA922B", background: "rgba(202,146,43,0.1)", padding: "0.08vw 0.35vw", borderRadius: "0.4vw", marginLeft: "auto" }}>{nom.category}</span>
                  </div>
                  {/* Tags */}
                  <div className="flex gap-[0.25vw] px-[0.6vw] pb-[0.3vw]" style={{ flexWrap: "wrap" }}>
                    {nom.tags.map(t => (
                      <span key={t} className="font-body" style={{ fontSize: "0.4vw", color: "#A6720F", background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)", padding: "0.08vw 0.3vw", borderRadius: "0.4vw" }}>{t}</span>
                    ))}
                  </div>
                  {/* Reason */}
                  <div className="px-[0.6vw] pb-[0.3vw]">
                    <p className="font-body" style={{ fontSize: "0.5vw", color: "#3A1F0E", lineHeight: 1.35 }}>{nom.reason}</p>
                  </div>
                  {/* Experience quote if present */}
                  {nom.experience && (
                    <div className="mx-[0.6vw] mb-[0.3vw] rounded-[0.5vw] px-[0.5vw] py-[0.3vw]" style={{ background: "rgba(202,146,43,0.05)", borderLeft: "2px solid #CA922B" }}>
                      <p className="font-body" style={{ fontSize: "0.44vw", color: "#A6720F", fontStyle: "italic" }}>"{nom.experience}"</p>
                    </div>
                  )}
                  {/* Community proof */}
                  <div className="px-[0.6vw] pb-[0.25vw]">
                    <span className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#CA922B" }}>
                      Recommended by {nom.reactions.love + nom.reactions.support + nom.reactions.saved + nom.reactions.visited} community members
                    </span>
                  </div>
                  {/* Reactions */}
                  <div className="flex border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {[
                      { icon: "♡", label: "Show Love", count: nom.reactions.love, active: idx === 1 },
                      { icon: "↑", label: "Support", count: nom.reactions.support, active: false },
                      { icon: "♡", label: "Saved", count: nom.reactions.saved, active: false },
                      { icon: "◎", label: "Visited", count: nom.reactions.visited, active: false },
                    ].map((r, ri) => (
                      <div key={ri} className="flex-1 flex items-center justify-center gap-[0.2vw] py-[0.35vw]" style={{ background: r.active ? "rgba(202,146,43,0.08)" : "transparent" }}>
                        <span style={{ fontSize: "0.55vw", color: r.active ? "#CA922B" : "#A87A40" }}>{r.icon}</span>
                        <span className="font-body" style={{ fontSize: "0.42vw", color: r.active ? "#CA922B" : "#A87A40", fontWeight: r.active ? 700 : 500 }}>{r.label} {r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "3-step nomination", rest: " — Who, what category, and why. Simple enough to do in under 2 minutes." },
            { bold: "No popularity contest", rest: " — Shows 'Recommended by 47 community members,' not a raw vote count." },
            { bold: "Stories over stats", rest: " — 'Why People Show Love' section surfaces testimonials on every profile." },
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
