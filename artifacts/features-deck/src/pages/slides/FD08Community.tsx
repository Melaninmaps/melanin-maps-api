const features = [
  {
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    title: "Community Feed",
    body: "Local stories, business updates, and neighbor recommendations — in real time.",
  },
  {
    icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    title: "Events",
    body: "From jazz nights to community clean-ups — Zara finds her people at the table.",
  },
  {
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    title: "Circles",
    body: "Private groups for families, crews, and collectives planning together.",
  },
  {
    icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    title: "Saved Spots",
    body: "Share your favorite places with your circle — and discover theirs.",
  },
];

export default function FD08Community() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 65% 35%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>08</div>

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "38vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "1.6vw" }}>COMMUNITY &amp; EVENTS</div>
        <h2 className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2vw" }}>
          Tonight she&rsquo;s meeting someone she found<br />
          <span style={{ color: "#CA922B" }}>through the community.</span>
        </h2>
        <div style={{ width: "4vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <p className="font-body" style={{ fontSize: "1.15vw", color: "#6B4420", lineHeight: 1.75 }}>
          Mapping With Melanin isn&rsquo;t just discovery. It&rsquo;s belonging. Every connection deepens the network — for Zara and for every person who joins after her.
        </p>
      </div>

      <div className="absolute grid grid-cols-2 gap-[1.2vw]" style={{ right: "6vw", top: "12%", bottom: "12%", width: "38vw", alignContent: "center" }}>
        {features.map((f) => (
          <div key={f.title} style={{ padding: "1.6vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(202,146,43,0.04)", display: "flex", flexDirection: "column", gap: "0.8vw" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.8vw", height: "1.8vw" }}>
              <path d={f.icon} />
            </svg>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#E8B86D" }}>{f.title}</div>
            <div className="font-body" style={{ fontSize: "0.95vw", color: "#6B4420", lineHeight: 1.55 }}>{f.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
