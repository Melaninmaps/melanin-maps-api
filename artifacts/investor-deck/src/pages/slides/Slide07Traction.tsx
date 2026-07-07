export default function Slide07Traction() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>07</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>TRACTION</div>
        <h2 className="font-display" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06" }}>Where we stand today.</h2>
        <div className="inv-rule w-[16vw] mt-[1.5vh]" />
      </div>

      {/* Timeline — 4 milestones */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "30vh", bottom: "8vh" }}>
        {/* Horizontal gold line */}
        <div className="absolute left-0 right-0" style={{ top: "12vh", height: "3px", background: "linear-gradient(90deg, #CA922B, rgba(202,146,43,0.3))" }} />

        <div className="flex gap-[2vw] h-full">
          <div className="flex-1 flex flex-col">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full mb-[2vh]" style={{ background: "#CA922B" }} />
            <div className="flex flex-col flex-1 py-[2vh] px-[1.5vw]" style={{ background: "#1C0E06" }}>
              <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>FOUNDATION</div>
              <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Platform Built</div>
              <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Mobile app, web platform, API, and AI launched and operational</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full mb-[2vh]" style={{ background: "#CA922B" }} />
            <div className="flex flex-col flex-1 py-[2vh] px-[1.5vw]" style={{ background: "#1C0E06" }}>
              <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>LAUNCHED</div>
              <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.2vw", fontWeight: 700 }}>Philadelphia</div>
              <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>First city go-live with full business listings, community hubs, and safety features</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full mb-[2vh]" style={{ background: "#CA922B", opacity: 0.5 }} />
            <div className="flex flex-col flex-1 py-[2vh] px-[1.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.04)" }}>
              <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300 }}>NEXT</div>
              <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06" }}>Founding 500</div>
              <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4 }}>Anchor business program to establish commercial foundation in first markets</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="w-[1.5vw] h-[1.5vw] rounded-full mb-[2vh]" style={{ background: "#CA922B", opacity: 0.3 }} />
            <div className="flex flex-col flex-1 py-[2vh] px-[1.5vw]" style={{ border: "1px solid rgba(202,146,43,0.2)", background: "rgba(202,146,43,0.02)" }}>
              <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 300, opacity: 0.5 }}>AHEAD</div>
              <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06", opacity: 0.7 }}>Multi-City Expansion</div>
              <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4, opacity: 0.7 }}>Atlanta, Houston, D.C., Chicago — rolling city launches with local community partners</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
