import { Link, useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: auth } = useGetCurrentAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/discover", label: "Explore" },
    { href: "/community", label: "Community" },
    { href: "/safety", label: "Safety" },
    { href: "/events", label: "Events" },
    { href: "/travel", label: "Travel" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAF6EF]">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#2B1507] text-[#F5EBD8] shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="font-serif font-bold text-xl md:text-2xl text-white tracking-tight flex items-center gap-2">
            Mapping with Melanin™
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`text-sm font-medium transition-colors hover:text-[#CA922B] cursor-pointer ${isActive ? "text-[#CA922B]" : "text-[#F5EBD8]"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth / Right side */}
          <div className="hidden md:flex items-center gap-4">
            {auth?.user ? (
              <Link href="/profile">
                <span className="text-sm font-medium hover:text-[#CA922B] transition-colors cursor-pointer">Profile</span>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-sm font-medium hover:text-[#CA922B] transition-colors cursor-pointer">Sign In</span>
                </Link>
                <Link href="/login">
                  <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6">Sign Up Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-[#F5EBD8]">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#2B1507] border-t border-white/10 px-4 py-4 flex flex-col gap-4 absolute w-full">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <span className="block text-base font-medium text-[#F5EBD8] hover:text-[#CA922B] cursor-pointer">{item.label}</span>
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
              {auth?.user ? (
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="block text-base font-medium text-[#F5EBD8] cursor-pointer">Profile</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="block text-base font-medium text-[#F5EBD8] cursor-pointer">Sign In</span>
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">Sign Up Free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}
