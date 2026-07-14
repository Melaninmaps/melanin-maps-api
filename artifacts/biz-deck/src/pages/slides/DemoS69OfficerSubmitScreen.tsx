import React from 'react';

const activityTypes: { label: string; icon: React.ReactNode; color: string; selected: boolean }[] = [
  { label: "Checkpoint", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>, color: "#C0392B", selected: true },
  { label: "Traffic Stop", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, color: "#E67E22", selected: false },
  { label: "Foot Patrol", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, color: "#F39C12", selected: false },
  { label: "Stop & Question", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, color: "#8E44AD", selected: false },
  { label: "Unmarked Vehicle", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>, color: "#2C3E50", selected: false },
  { label: "Other", icon: <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>, color: "#7F8C8D", selected: false },
];

export default function DemoS69OfficerSubmitScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>SUBMIT AN ALERT</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Zara sees<br />a checkpoint.<br /><span style={{ color: "#CA922B" }}>She reports it.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Six activity types. Auto-detected location. Optional badge number. Anonymous toggle on by default. Takes under 30 seconds — and immediately protects everyone nearby.
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", padding: "0.55vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Submit Officer Alert</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.6vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.65vw" }}>
          {/* Type grid */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.4vw" }}>Activity Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35vw" }}>
              {activityTypes.map((t, i) => (
                <div key={i} style={{ background: t.selected ? `${t.color}18` : "#fff", border: `0.08vw solid ${t.selected ? t.color : "#E8DDD0"}`, borderRadius: "0.55vw", padding: "0.45vw 0.5vw", display: "flex", alignItems: "center", gap: "0.35vw" }}>
                  <span style={{ color: t.selected ? t.color : "#7F8C8D", display: "flex", alignItems: "center" }}>{t.icon}</span>
                  <span style={{ color: t.selected ? t.color : "#3A2210", fontSize: "0.45vw", fontWeight: t.selected ? 800 : 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Location */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Location</div>
            <div style={{ background: "#fff", border: "0.08vw solid #CA922B", borderRadius: "0.55vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 600 }}>Georgia Ave &amp; Euclid St NW</div>
                <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>Auto-detected · Tap to adjust</div>
              </div>
            </div>
          </div>
          {/* Badge */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Badge Number <span style={{ color: "#A87A40", fontWeight: 400 }}>(optional)</span></div>
            <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.55vw", padding: "0.5vw 0.7vw" }}>
              <span style={{ color: "#BDB0A0", fontSize: "0.5vw" }}>e.g. 2847</span>
            </div>
          </div>
          {/* Anonymous */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(202,146,43,0.06)", borderRadius: "0.55vw", padding: "0.5vw 0.7vw" }}>
            <div>
              <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700 }}>Submit Anonymously</div>
              <div style={{ color: "#A87A40", fontSize: "0.4vw", marginTop: "0.08vw" }}>Enabled by default — your identity stays private</div>
            </div>
            <div style={{ width: "1.4vw", height: "0.8vw", background: "#CA922B", borderRadius: "0.5vw", position: "relative" }}>
              <div style={{ position: "absolute", right: "0.1vw", top: "0.1vw", width: "0.6vw", height: "0.6vw", background: "#fff", borderRadius: "50%" }} />
            </div>
          </div>
          {/* Submit CTA */}
          <div style={{ background: "#1C0E06", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center", marginTop: "0.3vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.55vw", fontWeight: 800 }}>Send Alert Now</div>
            <div style={{ color: "rgba(250,246,239,0.5)", fontSize: "0.38vw", marginTop: "0.1vw" }}>Visible to community within seconds</div>
          </div>
        </div>
      </div>
      </div>

      {/* Right copy */}
      <div className="absolute" style={{ right: "5vw", top: "50%", transform: "translateY(-50%)", width: "16vw" }}>
        <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.15, marginBottom: "1.6vw" }}>
          Under<br />30 seconds.
        </div>
        {[
          "Pinpoints your GPS location instantly",
          "Six report types — tap one",
          "Optional badge number field",
          "Anonymous by default",
          "Alert live within seconds",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-[0.7vw] mb-[0.9vw]">
            <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.3vw", flexShrink: 0 }} />
            <div style={{ fontSize: "0.88vw", color: "#5C3A1A", lineHeight: 1.5 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
