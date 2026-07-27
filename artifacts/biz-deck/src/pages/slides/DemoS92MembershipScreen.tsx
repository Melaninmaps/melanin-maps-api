import React from "react";

export default function DemoS92MembershipScreen() {
  const gold = "#CA922B";
  const cream = "#FDF8F0";
  const dark = "#1A0A00";
  const muted = "#7A6A55";

  // Phone mockup: Family Plan screen
  const phoneW = 245;
  const phoneH = 500;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0D0805",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6vw",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Left: copy block */}
      <div style={{ maxWidth: "44vw", color: "#FFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", marginBottom: "1.5vh" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ fontSize: "0.85vw", fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Family Plan Management
          </span>
        </div>
        <h1 style={{ fontSize: "3.8vw", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.04em", margin: "0 0 2vh" }}>
          One plan.
          <br />
          <span style={{ color: gold }}>Your whole family.</span>
        </h1>
        <p style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "3vh" }}>
          Add a family member from $2.99/mo. They share your AI pool, access safety features, and plan trips together — without paying for a separate subscription.
        </p>

        {/* Feature callouts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
          {[
            { icon: "activity", label: "Live AI pool meter", body: "See exactly how many KinfolkAI requests remain this month across your family." },
            { icon: "user-plus", label: "Invite in seconds", body: "Enter an email. They accept. Done — they're in your family circle instantly." },
            { icon: "lock", label: "Safety always on", body: "Officer Watch and neighborhood scores work for every member at every tier." },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
              <div style={{ width: "3.2vh", height: "3.2vh", borderRadius: "50%", background: "rgba(202,146,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vh" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon === "activity" && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />}
                  {f.icon === "user-plus" && <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>}
                  {f.icon === "lock" && <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFF", marginBottom: "0.2vh" }}>{f.label}</div>
                <div style={{ fontSize: "0.78vw", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: phone mockup */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Glow */}
        <div style={{ position: "absolute", width: phoneW + 80, height: phoneH + 80, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(202,146,43,0.18) 0%, transparent 70%)", zIndex: 0 }} />

        {/* Phone shell */}
        <div style={{
          width: phoneW,
          height: phoneH,
          background: "#111",
          borderRadius: 38,
          border: "2px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Screen content */}
          <div style={{ width: "100%", height: "100%", background: "#FFFDF8", overflowY: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Status bar */}
            <div style={{ height: 20, background: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: dark }}>9:41</span>
              <span style={{ fontSize: 7, color: dark }}>●●●</span>
            </div>

            {/* Header */}
            <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: dark, letterSpacing: -0.4 }}>Family Plan</div>
                  <div style={{ fontSize: 8, color: muted, marginTop: 1 }}>Navigator · 1 of 2 seats used</div>
                </div>
              </div>
            </div>

            {/* Plan card — Navigator colored */}
            <div style={{ margin: "10px 10px 8px", background: gold, borderRadius: 12, padding: "12px 12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", marginBottom: 2 }}>CURRENT PLAN</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#FFF", letterSpacing: -0.4 }}>Navigator</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 8px" }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>Upgrade</span>
                </div>
              </div>
              {/* AI Pool bar */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>KINFOLK AI THIS MONTH</span>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#FFF" }}>18 / 30</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "60%", background: "#FFF", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>12 requests remaining this month</div>
              </div>
            </div>

            {/* Feature limits */}
            <div style={{ margin: "0 10px 8px", background: "#FFF", borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
              {[
                { label: "Saved Places", val: "150" },
                { label: "Followed Topics", val: "20" },
                { label: "Kinfolk Circles", val: "1" },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <span style={{ fontSize: 8, color: muted }}>{r.label}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: dark }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Family members */}
            <div style={{ margin: "0 10px", background: "#FFF", borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", padding: "10px 10px 8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: dark }}>Family Members</span>
                <span style={{ fontSize: 8, color: muted }}>1 / 2 seats</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 3, borderRadius: 2, background: "rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: "50%", background: gold, borderRadius: 2 }} />
              </div>
              {/* Member row */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 7, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: "rgba(202,146,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: gold }}>JM</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: dark }}>Jordan M.</div>
                  <div style={{ fontSize: 7, color: muted }}>Active member</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </div>
              {/* Add member button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0 2px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span style={{ fontSize: 9, fontWeight: 700, color: gold }}>Invite Family Member — 1 seat free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
