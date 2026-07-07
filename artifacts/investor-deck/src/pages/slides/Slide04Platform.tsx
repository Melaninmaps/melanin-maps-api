export default function Slide04Platform() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>04</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE PLATFORM</div>
        <h2 className="font-display" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06" }}>
          One platform. Four interconnected layers.
        </h2>
        <div className="inv-rule w-[22vw] mt-[1.5vh]" />
      </div>

      {/* 4 platform layers — 2x2 grid */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "32vh", bottom: "8vh" }}>
        <div className="grid grid-cols-2 gap-[2.5vw] h-full">
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#CA922B" }}>Community</div>
            <div className="inv-rule w-[5vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.4 }}>
              Hubs, feeds, safety surveys, local knowledge — living communities, not static pages
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#1C0E06" }}>Discovery</div>
            <div className="inv-rule w-[5vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4 }}>
              Minority-owned business listings, map, verified reviews, and neighborhood safety data
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#1C0E06" }}>Intelligence</div>
            <div className="inv-rule w-[5vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4 }}>
              KinfolkAI provides personalized roadmaps, trip planning, and life-stage recommendations
            </p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "#1C0E06" }}>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#CA922B" }}>Commerce</div>
            <div className="inv-rule w-[5vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.85, lineHeight: 1.4 }}>
              Memberships, business subscriptions, promotions, and Founding 500 program
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
