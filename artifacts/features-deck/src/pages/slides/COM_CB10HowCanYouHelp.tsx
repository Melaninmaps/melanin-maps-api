import React from 'react';

const actions = [
  { icon: "invite", label: "Invite a friend", desc: "Share the platform with someone who needs it" },
  { icon: "claim", label: "Claim your business", desc: "Get your business listed and verified" },
  { icon: "recommend", label: "Recommend businesses", desc: "Tell the community where to go" },
  { icon: "review", label: "Leave reviews", desc: "Help others know what to expect" },
  { icon: "story", label: "Share your story", desc: "Your experience builds trust for everyone" },
  { icon: "welcome", label: "Welcome newcomers", desc: "Be the community you wish you found" },
  { icon: "member", label: "Become a founding member", desc: "Get exclusive benefits and shape what we build" },
];

const ICONS: Record<string, React.ReactNode> = {
  invite: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>,
  claim: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v11h14V9"/><path d="M9 14h6v6H9z"/></svg>,
  recommend: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  review: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  story: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  welcome: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  member: <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
};

export default function CB10HowCanYouHelp() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(202,146,43,0.1) 0%, transparent 50%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>10</div>

      <div className="absolute left-0 right-0 text-center" style={{ top: "6vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>YOUR ROLE AS A COMMUNITY BUILDER</div>
        <h1 className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.5vw" }}>
          How can you help?
        </h1>
        <p className="font-body" style={{ fontSize: "1.05vw", color: "#6B4420", marginBottom: "0" }}>
          You don&rsquo;t have to be an investor. You don&rsquo;t have to own a business.
        </p>
      </div>

      <div className="absolute left-[5vw] right-[5vw]" style={{ top: "20vw", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.3vw" }}>
        {actions.map((a, i) => (
          <div key={a.label} style={{ gridColumn: i === 6 ? "2 / 4" : undefined, padding: "1.3vw 1.5vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.2)", background: "rgba(250,246,239,0.03)", display: "flex", flexDirection: "column", gap: "0.65vw" }}>
            {ICONS[a.icon]}
            <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#FAF6EF" }}>{a.label}</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#6B4420", lineHeight: 1.45 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
