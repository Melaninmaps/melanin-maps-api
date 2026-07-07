export default function Slide07Dashboard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />

      {/* Top gold bar */}
      <div className="absolute top-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>07</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw]">
        <h2 className="font-display text-accent leading-tight" style={{ fontSize: "5vw", fontWeight: 800 }}>Business Dashboard.</h2>
        <div className="biz-bar w-[16vw] mt-[1.5vh]" />
      </div>

      {/* 3 x 2 grid */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "27vh", bottom: "8vh" }}>
        <div className="grid grid-cols-3 gap-[2vw] h-full">
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Analytics</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Views, clicks, saves, and engagement over time</p>
          </div>
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Review Management</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Respond to reviews and flag inaccurate content</p>
          </div>
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Profile Editor</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Update photos, hours, menu, and owner story</p>
          </div>
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Event Posting</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Create and promote events to local members</p>
          </div>
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Verification</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Submit ownership docs to earn the verified badge</p>
          </div>
          <div className="flex flex-col justify-center px-[2vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary mb-[1vh]" style={{ fontSize: "3.3vw", fontWeight: 800 }}>Promotions</div>
            <p className="font-body text-accent" style={{ fontSize: "2.6vw", fontWeight: 300, opacity: 0.8, lineHeight: 1.4 }}>Boost placement with targeted paid promotion slots</p>
          </div>
        </div>
      </div>
    </div>
  );
}
