export default function Slide05Founding500() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#2A1408" }}>
      {/* Strong gold texture layer */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(202,146,43,0.25) 0%, transparent 50%, rgba(202,146,43,0.1) 100%)" }} />

      {/* Top + bottom gold bars */}
      <div className="absolute top-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>05</div>

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[12vw]">
        <div className="font-body mb-[3vh]" style={{ fontSize: "2.6vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 300 }}>
          INTRODUCING
        </div>

        <div className="font-display text-accent leading-none tracking-tight mb-[1.5vh]" style={{ fontSize: "9vw", fontWeight: 800 }}>
          FOUNDING
        </div>
        <div className="font-display leading-none tracking-tight mb-[4vh]" style={{ fontSize: "9vw", fontWeight: 800, color: "#CA922B" }}>
          500
        </div>

        <div className="biz-bar mb-[4vh]" style={{ width: "14vw", margin: "0 auto" }} />

        <p className="font-body text-accent" style={{ fontSize: "3.3vw", fontWeight: 300, lineHeight: 1.6, textWrap: "balance" }}>
          The first 500 businesses to join Mapping With Melanin receive founding status — and everything that comes with it.
        </p>
      </div>
    </div>
  );
}
