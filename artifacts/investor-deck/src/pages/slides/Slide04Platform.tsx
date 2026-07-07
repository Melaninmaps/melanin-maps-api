export default function Slide04Platform() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>04</div>

      {/* Header */}
      <div className="px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE PLATFORM</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#1C0E06" }}>
          One platform. Four interconnected layers.
        </h2>
        <div className="inv-rule w-[20vw] mt-[1.2vh]" />
      </div>

      {/* 2x2 grid */}
      <div className="flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-2 gap-[2vw] h-full">
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B" }}>Community</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Hubs, feeds, safety surveys, local knowledge — living communities, not static pages.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#1C0E06" }}>Discovery</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.5 }}>
              Minority-owned business listings, map, verified reviews, and neighborhood safety data.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#1C0E06" }}>Intelligence</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.5 }}>
              KinfolkAI provides personalized roadmaps, trip planning, and life-stage recommendations.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#CA922B" }}>Commerce</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Memberships, business subscriptions, promotions, and the Founding 500 program.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
