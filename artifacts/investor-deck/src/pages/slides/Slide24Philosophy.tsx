const KEEPS = [
  "Businesses keep their customers.",
  "Businesses keep their websites.",
  "Businesses keep their booking systems.",
  "Businesses keep their social media.",
  "Communities keep their voice.",
];

export default function Slide24Philosophy() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>24</div>
      <div className="text-center px-[8vw]">
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          We&rsquo;re not replacing local communities.
        </h1>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          We&rsquo;re helping people find them.
        </h1>

        <div className="mt-[5vh] flex flex-col items-center gap-[1.2vh]">
          {KEEPS.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.5vw", color: "#3A1F0E", fontWeight: 500 }}>{item}</div>
          ))}
        </div>

        <div className="font-display mt-[4vh]" style={{ fontSize: "2vw", fontWeight: 700, color: "#A6720F" }}>
          Mapping with Melanin&trade; simply connects them.
        </div>
      </div>
    </div>
  );
}
