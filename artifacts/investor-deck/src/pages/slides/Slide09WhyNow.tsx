export default function Slide09WhyNow() {
  const reasons = [
    {
      n: "01",
      title: "AI is now accessible",
      body: "LLMs make personalized community intelligence viable at scale for the first time.",
    },
    {
      n: "02",
      title: "Community trust is at a premium",
      body: "Social media fragmentation is driving demand for purpose-built community platforms.",
    },
    {
      n: "03",
      title: "Minority wealth is growing",
      body: "Rising minority entrepreneurship, mobility, and investment demand culturally specific tools.",
    },
    {
      n: "04",
      title: "No entrenched competitor",
      body: "No platform combining community safety, discovery, and AI at this depth exists today.",
    },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(90,45,10,0.5) 0%, transparent 65%)" }} />
      <div className="inv-rule w-full relative" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>09</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="font-body mb-[1.2vh]" style={{ fontSize: "1.9vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>MARKET TIMING</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF" }}>Why now.</h2>
        <div className="inv-rule w-[8vw] mt-[1.2vh]" />
      </div>

      {/* 4 factors */}
      <div className="relative flex-1 px-[7vw] pb-[6vh] flex flex-col justify-evenly">
        {reasons.map(({ n, title, body }) => (
          <div key={n} className="flex items-center gap-[3vw]">
            <div className="font-display flex-shrink-0" style={{ fontSize: "3vw", fontWeight: 700, color: "#CA922B", opacity: 0.5, minWidth: "7vw" }}>{n}</div>
            <div className="flex-1 py-[1.2vh] px-[2.5vw]" style={{ border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.08)" }}>
              <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#FAF6EF" }}>{title}</div>
              <p className="font-body" style={{ fontSize: "1.95vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8, lineHeight: 1.4 }}>{body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
