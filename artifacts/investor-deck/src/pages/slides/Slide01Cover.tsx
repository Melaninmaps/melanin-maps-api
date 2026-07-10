export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage:
            "repeating-radial-gradient(circle at 18% 22%, transparent 0, transparent 42px, rgba(250,246,239,0.9) 43px, transparent 44px), repeating-radial-gradient(circle at 82% 78%, transparent 0, transparent 58px, rgba(250,246,239,0.9) 59px, transparent 60px)",
          backgroundSize: "100% 100%",
        }}
      />
      <div className="absolute top-[8vh] left-[6vw] font-body" style={{ fontSize: "1.85vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 500 }}>
        MAPPING WITH MELANIN&trade;
      </div>

      <div className="absolute left-[8.6vw] right-[6vw] top-1/2" style={{ transform: "translateY(calc(-50% - 2.2vh))" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "6.5vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          No one should have to wonder<br />if they&rsquo;ll belong.
        </h1>
        <div className="mt-[6.3vh] flex items-center gap-[1.5vw]">
          <div style={{ width: "4.8vw", height: "3px", background: "#CA922B" }} />
          <div className="font-body" style={{ fontSize: "2.25vw", color: "#A87A40", fontWeight: 300 }}>
            Helping people discover community before they arrive.
          </div>
        </div>
      </div>
    </div>
  );
}
