export default function Slide20KinfolkCapabilities() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>21</div>

      <div className="absolute left-[6vw] top-[7vh] max-w-[70vw]">
        <h1 className="font-display leading-tight" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          KinfolkAI works like another member of your team.
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[38vh] grid grid-cols-2 gap-x-[3vw] gap-y-[3vh]">
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns customer feedback into action.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns community insights into opportunities.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns ideas into events.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "3.5vh", background: "#CA922B", flexShrink: 0, marginTop: "0.4vh" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns goals into growth plans.</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[8vh]">
        <div className="inv-rule w-[8vw] mb-[3vh]" />
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#CA922B" }}>
          Powered by your business. Guided by your community.
        </div>
      </div>
    </div>
  );
}
