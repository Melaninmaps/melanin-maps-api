const benefits = [
  { headline: "Know before you go.", sub: "Safety, vibes, and verified businesses — all before you arrive." },
  { headline: "Meet people before you move.", sub: "Build friendships and community in your new city." },
  { headline: "Support businesses that reflect your values.", sub: "Every visit strengthens the community." },
  { headline: "Find trusted recommendations.", sub: "Real people. Real experiences. Community-verified." },
  { headline: "Build friendships.", sub: "Circles, events, and local connections that last." },
  { headline: "Discover opportunities.", sub: "Jobs, events, services — curated for your community." },
];

export default function CB07WhyCommunityMembersLoveIt() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>07</div>

      <div className="absolute left-[7vw]" style={{ top: "6.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>WHY COMMUNITY MEMBERS LOVE IT</div>
        <h1 className="font-display" style={{ fontSize: "4.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05 }}>
          It&rsquo;s not a feature.<br /><span style={{ color: "#CA922B" }}>It&rsquo;s a feeling.</span>
        </h1>
      </div>

      <div className="absolute left-[7vw] right-[7vw] grid grid-cols-3" style={{ top: "23vw", gap: "2vw" }}>
        {benefits.map((b, i) => (
          <div key={i} style={{ padding: "1.4vw 1.6vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.2)", background: "rgba(250,246,239,0.03)" }}>
            <div style={{ width: "2.5vw", height: "1.5px", background: "#CA922B", marginBottom: "0.9vw", opacity: 0.7 }} />
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.5vw", lineHeight: 1.3 }}>{b.headline}</div>
            <div className="font-body" style={{ fontSize: "0.9vw", color: "#8B6030", lineHeight: 1.5, fontWeight: 400 }}>{b.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
