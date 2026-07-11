const LINES = ["Find your community.", "Support your community.", "Strengthen your community."];

export default function Slide24OneMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>32</div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "6.2vw" }}>
        <div className="font-body mb-[2.3vw]" style={{ fontSize: "1.8vw", fontStyle: "italic", color: "#7B5408", fontWeight: 400 }}>
          Wherever life takes you…
        </div>
        <div className="flex flex-col" style={{ gap: "1.5vw" }}>
          {LINES.map((line) => {
            const [verb, ...rest] = line.split(" ");
            return (
              <div key={line} className="font-body" style={{ fontSize: "3.2vw", fontWeight: 500, color: "#3A1F0E", lineHeight: 1.2 }}>
                <span style={{ color: "#CA922B", fontWeight: 700 }}>{verb}</span>{" "}{rest.join(" ")}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[5.6vw]">
        <div style={{ height: "1px", background: "rgba(202,146,43,0.35)", marginBottom: "2.3vw" }} />
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
