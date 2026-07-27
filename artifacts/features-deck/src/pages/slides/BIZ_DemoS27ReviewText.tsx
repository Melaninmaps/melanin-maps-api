export default function DemoS27ReviewText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 50%, rgba(202,146,43,0.09), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · LEAVE A REVIEW</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Zara visits.<br />Now she has something to say.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          A review on Mapping With Melanin isn't just a star rating. It's a contribution to the community's shared intelligence. The compliment chips, the written review, the photos — everything she adds builds the Trust Score for every diaspora member who searches next.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {[
            { head: "Star rating + written review", body: "Standard review fields, but the context is different — you're not writing for Yelp's algorithm. You're writing for your community." },
            { head: "Compliment chips: what the community actually cares about", body: "Welcoming Vibe, Safe Space, Great Food, Authentic, Community Hub, Clean, Owner Response. Chips voted by reviewers become the 'Community Says' section on the profile." },
            { head: "Photo upload", body: "Real photos from real visits build trust visually. Zara's brunch photo appears in the gallery on Copper & Oak's profile within the hour." },
            { head: "Every review feeds the Trust Score", body: "We don't reveal the formula — but we can say: review quality, recency, consistency, and reviewer reputation all matter. Gaming it is hard by design." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>{p.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.9vw", lineHeight: 1.65 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>27 / 58</div>
    </div>
  );
}
