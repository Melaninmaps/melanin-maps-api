export default function Slide03SameQuestion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>
      <div className="text-center px-[8vw]">
        <div className="font-display leading-tight" style={{ fontSize: "5.4vw", fontWeight: 700, color: "#7B5408", textWrap: "balance" }}>
          That&rsquo;s why we built
        </div>
        <div className="font-display leading-tight mt-[1vh]" style={{ fontSize: "6.4vw", fontWeight: 700, color: "#1C0E06" }}>
          Mapping with Melanin&trade;
        </div>
        <div className="font-body mt-[4vh]" style={{ fontSize: "2vw", fontWeight: 400, color: "#7B5408" }}>
          To help people find community&mdash;and help communities find each other.
        </div>
      </div>
    </div>
  );
}
