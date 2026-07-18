export default function DemoS47KinfolkResponseText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 50%, rgba(202,146,43,0.09), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>BUSINESS OWNER JOURNEY · KINFOLKAI RESPONSE ASSIST</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          KinfolkAI doesn't write<br />a template. It writes Marcus.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          Most review platforms offer generic response templates. KinfolkAI reads the actual review, the chips selected, the reviewer's profile, and Marcus's past responses — then drafts something that sounds like it came from someone who actually runs this restaurant and cares about this community.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {[
            { head: "Context-aware drafting", body: "KinfolkAI reads the review text, the compliment chips, and Zara's member profile before drafting. The response isn't generic — it's specific to what she actually experienced." },
            { head: "Tone matching", body: "Marcus has written 12 previous responses. KinfolkAI analyzes his voice — warm, community-focused, personal — and matches it. The draft sounds like him, not a chatbot." },
            { head: "Three variations to choose from", body: "Marcus gets three response drafts: brief and warm, detailed and grateful, or community-forward. He picks one, edits as needed, and posts in two taps." },
            { head: "Response posts publicly, notifies Zara", body: "When Marcus publishes his reply, it appears beneath her review on the public profile and sends her a notification. Community loop closed." },
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
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>47 / 58</div>
    </div>
  );
}
