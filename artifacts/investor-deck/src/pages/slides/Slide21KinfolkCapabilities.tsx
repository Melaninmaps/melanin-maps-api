export default function Slide20KinfolkCapabilities() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>21</div>

      <div className="absolute left-0 right-0 top-[3.9vw] text-center">
        <h1 className="font-display leading-tight" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          KinfolkAI works like another member of your team.
        </h1>
        <div className="font-body mx-auto" style={{ fontSize: "1.5vw", color: "#6B4A2C", fontWeight: 500, marginTop: "1.1vw", maxWidth: "50vw" }}>
          More than automation&mdash;KinfolkAI understands your business in the context of your community.
        </div>
      </div>

      <div className="absolute left-[16vw] right-[16vw] top-[21.4vw] grid grid-cols-2 gap-x-[4vw] gap-y-[2.3vw]">
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "1.97vw", background: "#CA922B", flexShrink: 0, marginTop: "0.23vw" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Helps you understand your customers.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "1.97vw", background: "#CA922B", flexShrink: 0, marginTop: "0.23vw" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Reveals opportunities hidden in your community.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "1.97vw", background: "#CA922B", flexShrink: 0, marginTop: "0.23vw" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns opportunities into action.</div>
        </div>
        <div className="flex items-start gap-[1.2vw]">
          <div style={{ width: "3px", height: "1.97vw", background: "#CA922B", flexShrink: 0, marginTop: "0.23vw" }} />
          <div className="font-body" style={{ fontSize: "2vw", color: "#3A1F0E", fontWeight: 500 }}>Turns goals into growth plans.</div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-[4.5vw] text-center">
        <div className="inv-rule w-[8vw] mb-[1.7vw] mx-auto" />
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#CA922B" }}>
          Powered by your business. Guided by your community.
        </div>
      </div>
    </div>
  );
}
