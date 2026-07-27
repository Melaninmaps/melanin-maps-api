const base = import.meta.env.BASE_URL;

const members = [
  { name: "Zara M.", color: "#CA922B", initials: "ZM" },
  { name: "Jordan B.", color: "#A6720F", initials: "JB" },
  { name: "Nia T.", color: "#7C3AED", initials: "NT" },
  { name: "Dev R.", color: "#16A34A", initials: "DR" },
];
const saved = [
  { name: "Copper & Oak Bistro", score: 97, votes: 3 },
  { name: "Melanin & More Salon", score: 94, votes: 2 },
  { name: "The Root Collective", score: 91, votes: 4 },
];

export default function DemoS24CirclesScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>24</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Move Together.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara starts a DC Crew circle with her travel squad.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Four members. Shared saved places. Group voting on stops. KinfolkAI curates options based on everyone's preferences — not just whoever talks loudest in the group chat.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The group chat, but it actually plans things.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-[0.6vw]">
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#3A1F0E" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>DC Crew</div>
              </div>
              <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.55vw", color: "#A87A40" }}>4 members · Washington, DC · Private</div>
            </div>

            {/* Member avatars */}
            <div className="px-[1vw] pb-[0.7vw]" style={{ flexShrink: 0 }}>
              <div className="flex gap-[0.5vw] items-center">
                {members.map((m, i) => (
                  <div key={i} style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", border: "0.2vw solid #FAF6EF" }}>
                    <span className="font-body" style={{ fontSize: "0.55vw", fontWeight: 700, color: "#FFF" }}>{m.initials}</span>
                  </div>
                ))}
                <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", background: "#F0E8D8", border: "1px dashed #DDD0B8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-body" style={{ fontSize: "0.7vw", color: "#A87A40" }}>+</span>
                </div>
              </div>
            </div>

            {/* Curator mode banner */}
            <div className="mx-[1vw] mb-[0.6vw] rounded-[0.6vw] px-[0.8vw] py-[0.5vw]" style={{ background: "linear-gradient(135deg,#FEF9EE,#FAF6EF)", border: "1px solid #DDD0B8", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.4vw]">
                <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", background: "#CA922B" }} />
                <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#CA922B" }}>KinfolkAI Curator Mode ON</span>
              </div>
              <div className="font-body mt-[0.15vw]" style={{ fontSize: "0.47vw", color: "#7A5530" }}>AI is suggesting stops based on all 4 members' preferences</div>
            </div>

            {/* Saved places */}
            <div className="px-[1vw] flex-1" style={{ overflow: "hidden" }}>
              <div className="font-body mb-[0.4vw]" style={{ fontSize: "0.45vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>GROUP SAVED PLACES</div>
              <div className="flex flex-col gap-[0.4vw]">
                {saved.map((s, i) => (
                  <div key={i} className="rounded-[0.7vw] px-[0.7vw] py-[0.5vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>{s.name}</div>
                      <div className="flex items-center gap-[0.3vw] mt-[0.08vw]">
                        {[1,2,3].map(v => <div key={v} style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: v <= s.votes ? "#CA922B" : "#DDD0B8" }} />)}
                        <span className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40" }}>{s.votes}/4 votes</span>
                      </div>
                    </div>
                    <div className="rounded-[0.3vw] px-[0.4vw] py-[0.15vw]" style={{ background: "#CA922B" }}>
                      <span className="font-body" style={{ fontSize: "0.52vw", fontWeight: 800, color: "#FFF" }}>{s.score}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Plan trip CTA */}
              <div className="mt-[0.6vw] w-full flex items-center justify-center rounded-[0.7vw] py-[0.65vw]" style={{ background: "#CA922B" }}>
                <span className="font-body" style={{ fontSize: "0.68vw", fontWeight: 700, color: "#FFF" }}>Plan Saturday Itinerary →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Group voting</strong> on saved places — democracy replaces the loudest voice.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Curator Mode</strong> — KinfolkAI suggests stops everyone will love.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Private by default</strong> — your crew's spots stay yours until you say otherwise.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
