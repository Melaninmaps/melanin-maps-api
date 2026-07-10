const pillars = [
  { icon: "\u{1F50D}", title: "Discover" },
  { icon: "\u{1F91D}\u{1F3FE}", title: "Connect" },
  { icon: "\u{1F4C8}", title: "Grow" },
  { icon: "\u2708\uFE0F", title: "Travel" },
  { icon: "\u{1F90E}", title: "Belong" },
];

export default function Slide05Mission() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      <div className="absolute left-[6vw] right-[6vw] top-[16vh] text-center">
        <div className="font-body" style={{ fontSize: "1.5vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          FIVE PRINCIPLES
        </div>
        <h1 className="font-display leading-tight mt-[1.5vh]" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Everything we built starts here.
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[42vh] grid grid-cols-5 gap-[1.6vw]">
        {pillars.map((p) => (
          <div key={p.title} className="flex flex-col items-center text-center gap-[1.6vh]">
            <div style={{ fontSize: "3.2vw", lineHeight: 1 }}>{p.icon}</div>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#1C0E06" }}>{p.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
