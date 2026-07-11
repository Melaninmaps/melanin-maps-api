const incidentTypes = [
  { label: "Racial profiling", color: "#C0392B", selected: true },
  { label: "Unwelcoming / hostile staff", color: "#E67E22", selected: false },
  { label: "Followed in store", color: "#8E44AD", selected: false },
  { label: "Denied service", color: "#2980B9", selected: false },
  { label: "Overcharged / price discrimination", color: "#16A085", selected: false },
  { label: "Other harassment", color: "#7F8C8D", selected: false },
];

export default function DemoS71UnsafeSpaceScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>UNSAFE SPACE REPORT</div>
        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Felt unsafe<br />at a business?<br /><span style={{ color: "#CA922B" }}>Report it.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          If a community member experiences racial profiling, discrimination, or harassment at any business — minority-owned or not — they can file an Unsafe Space report. It's confidential, structured, and community-reviewed.
        </div>
        <div style={{ marginTop: "1.5vw", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
          {["Separate from business reviews — this is an incident report, not a rating","3 community confirmations → 'Community Caution' badge on the business","Owner may be notified or not — reporter chooses"].map((s,i) => (
            <div key={i} style={{ display: "flex", gap: "0.5vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.35vw", height: "0.35vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.45vw", flexShrink: 0 }} />
              <span style={{ color: "#6B4A2A", fontSize: "0.72vw", lineHeight: 1.55 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", padding: "0.5vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Report Unsafe Space</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {/* Business context */}
          <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700 }}>Urban Eats Kitchen</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Columbia Heights · Restaurant</div>
            </div>
            <div style={{ background: "#5C3A1A", borderRadius: "0.35vw", padding: "0.1vw 0.3vw" }}>
              <span style={{ color: "#D4B483", fontSize: "0.45vw", fontWeight: 800 }}>71</span>
            </div>
          </div>
          {/* Date */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 700, marginBottom: "0.3vw" }}>When did this happen?</div>
            <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.55vw", padding: "0.45vw 0.7vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#3A2210", fontSize: "0.5vw" }}>Today, July 11 — approx. 9:15 AM</span>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 16 16" fill="none" stroke="#8C6A3A" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M5 1v4M11 1v4M2 7h12"/></svg>
            </div>
          </div>
          {/* Incident type */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 700, marginBottom: "0.3vw" }}>What happened?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vw" }}>
              {incidentTypes.map((t, i) => (
                <div key={i} style={{ background: t.selected ? `${t.color}15` : "#fff", border: `0.08vw solid ${t.selected ? t.color : "#E8DDD0"}`, borderRadius: "0.5vw", padding: "0.42vw 0.6vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
                  <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", border: `0.1vw solid ${t.selected ? t.color : "#C8B49A"}`, background: t.selected ? t.color : "transparent", flexShrink: 0 }} />
                  <span style={{ color: t.selected ? t.color : "#3A2210", fontSize: "0.46vw", fontWeight: t.selected ? 700 : 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Notify owner */}
          <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 700 }}>Notify business owner</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>Owner sees incident type, not your identity</div>
            </div>
            <div style={{ width: "1.8vw", height: "0.95vw", background: "#E8DDD0", borderRadius: "1vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.1vw", width: "0.75vw", height: "0.75vw", background: "#fff", borderRadius: "50%", boxShadow: "0 0.05vw 0.2vw rgba(0,0,0,0.2)" }} />
            </div>
          </div>
        </div>
        <div style={{ padding: "0.4vw 0.7vw 0.7vw", flexShrink: 0 }}>
          <div style={{ background: "#C0392B", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center" }}>
            <span style={{ color: "#fff", fontSize: "0.55vw", fontWeight: 700 }}>File Unsafe Space Report</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["6 structured incident types", "From racial profiling to price discrimination — every form of harassment has a named category."],
          ["Reporter controls disclosure", "The toggle lets the reporter decide whether the business owner is notified — or kept in the dark."],
          ["Community Caution badge", "3 confirmed reports → visible 'Community Caution' indicator on the business profile for all members."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>71</div>
    </div>
  );
}
