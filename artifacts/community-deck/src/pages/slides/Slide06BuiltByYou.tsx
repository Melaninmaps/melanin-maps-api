export default function Slide06BuiltByYou() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 90%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>06</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <div className="flex items-center gap-[1.5vw] mb-[1.2vh]">
          <div className="gold-dot" />
          <h2 className="font-display leading-tight tracking-tight" style={{ fontSize: "4.5vw", fontWeight: 700, color: "#FAF6EF" }}>
            Built by people like you.
          </h2>
        </div>
        <div className="gold-rule w-[20vw]" />
      </div>

      {/* 4-column feature grid */}
      <div className="relative flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-4 gap-[1.8vw] h-full">
          {[
            { title: "Creator Videos", body: "Community-made guides and stories", hi: false },
            { title: "Community Tips", body: "Local knowledge from residents", hi: true },
            { title: "Questions", body: "Ask, answer, connect", hi: false },
            { title: "Recommendations", body: "Trusted by people like you", hi: true },
            { title: "Mentors", body: "Learn from those ahead", hi: true },
            { title: "Events", body: "Find your people nearby", hi: false },
            { title: "Businesses", body: "Community-verified listings", hi: false },
            { title: "Safety", body: "Real reports, real alerts", hi: true },
          ].map(({ title, body, hi }) => (
            <div key={title} className="flex flex-col justify-start py-[2vh] px-[1.8vw]"
              style={{ background: hi ? "rgba(202,146,43,0.09)" : "rgba(250,246,239,0.04)", border: `1px solid ${hi ? "rgba(202,146,43,0.3)" : "rgba(202,146,43,0.18)"}` }}>
              <div className="gold-rule w-[2.5vw] mb-[1.2vh]" />
              <span className="font-body mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 600, color: "#FAF6EF", lineHeight: 1.2 }}>{title}</span>
              <span className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#A07840", lineHeight: 1.4 }}>{body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
