export default function Slide20KinfolkCapabilities() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>21</div>

      <div className="absolute left-[6vw] top-[9vh] max-w-[46vw]">
        <h1 className="font-display leading-tight" style={{ fontSize: "4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Kinfolk AI helps businesses with&hellip;
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[32vh] grid grid-cols-2 gap-x-[3vw] gap-y-[3vh]">
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2.4vw", color: "#3A1F0E", fontWeight: 500 }}>Marketing ideas</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2.4vw", color: "#3A1F0E", fontWeight: 500 }}>Event planning</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2.4vw", color: "#3A1F0E", fontWeight: 500 }}>Review responses</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2.4vw", color: "#3A1F0E", fontWeight: 500 }}>Growth strategies</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[8vh]">
        <div className="inv-rule w-[8vw] mb-[3vh]" />
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#CA922B" }}>
          Spend less time managing. More time building.
        </div>
      </div>
    </div>
  );
}
