export default function Slide15BusinessQuestion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 70%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>16</div>
      <div className="text-center px-[8vw]">
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE OTHER SIDE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          What about the businesses welcoming Jasmine?
        </h1>
      </div>
    </div>
  );
}
