export default function Slide06Revenue() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>06</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>REVENUE MODEL</div>
        <h2 className="font-display" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06" }}>Four revenue streams.</h2>
        <div className="inv-rule w-[14vw] mt-[1.5vh]" />
      </div>

      {/* 2 x 2 grid */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "30vh", bottom: "8vh" }}>
        <div className="grid grid-cols-2 gap-[2.5vw] h-full">
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 01</div>
            <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700 }}>Member Subscriptions</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Navigator and Trailblazer tiers — monthly and annual membership plans</p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 02</div>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#1C0E06" }}>Business Subscriptions</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4 }}>Monthly plans for business profiles, dashboard tools, and listing features</p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.05)" }}>
            <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 03</div>
            <div className="font-display mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700, color: "#1C0E06" }}>Business Promotions</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.4 }}>Paid placement in search, map, feeds, hubs, and AI recommendations</p>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[3vw]" style={{ background: "#1C0E06" }}>
            <div className="font-body mb-[1vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.12em", fontWeight: 300 }}>STREAM 04</div>
            <div className="font-display text-accent mb-[1.5vh]" style={{ fontSize: "3.8vw", fontWeight: 700 }}>Community Data</div>
            <div className="inv-rule w-[4vw] mb-[1.5vh]" />
            <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>Anonymized neighborhood intelligence for developers, researchers, and city planners</p>
          </div>
        </div>
      </div>
    </div>
  );
}
