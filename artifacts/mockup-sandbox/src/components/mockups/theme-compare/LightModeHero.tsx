export default function LightModeHero() {
  return (
    <div className="w-full min-h-screen font-sans" style={{ background: "#FAF6EF", color: "#3A1F0E" }}>
      {/* Nav — stays espresso dark in both modes */}
      <header style={{ background: "#2B1507", borderBottom: "1px solid rgba(255,255,255,0.08)" }} className="w-full px-8 h-16 flex items-center justify-between">
        <span className="font-serif font-bold text-white text-lg">Mapping with Melanin™</span>
        <div className="flex items-center gap-6 text-sm font-medium" style={{ color: "#F5EBD8" }}>
          <span className="opacity-80">Businesses</span>
          <span className="opacity-80">Safety</span>
          <span className="opacity-80">Community</span>
          <span className="opacity-80">KinfolkAI™</span>
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center opacity-70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </div>
          <div className="px-5 py-2 rounded-full text-white font-semibold text-sm" style={{ background: "#CA922B" }}>Join the Waitlist</div>
        </div>
      </header>

      {/* Hero — always dark (brand identity) */}
      <section className="relative w-full" style={{ minHeight: 420, background: "#2B1507" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(202,146,43,0.10) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", color: "#CA922B" }}>Safety-First Community Intelligence</div>
            <h1 className="font-serif font-bold leading-tight mb-4" style={{ fontSize: 52, color: "#fff" }}>
              Map Your Life.<br />
              <span style={{ color: "#CA922B" }}>Connect Deeper.</span><br />
              Live With Purpose.
            </h1>
            <p className="font-semibold mb-3" style={{ fontSize: 18, color: "rgba(245,235,216,0.82)", lineHeight: 1.6 }}>
              Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, and new opportunities.
            </p>
            <p className="font-semibold" style={{ fontSize: 15, color: "rgba(245,235,216,0.62)", lineHeight: 1.6 }}>
              Most platforms tell you where to go. We help you understand what's really there.
            </p>
          </div>
          {/* Waitlist card */}
          <div className="rounded-2xl p-8" style={{ background: "rgba(42,22,7,0.7)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
            <h2 className="font-serif font-bold text-white mb-1" style={{ fontSize: 22 }}>Join the Waitlist</h2>
            <p className="font-semibold mb-1 text-sm" style={{ color: "rgba(245,235,216,0.62)" }}>Free to join. No spam, ever.</p>
            <p className="font-medium mb-5 text-xs" style={{ color: "rgba(245,235,216,0.42)" }}>We don't sell your attention—we help our community discover great businesses.</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {["First name", "Last name"].map(p => (
                  <input key={p} placeholder={p} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none" }} />
                ))}
              </div>
              <input placeholder="Enter your email address" className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none" }} />
              <button className="w-full py-3 rounded-full font-bold text-white text-base" style={{ background: "#CA922B" }}>Join the Waitlist</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip — always dark */}
      <div className="py-6 border-y" style={{ background: "#3A1F0E", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-4 gap-4 text-center">
          {[["2+ Members", "And growing every day"], ["200+ Cities", "Across the US and beyond"], ["96/100 Score", "Top-rated destinations"], ["100% Community", "Every insight, every review"]].map(([val, sub]) => (
            <div key={val}>
              <div className="font-serif font-bold text-xl mb-0.5" style={{ color: "#CA922B" }}>{val}</div>
              <div className="text-xs font-semibold" style={{ color: "rgba(245,235,216,0.7)" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature section — LIGHT mode difference shows here */}
      <section className="py-14" style={{ background: "#FAF6EF" }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-10">
            <div className="inline-flex px-4 py-1.5 rounded-full mb-4 text-xs font-bold tracking-widest uppercase" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", color: "#B8820F" }}>Explore The Platform</div>
            <h2 className="font-serif font-bold mb-3" style={{ fontSize: 36, color: "#2B1507" }}>Everything You Need in One Place</h2>
            <p className="font-semibold" style={{ color: "#6B3E1A", fontSize: 16 }}>Discover, connect, and make decisions with real intelligence behind every choice.</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: "🏪", label: "Discover", title: "Find Black-Owned Businesses", desc: "Search by category, safety rating, and community confidence score." },
              { icon: "🛡️", label: "Safety", title: "Safety Intelligence", desc: "Community-powered neighborhood safety reports and insights." },
              { icon: "✈️", label: "KinfolkAI™", title: "Plan Your Journey", desc: "AI-powered travel planning tailored to your cultural identity." },
            ].map(({ icon, label, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 shadow-sm" style={{ background: "#fff", border: "1px solid rgba(58,31,14,0.1)" }}>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#CA922B" }}>{label}</div>
                <h3 className="font-serif font-bold mb-2" style={{ fontSize: 17, color: "#2B1507" }}>{title}</h3>
                <p className="text-sm font-semibold" style={{ color: "#6B3E1A" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — warm cream in light mode */}
      <section className="py-12" style={{ background: "#F0E8D6", borderTop: "1px solid rgba(58,31,14,0.08)" }}>
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="font-serif font-bold mb-3" style={{ fontSize: 32, color: "#2B1507" }}>Built by Our Community, for Our Community</h2>
          <p className="font-semibold mb-6" style={{ color: "#6B3E1A", fontSize: 16, lineHeight: 1.6 }}>
            Mapping with Melanin™ is more than a platform — it's a movement to keep Black dollars in Black communities.
          </p>
          <button className="px-8 py-3 rounded-full font-bold text-white" style={{ background: "#CA922B" }}>Get Early Access</button>
        </div>
      </section>

      {/* Mode label */}
      <div className="text-center py-4" style={{ background: "#FAF6EF", borderTop: "1px solid rgba(58,31,14,0.08)" }}>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#CA922B" }}>☀️ Light Mode</span>
      </div>
    </div>
  );
}
