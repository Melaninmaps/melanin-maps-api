const posts = [
  {
    initials: "DW", bg: "from-[#CA922B] to-[#8B5E1A]", name: "Deja Williams", handle: "@dejawilliams",
    badge: "Trailblazer", privacy: "🌐", privacyLabel: "Public", ago: "1h ago",
    text: "We're now open 7 days a week! Come through for Sunday brunch — new menu dropping this weekend 🍽️🤎",
    likes: 61, comments: 14, isOwner: true,
  },
  {
    initials: "JM", bg: "bg-[#CA922B]", name: "Jasmine Mitchell", handle: "@jasmine.m",
    badge: "Navigator", privacy: "🌐", privacyLabel: "Public", ago: "2h ago",
    text: "Just checked in at The Breakfast Club ATL — the chicken & waffles hit different on a Saturday 🧇🤎",
    likes: 24, comments: 5, isOwner: false,
  },
  {
    initials: "MR", bg: "bg-[#7B5EA7]", name: "Marcus Reed", handle: "@marcusatl",
    badge: "Navigator", privacy: "👥", privacyLabel: "Followers", ago: "4h ago",
    text: "PSA: Sweet Auburn Seafood has a new outdoor patio. The vibes are immaculate. Go before everyone finds out 🦞",
    likes: 89, comments: 22, isOwner: false,
  },
  {
    initials: "TA", bg: "bg-[#1E7A4E]", name: "Tia Anderson", handle: "@tia_travels",
    badge: "Community", privacy: "🌐", privacyLabel: "Public", ago: "6h ago",
    text: "Added 3 new Black-owned spots to the map in Decatur. If you know of more, drop them below 📍",
    likes: 112, comments: 31, isOwner: false,
  },
];

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
          <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
        </div>
      </div>

      {/* Feed filter pills */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto">
        {["All Posts", "Following", "Local", "Business Updates"].map((f, i) => (
          <div key={f} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${i === 0 ? "bg-[#CA922B] border-[#CA922B] text-white" : "border-white/15 text-white/40 bg-transparent"}`}>
            {f}
          </div>
        ))}
      </div>

      {/* Quick composer strip */}
      <div className="mx-4 mb-3 bg-[#231200] rounded-2xl border border-white/8 p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#CA922B] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">JM</span>
        </div>
        <div className="flex-1 bg-[#1A0A00] rounded-xl px-3 py-2 border border-white/10">
          <p className="text-white/30 text-xs">Share with the community…</p>
        </div>
        {/* Privacy icon */}
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#CA922B]/15 border border-[#CA922B]/30 shrink-0">
          <span className="text-[11px]">🌐</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pb-24">
        {/* Feed */}
        <div className="flex flex-col gap-3 px-4">
          {posts.map((post, i) => (
            <div key={i} className="bg-[#231200] rounded-2xl border border-white/8 p-4">
              {/* Author row */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${post.bg.startsWith("from") ? `bg-gradient-to-br ${post.bg}` : post.bg}`}>
                  <span className="text-white text-sm font-bold">{post.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white text-sm font-bold">{post.name}</span>
                    {post.isOwner && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#1A2E22] border border-[#2D7A4F]/40">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"/>
                        <span className="text-[#4ADE80] text-[9px] font-bold">Owner</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#CA922B] text-[10px]">{post.handle}</span>
                    <span className="text-white/20 text-[10px]">·</span>
                    <span className="text-white/30 text-[10px]">{post.ago}</span>
                    <span className="text-white/20 text-[10px]">·</span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[9px]">{post.privacy}</span>
                      <span className="text-white/30 text-[9px]">{post.privacyLabel}</span>
                    </div>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </div>

              {/* Post text */}
              <p className="text-white/85 text-xs leading-relaxed">{post.text}</p>

              {/* Actions */}
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/6">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span className="text-white/40 text-[11px]">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span className="text-white/40 text-[11px]">{post.comments}</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  <span className="text-white/30 text-[11px]">Share</span>
                </div>
              </div>
            </div>
          ))}
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
