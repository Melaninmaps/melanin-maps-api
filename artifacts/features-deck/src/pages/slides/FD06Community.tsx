export default function FD06Community() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(202,146,43,0.07), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.25 }}>05</div>

      <div className="absolute" style={{ left: "7vw", top: "5.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>EVENTS, CIRCLES &amp; COMMUNITY FEED</div>
        <div className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05 }}>
          Find your people.
        </div>
        <div className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.05, marginBottom: "2vw" }}>
          Build your community.
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "19vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw" }}>
        <div style={{ padding: "2vw", background: "#1C0E06", borderRadius: "1vw" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.8vw" }}>Events</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1vw" }} />
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.8vw" }}>Local events curated for the community &mdash; cultural, professional, social, and wellness</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B" }}>RSVP &middot; Calendar sync &middot; Reminders</div>
        </div>
        <div style={{ padding: "2vw", background: "#1C0E06", borderRadius: "1vw" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.8vw" }}>Kinfolk Circles</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1vw" }} />
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.8vw" }}>Group planning spaces for travel, relocation, and community &mdash; with shared saved places and KinfolkAI&trade; curators</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B" }}>Shared lists &middot; AI curator &middot; Group votes</div>
        </div>
        <div style={{ padding: "2vw", background: "#1C0E06", borderRadius: "1vw" }}>
          <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.8vw" }}>Community Feed</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1vw" }} />
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.8vw" }}>Social feed with posts, shared spots, hashtags, link previews, and visibility controls for your network</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B" }}>For You &middot; Following &middot; Hashtags</div>
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ bottom: "3vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "1.2vw" }} />
        <div style={{ display: "flex", gap: "4vw" }}>
          <div>
            <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#1C0E06" }}>Life Journeys</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408" }}>Track milestones across relocation, relationships, and career</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#1C0E06" }}>Heritage Sites</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408" }}>Cultural landmarks and historical sites on the map</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#1C0E06" }}>Community Reference</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408" }}>Community-added resources beyond official business listings</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#1C0E06" }}>Audience Guidance Ratings</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408" }}>Family mode with age-appropriate content controls</div>
          </div>
        </div>
      </div>
    </div>
  );
}
