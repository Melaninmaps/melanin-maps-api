const BUSINESSES_KEEP = ["Their website", "Their booking system", "Their social media", "Their customer relationships"];
const COMMUNITIES_KEEP = ["Their voice", "Local knowledge", "Trusted recommendations", "Trust"];

export default function Slide24Philosophy() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>24</div>

      <div className="absolute left-0 right-0 top-[6vh] text-center px-[8vw]">
        <h1 className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          We&rsquo;re not another destination.
        </h1>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          We&rsquo;re the connection.
        </h1>
        <div className="font-body mt-[1.6vh]" style={{ fontSize: "1.25vw", color: "#7B5408", fontWeight: 500, fontStyle: "italic" }}>
          We don&rsquo;t ask businesses to start over. We help them build on what they&rsquo;ve already built.
        </div>
      </div>

      <div className="absolute left-1/2 top-[28vh] -translate-x-1/2 flex" style={{ gap: "6vw" }}>
        <div className="flex flex-col items-start">
          <div className="font-body mb-[1.6vh]" style={{ fontSize: "1.3vw", color: "#A6720F", letterSpacing: "0.08em", fontWeight: 700 }}>
            BUSINESSES KEEP OWNERSHIP OF...
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
            COMMUNITIES KEEP...
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

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ top: "66vh" }}>
        <div className="font-display" style={{ fontSize: "2vw", fontWeight: 700, color: "#A6720F" }}>
          Mapping with Melanin&trade; connects them.
        </div>
        <div className="font-body mt-[2vh]" style={{ fontSize: "1.25vw", color: "#3A1F0E", fontWeight: 500, lineHeight: 1.5 }}>
          You don&rsquo;t just connect businesses to customers. You connect stories &mdash; Jasmine&rsquo;s, Marcus&rsquo;s, the neighborhood&rsquo;s, the city&rsquo;s.
        </div>
      </div>
    </div>
  );
}
