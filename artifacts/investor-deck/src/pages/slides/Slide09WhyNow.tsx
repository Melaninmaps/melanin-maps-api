export default function Slide09WhyNow() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(90,45,10,0.5) 0%, transparent 65%)" }} />

      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>09</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw]">
        <div className="font-body mb-[1.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>MARKET TIMING</div>
        <h2 className="font-display text-accent" style={{ fontSize: "5vw", fontWeight: 700 }}>Why now.</h2>
        <div className="inv-rule w-[10vw] mt-[1.5vh]" />
      </div>

      {/* 4 timing factors */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "30vh", bottom: "8vh" }}>
        <div className="flex flex-col gap-[3vh] h-full justify-evenly">
          <div className="flex items-center gap-[3vw]">
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "5vw", fontWeight: 700, opacity: 0.5, minWidth: "8vw" }}>01</div>
            <div className="flex-1 py-[2vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.08)" }}>
              <div className="font-display text-accent" style={{ fontSize: "3.3vw", fontWeight: 700 }}>AI is now accessible</div>
              <p className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75, lineHeight: 1.3 }}>LLMs make personalized community intelligence viable at scale for the first time</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "5vw", fontWeight: 700, opacity: 0.5, minWidth: "8vw" }}>02</div>
            <div className="flex-1 py-[2vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.08)" }}>
              <div className="font-display text-accent" style={{ fontSize: "3.3vw", fontWeight: 700 }}>Community trust is at a premium</div>
              <p className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75, lineHeight: 1.3 }}>Social media fragmentation is driving demand for purpose-built community platforms</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "5vw", fontWeight: 700, opacity: 0.5, minWidth: "8vw" }}>03</div>
            <div className="flex-1 py-[2vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.08)" }}>
              <div className="font-display text-accent" style={{ fontSize: "3.3vw", fontWeight: 700 }}>Black wealth is growing</div>
              <p className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75, lineHeight: 1.3 }}>Rising Black entrepreneurship, mobility, and investment demand culturally specific tools</p>
            </div>
          </div>
          <div className="flex items-center gap-[3vw]">
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "5vw", fontWeight: 700, opacity: 0.5, minWidth: "8vw" }}>04</div>
            <div className="flex-1 py-[2vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.08)" }}>
              <div className="font-display text-accent" style={{ fontSize: "3.3vw", fontWeight: 700 }}>No entrenched competitor</div>
              <p className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75, lineHeight: 1.3 }}>No platform combining community safety, discovery, and AI at this depth exists today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
