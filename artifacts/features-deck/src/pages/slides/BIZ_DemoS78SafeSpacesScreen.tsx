const PLACES = [
  { name: "Busboys and Poets", city: "Washington, DC", tags: ["Welcoming","Cultural","Dining"], posts: 214, verified: true },
  { name: "Sankofa Video Books & Café", city: "Washington, DC", tags: ["Books","Safe","Community"], posts: 98, verified: true },
  { name: "The Ivy at Eden", city: "Kingston, Jamaica", tags: ["Travel-Safe","Welcoming"], posts: 43, verified: false },
  { name: "Golden Krust", city: "Brooklyn, NY", tags: ["Authentic","Friendly"], posts: 77, verified: true },
];

export default function DemoS78SafeSpacesScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>78</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Safe.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          The diaspora marks what's welcoming.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Browse community-verified spots across cities and countries. Filter by neighborhood, language, or vibe. Each entry grows richer with every post tagged to it — no editorial team required.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Safety is a shared language.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#0D0805" }}>
            {/* Header */}
            <div className="px-[1vw] pt-[1.1vw] pb-[0.7vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <div className="flex items-center gap-[0.5vw]">
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="font-display" style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FAF6EF" }}>Safe Spaces</span>
                <span className="font-body" style={{ fontSize: "0.46vw", color: "#2D7A4F", marginLeft: "auto", fontWeight: 600 }}>340 places</span>
              </div>
              {/* Search bar */}
              <div className="flex items-center gap-[0.4vw] mt-[0.6vw] rounded-[0.8vw] px-[0.65vw] py-[0.35vw]" style={{ background: "#2A1408" }}>
                <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "#7B5408" }}>Search places, cities, tags…</span>
              </div>
              {/* Filter chips */}
              <div className="flex gap-[0.4vw] mt-[0.5vw]" style={{ overflow: "hidden" }}>
                {["All","Washington DC","NYC","Kingston"].map((f, i) => (
                  <span key={f} className="font-body" style={{ fontSize: "0.46vw", fontWeight: 700, color: i === 0 ? "#1C0E06" : "#A87A40", background: i === 0 ? "#CA922B" : "#2A1408", padding: "0.2vw 0.5vw", borderRadius: "0.6vw", whiteSpace: "nowrap" }}>{f}</span>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-[0.35vw] px-[0.55vw] pt-[0.55vw] flex-1 overflow-hidden">
              {PLACES.map((pl, idx) => (
                <div key={idx} className="rounded-[0.8vw] p-[0.65vw]" style={{ background: "#1C0E06", border: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
                  <div className="flex items-start justify-between gap-[0.5vw]">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-[0.35vw]">
                        <span className="font-body" style={{ fontSize: "0.62vw", fontWeight: 700, color: "#FAF6EF" }}>{pl.name}</span>
                        {pl.verified && (
                          <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        )}
                      </div>
                      <div className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40", marginTop: "0.1vw" }}>{pl.city}</div>
                      <div className="flex gap-[0.3vw] mt-[0.3vw]" style={{ flexWrap: "wrap" }}>
                        {pl.tags.map(t => (
                          <span key={t} className="font-body" style={{ fontSize: "0.42vw", color: "#2D7A4F", background: "rgba(45,122,79,0.15)", border: "1px solid rgba(45,122,79,0.3)", padding: "0.1vw 0.35vw", borderRadius: "0.5vw" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end" style={{ flexShrink: 0 }}>
                      <span className="font-body" style={{ fontSize: "0.48vw", color: "#CA922B", fontWeight: 700 }}>{pl.posts}</span>
                      <span className="font-body" style={{ fontSize: "0.38vw", color: "#7B5408" }}>posts</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add a space CTA */}
              <div className="flex items-center gap-[0.45vw] rounded-[0.8vw] px-[0.65vw] py-[0.5vw]" style={{ border: "1px dashed rgba(202,146,43,0.4)", flexShrink: 0 }}>
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <span className="font-body" style={{ fontSize: "0.55vw", color: "#CA922B", fontWeight: 600 }}>Add a Safe Space</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "340 places", rest: " globally — restaurants, salons, hotels, coworking spaces, and cultural venues." },
            { bold: "Grows passively", rest: " — every location-tagged community post adds to or increments a place entry." },
            { bold: "Diaspora reach", rest: " — DC, NYC, Atlanta, London, Kingston, Lagos, Accra and growing." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4, marginTop: "0.55vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}>
                <strong style={{ fontWeight: 700, color: "#A6720F" }}>{item.bold}</strong>{item.rest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
