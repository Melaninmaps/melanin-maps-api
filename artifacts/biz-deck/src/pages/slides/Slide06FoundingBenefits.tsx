export default function Slide06FoundingBenefits() {
  return (
    <div className="w-screen h-screen overflow-hidden flex" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />

      {/* Gold left column */}
      <div className="flex-shrink-0 w-[8vw] flex flex-col items-center justify-center" style={{ background: "#CA922B" }}>
        <div className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, letterSpacing: "0.2em", writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#1C0E06" }}>
          FOUNDING 500
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col pl-[4vw] pr-[6vw] pt-[5vh] pb-[6vh]">
        {/* Header */}
        <div className="mb-[2.5vh]">
          <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
            Founding benefits.
          </h2>
          <div className="biz-bar w-[13vw] mt-[1.2vh]" />
        </div>

        {/* 5 benefits */}
        <div className="flex-1 flex flex-col justify-evenly">
          <div className="flex items-center gap-[2.5vw] py-[1.8vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display flex-shrink-0" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B" }}>01</div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Permanent Gold Badge</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>Founding business seal displayed on your profile forever</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[1.8vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display flex-shrink-0" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B" }}>02</div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Priority Listing</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>Top placement in search, map, and category results</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[1.8vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display flex-shrink-0" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B" }}>03</div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Locked-In Rate</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>Founding member pricing stays fixed as the platform grows</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[1.8vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display flex-shrink-0" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B" }}>04</div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Early Feature Access</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>First to use new business tools and dashboard features</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[1.8vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display flex-shrink-0" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B" }}>05</div>
            <div>
              <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#FAF6EF" }}>Featured in Launch Campaign</div>
              <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.75, lineHeight: 1.3 }}>Included in city launch marketing and press</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
