const base = import.meta.env.BASE_URL;

export default function Slide14FriendsBusinesses() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>15</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "34vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.1vw", color: "#A6720F", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY &mdash; SHE PAYS IT FORWARD
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          Now she helps the next newcomer.
        </h1>
        <div className="inv-rule w-[7vw] mt-[3vh] mb-[3vh]" />
        <div className="font-body mb-[3.2vh]" style={{ fontSize: "1.2vw", color: "#3A1F0E", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          She shares the businesses she trusts. She recommends the doctor who made her feel understood. She welcomes the next person arriving in Houston &mdash; just as someone once welcomed her.
        </div>
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          One person finds home.
          <br />
          Then they help someone else find theirs.
        </div>
        <div className="font-display mt-[1.6vh]" style={{ fontSize: "1.3vw", fontWeight: 700, color: "#1C0E06", fontStyle: "italic" }}>
          That is Mapping with Melanin&trade;.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "7vw" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "40.85vw", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.35)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="relative w-full" style={{ height: "12vw" }}>
              <img src={`${base}photos/entrepreneur-storefront.jpg`} crossOrigin="anonymous" alt="Nola's Kitchen storefront" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(28,14,6,0.05), rgba(28,14,6,0.6))" }} />
              <div className="absolute left-[0.8vw] top-[0.7vw] rounded-full px-[0.6vw] py-[0.2vw]" style={{ background: "rgba(28,14,6,0.55)", fontSize: "0.55vw", color: "#F5EBD8" }}>&larr; Business Profile</div>
              <div className="absolute left-[0.8vw] bottom-[0.6vw] rounded-full px-[0.55vw] py-[0.22vw]" style={{ background: "#CA922B", fontSize: "0.55vw", color: "#1C0E06", fontWeight: 700 }}>Chosen by the Community</div>
            </div>
            <div className="px-[0.85vw] pt-[0.75vw]">
              <div className="flex items-center justify-between">
                <span className="font-display" style={{ fontSize: "0.95vw", color: "#1C0E06", fontWeight: 700 }}>Nola&rsquo;s Kitchen</span>
                <span className="font-body" style={{ fontSize: "0.68vw", color: "#A6720F", fontWeight: 700 }}>&#9733; 4.9</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.62vw", color: "#7B5408", marginTop: "0.15vw" }}>Soul Food &middot; Third Ward &middot; Minority-owned</div>

              <div className="flex items-center gap-[0.5vw] mt-[0.8vw]">
                <div className="flex-1 text-center rounded-[0.5vw] py-[0.4vw]" style={{ background: "#1C0E06" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", color: "#FAF6EF", fontWeight: 700 }}>Call</span>
                </div>
                <div className="flex-1 text-center rounded-[0.5vw] py-[0.4vw]" style={{ background: "#1C0E06" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", color: "#FAF6EF", fontWeight: 700 }}>Directions</span>
                </div>
                <div className="flex-1 text-center rounded-[0.5vw] py-[0.4vw]" style={{ background: "#CA922B" }}>
                  <span className="font-body" style={{ fontSize: "0.58vw", color: "#1C0E06", fontWeight: 700 }}>Save</span>
                </div>
              </div>

              <div className="mt-[0.85vw] rounded-[0.7vw] px-[0.7vw] py-[0.65vw]" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                <div className="flex items-center gap-[0.5vw]">
                  <div className="rounded-full flex-shrink-0" style={{ width: "1.5vw", height: "1.5vw", background: "#CA922B" }} />
                  <div>
                    <div className="font-body" style={{ fontSize: "0.62vw", color: "#1C0E06", fontWeight: 700 }}>Jasmine T.</div>
                    <div className="font-body" style={{ fontSize: "0.55vw", color: "#A6720F" }}>Recommended to 3 newcomers</div>
                  </div>
                </div>
                <div className="font-body mt-[0.4vw]" style={{ fontSize: "0.58vw", color: "#3A1F0E", lineHeight: 1.4 }}>
                  &ldquo;Moving is hard. Finding places like this makes it easier. I recommend this to every newcomer.&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
