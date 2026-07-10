export default function Slide21OneCommunity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 20%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>22</div>

      <div className="absolute left-[6vw] right-[6vw] top-[7vh] text-center">
        <h1 className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#FAF6EF" }}>
          One Community.
        </h1>
        <div className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#CA922B" }}>
          Three Experiences.
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[10vh] grid grid-cols-3 gap-[2vw]">
        <div className="p-[2vw]" style={{ borderRadius: "0.8vw", border: "1px solid #3A1F0E", background: "rgba(250,246,239,0.04)" }}>
          <div className="font-body mb-[1.4vh]" style={{ fontSize: "1.5vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 500 }}>CONSUMERS</div>
          <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 700, color: "#FAF6EF" }}>Discover, belong, thrive.</div>
        </div>
        <div className="p-[2vw]" style={{ borderRadius: "0.8vw", border: "1px solid #3A1F0E", background: "rgba(250,246,239,0.04)" }}>
          <div className="font-body mb-[1.4vh]" style={{ fontSize: "1.5vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 500 }}>BUSINESSES</div>
          <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 700, color: "#FAF6EF" }}>Grow with Kinfolk AI.</div>
        </div>
        <div className="p-[2vw]" style={{ borderRadius: "0.8vw", border: "1px solid #3A1F0E", background: "rgba(250,246,239,0.04)" }}>
          <div className="font-body mb-[1.4vh]" style={{ fontSize: "1.5vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 500 }}>COMMUNITIES</div>
          <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 700, color: "#FAF6EF" }}>Connect and protect each other.</div>
        </div>
      </div>
    </div>
  );
}
