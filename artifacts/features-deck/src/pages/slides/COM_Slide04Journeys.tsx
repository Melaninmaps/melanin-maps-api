export default function Slide04Journeys() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(90,45,10,0.3) 0%, transparent 60%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>04</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="flex items-center gap-[1vw] mb-[1.5vh]">
          <div className="gold-dot" />
          <span className="font-body" style={{ fontSize: "1.9vw", letterSpacing: "0.12em", fontWeight: 300, color: "#CA922B" }}>LIFE JOURNEYS</span>
        </div>
        <h2 className="font-display leading-tight tracking-tight" style={{ fontSize: "4.5vw", fontWeight: 700, color: "#FAF6EF" }}>
          Every journey starts somewhere.
        </h2>
        <div className="gold-rule w-[18vw] mt-[1.5vh]" />
      </div>

      {/* Journey cards — 4 × 2 grid */}
      <div className="relative flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-4 gap-[2vw] h-full">
          {[
            { label: "Travel",     hi: true },
            { label: "Relocation", hi: true },
            { label: "Career",     hi: false },
            { label: "College",    hi: false },
            { label: "Health",     hi: false },
            { label: "Business",   hi: false },
            { label: "Family",     hi: true },
            { label: "Community",  hi: true },
          ].map(({ label, hi }) => (
            <div key={label} className="flex flex-col justify-end py-[2.5vh] px-[2vw]"
              style={{ background: hi ? "rgba(202,146,43,0.12)" : "rgba(202,146,43,0.07)", border: `1px solid ${hi ? "rgba(202,146,43,0.3)" : "rgba(202,146,43,0.18)"}` }}>
              <div className="font-display mb-[1vh]" style={{ fontSize: "3vw", fontWeight: 700, color: hi ? "#CA922B" : "#FAF6EF" }}>{label}</div>
              <div className="gold-rule w-[3vw]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
