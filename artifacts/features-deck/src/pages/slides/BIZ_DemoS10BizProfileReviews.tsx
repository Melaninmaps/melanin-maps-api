const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const reviews = [
  { name: "Nia T.", tier: "Navigator", date: "Jul 8, 2026", text: "This place is everything. The jerk eggs benedict hit different. Definitely a staple for the culture in DC.", rating: 5 },
  { name: "Marcus J.", tier: "Trailblazer", date: "Jul 2, 2026", text: "Solid food, great ambiance. The owner stopped by our table — that kind of community energy is rare.", rating: 5 },
  { name: "Aisha W.", tier: "Community", date: "Jun 28, 2026", text: "Great brunch spot. Can get busy on weekends so plan ahead. The peach cobbler waffle is a must.", rating: 4 },
];

export default function DemoS10BizProfileReviews() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 50%, rgba(202,146,43,0.09), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 9 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Reviews scroll<br />down.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Scrolling down on the business profile reveals the review section — real reviews from real community members. Tier badges (Community, Navigator, Trailblazer) show who said what. Owner responses are threaded below each review.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Membership tier shown on every review — higher-tier voices are verified members",
            "Reviews cannot be anonymous — accountability without hostility",
            "Owners can respond publicly — every reply builds or damages trust",
            "Ratings use a 5-star scale with mandatory text — no empty stars",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ padding: "0.4vw 0.9vw 0.3vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
            <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            <span style={{ color: "#A87A40", fontSize: "0.48vw", fontWeight: 600 }}>Copper & Oak Bistro</span>
          </div>

          <div style={{ flex: 1, padding: "0.3vw 0.9vw 0", display: "flex", flexDirection: "column", gap: "0.6vw", overflowY: "hidden" }}>
            {/* Rating summary */}
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.8vw", padding: "0.7vw", border: "1px solid rgba(202,146,43,0.2)", display: "flex", gap: "1vw", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#CA922B", fontSize: "2vw", fontWeight: 800, lineHeight: 1 }}>4.8</div>
                <div style={{ display: "flex", gap: "0.1vw", marginTop: "0.2vw" }}>
                  {[1,2,3,4,5].map(s => <div key={s} style={{ width: "0.55vw", height: "0.55vw", background: "#CA922B", borderRadius: "0.08vw" }} />)}
                </div>
                <div style={{ color: "#5C3A1A", fontSize: "0.42vw", marginTop: "0.15vw" }}>47 reviews</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5,4,3,2,1].map((star, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35vw", marginBottom: "0.12vw" }}>
                    <span style={{ color: "#5C3A1A", fontSize: "0.4vw", width: "0.5vw" }}>{star}</span>
                    <div style={{ flex: 1, height: "0.25vw", background: "rgba(202,146,43,0.15)", borderRadius: "0.2vw" }}>
                      <div style={{ height: "100%", background: "#CA922B", borderRadius: "0.2vw", width: i === 0 ? "82%" : i === 1 ? "12%" : "4%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Write review */}
            <div style={{ background: "#CA922B", borderRadius: "0.6vw", padding: "0.55vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.6vw", fontWeight: 800 }}>Write a Review</span>
            </div>

            {/* Reviews */}
            {reviews.map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.75vw", padding: "0.65vw", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4vw" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
                    <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: `linear-gradient(135deg, ${i === 0 ? "#CA922B,#7B5408" : i === 1 ? "#7B5408,#3D2410" : "#3D2410,#1C0E06"})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 800 }}>{r.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 700 }}>{r.name}</div>
                      <div style={{ padding: "0.05vw 0.3vw", borderRadius: "0.3vw", background: "rgba(202,146,43,0.15)", display: "inline-block" }}>
                        <span style={{ color: "#CA922B", fontSize: "0.38vw" }}>{r.tier}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: "0.08vw" }}>
                      {Array.from({ length: r.rating }).map((_, s) => <div key={s} style={{ width: "0.45vw", height: "0.45vw", background: "#CA922B", borderRadius: "0.06vw" }} />)}
                    </div>
                    <div style={{ color: "#3A2010", fontSize: "0.38vw", textAlign: "right", marginTop: "0.08vw" }}>{r.date}</div>
                  </div>
                </div>
                <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.55 }}>{r.text}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 0 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
