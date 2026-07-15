const base = import.meta.env.BASE_URL;

const SUPPORTED = ["Copper & Oak","Sankofa Café","Nubian Heritage"];

export default function DemoS80CommunityImpactScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>80</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Impact.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Your community presence, scored and surfaced.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Every member profile carries a Community Impact card — reviews, events, posts, and referrals scored 0–100. Business owners show their verified listings alongside their community activity. Trust runs in both directions.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Presence earns trust. Trust earns reach.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Profile header */}
            <div className="flex flex-col items-center pt-[1.2vw] pb-[0.7vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", overflow: "hidden", border: "0.2vw solid #CA922B" }}>
                <img src={`${base}photos/feed-woman-movein.jpg`} crossOrigin="anonymous" alt="Zara" className="w-full h-full object-cover" style={{ display: "block" }} />
              </div>
              <div className="font-display mt-[0.4vw]" style={{ fontSize: "0.82vw", fontWeight: 800, color: "#FAF6EF" }}>Zara M.</div>
              <div className="flex items-center gap-[0.35vw] mt-[0.25vw] rounded-[0.4vw] px-[0.55vw] py-[0.18vw]" style={{ background: "rgba(202,146,43,0.2)", border: "1px solid rgba(202,146,43,0.4)" }}>
                <div style={{ width: "0.38vw", height: "0.38vw", borderRadius: "50%", background: "#CA922B" }} />
                <span className="font-body" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#CA922B" }}>Navigator Member</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-around py-[0.6vw]" style={{ borderBottom: "1px solid #E8DDC8", flexShrink: 0 }}>
              {[["47","Followers"],["23","Following"],["340","Points"]].map(([v, l], i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#CA922B" }}>{v}</span>
                  <span className="font-body" style={{ fontSize: "0.4vw", color: "#A87A40" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Community Impact Card */}
            <div className="mx-[0.55vw] mt-[0.55vw] rounded-[0.9vw] overflow-hidden" style={{ border: "1px solid rgba(202,146,43,0.3)", flexShrink: 0 }}>
              {/* Card header */}
              <div className="flex items-center gap-[0.5vw] p-[0.6vw]" style={{ background: "#1C0E06" }}>
                <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "0.4vw", background: "rgba(202,146,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-body" style={{ fontSize: "0.6vw", fontWeight: 700, color: "#FAF6EF" }}>Community Impact</div>
                  <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>Zara actively supports the community</div>
                </div>
                <div className="rounded-[0.6vw] px-[0.5vw] py-[0.18vw]" style={{ background: "rgba(202,146,43,0.15)" }}>
                  <span className="font-display" style={{ fontSize: "0.75vw", fontWeight: 800, color: "#CA922B" }}>72</span>
                </div>
              </div>
              {/* Score label */}
              <div className="flex items-center gap-[0.35vw] px-[0.6vw] py-[0.3vw]" style={{ background: "#0D0805", borderTop: "1px solid rgba(202,146,43,0.2)" }}>
                <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="font-body" style={{ fontSize: "0.48vw", fontWeight: 700, color: "#CA922B" }}>Community Builder</span>
              </div>
              {/* Stats rows */}
              <div className="flex flex-col gap-[0.25vw] p-[0.55vw]" style={{ background: "#FAF6EF" }}>
                {[["star","7 reviews shared"],["map-pin","5 businesses championed"],["calendar","3 events attended"],["message-circle","12 community posts"]].map(([icon, label], i) => {
                  const icons: Record<string, string> = {
                    "star": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                    "map-pin": "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z M12 7 a3 3 0 1 0 0 6 a3 3 0 0 0 0-6z",
                    "calendar": "M3 9h18M8 3v3M16 3v3M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
                    "message-circle": "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
                  };
                  return (
                    <div key={i} className="flex items-center gap-[0.4vw]">
                      <div style={{ width: "1.3vw", height: "1.3vw", borderRadius: "0.3vw", background: "rgba(202,146,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><path d={icons[icon as string] ?? ""}/></svg>
                      </div>
                      <span className="font-body" style={{ fontSize: "0.5vw", color: "#3A1F0E", flex: 1 }}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Supports strip */}
              <div className="px-[0.55vw] pb-[0.55vw]" style={{ background: "#FAF6EF", borderTop: "1px solid #E8DDC8" }}>
                <div className="font-body mt-[0.3vw]" style={{ fontSize: "0.42vw", fontWeight: 700, color: "#A87A40", textTransform: "uppercase", letterSpacing: "0.08em" }}>Supports Others</div>
                <div className="flex gap-[0.3vw] mt-[0.3vw]">
                  {SUPPORTED.map(b => (
                    <span key={b} className="font-body" style={{ fontSize: "0.42vw", color: "#A6720F", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.25)", padding: "0.1vw 0.4vw", borderRadius: "0.6vw", whiteSpace: "nowrap" }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Score 72/100", rest: " — Builder tier. Earned through reviews, events, posts, and referrals." },
            { bold: "Businesses championed", rest: " — shows the places Zara reviewed and supported, linked and tappable." },
            { bold: "Bidirectional trust", rest: " — business owners link their listing to their profile; impact score flows into business trust." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4, marginTop: "0.55vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}>
                <strong style={{ fontWeight: 700, color: "#A6720F" }}>{item.bold}</strong>{item.rest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
