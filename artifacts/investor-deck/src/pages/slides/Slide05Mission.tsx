export default function Slide05Mission() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      <div className="absolute left-[6vw] right-[6vw] top-[10vh]">
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          That&rsquo;s why Mapping with Melanin&trade; exists.
        </h1>
      </div>

      <div className="absolute left-[6vw] top-[34vh] flex flex-col gap-[2.2vh]">
        <div className="flex items-center gap-[1.4vw]">
          <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", border: "3px solid #CA922B" }} />
          <div className="font-body" style={{ fontSize: "3vw", color: "#7B5408", fontWeight: 500 }}>Not to build another directory.</div>
        </div>
        <div className="flex items-center gap-[1.4vw]">
          <div style={{ width: "2.4vw", height: "2.4vw", borderRadius: "50%", border: "3px solid #CA922B" }} />
          <div className="font-body" style={{ fontSize: "3vw", color: "#7B5408", fontWeight: 500 }}>Not to build another social network.</div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[8vh]">
        <div className="inv-rule w-[10vw] mb-[3.5vh]" />
        <div className="grid grid-cols-3 gap-[2vw]">
          <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06" }}>To build confidence.</div>
          <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06" }}>To build community.</div>
          <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06" }}>To build opportunity.</div>
        </div>
      </div>
    </div>
  );
}
