export default function DemoS12HeritageText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 60%, rgba(202,146,43,0.11), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · CULTURAL HERITAGE MAP</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.6vw" }}>
          Our history lives
        </div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.0, marginBottom: "1.8vw" }}>
          on the same map.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.2vw", opacity: 0.8 }} />

        <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "58vw" }}>
          We never accepted the premise that economic navigation and cultural connection should live on separate screens. The melanated diaspora built this country&rsquo;s institutions, neighborhoods, and landmarks. That history belongs on the same map where we find businesses, plan trips, and move through the world with intention.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw 5vw" }}>
          <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
              <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>1</span>
            </div>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>Heritage layer — on by default</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.88vw", lineHeight: 1.65 }}>Cultural pins appear the first time the map opens — not tucked behind a settings menu. History is not a feature you toggle on. It is always there.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
              <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>2</span>
            </div>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>11 heritage categories, each with its own pin</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.88vw", lineHeight: 1.65 }}>HBCUs, Civil Rights landmarks, African American historical sites, art institutions, music heritage, historic neighborhoods, cultural centers, and more — each category has a distinct color and icon so members navigate by meaning.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
              <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>3</span>
            </div>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>Tap any pin, read the story</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.88vw", lineHeight: 1.65 }}>Tapping a heritage pin slides up a site card with category, location, and a brief history. &ldquo;View Details&rdquo; opens the full Cultural Heritage Explorer — searchable, filterable, and growing.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
            <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
              <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>4</span>
            </div>
            <div>
              <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>Also in the Library — 16 live site cards</div>
              <div className="font-body" style={{ color: "#7B5408", fontSize: "0.88vw", lineHeight: 1.65 }}>A horizontally scrolling strip of cultural heritage sites appears at the top of the Library tab — live-loaded from our database, updated as new sites are added. Discovery is not limited to the map.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
