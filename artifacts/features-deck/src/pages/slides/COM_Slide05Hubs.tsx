export default function Slide05Hubs() {
  return (
    <div className="w-screen h-screen overflow-hidden flex" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>05</div>

      {/* Left column */}
      <div className="relative flex-shrink-0 w-[36vw] flex flex-col justify-center pl-[7vw] pr-[3vw]">
        <div className="flex items-center gap-[1vw] mb-[2vh]">
          <div className="gold-dot" />
          <span className="font-body" style={{ fontSize: "1.9vw", letterSpacing: "0.12em", fontWeight: 300, color: "#CA922B" }}>SPACES</span>
        </div>
        <h2 className="font-display leading-none tracking-tight mb-[2vh]" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF" }}>
          Community Hubs
        </h2>
        <div className="gold-rule w-[12vw] mb-[2.5vh]" />
        <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.55 }}>
          Not topics. Living communities built around who you are and what you carry.
        </p>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0 self-center mx-[2vw]" style={{ width: "1px", height: "55vh", background: "linear-gradient(180deg, transparent, #CA922B 30%, #CA922B 70%, transparent)" }} />

      {/* Right — hub grid */}
      <div className="relative flex-1 flex items-center pr-[5vw]">
        <div className="grid grid-cols-2 gap-[1.6vw] w-full">
          {[
            { name: "Brazil",            hi: true },
            { name: "Diabetes",          hi: false },
            { name: "Natural Hair",      hi: false },
            { name: "Philadelphia",      hi: true },
            { name: "Melanated History", hi: true },
            { name: "Autism",            hi: false },
            { name: "Small Business",    hi: false },
            { name: "Parenting",         hi: true },
          ].map(({ name, hi }) => (
            <div key={name} className="py-[1.8vh] px-[1.8vw]"
              style={{ background: hi ? "rgba(202,146,43,0.12)" : "rgba(202,146,43,0.06)", borderLeft: `3px solid ${hi ? "#CA922B" : "rgba(202,146,43,0.35)"}` }}>
              <span className="font-body" style={{ fontSize: "2.5vw", fontWeight: 600, color: "#FAF6EF" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
