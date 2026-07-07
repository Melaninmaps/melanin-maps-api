export default function Slide04WhatWeOffer() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 90% 50%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />

      {/* Left gold bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[1.2vw]" style={{ background: "linear-gradient(180deg, #CA922B, rgba(202,146,43,0.3))" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>04</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw]">
        <h2 className="font-display text-accent leading-tight" style={{ fontSize: "5vw", fontWeight: 800 }}>What we offer your business.</h2>
        <div className="biz-bar w-[18vw] mt-[1.5vh]" />
      </div>

      {/* 5 features — asymmetric 2+3 row */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "28vh", bottom: "8vh" }}>
        {/* Row 1 — 2 wide items */}
        <div className="flex gap-[2.5vw] mb-[2.5vh]" style={{ height: "29vh" }}>
          <div className="flex-1 flex flex-col justify-center px-[2.5vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-primary mb-[1.2vh]" style={{ fontSize: "3.6vw", fontWeight: 800 }}>Business Profile</div>
            <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.8 }}>Hero images, owner story, video, and real reviews</div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-[2.5vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1.2vh]" style={{ fontSize: "3.6vw", fontWeight: 800 }}>Map Discovery</div>
            <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.8 }}>Pin on the full-screen interactive map with category filters</div>
          </div>
        </div>
        {/* Row 2 — 3 items */}
        <div className="flex gap-[2.5vw]" style={{ height: "27vh" }}>
          <div className="flex-1 flex flex-col justify-center px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Community Feed</div>
            <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8 }}>Posts, tips, and recommendations surfaced to your neighborhood</div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-[2vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Events</div>
            <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8 }}>Post and promote events directly to local community members</div>
          </div>
          <div className="flex-1 flex flex-col justify-center px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Promotions</div>
            <div className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8 }}>Paid placement in search, map, and community feeds</div>
          </div>
        </div>
      </div>
    </div>
  );
}
