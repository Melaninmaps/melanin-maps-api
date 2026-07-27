export default function DemoS88SocialLayerScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>88</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Social.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Every share is a conscious choice.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Link previews render automatically. Reposts carry attributed context. Visibility — Public, Followers, or Private — is chosen at composition time. Saved Spots can be shared selectively, with a confirmation gate for sensitive content.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Not going viral. Going deep.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.28)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-[1vw] py-[0.9vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.82vw", color: "#FAF6EF", fontWeight: 700 }}>Community</span>
              <div className="flex items-center gap-[0.4vw] rounded-[0.6vw] px-[0.5vw] py-[0.18vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.3)" }}>
                <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                <span className="font-body" style={{ fontSize: "0.44vw", color: "#CA922B", fontWeight: 700 }}>Public</span>
              </div>
            </div>

            <div className="flex flex-col gap-[0.45vw] px-[0.55vw] pt-[0.5vw] flex-1 overflow-hidden">
              {/* Post with link preview */}
              <div className="rounded-[0.8vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)", flexShrink: 0 }}>
                <div className="flex items-center gap-[0.45vw] px-[0.6vw] pt-[0.55vw]">
                  <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 700, color: "#1C0E06" }}>Marcus W.</div>
                  </div>
                  <div className="flex items-center gap-[0.25vw] rounded-[0.35vw] px-[0.35vw] py-[0.1vw]" style={{ background: "rgba(45,122,79,0.12)" }}>
                    <div style={{ width: "0.32vw", height: "0.32vw", borderRadius: "50%", background: "#2D7A4F" }} />
                    <span className="font-body" style={{ fontSize: "0.36vw", color: "#2D7A4F", fontWeight: 700 }}>Everyone</span>
                  </div>
                </div>
                <div className="px-[0.6vw] py-[0.4vw]">
                  <p className="font-body" style={{ fontSize: "0.55vw", color: "#3A1F0E", lineHeight: 1.35 }}>Great piece on building generational wealth through real estate investment.</p>
                </div>
                {/* Link preview card */}
                <div className="mx-[0.5vw] mb-[0.45vw] rounded-[0.6vw] overflow-hidden" style={{ border: "1px solid #E8DDC8" }}>
                  <div style={{ height: "2.5vw", background: "linear-gradient(135deg, #1C0E06 0%, #3A1F0E 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="font-display" style={{ fontSize: "0.6vw", color: "#CA922B", fontWeight: 700 }}>BlackWealthAccelerator.com</span>
                  </div>
                  <div className="p-[0.4vw]" style={{ background: "#FAF6EF" }}>
                    <div className="font-body" style={{ fontSize: "0.52vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.3 }}>5 Real Estate Strategies for First-Time Minority Investors</div>
                    <div className="font-body mt-[0.2vw]" style={{ fontSize: "0.42vw", color: "#7B5408", lineHeight: 1.3 }}>blackwealthaccelerator.com</div>
                  </div>
                </div>
              </div>

              {/* Repost */}
              <div className="rounded-[0.8vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)", flexShrink: 0 }}>
                <div className="flex items-center gap-[0.45vw] px-[0.6vw] pt-[0.5vw] pb-[0.3vw]">
                  <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "#2D7A4F", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="font-body" style={{ fontSize: "0.56vw", fontWeight: 700, color: "#1C0E06" }}>Darius K.</div>
                    <div className="flex items-center gap-[0.3vw]">
                      <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2.2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                      <span className="font-body" style={{ fontSize: "0.4vw", color: "#A87A40" }}>Reposted from Zara M.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[0.25vw] rounded-[0.35vw] px-[0.35vw] py-[0.1vw]" style={{ background: "rgba(90,111,202,0.12)" }}>
                    <div style={{ width: "0.32vw", height: "0.32vw", borderRadius: "50%", background: "#5A6FCA" }} />
                    <span className="font-body" style={{ fontSize: "0.36vw", color: "#5A6FCA", fontWeight: 700 }}>Followers</span>
                  </div>
                </div>
                <div className="px-[0.55vw] pb-[0.4vw]">
                  <p className="font-body" style={{ fontSize: "0.5vw", color: "#A87A40", lineHeight: 1.3, fontStyle: "italic" }}>This needed to be said louder. Sharing for the whole feed.</p>
                  {/* Nested original */}
                  <div className="mt-[0.3vw] rounded-[0.5vw] p-[0.4vw]" style={{ background: "#FAF6EF", border: "1px solid #E8DDC8" }}>
                    <div className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#A6720F" }}>Original by Zara M.</div>
                    <p className="font-body mt-[0.15vw]" style={{ fontSize: "0.44vw", color: "#3A1F0E", lineHeight: 1.3 }}>Copper & Oak Bistro just hired two baristas from the neighborhood. This is what community-first business looks like. #ShawEats</p>
                  </div>
                </div>
              </div>

              {/* Visibility selector hint */}
              <div className="flex items-center gap-[0.45vw] rounded-[0.75vw] px-[0.6vw] py-[0.4vw]" style={{ background: "#FAF6EF", border: "1px solid #E8DDC8", flexShrink: 0 }}>
                <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span className="font-body" style={{ fontSize: "0.52vw", color: "#A6720F", fontWeight: 600 }}>Write a post…</span>
                <div className="flex items-center gap-[0.3vw]" style={{ marginLeft: "auto" }}>
                  {["Public","Followers","Private"].map((v, i) => (
                    <span key={v} className="font-body" style={{ fontSize: "0.4vw", fontWeight: 700, color: i === 0 ? "#FAF6EF" : "#A87A40", background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.1)", padding: "0.1vw 0.4vw", borderRadius: "0.5vw" }}>{v}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          {[
            { bold: "Link preview cards", rest: " — title, domain, and favicon auto-fetched and rendered as clean card previews." },
            { bold: "Attributed reposts", rest: " — original author always preserved; add your own caption above the source post." },
            { bold: "Visibility at compose time", rest: " — Public, Followers Only, or Private chosen before the post goes out." },
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
