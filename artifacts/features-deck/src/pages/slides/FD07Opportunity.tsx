export default function FD07Opportunity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(202,146,43,0.12), transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.25 }}>06</div>

      <div className="absolute" style={{ left: "7vw", top: "5.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>OPPORTUNITY CENTER</div>
        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.5vw" }}>
          More than a map.
        </div>
        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.0, marginBottom: "2.5vw" }}>
          A launchpad.
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "19vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.8vw" }}>
        <div style={{ padding: "2vw 2.2vw", border: "1px solid rgba(202,146,43,0.3)", background: "rgba(202,146,43,0.08)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.7vw" }}>Jobs</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "0.9vw" }} />
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.9vw" }}>Curated job listings from minority-friendly employers with pay transparency, remote filters, and Near Me proximity search</div>
          <div className="font-body" style={{ fontSize: "0.76vw", color: "#CA922B" }}>Save listings &middot; Pay range &middot; Remote/hybrid</div>
        </div>
        <div style={{ padding: "2vw 2.2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.7vw" }}>Mentorship</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "0.9vw" }} />
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.9vw" }}>Connect with experienced mentors across industries &mdash; in-person, remote, and hybrid sessions with Calendly scheduling</div>
          <div className="font-body" style={{ fontSize: "0.76vw", color: "#CA922B" }}>Specialty filters &middot; Book sessions &middot; Near Me</div>
        </div>
        <div style={{ padding: "2vw 2.2vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(250,246,239,0.03)" }}>
          <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1.2vw" }}><path d="M3 9l1-5h16l1 5" /><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" /><path d="M5 9v11h14V9" /><path d="M9 14h6v6H9z" /></svg>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.7vw" }}>Community Marketplace</div>
          <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "0.9vw" }} />
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "0.9vw" }}>Buy and sell goods, services, and resources within the community &mdash; keeping dollars circulating where they belong</div>
          <div className="font-body" style={{ fontSize: "0.76vw", color: "#CA922B" }}>Goods &middot; Services &middot; Community listings</div>
        </div>
      </div>

      <div className="absolute left-[7vw] right-[7vw]" style={{ bottom: "3.5vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "1.2vw" }} />
        <div style={{ display: "flex", gap: "6vw" }}>
          <div>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Wellness</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408", marginTop: "0.3vw" }}>Check-ins, streaks, and health goals</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Financial Hub</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408", marginTop: "0.3vw" }}>Curated financial resources and goal tracking</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Knowledge Library</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#7B5408", marginTop: "0.3vw" }}>70+ curated topics, issues, and digest delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}
