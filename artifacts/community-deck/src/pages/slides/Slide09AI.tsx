export default function Slide09AI() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(90,45,10,0.5) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>09</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[4.5vh] pb-[2.5vh] text-center">
        <div className="flex items-center justify-center gap-[1.5vw] mb-[1.5vh]">
          <div className="gold-dot" />
          <h2 className="font-display leading-tight tracking-tight" style={{ fontSize: "4.3vw", fontWeight: 700, color: "#FAF6EF" }}>
            AI that understands your journey.
          </h2>
          <div className="gold-dot" />
        </div>
        <div className="flex justify-center mb-[1vh]"><div className="gold-rule w-[18vw]" /></div>
        <p className="font-body" style={{ fontSize: "2.5vw", fontWeight: 300, color: "#E8B86D" }}>
          Kinfolk AI — your personal community guide.
        </p>
      </div>

      {/* 5-column feature cards */}
      <div className="relative flex-1 px-[5vw] pb-[5vh]">
        <div className="flex gap-[1.6vw] h-full">
          {[
            { title: "Roadmaps",         body: "Step-by-step guides for life's transitions", hi: true },
            { title: "Recommendations",  body: "Personalized to your life stage",            hi: false },
            { title: "Saved Topics",     body: "Your interests, organized and delivered",     hi: true },
            { title: "Weekly Digests",   body: "What matters in your hubs, summarized",       hi: false },
            { title: "Trip Planning",    body: "Travel plans backed by community knowledge",  hi: true },
          ].map(({ title, body, hi }) => (
            <div key={title} className="flex-1 flex flex-col items-center justify-start pt-[4vh] pb-[2.5vh] px-[1.8vw] text-center"
              style={{ background: hi ? "rgba(202,146,43,0.12)" : "rgba(202,146,43,0.06)", border: `1px solid ${hi ? "rgba(202,146,43,0.35)" : "rgba(202,146,43,0.2)"}` }}>
              <div className="gold-rule w-[3vw] mb-[2vh]" />
              <div className="font-display mb-[1.2vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.2 }}>{title}</div>
              <p className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.45 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
