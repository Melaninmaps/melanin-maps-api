export default function Slide07Safety() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute left-0 top-0 bottom-0 w-[0.7vw]" style={{ background: "linear-gradient(180deg, rgba(202,146,43,0.5) 0%, rgba(202,146,43,0.15) 50%, rgba(202,146,43,0.5) 100%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>07</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[4.5vh] pb-[2vh]">
        <div className="flex items-center gap-[1vw] mb-[1.5vh]">
          <div className="gold-dot" />
          <span className="font-body" style={{ fontSize: "1.9vw", letterSpacing: "0.12em", fontWeight: 300, color: "#CA922B" }}>COMMUNITY SAFETY</span>
        </div>
        <h2 className="font-display leading-tight tracking-tight" style={{ fontSize: "4.3vw", fontWeight: 700, color: "#FAF6EF" }}>
          Safety that travels with you.
        </h2>
        <div className="gold-rule w-[18vw] mt-[1vh]" />
      </div>

      {/* 3×2 feature grid */}
      <div className="relative flex-1 px-[7vw] pb-[5vh]">
        <div className="grid grid-cols-3 gap-[1.8vw] h-full">
          {[
            { title: "Neighborhoods",      body: "Community safety scores from people who live there", hi: true },
            { title: "Meetup Verification", body: "Verified check-ins for safe meet-ups", hi: false },
            { title: "Officer Watch",       body: "Real-time community reports on encounters", hi: true },
            { title: "Community Alerts",    body: "Hyper-local warnings from your network", hi: false },
            { title: "Emergency Resources", body: "Vetted resources available wherever you are", hi: true },
            { title: "Travel Confidence",   body: "Go anywhere knowing your community has your back", hi: false },
          ].map(({ title, body, hi }) => (
            <div key={title} className="flex flex-col justify-start py-[2.2vh] px-[2vw]"
              style={{ background: hi ? "rgba(202,146,43,0.1)" : "rgba(202,146,43,0.05)", border: `1px solid ${hi ? "rgba(202,146,43,0.3)" : "rgba(202,146,43,0.18)"}` }}>
              <div className="font-display mb-[1vh]" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#CA922B" }}>{title}</div>
              <div className="gold-rule w-[3vw] mb-[1vh]" />
              <p className="font-body" style={{ fontSize: "2.2vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.45 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
