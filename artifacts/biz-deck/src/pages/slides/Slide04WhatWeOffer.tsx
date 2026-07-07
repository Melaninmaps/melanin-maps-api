export default function Slide04WhatWeOffer() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 90% 50%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />
      <div className="absolute left-0 top-0 bottom-0 w-[1vw]" style={{ background: "linear-gradient(180deg, #CA922B, rgba(202,146,43,0.3))" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>04</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
          What we offer your business.
        </h2>
        <div className="biz-bar w-[16vw] mt-[1.2vh]" />
      </div>

      {/* Features grid */}
      <div className="relative flex-1 px-[7vw] pb-[6vh] flex flex-col gap-[2vh]">
        {/* Row 1 — 2 wide items */}
        <div className="flex gap-[2vw]" style={{ flex: "1.1" }}>
          <div className="flex-1 flex flex-col justify-start px-[2.5vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "3vw", fontWeight: 800, color: "#CA922B" }}>Business Profile</div>
            <div className="font-body" style={{ fontSize: "2.3vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Hero images, owner story, video, and real reviews</div>
          </div>
          <div className="flex-1 flex flex-col justify-start px-[2.5vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "3vw", fontWeight: 800, color: "#CA922B" }}>Map Discovery</div>
            <div className="font-body" style={{ fontSize: "2.3vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Pin on the full-screen interactive map with category filters</div>
          </div>
        </div>
        {/* Row 2 — 3 items */}
        <div className="flex gap-[2vw]" style={{ flex: "1" }}>
          <div className="flex-1 flex flex-col justify-start px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.7vw", fontWeight: 800, color: "#CA922B" }}>Community Feed</div>
            <div className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Posts, tips, and recommendations surfaced to your neighborhood</div>
          </div>
          <div className="flex-1 flex flex-col justify-start px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.7vw", fontWeight: 800, color: "#CA922B" }}>Events</div>
            <div className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Post and promote events directly to local community members</div>
          </div>
          <div className="flex-1 flex flex-col justify-start px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display mb-[0.8vh]" style={{ fontSize: "2.7vw", fontWeight: 800, color: "#CA922B" }}>Promotions</div>
            <div className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.4 }}>Paid placement in search, map, and community feeds</div>
          </div>
        </div>
      </div>
    </div>
  );
}
