const TAGS = ["#SundayBrunch","#ShawEats","#BlackOwned","#DCMoves","#FinancialFreedom","#NaturalHair","#WanderlustSoul"];
const POSTS = [
  { user: "Zara M.", tag: "#SundayBrunch", loc: "Copper & Oak · Shaw, DC", text: "The mimosa flight is unmatched. 97 Trust Score and every drop earns it. #SundayBrunch #CopperAndOak", likes: 84 },
  { user: "Darius K.", tag: "#DCMoves", loc: "H Street · NE DC", text: "Just moved to the city and already found my spot. The community map is everything. #DCMoves #NewCity", likes: 61 },
];

export default function DemoS76HashtagScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>76</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Hashtags.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Tap a tag. Enter the conversation.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Trending tags live above the feed. Every #hashtag in a post is a live portal. Location pins create community-verified Safe Spaces entries automatically with every tagged post.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>The community writes the index.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-[1vw] py-[0.9vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 700 }}>Community</span>
              <div style={{ display: "flex", gap: "0.5vw" }}>
                {["For You","Following"].map((m, i) => (
                  <span key={m} className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: i === 0 ? "#1C0E06" : "#A87A40", background: i === 0 ? "#CA922B" : "transparent", padding: "0.15vw 0.5vw", borderRadius: "0.6vw" }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Trending strip */}
            <div className="flex gap-[0.45vw] px-[0.6vw] py-[0.5vw]" style={{ background: "#FAF6EF", borderBottom: "1px solid #E8DDC8", overflow: "hidden", flexShrink: 0 }}>
              {TAGS.slice(0, 5).map((t, i) => (
                <span key={t} className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: i === 0 ? "#FAF6EF" : "#A6720F", background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.12)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(202,146,43,0.3)"}`, borderRadius: "0.7vw", padding: "0.15vw 0.5vw", whiteSpace: "nowrap" }}>{t}</span>
              ))}
            </div>

            {/* Posts */}
            <div className="flex flex-col gap-[0.5vw] px-[0.5vw] pt-[0.5vw] flex-1 overflow-hidden">
              {POSTS.map((p, idx) => (
                <div key={idx} className="rounded-[0.8vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)", flexShrink: 0 }}>
                  <div className="flex items-start gap-[0.45vw] p-[0.6vw]">
                    <div style={{ width: "1.7vw", height: "1.7vw", borderRadius: "50%", background: idx === 0 ? "#CA922B" : "#2D7A4F", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="font-body" style={{ fontSize: "0.62vw", fontWeight: 700, color: "#1C0E06" }}>{p.user}</div>
                      <div className="flex items-center gap-[0.3vw] mt-[0.2vw]">
                        <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#A6720F" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="font-body" style={{ fontSize: "0.48vw", color: "#A87A40" }}>{p.loc}</span>
                      </div>
                      <p className="font-body mt-[0.35vw]" style={{ fontSize: "0.57vw", color: "#3A1F0E", lineHeight: 1.4 }}>
                        {p.text.split(/(#\w+)/g).map((chunk, ci) =>
                          /^#\w+$/.test(chunk)
                            ? <span key={ci} style={{ color: "#CA922B", fontWeight: 700 }}>{chunk}</span>
                            : chunk
                        )}
                      </p>
                      <div className="flex items-center gap-[0.6vw] mt-[0.3vw]">
                        <span className="font-body" style={{ fontSize: "0.5vw", color: "#B4832A" }}>
                          <svg style={{ display: "inline", marginRight: "0.2vw" }} width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                          {p.likes}
                        </span>
                        <span className="font-body" style={{ fontSize: "0.5vw", color: "#B4832A", fontWeight: 600 }}>{p.tag}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Safe Spaces pill */}
              <div className="flex items-center gap-[0.45vw] rounded-[0.8vw] px-[0.6vw] py-[0.55vw]" style={{ background: "#0D2E1A", border: "1px solid rgba(45,122,79,0.45)", flexShrink: 0 }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div style={{ flex: 1 }}>
                  <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#3FD97F" }}>Safe Spaces Directory</div>
                  <div className="font-body" style={{ fontSize: "0.46vw", color: "#2D7A4F" }}>Community-verified · 340 places near you</div>
                </div>
                <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="#2D7A4F" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Trending strip", rest: " — 12 live hashtags above the feed, color-coded by your followed tags." },
            { bold: "Tappable #tags", rest: " — every tag in a post opens a dedicated filtered feed with a follow toggle." },
            { bold: "Location pin", rest: " — every tagged post auto-creates or increments a Safe Spaces entry." },
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
