const base = import.meta.env.BASE_URL;

const events = [
  { title: "Afrobeats & Culture Night", venue: "The Root Collective", date: "SAT JUL 18 · 9PM", cat: "Music", trust: 91, price: "Free" },
  { title: "Natural Hair Expo — DC", venue: "Howard University", date: "SUN JUL 19 · 11AM", cat: "Wellness", trust: 97, price: "$12" },
  { title: "Minority Biz Mixer: Shaw", venue: "Copper & Oak Bistro", date: "WED JUL 22 · 7PM", cat: "Business", trust: 97, price: "Free" },
  { title: "Poetry Slam: Black Futures", venue: "Busboys & Poets", date: "THU JUL 23 · 8PM", cat: "Arts", trust: 88, price: "$8" },
  { title: "Community Town Hall — U St", venue: "Reeves Center", date: "SAT JUL 25 · 2PM", cat: "Community", trust: 95, price: "Free" },
];
const cats = ["All","Music","Wellness","Business","Arts","Community"];

export default function DemoS18EventsScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>18</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Celebrate.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Cultural programming, finally in one place.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Afrobeats nights, hair expos, diaspora business mixers, poetry slams, and community town halls. Submitted by community organizers — not scraped from platforms that miss most minority-produced events.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Every weekend, something worth showing up for.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.3vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>Events Near You</div>
              <div className="font-body mt-[0.15vw]" style={{ fontSize: "0.55vw", color: "#A87A40" }}>Washington, DC · This Week</div>
            </div>
            {/* Cat filters */}
            <div className="flex gap-[0.38vw] px-[0.8vw] pb-[0.55vw]" style={{ flexShrink: 0, overflowX: "hidden" }}>
              {cats.map((c, i) => (
                <div key={i} className="rounded-[2vw] px-[0.55vw] py-[0.22vw]" style={{ background: i === 0 ? "#CA922B" : "#FFFFFF", border: i === 0 ? "none" : "1px solid #DDD0B8", flexShrink: 0 }}>
                  <span className="font-body" style={{ fontSize: "0.45vw", fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "#FFF" : "#7A5530" }}>{c}</span>
                </div>
              ))}
            </div>
            {/* Events list */}
            <div className="flex flex-col gap-[0.42vw] px-[0.8vw] flex-1" style={{ overflow: "hidden" }}>
              {events.map((e, i) => (
                <div key={i} className="rounded-[0.7vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8", flexShrink: 0 }}>
                  <div style={{ height: "0.25vw", background: i === 0 ? "#CA922B" : i === 1 ? "#16A34A" : i === 2 ? "#7B5408" : i === 3 ? "#7C3AED" : "#0891B2" }} />
                  <div className="px-[0.7vw] py-[0.5vw]">
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2 }}>{e.title}</div>
                        <div className="font-body mt-[0.1vw]" style={{ fontSize: "0.48vw", color: "#A87A40" }}>{e.venue}</div>
                        <div className="font-body mt-[0.15vw]" style={{ fontSize: "0.44vw", color: "#7A5530", fontWeight: 600 }}>{e.date}</div>
                      </div>
                      <div className="flex flex-col items-end gap-[0.18vw]">
                        <div className="rounded-[0.3vw] px-[0.35vw] py-[0.1vw]" style={{ background: "#CA922B" }}>
                          <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 800, color: "#FFF" }}>{e.trust}</span>
                        </div>
                        <span className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{e.price}</span>
                      </div>
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
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Community-submitted</strong> events — organizers add directly, no platform gatekeeper.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Venue Trust Score</strong> visible on every event — know the space before you go.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>KinfolkAI integration</strong> — ask for a weekend plan and events appear automatically.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
