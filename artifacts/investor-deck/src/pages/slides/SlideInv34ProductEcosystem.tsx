export default function SlideInv34ProductEcosystem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>

      {/* Stronger ambient glow — the platform is the sun */}
      <div
        className="absolute"
        style={{
          left: "18vw",
          top: "7vw",
          width: "64vw",
          height: "46vw",
          background:
            "radial-gradient(ellipse at center, rgba(202,146,43,0.22) 0%, rgba(202,146,43,0.1) 38%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {/* Page number */}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="absolute" style={{ left: "6vw", top: "2.2vw" }}>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          One Platform.{" "}
          <span style={{ color: "#CA922B" }}>Six Growth Engines.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", marginTop: "0.4vw" }}>
          Each engine creates value independently. Together, they create a network effect that's difficult to replicate.
        </div>
      </div>

      {/* ── SVG: connector lines + clockwise journey indicators ────────
           viewBox "0 0 100 56.25" → coordinates match vw units exactly.
           Cards: top=14/25.5/37, height=10 → center_y = 19 / 30.5 / 42
           Left card right edge x=23, hub left x=32
           Hub right x=68, right card left x=77
           Gap midpoints: (24+25.5)/2=24.75, (35.5+37)/2=36.25
      ──────────────────────────────────────────────────────────────── */}
      <svg
        className="absolute"
        style={{ top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 56.25"
        preserveAspectRatio="none"
      >
        {/* Connector lines */}
        <g stroke="#CA922B" strokeWidth="0.28" strokeDasharray="1.4 2.6" opacity="0.3" fill="none" strokeLinecap="round">
          <line x1="23" y1="19" x2="32" y2="19" />
          <line x1="23" y1="30.5" x2="32" y2="30.5" />
          <line x1="23" y1="42" x2="32" y2="42" />
          <line x1="68" y1="19" x2="77" y2="19" />
          <line x1="68" y1="30.5" x2="77" y2="30.5" />
          <line x1="68" y1="42" x2="77" y2="42" />
        </g>
        {/* Endpoint dots */}
        <g fill="#CA922B" opacity="0.38">
          <circle cx="23" cy="19" r="0.48" /><circle cx="32" cy="19" r="0.48" />
          <circle cx="23" cy="30.5" r="0.48" /><circle cx="32" cy="30.5" r="0.48" />
          <circle cx="23" cy="42" r="0.48" /><circle cx="32" cy="42" r="0.48" />
          <circle cx="68" cy="19" r="0.48" /><circle cx="77" cy="19" r="0.48" />
          <circle cx="68" cy="30.5" r="0.48" /><circle cx="77" cy="30.5" r="0.48" />
          <circle cx="68" cy="42" r="0.48" /><circle cx="77" cy="42" r="0.48" />
        </g>
        {/* Journey flow arrows — left column ↓ (step 1→2→3) */}
        <g stroke="#CA922B" strokeWidth="0.35" opacity="0.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* ↓ between Discover and Safety */}
          <polyline points="11.5,24.5 12.5,25.7 13.5,24.5" />
          {/* ↓ between Safety and Community */}
          <polyline points="11.5,36 12.5,37.2 13.5,36" />
          {/* ↑ between Experiences and Business (right col, step 4→5) */}
          <polyline points="86.5,36 87.5,34.8 88.5,36" />
          {/* ↑ between Business and Relocation (step 5→6) */}
          <polyline points="86.5,24.5 87.5,23.3 88.5,24.5" />
        </g>
      </svg>

      {/* ── CENTER HUB: Mapping with Melanin™ ──────────────────────── */}
      <div
        className="absolute"
        style={{
          left: "32vw",
          top: "14vw",
          width: "36vw",
          height: "33vw",
          background: "rgba(202,146,43,0.14)",
          border: "1.5px solid #CA922B",
          borderRadius: "0.7vw",
          boxShadow:
            "0 0 4vw rgba(202,146,43,0.3), 0 0 8vw rgba(202,146,43,0.14), inset 0 0 2.5vw rgba(202,146,43,0.07)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "2vw 2.5vw",
        }}
      >
        <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "0.5vw" }}>
          THE PLATFORM
        </div>
        <div className="font-display" style={{ fontSize: "2.5vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>
          Mapping with Melanin™
        </div>
        <div className="font-display" style={{ fontSize: "1.2vw", color: "#CA922B", marginTop: "0.5vw" }}>
          Community Intelligence Ecosystem
        </div>
        <div style={{ width: "14vw", height: "1px", background: "rgba(202,146,43,0.35)", margin: "1vw 0" }} />
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontStyle: "italic", fontWeight: 500 }}>
          Powered by KinfolkAI™
        </div>
        <div
          className="font-body"
          style={{ fontSize: "0.95vw", color: "#A87A40", fontStyle: "italic", lineHeight: 1.55, marginTop: "0.6vw", maxWidth: "26vw" }}
        >
          Every interaction strengthens<br />every future recommendation.
        </div>
      </div>

      {/* ── Column phase labels ─────────────────────────────────────── */}
      <div className="absolute font-body" style={{ left: "2vw", top: "11.8vw", width: "21vw", fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, textAlign: "center", opacity: 0.85 }}>
        ACQUIRE &amp; BUILD TRUST
      </div>
      <div className="absolute font-body" style={{ left: "77vw", top: "11.8vw", width: "21vw", fontSize: "0.78vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, textAlign: "center", opacity: 0.85 }}>
        ENGAGE &amp; GROW LIFETIME VALUE
      </div>

      {/* ──────────────────────────────────────────────────────────────
           LEFT COLUMN — clockwise journey steps 1→2→3 (top → bottom)
      ──────────────────────────────────────────────────────────────── */}

      {/* STEP 1 — Discover */}
      <div className="absolute" style={{ left: "2vw", top: "14vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>1</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V9l7-5 7 5v12" />
            <path d="M9 21v-5h2v5M13 21v-5h2v5" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Discover</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>ACQUIRES USERS</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Trusted places recommended by the community.
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2 — Safety */}
      <div className="absolute" style={{ left: "2vw", top: "25.5vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>2</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Safety</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>BUILDS TRUST</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Know before you go.
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3 — Community */}
      <div className="absolute" style={{ left: "2vw", top: "37vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>3</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Community</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>CREATES ENGAGEMENT</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Build meaningful local connections.
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
           RIGHT COLUMN — clockwise journey steps 4→5→6 (bottom → top)
      ──────────────────────────────────────────────────────────────── */}

      {/* STEP 6 — Relocation (top-right, final journey stage) */}
      <div className="absolute" style={{ left: "77vw", top: "14vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>6</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            <line x1="17" y1="7" x2="21" y2="7" />
            <polyline points="19 5 21 7 19 9" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Relocation</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>EXPANDS LIFETIME VALUE</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Move with confidence before the boxes arrive.
            </div>
          </div>
        </div>
      </div>

      {/* STEP 5 — Business (mid-right) */}
      <div className="absolute" style={{ left: "77vw", top: "25.5vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>5</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Business</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>CREATES SUPPLY</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Businesses power discovery, experiences, and community engagement across the ecosystem.
            </div>
          </div>
        </div>
      </div>

      {/* STEP 4 — Experiences (bottom-right, picks up the journey from Community) */}
      <div className="absolute" style={{ left: "77vw", top: "37vw", width: "21vw", height: "10vw" }}>
        <div style={{ position: "relative", height: "100%", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.5vw", padding: "1vw 1.2vw" }}>
          <div style={{ position: "absolute", top: "0.55vw", right: "0.55vw", width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.22)", border: "1px solid rgba(202,146,43,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="font-display" style={{ fontSize: "0.72vw", color: "#CA922B", fontWeight: 800, lineHeight: 1 }}>4</span>
          </div>
          <svg width="1.75vw" height="1.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="8" cy="15" r="1" fill="#CA922B" stroke="none" />
            <circle cx="12" cy="15" r="1" fill="#CA922B" stroke="none" />
            <circle cx="16" cy="15" r="1" fill="#CA922B" stroke="none" />
          </svg>
          <div style={{ marginTop: "0.35vw" }}>
            <div className="font-display" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FAF6EF" }}>Experiences</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.13em", fontWeight: 700, marginTop: "0.1vw" }}>DRIVES RETENTION</div>
            <div className="font-body" style={{ fontSize: "0.87vw", color: "#A87A40", marginTop: "0.2vw", lineHeight: 1.4 }}>
              Experience every city like a local.
            </div>
          </div>
        </div>
      </div>

      {/* ── Flywheel bridge sentence (below center hub) ─────────────── */}
      <div
        className="absolute font-body"
        style={{
          left: "32vw",
          top: "48vw",
          width: "36vw",
          fontSize: "0.9vw",
          color: "#A87A40",
          fontStyle: "italic",
          textAlign: "center",
          lineHeight: 1.5,
          opacity: 0.9,
        }}
      >
        Every stage creates more data, trust, and engagement — making the next stage even more valuable.
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
