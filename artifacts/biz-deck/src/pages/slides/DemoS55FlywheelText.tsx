export default function DemoS55FlywheelText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.12), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>THE FULL PICTURE · THE COMMUNITY FLYWHEEL</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Zara and Marcus.<br />They made each other possible.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.5vw" }}>
          {[
            { n: "1", head: "Member joins", body: "Zara downloads the app, sets her preferences, discovers Copper & Oak, visits, reviews, and saves. She earns points and starts a Kinfolk Circle." },
            { n: "2", head: "Business grows", body: "Marcus gains a 5-star review, sees the chip analytics, upgrades to Merchant, activates a promotion, and watches his Trust Score rise." },
            { n: "3", head: "Platform deepens", body: "More members mean more reviews, more safety data, more community intelligence, better KinfolkAI context, and more businesses worth listing." },
            { n: "4", head: "Community strengthens", body: "Businesses invest in their community presence. Members invest in the platform. The Trust Score becomes more valuable. The loop compounds." },
          ].map((step, i) => (
            <div key={i} className="rounded-[0.8vw] p-[1.1vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.25)" }}>
              <div className="font-display mb-[0.7vw]" style={{ fontSize: "2.8vw", fontWeight: 900, color: "rgba(202,146,43,0.25)", lineHeight: 1 }}>{step.n}</div>
              <div className="font-display" style={{ fontSize: "0.88vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.45vw" }}>{step.head}</div>
              <div className="font-body" style={{ fontSize: "0.75vw", color: "#7B5408", lineHeight: 1.65 }}>{step.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-[2.5vw] rounded-[0.8vw] px-[2vw] py-[1.1vw] text-center" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)" }}>
          <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.3 }}>
            Every feature exists to spin this flywheel.
          </div>
          <div className="font-body mt-[0.5vw]" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.65 }}>
            Safety tools bring members. Members bring reviews. Reviews build Trust Scores. Trust Scores bring more members and better businesses. Better businesses bring more members. The community is the product — and it builds itself.
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>55 / 58</div>
    </div>
  );
}
