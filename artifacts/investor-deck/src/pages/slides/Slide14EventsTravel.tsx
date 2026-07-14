const base = import.meta.env.BASE_URL;

const POSTS = [
  { photo: "photos/feed-friends-rooftop.jpg", name: "Jasmine T.", loc: "Houston, TX", caption: "Landed in a new city and already have people to meet this weekend. Never felt like a stranger.", likes: 61, comments: 9 },
  { photo: "photos/feed-woman-movein.jpg", name: "Aisha R.", loc: "Atlanta, GA", caption: "Six months in and this city finally feels like home. Grateful for this community.", likes: 103, comments: 18 },
];

const CHECKLIST = [
  "She joins a neighborhood run club.",
  "She shares businesses she loves with others.",
  "She welcomes newcomers to Houston.",
  "She helps others discover places they\u2019ll love.",
  "She\u2019s helping make Houston feel like home for someone else.",
];

export default function Slide13EventsTravel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.14), transparent 55%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>14</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "33vw" }}>
        <div className="font-body mb-[1.1vw]" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE BECOMES PART OF THE COMMUNITY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          She&rsquo;s no longer new here.
          <br />
          She&rsquo;s known here.
        </h1>

        <div className="mt-[1.7vw]" style={{ display: "flex", flexDirection: "column", gap: "0.76vw" }}>
          {CHECKLIST.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.15vw", color: "#D8B98A", fontWeight: 400, display: "flex", alignItems: "flex-start", gap: "0.8vw", lineHeight: 1.4 }}>
              <span style={{ color: "#CA922B", fontSize: "1.1vw", fontWeight: 700, flexShrink: 0 }}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>

        <div className="font-display mt-[1.8vw]" style={{ fontSize: "1.5vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic", textWrap: "balance" }}>
          She came looking for a community.
          <br />
          Now she&rsquo;s helping build one.
        </div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="flex items-center justify-between px-[1vw] py-[1vw]" style={{ background: "#1C0E06" }}>
              <span className="font-display" style={{ fontSize: "0.85vw", color: "#F5EBD8", fontWeight: 700 }}>Community Feed</span>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#F5EBD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col gap-[0.55vw] px-[0.55vw] pt-[0.55vw]">
              <div className="rounded-[0.9vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                <div className="flex items-center gap-[0.5vw] px-[0.7vw] py-[0.55vw]">
                  <div className="rounded-full flex-shrink-0 flex items-center justify-center" style={{ width: "1.8vw", height: "1.8vw", background: "#CA922B" }}><svg width="0.85vw" height="0.85vw" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v6l-3 5M12 13l3 5M8 12h8"/></svg></div>
                  <div>
                    <div className="font-body" style={{ fontSize: "0.72vw", color: "#1C0E06", fontWeight: 700 }}>Houston Sunrise Run Club</div>
                    <div className="font-body" style={{ fontSize: "0.6vw", color: "#A6720F" }}>Community Event &middot; This Saturday</div>
                  </div>
                </div>
                <div className="mx-[0.7vw] mb-[0.6vw] rounded-[0.6vw] px-[0.7vw] py-[0.6vw]" style={{ background: "#FBF1DD", border: "1px dashed #CA922B" }}>
                  <div className="font-body" style={{ fontSize: "0.65vw", color: "#3A1F0E", fontWeight: 600 }}>Saturday, 7:00 AM &middot; Memorial Park</div>
                  <div className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408", marginTop: "0.2vw" }}>Hosted by neighbors in her new community</div>
                </div>
                <div className="px-[0.7vw] pb-[0.6vw] flex items-center justify-between">
                  <span className="font-body" style={{ fontSize: "0.6vw", color: "#B4832A" }}>18 going &middot; 6 new this week</span>
                  <span className="font-display rounded-full px-[0.65vw] py-[0.25vw]" style={{ fontSize: "0.58vw", color: "#FAF6EF", background: "#1C0E06", fontWeight: 700 }}>Jasmine RSVP&rsquo;d &#10003;</span>
                </div>
              </div>
              {POSTS.map((p) => (
                <div key={p.name} className="rounded-[0.9vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                  <div className="flex items-center gap-[0.5vw] px-[0.7vw] py-[0.55vw]">
                    <div className="rounded-full flex-shrink-0" style={{ width: "1.8vw", height: "1.8vw", background: "#CA922B" }} />
                    <div>
                      <div className="font-body" style={{ fontSize: "0.72vw", color: "#1C0E06", fontWeight: 700 }}>{p.name}</div>
                      <div className="font-body" style={{ fontSize: "0.6vw", color: "#A6720F" }}>{p.loc}</div>
                    </div>
                  </div>
                  <div className="relative w-full" style={{ height: "6.2vw" }}>
                    <img src={`${base}${p.photo}`} crossOrigin="anonymous" alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="px-[0.7vw] py-[0.5vw]">
                    <div className="font-body" style={{ fontSize: "0.62vw", color: "#3A1F0E", lineHeight: 1.35 }}>{p.caption}</div>
                    <div className="flex items-center gap-[0.7vw] mt-[0.4vw]" style={{ fontSize: "0.6vw", color: "#B4832A" }}>
                      <span>&#10084; {p.likes}</span>
                      <span>&#128172; {p.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
