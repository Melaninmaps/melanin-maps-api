export default function Slide04WhereBelong() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>04</div>
      <div className="text-center px-[8vw]">
        <div className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#7B5408", textWrap: "balance" }}>
          More than a map. More than a directory.
        </div>
        <div className="font-display leading-tight mt-[2vh]" style={{ fontSize: "6.2vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          A community ecosystem.
        </div>
        <div className="font-display mt-[3vh]" style={{ fontSize: "2vw", fontWeight: 700, fontStyle: "italic", color: "#A6720F", textWrap: "balance" }}>
          Where people, businesses, and belonging come together.
        </div>
      </div>
    </div>
  );
}
