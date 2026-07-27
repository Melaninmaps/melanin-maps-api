export default function Slide05Founding500() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: "#2A1408" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(202,146,43,0.25) 0%, transparent 50%, rgba(202,146,43,0.1) 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>05</div>

      <div className="relative flex flex-col items-center px-[12vw]">
        <div className="font-body mb-[2.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 300 }}>
          INTRODUCING
        </div>
        <div className="font-display leading-none tracking-tight" style={{ fontSize: "8vw", fontWeight: 800, color: "#FAF6EF" }}>
          FOUNDING
        </div>
        <div className="font-display leading-none tracking-tight mb-[3.5vh]" style={{ fontSize: "8vw", fontWeight: 800, color: "#CA922B" }}>
          500
        </div>
        <div className="biz-bar mb-[3.5vh]" style={{ width: "12vw" }} />
        <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.6, textWrap: "balance" }}>
          The first 500 businesses to join Mapping With Melanin receive founding status — and everything that comes with it.
        </p>
      </div>
    </div>
  );
}
