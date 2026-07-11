const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${13 * scale}vw`, height: `${24 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${0.9 * scale}vw ${0.65 * scale}vw`, boxShadow: `0 ${1.5 * scale}vw ${5 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3 * scale}vw`, height: `${0.42 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.3 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS07Safety() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "25vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>COMMUNITY SAFETY</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Travel with backup.<br /><span style={{ color: "#CA922B" }}>Always.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.92vw", color: "#A87A40", lineHeight: 1.7 }}>
          People of color, Black women, and LGBTQ+ community members face real risk in everyday situations. These tools exist because that risk is real — and the community deserves infrastructure to meet it.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            { title: "Safe Check-In", body: "Creates accountability before anything happens — trusted contacts notified if you miss your window." },
            { title: "Live Location Share", body: "No app required for the recipient. Real-time, private, and ends when you say so." },
            { title: "Meetup Verified", body: "Reduces the risk of meeting someone new from the community for the first time." },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: "0.7vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div className="font-display" style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FAF6EF" }}>{f.title}</div>
                <div className="font-body" style={{ fontSize: "0.75vw", color: "#A87A40", lineHeight: 1.4 }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Three phones */}
      <div className="absolute" style={{ right: "2vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "1.2vw" }}>
        {/* Phone 1 — Safety Hub */}
        <Phone>
          <div style={{ padding: "0.8vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Safety Hub</div>
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Your safety tools, always ready.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5vw" }}>
              {[
                { icon: <><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>, title: "Safe Check-In", sub: "No active check-in", action: "Schedule", active: false },
                { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>, title: "Live Location", sub: "Share with trusted contact", action: "Start", active: false },
                { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, title: "Meetup Verified", sub: "2 verifications complete", action: "New", active: true },
              ].map((item, i) => (
                <div key={i} style={{ background: (item as any).active ? "rgba(202,146,43,0.12)" : "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", border: `1px solid ${(item as any).active ? "rgba(202,146,43,0.35)" : "rgba(255,255,255,0.06)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "0.4vw", alignItems: "center" }}>
                      <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                      <div>
                        <div style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>{item.title}</div>
                        <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{item.sub}</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.15vw 0.4vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                      <span style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>{item.action}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.5vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>TRUSTED CONTACTS</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.48vw", marginTop: "0.15vw" }}>Maya & Darius will be notified if you don't check in.</div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Check-In flow */}
        <Phone>
          <div style={{ padding: "0.8vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Schedule Check-In</div>
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Where are you going?</div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.5vw", padding: "0.45vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.52vw" }}>Copper & Oak Bistro</span>
              </div>
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Check-in deadline</div>
              <div style={{ display: "flex", gap: "0.4vw" }}>
                {["8:00 PM", "9:00 PM", "10:00 PM"].map((t, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.35vw", borderRadius: "0.5vw", background: i === 0 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                    <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.44vw" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Notify if I don't check in</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35vw" }}>
                {["Maya Williams", "Darius Thompson"].map((contact, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(202,146,43,0.08)", borderRadius: "0.5vw", padding: "0.4vw 0.5vw", border: "1px solid rgba(202,146,43,0.2)" }}>
                    <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{contact}</span>
                    <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Start Check-In</span>
            </div>
          </div>
        </Phone>

        {/* Phone 3 — Live location */}
        <Phone>
          <div style={{ padding: "0.8vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Live Location Share</div>
            <div style={{ background: "rgba(46,140,46,0.1)", borderRadius: "0.7vw", padding: "0.55vw", border: "1px solid rgba(46,140,46,0.3)", textAlign: "center" }}>
              <div style={{ color: "#4CAF50", fontSize: "0.5vw", fontWeight: 700 }}>ACTIVE — 2h 14m remaining</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.48vw", marginTop: "0.15vw" }}>Your location is being shared</div>
            </div>
            {/* Mini map */}
            <div style={{ height: "5vw", background: "linear-gradient(160deg,#1a2518,#152012)", borderRadius: "0.6vw", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "35%", left: "40%", width: "1.2vw", height: "1.2vw", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: "#CA922B" }} />
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 45% 40%, rgba(202,146,43,0.15), transparent 50%)" }} />
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.46vw", marginBottom: "0.3vw" }}>Share link</div>
              <div style={{ display: "flex", gap: "0.3vw" }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "0.5vw", padding: "0.4vw", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>mwm.live/loc/k8j2p...</span>
                </div>
                <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.5vw", padding: "0.4vw 0.5vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>Copy</span>
                </div>
              </div>
            </div>
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Anyone with the link can view your live location — no app required.</div>
            <div style={{ marginTop: "auto", background: "rgba(190,60,40,0.15)", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center", border: "1px solid rgba(190,60,40,0.3)" }}>
              <span style={{ color: "#E8603A", fontSize: "0.58vw", fontWeight: 800 }}>Stop Sharing</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
