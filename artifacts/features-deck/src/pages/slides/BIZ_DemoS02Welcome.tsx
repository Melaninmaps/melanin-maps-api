const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

export default function DemoS02Welcome() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 1 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          The first thing<br />a user sees.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Before an account. Before any data. The welcome screen sets the entire cultural tone — this is not a generic app. It is a space built for the melanated diaspora, and that is unmistakable from the very first frame.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Gold-on-dark palette signals community and warmth from pixel one",
            "Sign in with Apple or Google — zero friction, full trust",
            "No tracking walls, no email harvesting — respect first",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          {/* Splash screen */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "2vw 1.2vw 1.5vw" }}>
            {/* Top area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1vw" }}>
              {/* Logo mark */}
              <div style={{ width: "5vw", height: "5vw", borderRadius: "1.4vw", background: "linear-gradient(135deg, rgba(202,146,43,0.25), rgba(202,146,43,0.08))", border: "1.5px solid rgba(202,146,43,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="2.5vw" height="2.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#CA922B", fontSize: "0.75vw", fontWeight: 800, letterSpacing: "0.12em" }}>MAPPING WITH</div>
                <div style={{ color: "#FAF6EF", fontSize: "1.15vw", fontWeight: 800, letterSpacing: "0.08em" }}>MELANIN™</div>
              </div>
              <div style={{ color: "#5C3A1A", fontSize: "0.55vw", textAlign: "center", lineHeight: 1.6, maxWidth: "16vw" }}>
                Community discovery for the melanated diaspora. Find your people, places, and power.
              </div>
            </div>

            {/* Auth buttons */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
              <button style={{ width: "100%", background: "#FAF6EF", borderRadius: "0.8vw", padding: "0.75vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5vw", border: "none" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="#1C0E06"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span style={{ color: "#1C0E06", fontSize: "0.7vw", fontWeight: 700 }}>Continue with Apple</span>
              </button>
              <button style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "0.8vw", padding: "0.75vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5vw", border: "1px solid rgba(255,255,255,0.12)" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span style={{ color: "#FAF6EF", fontSize: "0.7vw", fontWeight: 600 }}>Continue with Google</span>
              </button>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "#5C3A1A", fontSize: "0.5vw" }}>Sign in with email</span>
              </div>
              <div style={{ textAlign: "center", marginTop: "0.3vw" }}>
                <span style={{ color: "#3A2010", fontSize: "0.42vw", lineHeight: 1.6 }}>By continuing you agree to our Terms & Privacy Policy</span>
              </div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
