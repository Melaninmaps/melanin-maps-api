export default function Slide03Reach() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>03</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <h2 className="font-display" style={{ fontSize: "4.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
          Where we are.
        </h2>
        <div className="biz-bar w-[10vw] mt-[1.2vh]" />
      </div>

      {/* City grid — 4 cols × 2 rows */}
      <div className="relative flex-1 px-[5vw] pb-[6vh]">
        <div className="grid grid-cols-4 gap-[1.5vw] h-full">
          {[
            { name: "Philadelphia", label: "Launch City", hi: true },
            { name: "Atlanta",      label: "Growing",     hi: false },
            { name: "Houston",      label: "Growing",     hi: false },
            { name: "D.C.",         label: "Coming Soon", hi: false },
            { name: "Chicago",      label: "Coming Soon", hi: false },
            { name: "New York",     label: "Coming Soon", hi: false },
            { name: "Miami",        label: "Coming Soon", hi: false },
            { name: "+ More",       label: "Expanding",   hi: false },
          ].map(({ name, label, hi }) => (
            <div key={name} className="flex flex-col justify-center py-[2vh] px-[2vw]"
              style={{ background: hi ? "rgba(202,146,43,0.15)" : "rgba(202,146,43,0.08)", border: `1px solid ${hi ? "rgba(202,146,43,0.4)" : "rgba(202,146,43,0.22)"}` }}>
              <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2 }}>
                {name}
              </div>
              <div className="biz-bar mt-[0.8vh] mb-[0.6vh]" style={{ width: "2vw" }} />
              <div className="font-body" style={{ fontSize: "1.6vw", color: "#CA922B", fontWeight: 300 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
