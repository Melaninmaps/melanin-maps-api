const base = import.meta.env.BASE_URL;

export default function DemoS58ClosingCTA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex" style={{ background: "#0D0805" }}>
      {/* Left dark panel */}
      <div className="relative flex flex-col justify-center" style={{ width: "55%", paddingLeft: "8vw", paddingRight: "4vw", zIndex: 2 }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: "#CA922B" }} />
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "3vw" }}>MAPPING WITH MELANIN™</div>
        <div className="font-display" style={{ fontSize: "6vw", fontWeight: 900, color: "#FAF6EF", lineHeight: 0.95, marginBottom: "1.5vw" }}>
          Find your<br />people.<br />Anywhere.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.15vw", color: "#7B5408", lineHeight: 1.75, marginBottom: "3.5vw", maxWidth: "38vw" }}>
          From the first app open to the first brunch reservation, the first safety alert to the first Kinfolk Circle, the first business saved to the first Trust Score that earns it — we built a world where the diaspora moves with confidence, connection, and community.
        </div>

        {/* App download */}
        <div className="flex gap-[1vw] items-center mb-[2.5vw]">
          <div className="flex items-center gap-[0.7vw] rounded-[0.7vw] px-[1.5vw] py-[0.85vw]" style={{ background: "#FAF6EF" }}>
            <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            <div>
              <div className="font-body" style={{ fontSize: "0.55vw", color: "#7A5530", fontWeight: 600 }}>Download on the</div>
              <div className="font-display" style={{ fontSize: "0.85vw", fontWeight: 800, color: "#1C0E06" }}>App Store</div>
            </div>
          </div>
          <div className="flex items-center gap-[0.7vw] rounded-[0.7vw] px-[1.5vw] py-[0.85vw]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(202,146,43,0.3)" }}>
            <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <div>
              <div className="font-body" style={{ fontSize: "0.55vw", color: "#7A5530", fontWeight: 600 }}>Get it on</div>
              <div className="font-display" style={{ fontSize: "0.85vw", fontWeight: 800, color: "#CA922B" }}>Google Play</div>
            </div>
          </div>
        </div>

        <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408" }}>
          mappingwithmelanin.com
        </div>
      </div>

      {/* Right image panel */}
      <div className="relative flex-1">
        <img
          src={`${base}photos/feed-friends-rooftop.jpg`}
          crossOrigin="anonymous"
          alt="Community"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0D0805 0%, transparent 35%)" }} />

        {/* Floating stats */}
        <div className="absolute flex flex-col gap-[1.2vw]" style={{ bottom: "6vh", right: "5vw" }}>
          {[
            { val: "14", label: "Safety features" },
            { val: "97", label: "Top Trust Score" },
            { val: "3", label: "Membership tiers" },
            { val: "∞", label: "Community connections" },
          ].map((stat, i) => (
            <div key={i} className="rounded-[0.7vw] px-[1.5vw] py-[0.8vw] text-center" style={{ background: "rgba(13,8,5,0.7)", border: "1px solid rgba(202,146,43,0.3)", backdropFilter: "blur(8px)" }}>
              <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 900, color: "#CA922B", lineHeight: 1 }}>{stat.val}</div>
              <div className="font-body" style={{ fontSize: "0.55vw", color: "#A87A40", fontWeight: 600, letterSpacing: "0.08em" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>58 / 58</div>
    </div>
  );
}
