const ICONS = [
  // Person / consumer
  <svg key="consumer" width="2.4vw" height="2.4vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>,
  // Store / business
  <svg key="business" width="2.4vw" height="2.4vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-5h16l1 5"/>
    <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/>
    <path d="M5 9v11h14V9"/>
    <path d="M9 14h6v6H9z"/>
  </svg>,
  // Globe / community
  <svg key="community" width="2.4vw" height="2.4vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3c-2.5 3-4 5.7-4 9s1.5 6 4 9"/>
    <path d="M12 3c2.5 3 4 5.7 4 9s-1.5 6-4 9"/>
    <path d="M3 12h18"/>
    <path d="M3.6 8h16.8M3.6 16h16.8"/>
  </svg>,
];

const CARDS = [
  {
    label: "CONSUMERS",
    copy: "Discover trusted places and people.",
  },
  {
    label: "BUSINESSES",
    copy: "Grow with community-powered discovery.",
  },
  {
    label: "COMMUNITIES",
    copy: "Strengthen trust through shared experiences.",
  },
];

export default function Slide21OneCommunity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 20%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>29</div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "4.5vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "1.4vw" }} />
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.5 }}>
          This is bigger than finding businesses.<br />
          It's about strengthening <span style={{ color: "#CA922B" }}>communities</span> through <span style={{ color: "#CA922B" }}>economic opportunity</span>.
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[3.9vw] text-center">
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#FAF6EF" }}>
          Built for Every Part of the Community.
        </h1>
      </div>

      <div className="absolute left-[6vw] right-[6vw] text-center" style={{ top: "15.75vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 600 }}>
          WHO WE SERVE
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] grid grid-cols-3 gap-[2vw]" style={{ top: "18.6vw" }}>
        {CARDS.map((card, i) => (
          <div key={card.label} className="p-[2vw]" style={{ borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(250,246,239,0.04)" }}>
            <div className="mb-[0.68vw]" style={{ lineHeight: 1 }}>{ICONS[i]}</div>
            <div className="font-body mb-[0.79vw]" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600 }}>{card.label}</div>
            <div className="font-display" style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.3 }}>{card.copy}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
