export default function Slide07Traction() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>07</div>

      {/* Header */}
      <div className="px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>TRACTION</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#1C0E06" }}>Where we stand today.</h2>
        <div className="inv-rule w-[14vw] mt-[1.2vh]" />
      </div>

      {/* 4 milestone cards */}
      <div className="flex-1 px-[7vw] pb-[6vh]">
        <div className="flex gap-[2vw] h-full">
          {/* Card 1 */}
          <div className="flex-1 flex flex-col py-[2.5vh] px-[2vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>FOUNDATION</div>
            <div className="font-display mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FAF6EF" }}>Platform Built</div>
            <div className="inv-rule w-[3vw] mb-[1vh]" />
            <p className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Mobile app, web platform, API, and AI — launched and operational.
            </p>
          </div>
          {/* Card 2 */}
          <div className="flex-1 flex flex-col py-[2.5vh] px-[2vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>LAUNCHED</div>
            <div className="font-display mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FAF6EF" }}>Philadelphia</div>
            <div className="inv-rule w-[3vw] mb-[1vh]" />
            <p className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              First city go-live with full business listings, community hubs, and safety features.
            </p>
          </div>
          {/* Card 3 */}
          <div className="flex-1 flex flex-col py-[2.5vh] px-[2vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.04)" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>NEXT</div>
            <div className="font-display mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#1C0E06" }}>Founding 500</div>
            <div className="inv-rule w-[3vw] mb-[1vh]" />
            <p className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.5 }}>
              Anchor business program to establish commercial foundation in first markets.
            </p>
          </div>
          {/* Card 4 */}
          <div className="flex-1 flex flex-col py-[2.5vh] px-[2vw]" style={{ border: "1px solid rgba(202,146,43,0.2)", background: "rgba(202,146,43,0.02)" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300, opacity: 0.6 }}>AHEAD</div>
            <div className="font-display mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#3A1F0E" }}>Multi-City Expansion</div>
            <div className="inv-rule w-[3vw] mb-[1vh]" />
            <p className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.5 }}>
              Atlanta, Houston, D.C., Chicago — rolling city launches with local community partners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
