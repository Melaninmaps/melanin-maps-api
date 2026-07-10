export default function Slide24OneMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>32</div>

      <div className="absolute left-[6vw] right-[6vw] top-[10vh]">
        <div className="grid grid-cols-2 gap-x-[3vw] gap-y-[2.4vh]">
          <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>Helping families relocate with confidence.</div>
          <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>Helping travelers feel welcome.</div>
          <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>Helping entrepreneurs grow.</div>
          <div className="font-body" style={{ fontSize: "2.5vw", color: "#3A1F0E", fontWeight: 500 }}>Helping communities connect.</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[10vh] text-center">
        <div className="inv-rule mx-auto w-[8vw] mb-[4vh]" />
        <div className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#1C0E06" }}>
          One map.
        </div>
        <div className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#CA922B" }}>
          One movement.
        </div>
      </div>
    </div>
  );
}
