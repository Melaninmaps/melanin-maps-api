const base = import.meta.env.BASE_URL;

export default function SlideBusinessesHaveStories() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right image */}
      <div className="absolute right-0 top-0 w-[45vw] h-full">
        <img
          src={`${base}hero-business.png`}
          crossOrigin="anonymous"
          alt="Minority-owned business owner"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center center" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.35) 55%, transparent 100%)" }} />
      </div>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        11
      </div>

      {/* Left content */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "52vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          BUSINESS DISCOVERY
        </div>

        <h1 className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.8vw" }}>
          Businesses<br />
          Have <span style={{ color: "#CA922B" }}>Stories.</span>
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.8vw" }} />

        <p className="font-body" style={{ fontSize: "1.3vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw", maxWidth: "40vw" }}>
          Every business has a reason it exists.<br />
          Hear directly from owners, learn what inspired them,
          and discover the people behind the storefront.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1vw" }}>
          {[
            { label: "Owner Story", desc: "The reason it exists, in their own words" },
            { label: "Community Confidence Score", desc: "0\u2013100 rating from people who have actually been there" },
            { label: "Compliment Chips", desc: "Specific praise from community members" },
            { label: "Featured Video", desc: "See the business come alive before you visit" },
            { label: "Verification Badge", desc: "Confirmed minority-owned and community-verified" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start" style={{ gap: "1vw" }}>
              <div style={{ flexShrink: 0, marginTop: "0.35vw", width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B" }} />
              <div>
                <span className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#FAF6EF" }}>{label} &mdash; </span>
                <span className="font-body" style={{ fontSize: "0.9vw", color: "#6B4420" }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
