import { Link, useLocation, Redirect } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Menu, X, MessageSquare, Bell, ChevronRight, FileText, BarChart2, Sparkles, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const BASE = import.meta.env.BASE_URL;

function useRequireApproval() {
  const [requireApproval, setRequireApproval] = useState(false);
  useEffect(() => {
    fetch(`${BASE}api/admin/check`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setRequireApproval(d.requireApproval === true))
      .catch(() => {});
  }, []);
  return requireApproval;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: auth } = useGetCurrentAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const requireApproval = useRequireApproval();
  const { theme, setTheme } = useTheme();

  if (requireApproval && auth?.user && auth.user.approved === false) {
    return <Redirect to="/pending-approval" />;
  }

  const navItems = [
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/explore", label: "Explore" },
    { href: "/businesses", label: "Businesses" },
    { href: "/community", label: "Community" },
    { href: "/safety", label: "Safety" },
    { href: "/travel", label: "KinfolkAI™" },
    { href: "/events", label: "Events" },
    { href: "/for-business-owners", label: "For Business Owners", featured: true },
    { href: "/contact", label: "Contact" },
  ];

  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* ── Top Announcement Banner ── */}
      {!bannerDismissed && (
        <div className="w-full bg-[#CA922B] text-[#2B1507] text-sm font-semibold z-[60] relative">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 sm:gap-4 flex-wrap">
              <span className="font-bold hidden sm:inline shrink-0">Explore MWM™:</span>
              <Link href="/pitch-deck">
                <span className="flex items-center gap-1 hover:underline cursor-pointer shrink-0">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Pitch Deck
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
              <Link href="/biz-onepager">
                <span className="flex items-center gap-1 hover:underline cursor-pointer shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                  Business One-Pager
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
              <Link href="/features">
                <span className="flex items-center gap-1 hover:underline cursor-pointer shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  Platform Features
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
              <Link href="/for-business-owners">
                <span className="flex items-center gap-1 hover:underline cursor-pointer shrink-0 sm:hidden md:flex">
                  <FileText className="w-3.5 h-3.5" />
                  List Your Business
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#2B1507] text-[#F5EBD8] shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0 mr-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#FAF6EF] border-2 border-[#CA922B] shrink-0 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}images/logo-transparent.png`}
                alt="Mapping with Melanin logo"
                className="w-full h-full object-cover object-top scale-110"
              />
            </div>
            <span className="font-serif font-bold text-white tracking-tight">
              <span className="hidden sm:inline xl:hidden 2xl:inline text-xl">Mapping with Melanin™</span>
              <span className="hidden xl:inline 2xl:hidden text-lg">MWM™</span>
              <span className="sm:hidden text-base">MWM™</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden xl:flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    aria-current={isActive ? "page" : undefined}
                    className={`text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "text-[#CA922B]"
                        : item.featured
                        ? "text-[#F5EBD8] font-semibold border-b border-[#CA922B]/50 hover:text-[#CA922B]"
                        : "text-[#F5EBD8] hover:text-[#CA922B]"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth / Right side */}
          <div className="hidden xl:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle light/dark mode"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/15 transition-colors text-[#F5EBD8]"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {auth?.user ? (
              <>
                <Link href="/notifications">
                  <Bell className="w-5 h-5 text-[#F5EBD8] cursor-pointer hover:text-[#CA922B] transition-colors" />
                </Link>
                <Link href="/profile">
                  <span className="text-sm font-medium hover:text-[#CA922B] transition-colors cursor-pointer">Profile</span>
                </Link>
              </>
            ) : (
              <a href="/#waitlist-form">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6 font-semibold">Join the Waitlist</Button>
              </a>
            )}
          </div>

          {/* Hamburger — visible on all screens below xl */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            className="xl:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 transition-colors text-[#F5EBD8] shrink-0"
          >
            {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            role="navigation"
            aria-label="Mobile navigation"
            className="xl:hidden bg-[#2B1507] border-t border-white/10 px-5 py-5 flex flex-col gap-1 absolute w-full shadow-xl z-40 max-h-[80dvh] overflow-y-auto"
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <span className={`block py-3 text-[15px] font-medium cursor-pointer hover:text-[#CA922B] border-b border-white/5 transition-colors ${item.featured ? "text-[#CA922B] font-semibold" : "text-[#F5EBD8]"}`}>
                  {item.label}
                </span>
              </Link>
            ))}
            <div className="pt-4 mt-2 flex flex-col gap-3">
              <button
                onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 py-3 text-[15px] font-medium text-[#F5EBD8] border-b border-white/5"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
              {auth?.user ? (
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="block text-[15px] font-medium text-[#F5EBD8] cursor-pointer py-2">Profile</span>
                </Link>
              ) : (
                <a href="/#waitlist-form" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-semibold py-3 text-base">
                    Join the Waitlist
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full flex flex-col" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#2B1507] text-[#F5EBD8] py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Discover</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/businesses"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Minority-Owned Businesses</span></Link></li>
                <li><Link href="/explore"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Restaurants & Nightlife</span></Link></li>
                <li><Link href="/explore"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Hotels & Stays</span></Link></li>
                <li><Link href="/cities"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">City Spotlights</span></Link></li>
                <li><Link href="/map"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Explore the Map</span></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Community</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/community"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Groups & Meetups</span></Link></li>
                <li><Link href="/jobs"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Job Board</span></Link></li>
                <li><Link href="/events"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Cultural Events</span></Link></li>
                <li><Link href="/travel"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">KinfolkAI Travel Planner</span></Link></li>
                <li><Link href="/resources"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Mental Health & Recovery</span></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Platform</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/safety"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Safety & Reviews</span></Link></li>
                <li><Link href="/community-guidelines"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Guidelines</span></Link></li>
                <li><Link href="/membership"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Membership Plans</span></Link></li>
                <li><Link href="/roadmap"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Product Roadmap</span></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">About Us</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><a href="mailto:hello@mappingwithmelanin.com" className="hover:text-[#CA922B] transition-colors cursor-pointer">Contact Us</a></li>
                <li><Link href="/for-business-owners"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">List Your Business</span></Link></li>
                <li><Link href="/terms"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy-policy"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Privacy Policy</span></Link></li>
                <li><Link href="/community-guidelines"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Guidelines</span></Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#F5EBD8]/60">
            <p>© 2026 Mapping with Melanin™. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Privacy Policy</span></Link>
              <Link href="/terms"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Terms of Service</span></Link>
              <Link href="/community-guidelines"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Guidelines</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {/* KinfolkAI Widget — hidden on auth/payment-critical pages */}
      {!["/login", "/signup", "/membership"].includes(location) && (
        <Link href="/travel">
          <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50">
            {/* Full widget on sm+ screens */}
            <div className="hidden sm:flex bg-[#2B1507] border border-[#CA922B]/30 shadow-2xl rounded-2xl p-4 flex-col gap-2 cursor-pointer hover:shadow-[0_10px_40px_rgba(202,146,43,0.15)] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#CA922B]/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#CA922B]" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">KinfolkAI</div>
                  <div className="text-[#F5EBD8]/70 text-xs">Plan your next trip</div>
                </div>
              </div>
            </div>
            {/* Compact icon-only button on mobile */}
            <div className="sm:hidden w-12 h-12 rounded-full bg-[#2B1507] border border-[#CA922B]/40 shadow-xl flex items-center justify-center cursor-pointer">
              <MessageSquare className="w-5 h-5 text-[#CA922B]" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
