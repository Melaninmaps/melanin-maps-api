const pillars = [
  { title: "Discover", desc: "Find businesses, people, neighborhoods, and opportunities." },
  { title: "Connect", desc: "Build relationships before you arrive." },
  { title: "Grow", desc: "Help businesses thrive through community." },
  { title: "Travel", desc: "Navigate new places with confidence." },
  { title: "Belong", desc: "Create lasting connections wherever life takes you." },
];

export default function Slide05Mission() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      <div className="absolute left-[6vw] right-[6vw] top-[10vh] text-center">
        <div className="font-body" style={{ fontSize: "1.5vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          FIVE PILLARS
        </div>
        <h1 className="font-display leading-tight mt-[1.5vh]" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          What makes the ecosystem different.
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[32vh] grid grid-cols-5 gap-[1.6vw]">
        {pillars.map((p) => (
          <div key={p.title} className="flex flex-col items-center text-center gap-[1.6vh]">
            <div style={{ width: "0.3vw", height: "3.4vh", background: "#CA922B", opacity: 0.75 }} />
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#1C0E06" }}>{p.title}</div>
            <div className="font-body" style={{ fontSize: "1.35vw", color: "#7B5408", fontWeight: 400, lineHeight: 1.4 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
