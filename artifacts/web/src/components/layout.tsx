import { Link, useLocation, Redirect } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Menu, X, MessageSquare, Bell, Sun, Moon, Compass, Map, Users, Shield, BookOpen, User, Instagram, Facebook, Music2, AtSign, ExternalLink } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/theme";
import { FeedbackButton } from "./FeedbackButton";
import { KinfolkOnboarding } from "./KinfolkOnboarding";
import { OFFICIAL_SOCIAL_LINKS } from "@/lib/socialLinks";

const BASE = import.meta.env.BASE_URL;

const SOCIAL_ICONS = {
  tiktok: Music2,
  instagram: Instagram,
  facebook: Facebook,
  threads: AtSign,
} as const;

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
  const [kinfolkDismissed, setKinfolkDismissed] = useState(false);
  const [location] = useLocation();
  const { data: auth, isLoading: authLoading, refetch: refetchAuth } = useGetCurrentAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const requireApproval = useRequireApproval();
  const { theme, setTheme } = useTheme();

  // Onboarding: show once when an authenticated member hasn't completed profile setup
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const needsOnboarding =
    !!auth?.user && auth.user.profileSetupComplete === false && !onboardingDismissed;
  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDismissed(true);
    refetchAuth?.();
  }, [refetchAuth]);

  if (requireApproval && auth?.user && auth.user.approved === false) {
    return <Redirect to="/pending-approval" />;
  }

  const isMember = !!(auth?.user);

  // Contextual KinfolkAI bubble subtitle — changes based on current page
  const kinfolkSubtitle = (() => {
    if (location === "/" || location === "") return "What can I help with?";
    if (location.startsWith("/map") || location.startsWith("/explore")) return "Need help finding something?";
    if (location.startsWith("/businesses/")) return "Want to know what the community says?";
    if (location.startsWith("/safety")) return "I'm here if you need me";
    if (location.startsWith("/community")) return "Let's connect you";
    if (location.startsWith("/profile")) return "How can I help today?";
    return "Ask me anything";
  })();

  type NavItem = { href: string; label: string; featured?: boolean };

  // Always-visible nav — no account needed
  const publicNavItems: NavItem[] = [
    { href: "/map", label: "Map" },
    { href: "/businesses", label: "Businesses" },
    { href: "/safety", label: "Safety" },
    { href: "/for-business-owners", label: "For Business Owners", featured: true },
  ];

  // Additional nav items shown only to approved members
  const memberOnlyNavItems: NavItem[] = [
    { href: "/explore", label: "Explore" },
    { href: "/community", label: "Community" },
    { href: "/library", label: "Library" },
    { href: "/travel", label: "KinfolkAI™" },
    { href: "/events", label: "Events" },
    { href: "/circles", label: "Circles" },
    { href: "/guides", label: "Guides" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/connections", label: "Connections" },
  ];

  const navItems: NavItem[] = isMember
    ? [...publicNavItems, ...memberOnlyNavItems]
    : publicNavItems;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* First-time Kinfolk onboarding — shown once when profileSetupComplete is false */}
      {needsOnboarding && (
        <KinfolkOnboarding
          firstName={auth?.user?.firstName ?? undefined}
          onComplete={handleOnboardingComplete}
        />
      )}
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#2B1507] text-[#F5EBD8] shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Mapping with Melanin home"
            data-testid="logo-home-link"
            className="flex items-center gap-2 md:gap-3 shrink-0 mr-4"
          >
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
          <nav aria-label="Main navigation" data-testid="desktop-navigation" className="hidden xl:flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`desktop-nav-link-${item.href.slice(1).replaceAll("/", "-") || "home"}`}
                  data-nav-item={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
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
                data-testid="desktop-theme-toggle"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 bg-white/5 hover:bg-white/15 transition-colors text-[#F5EBD8]"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {authLoading ? (
              /* Stable placeholder while session resolves — prevents Log In flash */
              <div className="w-20 h-8" aria-hidden="true" />
            ) : auth?.user ? (
              <>
                <Link href="/notifications" aria-label="Notifications" data-testid="desktop-notifications-link">
                  <Bell className="w-5 h-5 text-[#F5EBD8] cursor-pointer hover:text-[#CA922B] transition-colors" />
                </Link>
                <Link href="/profile" data-testid="desktop-profile-link">
                  <span className="text-sm font-medium hover:text-[#CA922B] transition-colors cursor-pointer">Profile</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <span className="text-sm font-medium text-[#F5EBD8]/80 hover:text-[#CA922B] transition-colors cursor-pointer">Log In</span>
                </Link>
                <a href="/#waitlist-form">
                  <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6 font-semibold">Join the Waitlist</Button>
                </a>
              </div>
            )}
          </div>

          {/* Hamburger — visible on all screens below xl */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-menu"
            data-testid="mobile-menu-toggle"
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
            data-testid="mobile-navigation"
            className="xl:hidden bg-[#2B1507] border-t border-white/10 px-5 py-5 flex flex-col gap-1 absolute w-full shadow-xl z-40 max-h-[80dvh] overflow-y-auto"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid={`mobile-nav-link-${item.href.slice(1).replaceAll("/", "-") || "home"}`}
                data-nav-item={item.href}
              >
                <span className={`block py-3 text-[15px] font-medium cursor-pointer hover:text-[#CA922B] border-b border-white/5 transition-colors ${item.featured ? "text-[#CA922B] font-semibold" : "text-[#F5EBD8]"}`}>
                  {item.label}
                </span>
              </Link>
            ))}
            <div className="pt-4 mt-2 flex flex-col gap-3">
              <button
                onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setIsMobileMenuOpen(false); }}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                data-testid="mobile-theme-toggle"
                className="flex items-center gap-3 py-3 text-[15px] font-medium text-[#F5EBD8] border-b border-white/5"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
              {authLoading ? null : auth?.user ? (
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-profile-link">
                  <span className="block text-[15px] font-medium text-[#F5EBD8] cursor-pointer py-2">Profile</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-login-link">
                    <span className="block text-center text-[15px] font-medium text-[#F5EBD8]/80 cursor-pointer py-2 border border-white/20 rounded-full hover:border-[#CA922B]/50">Log In</span>
                  </Link>
                  <a href="/#waitlist-form" onClick={() => setIsMobileMenuOpen(false)} data-testid="mobile-waitlist-link">
                    <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-semibold py-3 text-base">
                      Join the Waitlist
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content — bottom padding for mobile nav (members and guests both get it) */}
      <main id="main-content" className="flex-1 w-full flex flex-col pb-16 sm:pb-0" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#2B1507] text-[#F5EBD8] pt-16 pb-28 sm:py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Discover</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/businesses"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Businesses</span></Link></li>
                <li><Link href="/submit-business"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Submit a Business</span></Link></li>
                <li><Link href="/map"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Explore the Map</span></Link></li>
                <li><Link href="/cities"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">City Spotlights</span></Link></li>
                {isMember && (
                  <li><Link href="/explore"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Restaurants & Nightlife</span></Link></li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Community</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/safety"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Intelligence</span></Link></li>
                {isMember ? (
                  <>
                    <li><Link href="/community"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Groups & Meetups</span></Link></li>
                    <li><Link href="/jobs"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Job Board</span></Link></li>
                    <li><Link href="/events"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Cultural Events</span></Link></li>
                    <li><Link href="/travel"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">KinfolkAI™</span></Link></li>
                  </>
                ) : (
                  <li><Link href="/membership"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Create an Account →</span></Link></li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl mb-6 text-white">Platform</h3>
              <ul className="space-y-3 text-sm text-[#F5EBD8]/80">
                <li><Link href="/safety"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Safety & Reviews</span></Link></li>
                <li><Link href="/community-guidelines"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Guidelines</span></Link></li>
                <li><Link href="/membership"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Membership Plans</span></Link></li>
                <li><Link href="/roadmap"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Product Roadmap</span></Link></li>
                <li><Link href="/trust-and-safety"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Trust & Safety Center</span></Link></li>
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

          <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Follow Mapping With Melanin</h3>
                <p className="mt-1 text-sm text-[#F5EBD8]/60">Stay connected for community stories, businesses, events, and platform updates.</p>
              </div>
              <nav aria-label="Mapping With Melanin social media" className="flex flex-wrap gap-2">
                {OFFICIAL_SOCIAL_LINKS.map(({ id, label, handle, href }) => {
                  const Icon = SOCIAL_ICONS[id];
                  return (
                    <a
                      key={id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow Mapping With Melanin on ${label} (${handle})`}
                      data-testid={`official-social-${id}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#F5EBD8] transition-colors hover:border-[#CA922B]/60 hover:bg-[#CA922B]/10 hover:text-[#CA922B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B]"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{label}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#F5EBD8]/60">
            <p>© 2026 Mapping with Melanin™. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Privacy Policy</span></Link>
              <Link href="/terms"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Terms of Service</span></Link>
              <Link href="/community-guidelines"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Community Guidelines</span></Link>
              <Link href="/trust-and-safety"><span className="hover:text-[#CA922B] transition-colors cursor-pointer">Trust & Safety</span></Link>
            </div>
          </div>
        </div>
      </footer>

      {/* KinfolkAI Widget — members only, desktop/tablet only, hidden on auth/kinfolk pages or when dismissed */}
      {isMember && !kinfolkDismissed && !["/login", "/signup", "/membership", "/travel"].includes(location) && (
        <div className="hidden sm:block fixed bottom-6 right-6 z-50">
          <div className="relative bg-[#2B1507] border border-[#CA922B]/30 shadow-2xl rounded-2xl p-4 flex flex-col gap-2 hover:shadow-[0_10px_40px_rgba(202,146,43,0.15)] transition-all">
            <button
              onClick={() => setKinfolkDismissed(true)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#3A1F0E] border border-[#CA922B]/40 flex items-center justify-center hover:bg-[#CA922B]/20 transition-colors"
              aria-label="Dismiss KinfolkAI"
            >
              <X className="w-3 h-3 text-[#F5EBD8]/70" />
            </button>
            <Link href="/travel">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#CA922B]/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#CA922B]" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">KinfolkAI™</div>
                  <div className="text-[#F5EBD8]/70 text-xs">{kinfolkSubtitle}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Beta Feedback floating button — authenticated users only */}
      <FeedbackButton />

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────────── */}
      {/* Members get the full 6-tab bar; guests get Map / Businesses / Safety / Sign In */}
      <nav
        aria-label="Mobile bottom navigation"
        data-testid="mobile-bottom-navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2B1507] border-t border-white/10 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {isMember ? (
          [
            { href: "/explore",   Icon: Compass,  label: "Explore"    },
            { href: "/map",       Icon: Map,      label: "Map"        },
            { href: "/community", Icon: Users,    label: "Community"  },
            { href: "/safety",    Icon: Shield,   label: "Safety"     },
            { href: "/library",   Icon: BookOpen, label: "Library"    },
            { href: "/profile",   Icon: User,     label: "Profile"    },
          ].map(({ href, Icon, label }) => {
            const active = location === href || (href !== "/explore" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex-1"
                data-testid={`mobile-bottom-nav-link-${href.slice(1).replaceAll("/", "-")}`}
                data-nav-item={href}
                aria-current={active ? "page" : undefined}
              >
                <div className={`flex flex-col items-center justify-center gap-0.5 py-2 w-full transition-colors cursor-pointer ${active ? "text-[#CA922B]" : "text-[#F5EBD8]/50"}`}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                  <span className={`text-[9px] font-bold leading-none ${active ? "text-[#CA922B]" : "text-[#F5EBD8]/40"}`}>{label}</span>
                  {active && <div className="absolute bottom-0 w-6 h-0.5 bg-[#CA922B] rounded-full" />}
                </div>
              </Link>
            );
          })
        ) : (
          [
            { href: "/map",        Icon: Map,    label: "Map"       },
            { href: "/businesses", Icon: Compass, label: "Businesses" },
            { href: "/safety",     Icon: Shield,  label: "Safety"    },
            { href: "/login",      Icon: User,    label: "Sign In"   },
          ].map(({ href, Icon, label }) => {
            const active = location === href || (href !== "/login" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex-1"
                data-testid={`mobile-bottom-nav-link-${href.slice(1).replaceAll("/", "-")}`}
                data-nav-item={href}
                aria-current={active ? "page" : undefined}
              >
                <div className={`flex flex-col items-center justify-center gap-0.5 py-2 w-full transition-colors cursor-pointer ${active ? "text-[#CA922B]" : "text-[#F5EBD8]/50"}`}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                  <span className={`text-[9px] font-bold leading-none ${active ? "text-[#CA922B]" : "text-[#F5EBD8]/40"}`}>{label}</span>
                </div>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
}
