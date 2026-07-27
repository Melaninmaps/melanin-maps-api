const base = import.meta.env.BASE_URL;

export default function SlideFindYourPeople() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      {/* Right image */}
      <div className="absolute right-0 top-0 w-[46vw] h-full">
        <img
          src={`${base}app-community.jpg`}
          crossOrigin="anonymous"
          alt="Community feed"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center top" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #3D2417 0%, rgba(61,36,23,0.45) 55%, transparent 100%)" }} />
      </div>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        12
      </div>

      {/* Left content */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "50vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          COMMUNITY
        </div>

        <h1 className="font-display" style={{ fontSize: "5.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.8vw" }}>
          Find Your <span style={{ color: "#CA922B" }}>People.</span>
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.8vw" }} />

        <p className="font-body" style={{ fontSize: "1.35vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "3vw", maxWidth: "38vw" }}>
          Community isn&rsquo;t something you stumble into.<br />
          It&rsquo;s something you build.
        </p>

        <p className="font-body" style={{ fontSize: "1.1vw", color: "#8B6030", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw", maxWidth: "38vw" }}>
          Discover people who share your interests, your experiences, and your values &mdash;
          whether you&rsquo;re traveling across the country or across town.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9vw" }}>
          {[
            { label: "Kinfolk Circles", desc: "Private group travel planning with shared saves and collective AI curation" },
            { label: "Community Feed", desc: "Posts, stories, and recommendations from your extended network" },
            { label: "Safe Spaces", desc: "Curated directory of verified welcoming and inclusive locations" },
            { label: "Events", desc: "Local gatherings, activations, and meetups from your community" },
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
