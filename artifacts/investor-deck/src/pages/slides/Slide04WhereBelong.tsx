export default function Slide04WhereBelong() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>04</div>
      <div className="text-center px-[8vw]">
        <div className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#7B5408", textWrap: "balance" }}>
          More than a map. More than a directory. More than a social network.
        </div>
        <div className="font-display leading-tight mt-[2vh]" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          It&rsquo;s a community ecosystem.
        </div>
        <div className="font-body mt-[4vh]" style={{ fontSize: "2vw", fontWeight: 400, color: "#7B5408", textWrap: "balance" }}>
          Built to help people discover trusted businesses, build meaningful connections, and navigate life with confidence.
        </div>
      </div>
    </div>
  );
}
