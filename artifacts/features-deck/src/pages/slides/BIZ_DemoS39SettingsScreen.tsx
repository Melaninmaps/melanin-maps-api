export default function DemoS39SettingsScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>39</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Control.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Every toggle means we thought about the member first.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Notifications by category. Privacy controls for profile, saved places, and reviews. Family Mode for guidance filtering. Dark mode. KinfolkAI depth settings by membership tier. This platform doesn't sell attention — it sells peace of mind.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>We don't sell your attention. We protect it.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="px-[1vw] pt-[1.3vw] pb-[0.6vw]" style={{ flexShrink: 0 }}>
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 800, color: "#1C0E06" }}>Settings</div>
            </div>
            <div className="flex-1" style={{ overflow: "hidden" }}>
              {[
                { section: "NOTIFICATIONS", items: [
                  { label: "Safety Alerts", sub: "ICE, police, community emergencies", on: true, critical: true },
                  { label: "Circle Updates", sub: "New saves, votes, and messages", on: true },
                  { label: "Review Responses", sub: "When owners reply to your reviews", on: true },
                  { label: "Event Reminders", sub: "48h and 1h before registered events", on: false },
                  { label: "Weekly Digest", sub: "Library topics you follow", on: true },
                ]},
                { section: "PRIVACY", items: [
                  { label: "Public Profile", sub: "Other members can find and view you", on: true },
                  { label: "Show Saved Places", sub: "Visible on your public profile", on: false },
                  { label: "Share Activity to Feed", sub: "Reviews and check-ins appear in community", on: true },
                ]},
                { section: "CONTENT", items: [
                  { label: "Family Mode", sub: "Filter community feed by guidance rating", on: false },
                  { label: "Dark Mode", sub: "Use dark theme throughout the app", on: false },
                ]},
              ].map((group, gi) => (
                <div key={gi}>
                  <div className="px-[1vw] py-[0.3vw]" style={{ background: "#F0E8D8" }}>
                    <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#A87A40", letterSpacing: "0.1em" }}>{group.section}</span>
                  </div>
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-[0.65vw] px-[1vw] py-[0.48vw]" style={{ borderBottom: "1px solid #F0E8D8" }}>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-[0.35vw]">
                          <span className="font-body" style={{ fontSize: "0.56vw", fontWeight: 700, color: "#1C0E06" }}>{item.label}</span>
                          {item.critical && <div className="rounded-[0.25vw] px-[0.3vw] py-[0.06vw]" style={{ background: "#DC2626" }}><span className="font-body" style={{ fontSize: "0.36vw", fontWeight: 700, color: "#FFF" }}>CRITICAL</span></div>}
                        </div>
                        <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>{item.sub}</div>
                      </div>
                      {/* Toggle */}
                      <div style={{ width: "2.2vw", height: "1.15vw", borderRadius: "1vw", background: item.on ? "#CA922B" : "#DDD0B8", position: "relative", flexShrink: 0 }}>
                        <div style={{ position: "absolute", width: "0.85vw", height: "0.85vw", borderRadius: "50%", background: "#FFF", top: "0.15vw", left: item.on ? "1.2vw" : "0.15vw", boxShadow: "0 0.05vw 0.2vw rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Critical flag on safety alerts</strong> — can't be accidentally turned off.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Privacy granularity</strong> — profile, saves, and activity controlled separately.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Family Mode</strong> — guidance filter for the whole household, one toggle.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
