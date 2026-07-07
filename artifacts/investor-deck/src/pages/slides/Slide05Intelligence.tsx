export default function Slide05Intelligence() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(90,45,10,0.5) 0%, transparent 70%)" }} />
      <div className="inv-rule w-full relative" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>05</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh] text-center">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE DATA MOAT</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF" }}>
          Community intelligence compounds.
        </h2>
        <div className="flex justify-center mt-[1.2vh]">
          <div className="inv-rule w-[16vw]" />
        </div>
      </div>

      {/* 3 columns */}
      <div className="relative flex-1 px-[7vw] pb-[6vh]">
        <div className="flex gap-[2.5vw] h-full">
          <div className="flex-1 flex flex-col items-center justify-start py-[3vh] px-[2vw] text-center" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>1</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FAF6EF" }}>Members Join</div>
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.5 }}>
              Each new member brings their knowledge, journeys, and networks to the platform.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-start py-[3vh] px-[2vw] text-center" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>2</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FAF6EF" }}>Data Accumulates</div>
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.5 }}>
              Safety surveys, reviews, tips, and recs build a proprietary dataset no competitor can replicate.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-start py-[3vh] px-[2vw] text-center" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>3</div>
            <div className="inv-rule w-[3.5vw] mb-[1.2vh]" />
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FAF6EF" }}>Value Deepens</div>
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.5 }}>
              Better AI, better recommendations, more business reach — the platform becomes irreplaceable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
