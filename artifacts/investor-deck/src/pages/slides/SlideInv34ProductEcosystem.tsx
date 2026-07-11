export default function SlideInv34ProductEcosystem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      {/* Radial glow from KinfolkAI center */}
      <div
        className="absolute"
        style={{
          left: "28vw",
          top: "14vw",
          width: "44vw",
          height: "30vw",
          background: "radial-gradient(ellipse, rgba(202,146,43,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Page number */}
      <div
        className="absolute font-display"
        style={{ bottom: "1.7vw", right: "5vw", fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}
      >
        34
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="absolute" style={{ left: "6vw", top: "2.8vw" }}>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          One Platform.{" "}
          <span style={{ color: "#CA922B" }}>Six Growth Engines.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", marginTop: "0.5vw" }}>
          Every experience strengthens the next — creating a platform people return to again and again.
        </div>
      </div>

      {/* ── Connector lines SVG overlay ────────────────────────── */}
      {/*
        Card positions (in vw / viewBox units, viewBox="0 0 100 56.25"):
          KinfolkAI™  left=38 top=20 right=62 bottom=31 center=(50,25.5)
          Discover    left=4  top=15 right=26 bottom=25 center=(15,20)
          Experiences left=74 top=15 right=96 bottom=25 center=(85,20)
          Safety      left=4  top=33 right=26 bottom=43 center=(15,38)
          Community   left=74 top=33 right=96 bottom=43 center=(85,38)
          Relocation  left=38 top=42 right=62 bottom=52 center=(50,47)
      */}
      <svg
        className="absolute"
        style={{ top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 56.25"
        preserveAspectRatio="none"
      >
        <g stroke="#CA922B" strokeWidth="0.45" strokeDasharray="1.8 2.8" opacity="0.4" fill="none" strokeLinecap="round">
          {/* KinfolkAI left → Discover right */}
          <line x1="38" y1="25.5" x2="26" y2="20" />
          {/* KinfolkAI right → Experiences left */}
          <line x1="62" y1="25.5" x2="74" y2="20" />
          {/* KinfolkAI left-lower → Safety right */}
          <line x1="38" y1="27" x2="26" y2="38" />
          {/* KinfolkAI right-lower → Community left */}
          <line x1="62" y1="27" x2="74" y2="38" />
          {/* KinfolkAI bottom → Relocation top */}
          <line x1="50" y1="31" x2="50" y2="42" />
        </g>
        {/* Endpoint dots on outer cards */}
        <g fill="#CA922B" opacity="0.5">
          <circle cx="26" cy="20" r="0.55" />
          <circle cx="74" cy="20" r="0.55" />
          <circle cx="26" cy="38" r="0.55" />
          <circle cx="74" cy="38" r="0.55" />
          <circle cx="50" cy="42" r="0.55" />
        </g>
        {/* Central dot on KinfolkAI™ */}
        <circle cx="50" cy="25.5" r="0.85" fill="#CA922B" opacity="0.7" />
      </svg>

      {/* ── DISCOVER (top-left) ─────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "4vw",
          top: "15vw",
          width: "22vw",
          height: "10vw",
          background: "rgba(202,146,43,0.07)",
          border: "1px solid rgba(202,146,43,0.28)",
          borderRadius: "0.5vw",
          padding: "1.1vw 1.3vw",
        }}
      >
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V9L12 4l7 5v12" />
          <path d="M9 21v-5h2.5v5" />
          <path d="M12.5 21v-5H15v5" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FAF6EF" }}>Discover</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>ATTRACTS NEW USERS</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#A87A40", marginTop: "0.35vw", lineHeight: 1.45 }}>
          Discover trusted places recommended by the community.
        </div>
      </div>

      {/* ── KINFOLK AI™ (center hub) ─────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "38vw",
          top: "20vw",
          width: "24vw",
          height: "11vw",
          background: "rgba(202,146,43,0.15)",
          border: "1.5px solid #CA922B",
          borderRadius: "0.6vw",
          padding: "1.1vw 1.4vw",
          boxShadow: "0 0 2.5vw rgba(202,146,43,0.18)",
        }}
      >
        {/* Sparkle icon */}
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3L13.6 8.6L19 10L13.6 11.4L12 17L10.4 11.4L5 10L10.4 8.6L12 3Z" />
          <path d="M19 14L19.9 16.6L22.5 17.5L19.9 18.4L19 21L18.1 18.4L15.5 17.5L18.1 16.6Z" />
          <path d="M4.5 3.5L5.2 5.5L7 6.5L5.2 7.5L4.5 9.5L3.8 7.5L2 6.5L3.8 5.5Z" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.55vw", fontWeight: 700, color: "#FAF6EF" }}>KinfolkAI™</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>PERSONALIZES EVERY JOURNEY</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#D9C4A3", marginTop: "0.35vw", lineHeight: 1.45 }}>
          AI guided by community intelligence — not algorithms alone.
        </div>
      </div>

      {/* ── EXPERIENCES (top-right) ──────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "74vw",
          top: "15vw",
          width: "22vw",
          height: "10vw",
          background: "rgba(202,146,43,0.07)",
          border: "1px solid rgba(202,146,43,0.28)",
          borderRadius: "0.5vw",
          padding: "1.1vw 1.3vw",
        }}
      >
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="15" r="1" fill="#CA922B" stroke="none" />
          <circle cx="12" cy="15" r="1" fill="#CA922B" stroke="none" />
          <circle cx="16" cy="15" r="1" fill="#CA922B" stroke="none" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FAF6EF" }}>Experiences</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>DRIVES RECURRING USE</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#A87A40", marginTop: "0.35vw", lineHeight: 1.45 }}>
          Experience every city like a local.
        </div>
      </div>

      {/* ── SAFETY (mid-left) ───────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "4vw",
          top: "33vw",
          width: "22vw",
          height: "10vw",
          background: "rgba(202,146,43,0.07)",
          border: "1px solid rgba(202,146,43,0.28)",
          borderRadius: "0.5vw",
          padding: "1.1vw 1.3vw",
        }}
      >
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FAF6EF" }}>Safety</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>BUILDS TRUST</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#A87A40", marginTop: "0.35vw", lineHeight: 1.45 }}>
          Know before you go.
        </div>
      </div>

      {/* ── COMMUNITY (mid-right) ───────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "74vw",
          top: "33vw",
          width: "22vw",
          height: "10vw",
          background: "rgba(202,146,43,0.07)",
          border: "1px solid rgba(202,146,43,0.28)",
          borderRadius: "0.5vw",
          padding: "1.1vw 1.3vw",
        }}
      >
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FAF6EF" }}>Community</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>CREATES ENGAGEMENT</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#A87A40", marginTop: "0.35vw", lineHeight: 1.45 }}>
          Build meaningful local connections.
        </div>
      </div>

      {/* ── RELOCATION (bottom-center) ──────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "38vw",
          top: "42vw",
          width: "24vw",
          height: "10vw",
          background: "rgba(202,146,43,0.07)",
          border: "1px solid rgba(202,146,43,0.28)",
          borderRadius: "0.5vw",
          padding: "1.1vw 1.3vw",
        }}
      >
        {/* House with arrow */}
        <svg width="1.9vw" height="1.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
          <line x1="17" y1="7" x2="21" y2="7" />
          <polyline points="19 5 21 7 19 9" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", marginTop: "0.45vw" }}>
          <div className="font-display" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FAF6EF" }}>Relocation</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 600 }}>EXPANDS LIFETIME VALUE</div>
        </div>
        <div className="font-body" style={{ fontSize: "0.98vw", color: "#A87A40", marginTop: "0.35vw", lineHeight: 1.45 }}>
          Move with confidence before the boxes arrive.
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", bottom: "3vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "0.8vw" }} />
        <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#A87A40", fontStyle: "italic" }}>
          Everything you need to discover, connect, and belong.
        </div>
      </div>
    </div>
  );
}
