export default function Slide08Founding500() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Gold left column */}
      <div className="absolute left-0 top-0 bottom-0 w-[8vw]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>08</div>

      {/* Header — offset right of gold bar */}
      <div className="absolute top-[8vh] left-[12vw] right-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#7B5408", letterSpacing: "0.18em", fontWeight: 300 }}>ANCHOR STRATEGY</div>
        <h2 className="font-display" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06" }}>The Founding 500.</h2>
        <div className="inv-rule w-[16vw] mt-[1.5vh]" />
      </div>

      {/* Content — 2 columns */}
      <div className="absolute left-[12vw] right-[7vw]" style={{ top: "30vh", bottom: "8vh" }}>
        <div className="flex gap-[4vw] h-full">
          {/* Left: What it is */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display mb-[2vh]" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>What it is</div>
            <div className="inv-rule-thin w-full mb-[2.5vh]" />
            <div className="flex flex-col gap-[2.5vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Limited to the first 500 businesses to join the platform</p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Permanent founding badge and price lock</p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Priority placement as platform grows</p>
              </div>
            </div>
          </div>

          {/* Right: Why it matters */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display mb-[2vh]" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>Why it matters</div>
            <div className="inv-rule-thin w-full mb-[2.5vh]" />
            <div className="flex flex-col gap-[2.5vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Creates predictable early ARR before full launch</p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Builds supply-side density to attract members</p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="w-[3px] h-[4vh] flex-shrink-0" style={{ background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.4 }}>Community-verified businesses create organic retention</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
