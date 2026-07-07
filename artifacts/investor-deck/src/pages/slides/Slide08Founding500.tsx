export default function Slide08Founding500() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Gold left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[1vw]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>08</div>

      {/* Header */}
      <div className="pl-[5vw] pr-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>ANCHOR STRATEGY</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#1C0E06" }}>The Founding 500.</h2>
        <div className="inv-rule w-[14vw] mt-[1.2vh]" />
      </div>

      {/* 2 columns */}
      <div className="flex-1 pl-[5vw] pr-[7vw] pb-[6vh]">
        <div className="flex gap-[4vw] h-full">
          {/* Left */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display mb-[1.8vh]" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>What it is</div>
            <div className="inv-rule-thin w-full mb-[2vh]" />
            <div className="flex flex-col gap-[2.2vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Limited to the first 500 businesses to join the platform
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Permanent founding badge and locked-in price
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Priority placement as the platform grows
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex-shrink-0 w-[1px]" style={{ background: "rgba(202,146,43,0.3)" }} />

          {/* Right */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="font-display mb-[1.8vh]" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>Why it matters</div>
            <div className="inv-rule-thin w-full mb-[2vh]" />
            <div className="flex flex-col gap-[2.2vh]">
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Creates predictable early revenue before full launch
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Builds supply-side density to attract community members
                </p>
              </div>
              <div className="flex items-start gap-[1.5vw]">
                <div className="flex-shrink-0 mt-[0.5vh]" style={{ width: "3px", height: "3.5vh", background: "#CA922B" }} />
                <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.45 }}>
                  Community-verified businesses drive organic retention
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
