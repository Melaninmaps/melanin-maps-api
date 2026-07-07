export default function Slide05Hubs() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>05</div>

      {/* Left column — header + description */}
      <div className="absolute left-[7vw] top-0 bottom-0 w-[32vw] flex flex-col justify-center pr-[3vw]">
        <div className="gold-dot mb-[2.5vh]" />
        <h2 className="font-display text-accent leading-tight tracking-tight mb-[2vh]" style={{ fontSize: "5.2vw", fontWeight: 700 }}>
          Community Hubs
        </h2>
        <div className="gold-rule w-[14vw] mb-[2.5vh]" />
        <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.5, textWrap: "pretty" }}>
          Not topics. Living communities built around who you are and what you carry.
        </p>
      </div>

      {/* Right — 4 x 2 grid of hubs */}
      <div className="absolute right-[5vw] top-[10vh] bottom-[10vh] left-[42vw] flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-[2vw]">
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.12)", borderLeft: "3px solid #CA922B" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Brazil</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", borderLeft: "3px solid rgba(202,146,43,0.4)" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Diabetes</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", borderLeft: "3px solid rgba(202,146,43,0.4)" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Natural Hair</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.12)", borderLeft: "3px solid #CA922B" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Philadelphia</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.12)", borderLeft: "3px solid #CA922B" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Melanated History</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", borderLeft: "3px solid rgba(202,146,43,0.4)" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Autism</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", borderLeft: "3px solid rgba(202,146,43,0.4)" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Small Business</span>
          </div>
          <div className="py-[2.2vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.12)", borderLeft: "3px solid #CA922B" }}>
            <span className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 600 }}>Parenting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
