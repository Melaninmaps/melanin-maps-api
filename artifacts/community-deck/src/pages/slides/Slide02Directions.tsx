export default function Slide02Directions() {
  return (
    <div className="w-screen h-screen overflow-hidden flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(90,45,10,0.35) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>02</div>

      <div className="relative flex items-stretch w-full pl-[7vw] pr-[6vw] gap-0">
        {/* Left: Headline */}
        <div className="flex-shrink-0 w-[44vw] pr-[4vw] flex flex-col justify-center">
          <div className="flex items-center gap-[1vw] mb-[2.5vh]">
            <div className="gold-dot" />
            <span className="font-body" style={{ fontSize: "1.9vw", letterSpacing: "0.12em", fontWeight: 300, color: "#CA922B" }}>THE REALITY</span>
          </div>
          <h2 className="font-display leading-tight tracking-tight mb-[2.5vh]" style={{ fontSize: "4.8vw", fontWeight: 700, color: "#FAF6EF" }}>
            Life doesn't come with directions.
          </h2>
          <div className="gold-rule w-[14vw] mb-[2.5vh]" />
          <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#CA922B" }}>
            We've all been there.
          </p>
        </div>

        {/* Divider */}
        <div className="flex-shrink-0 self-stretch flex items-center mx-[3vw]">
          <div style={{ width: "1px", height: "54vh", background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />
        </div>

        {/* Right: The list */}
        <div className="flex-1 flex flex-col justify-center gap-[2.3vh]">
          {["Moving.", "Traveling.", "Starting over.", "Finding trusted businesses.", "Choosing schools.", "Finding your people."].map((item) => (
            <div key={item} className="flex items-center gap-[1.5vw]">
              <div className="gold-dot flex-shrink-0" />
              <span className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
