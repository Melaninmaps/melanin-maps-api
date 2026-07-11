export default function SlideInv34ProductEcosystem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      {/* Ambient glow behind center */}
      <div
        className="absolute"
        style={{
          left: "24vw",
          top: "10vw",
          width: "52vw",
          height: "38vw",
          background: "radial-gradient(ellipse, rgba(202,146,43,0.11) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {/* Page number */}
      <div className="absolute font-display" style={{ bottom: "1.7vw", right: "5vw", fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>34</div>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="absolute" style={{ left: "6vw", top: "2.5vw" }}>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          One Platform.{" "}
          <span style={{ color: "#CA922B" }}>Six Growth Engines.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", marginTop: "0.45vw" }}>
          Each growth engine reinforces the next, creating compounding value for users, businesses, and the platform.
        </div>
      </div>

      {/* ── SVG connector lines ─────────────────────────────────────
           viewBox "0 0 100 56.25" — coordinates match vw positions exactly.
           Card rows top=14 / 24 / 34, each height=8.5 → center_y = 18.25 / 28.25 / 38.25
           Left card right edge  x=23, hub left edge  x=32
           Hub right edge        x=68, right card left x=77
      ─────────────────────────────────────────────────────────────── */}
      <svg
        className="absolute"
        style={{ top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 56.25"
        preserveAspectRatio="none"
      >
        <g stroke="#CA922B" strokeWidth="0.28" strokeDasharray="1.4 2.6" opacity="0.3" fill="none" strokeLinecap="round">
          <line x1="23" y1="18.25" x2="32" y2="18.25" />
          <line x1="23" y1="28.25" x2="32" y2="28.25" />
          <line x1="23" y1="38.25" x2="32" y2="38.25" />
          <line x1="68" y1="18.25" x2="77" y2="18.25" />
          <line x1="68" y1="28.25" x2="77" y2="28.25" />
          <line x1="68" y1="38.25" x2="77" y2="38.25" />
        </g>
        <g fill="#CA922B" opacity="0.4">
          <circle cx="23" cy="18.25" r="0.5" /><circle cx="32" cy="18.25" r="0.5" />
          <circle cx="23" cy="28.25" r="0.5" /><circle cx="32" cy="28.25" r="0.5" />
          <circle cx="23" cy="38.25" r="0.5" /><circle cx="32" cy="38.25" r="0.5" />
          <circle cx="68" cy="18.25" r="0.5" /><circle cx="77" cy="18.25" r="0.5" />
          <circle cx="68" cy="28.25" r="0.5" /><circle cx="77" cy="28.25" r="0.5" />
          <circle cx="68" cy="38.25" r="0.5" /><circle cx="77" cy="38.25" r="0.5" />
        </g>
      </svg>

      {/* ── CENTER HUB: Mapping with Melanin™ ──────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "32vw",
          top: "14vw",
          width: "36vw",
          height: "28.5vw",
          background: "rgba(202,146,43,0.1)",
          border: "1.5px solid rgba(202,146,43,0.65)",
          borderRadius: "0.7vw",
          boxShadow: "0 0 3vw rgba(202,146,43,0.12)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "2vw 2.5vw",
        }}
      >
        <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "0.6vw" }}>
          THE PLATFORM
        </div>
        <div className="font-display" style={{ fontSize: "2.5vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          Mapping with Melanin™
        </div>
        <div className="font-display" style={{ fontSize: "1.25vw", color: "#CA922B", marginTop: "0.5vw" }}>
          Community Intelligence Platform
        </div>
        <div style={{ width: "14vw", height: "1px", background: "rgba(202,146,43,0.3)", margin: "1.1vw 0" }} />
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontStyle: "italic", fontWeight: 500 }}>
          Powered by KinfolkAI™
        </div>
        <div
          className="font-body"
          style={{ fontSize: "0.95vw", color: "#A87A40", fontStyle: "italic", lineHeight: 1.55, marginTop: "0.6vw", maxWidth: "26vw" }}
        >
          Every interaction makes the next<br />recommendation smarter.
        </div>
      </div>

      {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}

      {/* Discover — row 1 */}
      <div className="absolute" style={{ left: "2vw", top: "14vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V9l7-5 7 5v12" />
          <path d="M9 21v-5h2v5M13 21v-5h2v5" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Discover</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>ACQUIRES USERS</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Trusted places recommended by the community.
          </div>
        </div>
      </div>

      {/* Safety — row 2 */}
      <div className="absolute" style={{ left: "2vw", top: "24vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Safety</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>BUILDS TRUST</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Know before you go.
          </div>
        </div>
      </div>

      {/* Community — row 3 */}
      <div className="absolute" style={{ left: "2vw", top: "34vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Community</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>CREATES ENGAGEMENT</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Build meaningful local connections.
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}

      {/* Experiences — row 1 */}
      <div className="absolute" style={{ left: "77vw", top: "14vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="15" r="1" fill="#CA922B" stroke="none" />
          <circle cx="12" cy="15" r="1" fill="#CA922B" stroke="none" />
          <circle cx="16" cy="15" r="1" fill="#CA922B" stroke="none" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Experiences</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>DRIVES RETENTION</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Experience every city like a local.
          </div>
        </div>
      </div>

      {/* Business — row 2 */}
      <div className="absolute" style={{ left: "77vw", top: "24vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Business</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>CREATES SUPPLY</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Businesses create the content and events that power the ecosystem.
          </div>
        </div>
      </div>

      {/* Relocation — row 3 */}
      <div className="absolute" style={{ left: "77vw", top: "34vw", width: "21vw", height: "8.5vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
        <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
          <line x1="17" y1="7" x2="21" y2="7" />
          <polyline points="19 5 21 7 19 9" />
        </svg>
        <div style={{ marginTop: "0.4vw" }}>
          <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Relocation</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>EXPANDS LIFETIME VALUE</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", marginTop: "0.25vw", lineHeight: 1.4 }}>
            Move with confidence before the boxes arrive.
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", bottom: "3vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)", marginBottom: "0.8vw" }} />
        <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#A87A40", fontStyle: "italic" }}>
          One ecosystem. Multiple revenue streams. Increasing lifetime value.
        </div>
      </div>
    </div>
  );
}
