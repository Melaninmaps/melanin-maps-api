export default function Slide10TheAsk() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule absolute top-0 left-0 right-0" />
      <div className="inv-rule absolute bottom-0 left-0 right-0" />

      {/* Dark left half */}
      <div className="absolute left-0 top-0 w-[48vw] h-full" style={{ background: "#1C0E06" }} />
      {/* Gold divider */}
      <div className="absolute top-0 bottom-0 w-[0.4vw]" style={{ left: "48vw", background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>10</div>

      {/* Left — vision: justify-start with explicit top padding */}
      <div className="absolute left-0 top-0 w-[48vw] h-full flex flex-col justify-start pt-[10vh] pl-[7vw] pr-[5vw]">
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE VISION</div>
        <h2 className="font-display leading-tight mb-[2.5vh]" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF" }}>
          The infrastructure for the melanated diaspora.
        </h2>
        <div className="inv-rule w-[12vw] mb-[2.5vh]" />
        <p className="font-body" style={{ fontSize: "2.3vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.55, opacity: 0.85 }}>
          We are building the layer of trust, intelligence, and connection that minorities and the melanated diaspora have needed — and that no platform has built for them.
        </p>
      </div>

      {/* Right — use of funds */}
      <div className="absolute top-0 bottom-0 flex flex-col justify-center pl-[5vw] pr-[6vw]" style={{ left: "50vw" }}>
        <div className="font-body mb-[2.5vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>USE OF FUNDS</div>
        <div className="flex flex-col gap-[2.5vh]">
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.4vh]" style={{ width: "3px", height: "4vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#1C0E06" }}>City Expansion</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#3A1F0E" }}>Launch operations in the next 3 markets</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.4vh]" style={{ width: "3px", height: "4vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#1C0E06" }}>AI Development</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#3A1F0E" }}>KinfolkAI capabilities and data pipeline</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.4vh]" style={{ width: "3px", height: "4vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#1C0E06" }}>Community Growth</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#3A1F0E" }}>Member acquisition and creator program</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.8vw]">
            <div className="flex-shrink-0 mt-[0.4vh]" style={{ width: "3px", height: "4vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#1C0E06" }}>Team</div>
              <div className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#3A1F0E" }}>Engineering, community, and sales hires</div>
            </div>
          </div>
        </div>
        <div className="mt-[3vh] pt-[2vh]" style={{ borderTop: "1px solid rgba(202,146,43,0.4)" }}>
          <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#1C0E06" }}>MAPPING WITH MELANIN™</div>
          <div className="font-body mt-[0.5vh]" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#7B5408" }}>mappingwithmelanin.com</div>
        </div>
      </div>
    </div>
  );
}
