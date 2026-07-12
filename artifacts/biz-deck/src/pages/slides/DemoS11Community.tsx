const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const Tab = ({ labels, active }: { labels: string[]; active: number }) => (
  <div style={{ display: "flex", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
    {labels.map((l, i) => (
      <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.45vw 0", borderBottom: i === active ? "2px solid #CA922B" : "2px solid transparent" }}>
        <span style={{ color: i === active ? "#CA922B" : "#5C3A1A", fontSize: "0.48vw", fontWeight: i === active ? 700 : 400 }}>{l}</span>
      </div>
    ))}
  </div>
);

export default function DemoS11Community() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 50%, rgba(202,146,43,0.1), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>COMMUNITY</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Connect with people who share<br /><span style={{ color: "#CA922B" }}>your culture.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Social media algorithms suppress minority community content — they deprioritize it and force community pages to pay for reach. We built a feed where community voices aren't filtered, diaspora events surface first, and local businesses get authentic exposure without paying for it.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Algorithm-free feed: no paid boosting, no suppression", "Events reach the people most likely to show up and care", "Groups create structured community around shared interests or travel", "Audience ratings protect families without restricting creators", "Content stays in the community — no external data harvesting"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Community Feed */}
        <Phone>
          <Tab labels={["For You", "Following", "Events", "Groups"]} active={0} />
          <div style={{ flex: 1, padding: "0.6vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.6vw", overflowY: "hidden" }}>
            {/* Post 1 */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.7vw", padding: "0.6vw", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: "0.4vw", alignItems: "center", marginBottom: "0.35vw" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid rgba(202,146,43,0.4)" }} />
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 700 }}>Danielle R.</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>2 hours ago</div>
                </div>
              </div>
              <div style={{ color: "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.45, marginBottom: "0.35vw" }}>
                Just had the most incredible Sunday brunch at Copper & Oak. The community here really shows up for each other.
              </div>
              <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.5vw", padding: "0.3vw 0.5vw", display: "inline-flex", alignItems: "center", gap: "0.3vw", marginBottom: "0.35vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span style={{ color: "#CA922B", fontSize: "0.44vw" }}>Copper & Oak Bistro · Trust 97</span>
              </div>
              <div style={{ display: "flex", gap: "0.8vw" }}>
                {[{ icon: "♥", count: "47" }, { icon: "✦", count: "12" }, { icon: "↪", count: "8" }].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.2vw" }}>
                    <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.5vw" }}>{r.icon}</span>
                    <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Post 2 */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.7vw", padding: "0.6vw", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: "0.4vw", alignItems: "center", marginBottom: "0.35vw" }}>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(80,40,20,0.4)", border: "1px solid rgba(202,146,43,0.3)" }} />
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 700 }}>Marcus J.</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>4 hours ago</div>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(202,146,43,0.1)", borderRadius: "0.3vw", padding: "0.1vw 0.35vw", border: "1px solid rgba(202,146,43,0.3)" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.38vw" }}>EVERYONE</span>
                </div>
              </div>
              <div style={{ color: "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.45 }}>PSA: The Root Collective just opened a second location in Columbia Heights. Community trust already at 89 after one week.</div>
              <div style={{ display: "flex", gap: "0.8vw", marginTop: "0.3vw" }}>
                {[{ icon: "♥", count: "124" }, { icon: "✦", count: "31" }].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.2vw" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.5vw" }}>{r.icon}</span>
                    <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Events */}
        <Phone>
          <Tab labels={["For You", "Following", "Events", "Groups"]} active={2} />
          <div style={{ flex: 1, padding: "0.6vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.6vw", overflowY: "hidden" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Upcoming Events</div>
            {[
              { title: "Melanin in Motion Fitness Pop-Up", date: "Sat Jan 18 · 10 AM", cat: "Wellness", attendees: 47 },
              { title: "Black Business Networking Mixer", date: "Thu Jan 23 · 6 PM", cat: "Professional", attendees: 89 },
              { title: "Natural Hair & Wellness Expo", date: "Sat Jan 25 · 11 AM", cat: "Culture", attendees: 214 },
              { title: "Community Poetry Night", date: "Fri Jan 31 · 7 PM", cat: "Arts", attendees: 63 },
            ].map((event, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.7vw", padding: "0.55vw 0.65vw", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                  <div style={{ background: "rgba(202,146,43,0.15)", borderRadius: "0.3vw", padding: "0.08vw 0.3vw", border: "1px solid rgba(202,146,43,0.3)" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>{event.cat.toUpperCase()}</span>
                  </div>
                  <span style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{event.attendees} going</span>
                </div>
                <div style={{ color: "#FAF6EF", fontSize: "0.58vw", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.15vw" }}>{event.title}</div>
                <div style={{ color: "#A87A40", fontSize: "0.46vw" }}>{event.date}</div>
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
