function LinkPreview({ favicon, domain, title, description, image }: {
  favicon: string; domain: string; title: string; description: string; image?: string;
}) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 overflow-hidden bg-[#1A0A00]">
      {image && (
        <div className="w-full h-24 flex items-center justify-center text-4xl" style={{ background: image }}>
        </div>
      )}
      <div className="px-3 py-2.5 flex items-start gap-2">
        <div className="w-5 h-5 rounded flex items-center justify-center bg-white/10 shrink-0 mt-0.5 text-sm">{favicon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white/30 text-[10px] mb-0.5">{domain}</p>
          <p className="text-white/85 text-xs font-semibold leading-snug">{title}</p>
          <p className="text-white/40 text-[10px] mt-0.5 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return <span className="text-[#CA922B] text-xs">{text}</span>;
}

function PostActions({ likes, comments }: { likes: number; comments: number }) {
  return (
    <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/6">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span className="text-white/40 text-[11px]">{likes}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span className="text-white/40 text-[11px]">{comments}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span className="text-white/30 text-[11px]">Repost</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        <span className="text-white/30 text-[11px]">Share</span>
      </div>
    </div>
  );
}

function Avatar({ initials, bg, size = "sm" }: { initials: string; bg: string; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center shrink-0 font-bold text-white ${bg.startsWith("from") ? `bg-gradient-to-br ${bg}` : bg}`}>
      {initials}
    </div>
  );
}

export function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-white text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <div className="w-6 h-3 border border-white/60 rounded-sm relative"><div className="absolute left-0.5 top-0.5 bottom-0.5 w-4 bg-white rounded-sm"/></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <span className="text-white text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Community</span>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#CA922B] flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed filter pills */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
        {["For You", "Following", "Local", "Business", "Events"].map((f, i) => (
          <div key={f} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${i === 0 ? "bg-[#CA922B] border-[#CA922B] text-white" : "border-white/15 text-white/40 bg-transparent"}`}>
            {f}
          </div>
        ))}
      </div>

      {/* Quick composer */}
      <div className="mx-4 mb-3 bg-[#231200] rounded-2xl border border-white/8 p-3 flex items-center gap-3">
        <Avatar initials="JM" bg="bg-[#CA922B]" />
        <div className="flex-1 bg-[#1A0A00] rounded-xl px-3 py-2 border border-white/10">
          <p className="text-white/30 text-xs">Share with the community…</p>
        </div>
        <div className="flex gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pb-24">
        <div className="flex flex-col gap-3 px-4">

          {/* Post 1 — plain text with hashtags (Business Owner) */}
          <div className="bg-[#231200] rounded-2xl border border-white/8 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials="DW" bg="from-[#CA922B] to-[#8B5E1A]" md />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-white text-sm font-bold">Deja Williams</span>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#1A2E22] border border-[#2D7A4F]/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"/>
                    <span className="text-[#4ADE80] text-[9px] font-bold">Business Owner</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#CA922B] text-[10px]">@dejawilliams</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-white/30 text-[10px]">1h ago</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[9px]">🌐</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <p className="text-white/85 text-xs leading-relaxed">
              Sunday brunch starts this weekend 🍳 New menu, new outdoor seating, same love. We're also partnering with a local jazz band — come for the food, stay for the vibes.{" "}
              <Tag text="#DejasSoulKitchen" /> <Tag text="#ATLFood" /> <Tag text="#BlackOwnedATL" />
            </p>
            <PostActions likes={61} comments={14} />
          </div>

          {/* Post 2 — text + link preview (article) */}
          <div className="bg-[#231200] rounded-2xl border border-white/8 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials="TA" bg="bg-[#1E7A4E]" md />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-bold">Tia Anderson</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#CA922B] text-[10px]">@tia_travels</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-white/30 text-[10px]">3h ago</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[9px]">🌐</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <p className="text-white/85 text-xs leading-relaxed">
              This piece on Black travel safety hit different. Worth a read before your next trip — covers everything from local intel to building community abroad.{" "}
              <Tag text="#BlackTravel" /> <Tag text="#SafetyFirst" />
            </p>
            <LinkPreview
              favicon="📰"
              domain="essence.com"
              title="The Black Traveler's Safety Guide: Community Intelligence Over Google Reviews"
              description="Why crowdsourced safety data from Black communities is changing the way we travel — and which apps are leading the charge."
            />
            <PostActions likes={112} comments={31} />
          </div>

          {/* Post 3 — text + business link card */}
          <div className="bg-[#231200] rounded-2xl border border-white/8 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials="JM" bg="bg-[#CA922B]" md />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-bold">Jasmine Mitchell</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#CA922B] text-[10px]">@jasmine.m</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-white/30 text-[10px]">5h ago</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[9px]">👥</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <p className="text-white/85 text-xs leading-relaxed">
              Found this gem in Inman Park yesterday — fully Black-owned, incredible espresso, and they actually know your name by the third visit. This is exactly what the map is for 🗺️🤎
            </p>
            {/* Business card link */}
            <div className="mt-3 rounded-xl border border-[#CA922B]/25 overflow-hidden bg-[#2A1200]">
              <div className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 rounded-xl bg-[#CA922B]/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl">☕</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"/>
                    <span className="text-[#4ADE80] text-[9px] font-bold">VERIFIED · MAP LISTING</span>
                  </div>
                  <p className="text-white font-bold text-sm">BLK Coffee Co.</p>
                  <p className="text-white/50 text-xs">Café · Inman Park, Atlanta</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[#CA922B] text-[10px]">4.9 ★</span>
                    <span className="text-white/20 text-[10px]">·</span>
                    <span className="text-white/40 text-[10px]">62 saves</span>
                  </div>
                </div>
                <div className="bg-[#CA922B] rounded-full px-3 py-1.5 shrink-0">
                  <span className="text-white text-[10px] font-bold">View</span>
                </div>
              </div>
            </div>
            <PostActions likes={38} comments={9} />
          </div>

          {/* Post 4 — link only (event) */}
          <div className="bg-[#231200] rounded-2xl border border-white/8 p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials="MR" bg="bg-[#7B5EA7]" md />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-bold">Marcus Reed</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#CA922B] text-[10px]">@marcusatl</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-white/30 text-[10px]">7h ago</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[9px]">🌐</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <p className="text-white/85 text-xs leading-relaxed">
              ATL fam — this pop-up is 🔥 I went last month and it was packed. Grab your tickets early, they sell out fast. <Tag text="#ATLEvents" /> <Tag text="#SupportBlack" />
            </p>
            <LinkPreview
              favicon="🎟️"
              domain="eventbrite.com"
              title="Black Entrepreneurs Market & Pop-Up — ATL Summer Edition"
              description="50+ Black-owned vendors, live music, food trucks, and pitch competition. July 19 · Ponce City Market Rooftop, Atlanta GA"
              image="linear-gradient(135deg, #3B1F0E 0%, #CA922B22 100%)"
            />
            <PostActions likes={89} comments={22} />
          </div>

          {/* Post 5 — short text, follower-only, repost indicator */}
          <div className="bg-[#231200] rounded-2xl border border-white/8 p-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              <span className="text-white/30 text-[10px]">Jasmine reposted</span>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials="KJ" bg="bg-[#C0392B]" md />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-bold">Kofi James</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#CA922B] text-[10px]">@kofispeaks</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-white/30 text-[10px]">1d ago</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[9px]">🌐</span>
                </div>
              </div>
            </div>
            <p className="text-white/85 text-xs leading-relaxed">
              The best tourism guide for any Black city isn't in a magazine. It's in the community. Apps like Mapping With Melanin are doing what travel journalism never could — building trust through lived experience. 💯
            </p>
            <PostActions likes={204} comments={47} />
          </div>

        </div>
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A0A00] border-t border-white/10 flex items-end justify-around px-2 pb-6 pt-2">
        {[
          { icon: "compass", label: "Discover", active: false },
          { icon: "map", label: "Map", active: false },
          { icon: "book", label: "Library", active: false },
          { icon: "users", label: "Community", active: true },
          { icon: "user", label: "Profile", active: false },
        ].map((tab) => (
          <div key={tab.label} className="flex flex-col items-center gap-1 px-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tab.active ? "#CA922B" : "white"} strokeWidth={tab.active ? "2.5" : "1.5"} opacity={tab.active ? 1 : 0.4}>
              {tab.icon === "compass" && <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>}
              {tab.icon === "map" && <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}
              {tab.icon === "book" && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}
              {tab.icon === "users" && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
              {tab.icon === "user" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
            </svg>
            <span className={`text-[10px] ${tab.active ? "text-[#CA922B] font-semibold" : "text-white/40"}`}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
