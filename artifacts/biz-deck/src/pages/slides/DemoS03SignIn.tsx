const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

export default function DemoS03SignIn() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#130A03" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 2 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Sign in and<br />step in.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          Email sign-in for users who prefer it — with full password reset via a 6-digit code, Apple, and Google. No invasive data requests. Auth is the handshake, not a data extraction moment.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Apple and Google SSO — fastest path, maximum trust",
            "Email + password available with 6-digit reset flow",
            "Session token in SecureStore — never exposed client-side",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "2.2vw 1.2vw 1.5vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", marginBottom: "2vw" }}>
              <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span style={{ color: "#A87A40", fontSize: "0.52vw" }}>Back</span>
            </div>
            <div style={{ marginBottom: "2.5vw" }}>
              <div style={{ color: "#FAF6EF", fontSize: "1.1vw", fontWeight: 800, lineHeight: 1.2 }}>Welcome back.</div>
              <div style={{ color: "#5C3A1A", fontSize: "0.55vw", marginTop: "0.3vw" }}>Sign in to your account</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw", marginBottom: "1.5vw" }}>
              <div>
                <div style={{ color: "#A87A40", fontSize: "0.5vw", marginBottom: "0.3vw", fontWeight: 600 }}>EMAIL</div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.6vw", padding: "0.65vw 0.8vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                  <span style={{ color: "#FAF6EF", fontSize: "0.6vw" }}>zara.mitchell@email.com</span>
                </div>
              </div>
              <div>
                <div style={{ color: "#A87A40", fontSize: "0.5vw", marginBottom: "0.3vw", fontWeight: 600 }}>PASSWORD</div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.6vw", padding: "0.65vw 0.8vw", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#FAF6EF", fontSize: "0.6vw" }}>••••••••••</span>
                  <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#5C3A1A" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "#CA922B", fontSize: "0.48vw" }}>Forgot password?</span>
              </div>
            </div>

            <div style={{ background: "#CA922B", borderRadius: "0.8vw", padding: "0.8vw", textAlign: "center", marginBottom: "1.2vw" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.72vw", fontWeight: 800 }}>Sign In</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", marginBottom: "1.2vw" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ color: "#3A2010", fontSize: "0.48vw" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6vw" }}>
              <div style={{ background: "#FAF6EF", borderRadius: "0.8vw", padding: "0.65vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5vw" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="#1C0E06"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span style={{ color: "#1C0E06", fontSize: "0.65vw", fontWeight: 700 }}>Continue with Apple</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw", padding: "0.65vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5vw", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.65vw", fontWeight: 600 }}>Continue with Google</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "auto" }}>
              <span style={{ color: "#5C3A1A", fontSize: "0.48vw" }}>Don't have an account? </span>
              <span style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700 }}>Sign up free</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
