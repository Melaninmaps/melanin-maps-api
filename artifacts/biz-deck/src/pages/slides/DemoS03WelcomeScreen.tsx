const base = import.meta.env.BASE_URL;

export default function DemoS03WelcomeScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Welcome.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          The first screen sets the tone.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Sign in with Apple or Google in two taps — or continue as a guest and explore freely. No paywall on entry. The community is open; membership unlocks more.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Easy in. Worth staying for.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#1C0E06" }}>
            <div className="relative" style={{ height: "52%" }}>
              <img src={`${base}photos/feed-woman-movein.jpg`} crossOrigin="anonymous" alt="Community member" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(28,14,6,0.05) 0%, rgba(28,14,6,0.82) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 px-[1.2vw] pb-[1.2vw]">
                <div className="font-display" style={{ fontSize: "2.1vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1 }}>Mapping With<br />Melanin™</div>
                <div className="font-body mt-[0.35vw]" style={{ fontSize: "0.62vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600 }}>COMMUNITY · DISCOVERY · CULTURE</div>
              </div>
            </div>
            <div className="flex flex-col items-center px-[1.2vw] pt-[1.2vw] gap-[0.65vw]" style={{ flex: 1 }}>
              <div className="w-full flex items-center justify-center gap-[0.55vw] rounded-[0.7vw] py-[0.7vw]" style={{ background: "#FAF6EF" }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="#1C0E06"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 0 1-6.032-6.032 6.033 6.033 0 0 1 6.032-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/></svg>
                <span className="font-body" style={{ fontSize: "0.76vw", fontWeight: 700, color: "#1C0E06" }}>Continue with Google</span>
              </div>
              <div className="w-full flex items-center justify-center gap-[0.55vw] rounded-[0.7vw] py-[0.7vw]" style={{ background: "rgba(250,246,239,0.1)", border: "1px solid rgba(250,246,239,0.25)" }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="#FAF6EF"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <span className="font-body" style={{ fontSize: "0.76vw", fontWeight: 700, color: "#FAF6EF" }}>Continue with Apple</span>
              </div>
              <div className="flex items-center gap-[0.6vw] w-full">
                <div style={{ flex: 1, height: "1px", background: "rgba(250,246,239,0.12)" }} />
                <span className="font-body" style={{ fontSize: "0.6vw", color: "rgba(250,246,239,0.3)" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(250,246,239,0.12)" }} />
              </div>
              <span className="font-body" style={{ fontSize: "0.72vw", fontWeight: 600, color: "rgba(250,246,239,0.4)" }}>Continue as Guest →</span>
              <div className="font-body mt-[0.3vw]" style={{ fontSize: "0.52vw", color: "rgba(250,246,239,0.18)", textAlign: "center", lineHeight: 1.5 }}>By continuing you agree to our Terms &amp; Privacy Policy</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Two-tap sign-in</strong> — Apple, Google, or guest. Zero friction.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Guest mode</strong> lets curious members explore before committing.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Warm first impression</strong> — a cultural home, not just a utility app.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
