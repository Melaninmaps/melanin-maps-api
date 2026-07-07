export default function Slide05Intelligence() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Subtle radial */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(90,45,10,0.5) 0%, transparent 70%)" }} />

      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>05</div>

      {/* Centered header */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw] text-center">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE DATA MOAT</div>
        <h2 className="font-display text-accent" style={{ fontSize: "5vw", fontWeight: 700 }}>
          Community intelligence compounds.
        </h2>
        <div className="flex justify-center mt-[1.5vh]"><div className="inv-rule w-[18vw]" /></div>
      </div>

      {/* 3-column moat */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "34vh", bottom: "8vh" }}>
        <div className="flex gap-[3vw] h-full">
          <div className="flex-1 flex flex-col items-center justify-center text-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display text-primary mb-[2vh]" style={{ fontSize: "10vw", fontWeight: 700, lineHeight: 1 }}>1</div>
            <div className="inv-rule w-[4vw] mb-[2vh]" />
            <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.3vw", fontWeight: 700 }}>Members Join</div>
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Each new member brings their knowledge, journeys, and networks</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[2vh]" style={{ fontSize: "10vw", fontWeight: 700, lineHeight: 1 }}>2</div>
            <div className="inv-rule w-[4vw] mb-[2vh]" />
            <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.3vw", fontWeight: 700 }}>Data Accumulates</div>
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Safety surveys, reviews, tips, and recommendations build a proprietary dataset</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display text-primary mb-[2vh]" style={{ fontSize: "10vw", fontWeight: 700, lineHeight: 1 }}>3</div>
            <div className="inv-rule w-[4vw] mb-[2vh]" />
            <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.3vw", fontWeight: 700 }}>Value Deepens</div>
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Better AI, better recommendations, more business reach — the platform becomes irreplaceable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
