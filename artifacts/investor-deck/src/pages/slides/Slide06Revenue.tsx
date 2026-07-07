export default function Slide06Revenue() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>06</div>

      {/* Header */}
      <div className="px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>REVENUE MODEL</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#1C0E06" }}>Four revenue streams.</h2>
        <div className="inv-rule w-[13vw] mt-[1.2vh]" />
      </div>

      {/* 2x2 grid */}
      <div className="flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-2 gap-[2vw] h-full">
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 01</div>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "3.3vw", fontWeight: 700, color: "#FAF6EF" }}>Member Subscriptions</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Navigator and Trailblazer tiers — monthly and annual membership plans.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 02</div>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "3.3vw", fontWeight: 700, color: "#1C0E06" }}>Business Subscriptions</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.5 }}>
              Monthly plans for business profiles, dashboard tools, and listing features.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 03</div>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "3.3vw", fontWeight: 700, color: "#1C0E06" }}>Business Promotions</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#1C0E06", lineHeight: 1.5 }}>
              Paid placement in search, map, feeds, hubs, and AI recommendations.
            </p>
          </div>
          <div className="flex flex-col justify-start py-[2.5vh] px-[2.5vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[0.8vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 04</div>
            <div className="font-display mb-[1.2vh]" style={{ fontSize: "3.3vw", fontWeight: 700, color: "#FAF6EF" }}>Community Data</div>
            <div className="inv-rule w-[4vw] mb-[1.2vh]" />
            <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.5 }}>
              Anonymized neighborhood intelligence for developers, researchers, and city planners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
