const STATEMENTS = [
  "Helping families relocate with confidence.",
  "Helping travelers feel welcome.",
  "Helping entrepreneurs grow.",
];

export default function Slide24OneMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>32</div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "12vh" }}>
        <div className="flex flex-col" style={{ gap: "3.6vh" }}>
          {STATEMENTS.map((s, i) => (
            <div key={s} className="flex items-baseline" style={{ gap: "1.2vw" }}>
              <div className="font-display" style={{ fontSize: "1.4vw", color: "#CA922B", fontWeight: 700, opacity: 0.5, flexShrink: 0, minWidth: "1.6vw" }}>
                {i + 1}.
              </div>
              <div className="font-body" style={{ fontSize: "2.8vw", color: "#3A1F0E", fontWeight: 500, lineHeight: 1.25 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[10vh]">
        <div style={{ height: "1px", background: "rgba(202,146,43,0.35)", marginBottom: "4vh" }} />
        <div className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#1C0E06" }}>
          One map.
        </div>
        <div className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#CA922B" }}>
          One movement.
        </div>
      </div>
    </div>
  );
}
