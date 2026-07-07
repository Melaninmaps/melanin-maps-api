export default function Slide10TheAsk() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />
      {/* Bottom gold rule */}
      <div className="inv-rule absolute bottom-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>10</div>

      {/* Dark left half */}
      <div className="absolute left-0 top-0 w-[48vw] h-full" style={{ background: "#1C0E06" }} />

      {/* Gold divider */}
      <div className="absolute top-0 bottom-0 w-[0.4vw]" style={{ left: "48vw", background: "#CA922B" }} />

      {/* Left — the vision */}
      <div className="absolute left-0 top-0 w-[48vw] h-full flex flex-col justify-center pl-[7vw] pr-[4vw]">
        <div className="font-body mb-[2vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE VISION</div>
        <h2 className="font-display text-accent leading-tight mb-[3vh]" style={{ fontSize: "5vw", fontWeight: 700, textWrap: "balance" }}>
          The infrastructure for the melanated diaspora.
        </h2>
        <div className="inv-rule w-[14vw] mb-[3vh]" />
        <p className="font-body text-accent" style={{ fontSize: "2.9vw", fontWeight: 300, lineHeight: 1.6, opacity: 0.85 }}>
          We are building the layer of trust, intelligence, and connection that millions of minorities and the melanated diaspora have needed — and that no platform has ever built for them.
        </p>
      </div>

      {/* Right — the ask */}
      <div className="absolute top-0 bottom-0 flex flex-col justify-center pl-[5vw] pr-[7vw]" style={{ left: "50vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>USE OF FUNDS</div>
        <div className="flex flex-col gap-[3vh]">
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] flex-shrink-0" style={{ height: "5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>City Expansion</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E" }}>Launch operations in next 3 markets</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] flex-shrink-0" style={{ height: "5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>AI Development</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E" }}>KinfolkAI capabilities and data pipeline</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] flex-shrink-0" style={{ height: "5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>Community Growth</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E" }}>Member acquisition and creator program</div>
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="w-[3px] flex-shrink-0" style={{ height: "5vh", background: "#CA922B" }} />
            <div>
              <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>Team</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E" }}>Engineering, community, and sales hires</div>
            </div>
          </div>
        </div>
        <div className="mt-[3.5vh] pt-[2.5vh]" style={{ borderTop: "1px solid rgba(202,146,43,0.4)" }}>
          <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 700, color: "#1C0E06" }}>MAPPING WITH MELANIN™</div>
          <div className="font-body mt-[0.5vh]" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#7B5408" }}>mappingwithmelanin.com</div>
        </div>
      </div>
    </div>
  );
}
