const LINES = [
  { text: "Find your community.", gold: false },
  { text: "Help others find theirs.", gold: false },
  { text: "Become a Founding Business.", gold: true },
];

export default function Slide25FoundingInvite() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>33</div>

      <div className="text-center px-[8vw]">
        <div className="font-body mb-[2.8vw]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 500 }}>
          JOIN US
        </div>

        <div className="flex flex-col" style={{ gap: "1.4vw" }}>
          {LINES.map((line, i) => (
            <div
              key={line.text}
              className="font-display"
              style={{
                fontSize: i === 2 ? "5vw" : "4vw",
                fontWeight: 700,
                color: line.gold ? "#CA922B" : "#FAF6EF",
                lineHeight: 1.15,
                opacity: i < 2 ? 0.75 : 1,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className="inv-rule mx-auto w-[8vw] mt-[2.8vw] mb-[1.7vw]" />
        <div className="font-body" style={{ fontSize: "1.6vw", color: "#A87A40", fontWeight: 300, letterSpacing: "0.06em" }}>
          Mapping With Melanin&trade;
        </div>
      </div>
    </div>
  );
}
