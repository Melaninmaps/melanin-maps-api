const BUSINESSES_KEEP = ["Website", "Booking system", "Social media", "Customer relationships"];
const COMMUNITIES_KEEP = ["Their voice", "Local knowledge", "Recommendations", "Trust"];

export default function Slide24Philosophy() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>24</div>

      <div className="absolute left-0 right-0 top-[6vh] text-center px-[8vw]">
        <h1 className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          We&rsquo;re not replacing local communities.
        </h1>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          We&rsquo;re helping people find them.
        </h1>
        <div className="font-body mt-[1.6vh]" style={{ fontSize: "1.25vw", color: "#7B5408", fontWeight: 500, fontStyle: "italic" }}>
          We don&rsquo;t ask businesses to start over. We help them build on what they&rsquo;ve already built.
        </div>
      </div>

      <div className="absolute left-1/2 top-[28vh] -translate-x-1/2 flex" style={{ gap: "6vw" }}>
        <div className="flex flex-col items-start">
          <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.3vw", color: "#A6720F", letterSpacing: "0.08em", fontWeight: 700 }}>
            BUSINESSES KEEP
          </div>
          <div className="flex flex-col gap-[1vh]">
            {BUSINESSES_KEEP.map((item) => (
              <div key={item} className="flex items-center gap-[0.8vw]">
                <span style={{ color: "#CA922B", fontSize: "1.3vw", fontWeight: 700 }}>&#10003;</span>
                <span className="font-body" style={{ fontSize: "1.4vw", color: "#3A1F0E", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(58,31,14,0.15)" }} />
        <div className="flex flex-col items-start">
          <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.3vw", color: "#A6720F", letterSpacing: "0.08em", fontWeight: 700 }}>
            COMMUNITIES KEEP
          </div>
          <div className="flex flex-col gap-[1vh]">
            {COMMUNITIES_KEEP.map((item) => (
              <div key={item} className="flex items-center gap-[0.8vw]">
                <span style={{ color: "#CA922B", fontSize: "1.3vw", fontWeight: 700 }}>&#10003;</span>
                <span className="font-body" style={{ fontSize: "1.4vw", color: "#3A1F0E", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center" style={{ top: "68vh" }}>
        <div style={{ color: "#CA922B", fontSize: "1.6vw", fontWeight: 400, lineHeight: 1, opacity: 0.6 }}>&#8595;</div>
        <div className="font-display mt-[1.6vh]" style={{ fontSize: "2vw", fontWeight: 700, color: "#A6720F" }}>
          Mapping with Melanin&trade; connects them.
        </div>
      </div>
    </div>
  );
}
