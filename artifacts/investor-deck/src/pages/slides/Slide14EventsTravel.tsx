const CHECKLIST = [
  "She joins a local run club through the community feed.",
  "She shows up to a neighborhood event and recognizes faces.",
  "She makes friends who share her experience.",
  "She finally feels safe in her new neighborhood.",
];

export default function Slide13EventsTravel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.14), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>14</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "38vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE BECOMES PART OF THE COMMUNITY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          She&rsquo;s no longer new here.
          <br />
          She&rsquo;s known here.
        </h1>

        <div className="mt-[3.4vh]" style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.25vw", color: "#D8B98A", fontWeight: 400, display: "flex", alignItems: "flex-start", gap: "0.8vw", lineHeight: 1.4 }}>
              <span style={{ color: "#CA922B", fontSize: "1.2vw", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[3.6vh]" style={{ fontSize: "1.7vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic", textWrap: "balance" }}>
          A city full of strangers became a community of friends.
        </div>
      </div>
    </div>
  );
}
