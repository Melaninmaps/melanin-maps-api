const PILLARS = [
  {
    label: "Community Discovery",
    body: "Find places, people, and neighborhoods trusted by the community — before you ever arrive.",
  },
  {
    label: "Business Growth",
    body: "Connect minority-owned businesses to the customers already looking for exactly what they offer.",
  },
  {
    label: "Kinfolk AI",
    body: "Community-powered intelligence that gets smarter with every interaction, search, and recommendation.",
  },
];

export default function Slide22OneEcosystem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>30</div>

      <div className="absolute left-0 right-0" style={{ top: "7.3vw" }}>
        <div className="text-center px-[8vw] mb-[2.8vw]">
          <div className="font-body mb-[0.84vw]" style={{ fontSize: "1.8vw", color: "#7B5408", fontWeight: 300 }}>
            Instead of three different apps&hellip;
          </div>
          <h1 className="font-display leading-tight" style={{ fontSize: "5.4vw", fontWeight: 700, color: "#1C0E06" }}>
            One ecosystem.
          </h1>
        </div>

        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", margin: "0 6vw 2.3vw" }} />

        <div className="grid grid-cols-3 gap-[3vw] px-[6vw]">
          {PILLARS.map((p) => (
            <div key={p.label}>
              <div className="font-display mb-[0.68vw]" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#CA922B" }}>
                {p.label}
              </div>
              <div className="font-body" style={{ fontSize: "1.2vw", color: "#5C3A1A", lineHeight: 1.55 }}>
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
