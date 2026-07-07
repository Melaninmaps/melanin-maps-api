export default function Slide02Audience() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(90,45,10,0.4) 0%, transparent 60%)" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>02</div>

      {/* Big stat layout */}
      <div className="absolute inset-0 flex items-center pl-[8vw] pr-[6vw]">
        {/* Left: Stat */}
        <div className="w-[40vw] flex-shrink-0">
          <div className="font-display" style={{ fontSize: "15vw", fontWeight: 800, color: "#CA922B", lineHeight: 0.9 }}>44M</div>
          <div className="biz-bar w-[16vw] mt-[2.5vh] mb-[2vh]" />
          <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 300, lineHeight: 1.3 }}>Black Americans with over $1.6 trillion in buying power.</div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-[55vh] mx-[5vw] flex-shrink-0" style={{ background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

        {/* Right: Context */}
        <div className="flex-1">
          <h2 className="font-display text-accent leading-tight mb-[3vh]" style={{ fontSize: "4.5vw", fontWeight: 800 }}>
            Your customers are already here.
          </h2>
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.2vh]" style={{ background: "#CA922B" }} />
              <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 300, opacity: 0.9 }}>Community-first platform, not a generic directory</span>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.2vh]" style={{ background: "#CA922B" }} />
              <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 300, opacity: 0.9 }}>Members search for businesses they can trust</span>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full flex-shrink-0 mt-[1.2vh]" style={{ background: "#CA922B" }} />
              <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 300, opacity: 0.9 }}>Recommendations from people like them</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
