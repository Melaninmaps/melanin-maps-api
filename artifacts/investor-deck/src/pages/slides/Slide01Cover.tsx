export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div className="absolute top-[6vh] left-[6vw] font-body" style={{ fontSize: "1.6vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 500 }}>
        MAPPING WITH MELANIN&trade;
      </div>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>01</div>

      <div className="absolute left-[6vw] right-[6vw] top-1/2 -translate-y-1/2">
        <h1 className="font-display leading-tight" style={{ fontSize: "6.5vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          No one should have to wonder<br />if they&rsquo;ll belong.
        </h1>
        <div className="mt-[4vh] flex items-center gap-[1.5vw]">
          <div style={{ width: "4vw", height: "3px", background: "#CA922B" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#A87A40", fontWeight: 300 }}>
            A platform for finding home, wherever you land.
          </div>
        </div>
      </div>
    </div>
  );
}
