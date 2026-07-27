import React from "react";

export default function DemoS91MembershipText() {
  const gold = "#CA922B";
  const cream = "#FDF8F0";
  const dark = "#1A0A00";
  const muted = "#7A6A55";

  const tiers = [
    { name: "Explorer", price: "Free", ai: "—", places: "30", topics: "5", family: "—", color: "#A87A40" },
    { name: "Navigator", price: "$7.99", ai: "30/mo", places: "150", topics: "20", family: "1 free", color: "#CA922B" },
    { name: "Trailblazer", price: "$19.99", ai: "100/mo", places: "500", topics: "50", family: "1 free", color: "#1A5C35" },
    { name: "Community Builder", price: "$29.99", ai: "300/mo", places: "∞", topics: "∞", family: "1 free", color: "#5C3D9E" },
    { name: "Legacy Member", price: "$79.99", ai: "Unlimited", places: "∞", topics: "∞", family: "1 free", color: "#1A0A00" },
  ];

  const addOns = [
    { tier: "Navigator", price: "$2.99" },
    { tier: "Trailblazer", price: "$3.99" },
    { tier: "Community Builder", price: "$4.99" },
    { tier: "Legacy", price: "$6.99" },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: cream,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: "4vw 5.5vw",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "3vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7vw", marginBottom: "0.8vh" }}>
          {/* Safety icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontSize: "0.85vw", fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Membership Architecture
          </span>
        </div>
        <h1 style={{ fontSize: "3.4vw", fontWeight: 900, color: dark, lineHeight: 1.08, letterSpacing: "-0.03em", margin: 0 }}>
          Designed to Give Back.
          <br />
          <span style={{ color: gold }}>Priced to Stay Accessible.</span>
        </h1>
        <p style={{ fontSize: "1.15vw", color: muted, marginTop: "1.2vh", maxWidth: "55vw", lineHeight: 1.55 }}>
          Safety is always free. AI travel planning, family seats, and advanced tools are unlocked by tier — shared as a pool so families benefit together without multiplying costs.
        </p>
      </div>

      {/* Main grid: tier table left, add-on + principles right */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>

        {/* Tier table */}
        <div style={{ flex: 2.2, display: "flex", flexDirection: "column", gap: "0.5vh" }}>
          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 0.7fr 0.9fr 0.6fr 0.55fr 0.7fr",
            gap: "0.4vw",
            padding: "0.6vh 0.8vw",
            marginBottom: "0.2vh",
          }}>
            {["Tier", "Price/mo", "KinfolkAI Pool", "Saved Places", "Topics", "Family Seat"].map((h) => (
              <div key={h} style={{ fontSize: "0.7vw", fontWeight: 700, color: muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {tiers.map((t, i) => (
            <div
              key={t.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.7fr 0.9fr 0.6fr 0.55fr 0.7fr",
                gap: "0.4vw",
                alignItems: "center",
                background: i === 0 ? "rgba(0,0,0,0.03)" : "#FFF",
                borderRadius: "0.7vw",
                padding: "1.2vh 0.8vw",
                border: `1px solid ${i === 0 ? "rgba(0,0,0,0.06)" : "rgba(202,146,43,0.15)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.95vw", fontWeight: 700, color: dark }}>{t.name}</span>
              </div>
              <span style={{ fontSize: "0.9vw", fontWeight: 600, color: t.color }}>{t.price}</span>
              <span style={{ fontSize: "0.85vw", color: dark }}>{t.ai}</span>
              <span style={{ fontSize: "0.85vw", color: dark }}>{t.places}</span>
              <span style={{ fontSize: "0.85vw", color: dark }}>{t.topics}</span>
              <span style={{ fontSize: "0.85vw", color: t.name === "Explorer" ? muted : "#1A6B4A", fontWeight: t.name === "Explorer" ? 400 : 600 }}>
                {t.family}
              </span>
            </div>
          ))}
        </div>

        {/* Right column: add-ons + principles */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>

          {/* Add-on seat pricing */}
          <div style={{
            background: "#FFF",
            borderRadius: "1vw",
            padding: "1.6vh 1.4vw",
            border: `1px solid rgba(202,146,43,0.2)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", marginBottom: "1.2vh" }}>
              {/* Users icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span style={{ fontSize: "0.75vw", fontWeight: 700, color: gold, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Add-On Seats
              </span>
            </div>
            <p style={{ fontSize: "0.75vw", color: muted, marginBottom: "1vh", lineHeight: 1.5 }}>
              First seat always included free. Additional family members share the same AI pool.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5vh" }}>
              {addOns.map((a) => (
                <div key={a.tier} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8vw", color: dark }}>{a.tier}</span>
                  <span style={{ fontSize: "0.85vw", fontWeight: 700, color: dark }}>{a.price}/seat/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Design principles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {[
              { icon: "shield", label: "Safety is always free", body: "Officer Watch, surveys, and neighborhood scores — no plan required, ever." },
              { icon: "wifi", label: "Pooled AI, not per-person", body: "The family shares one monthly AI budget — upgrading the plan grows the pool." },
              { icon: "search", label: "Search is never gated", body: "Minority-owned business discovery stays open to every member and visitor." },
            ].map((p) => (
              <div key={p.label} style={{ display: "flex", gap: "0.7vw", alignItems: "flex-start" }}>
                <div style={{ width: "2.2vh", height: "2.2vh", borderRadius: "50%", background: "rgba(202,146,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.2vh" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {p.icon === "shield" && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
                    {p.icon === "wifi" && <><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></>}
                    {p.icon === "search" && <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>}
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "0.78vw", fontWeight: 700, color: dark }}>{p.label}</div>
                  <div style={{ fontSize: "0.72vw", color: muted, lineHeight: 1.5, marginTop: "0.2vh" }}>{p.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer label */}
      <div style={{ marginTop: "2vh", display: "flex", alignItems: "center", gap: "0.5vw" }}>
        <div style={{ width: "2vw", height: "1px", background: gold }} />
        <span style={{ fontSize: "0.7vw", color: muted, letterSpacing: "0.08em" }}>
          MAPPING WITH MELANIN™ — MEMBERSHIP ARCHITECTURE
        </span>
      </div>
    </div>
  );
}
