import { Link, useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Map, Compass, Shield, Calendar, Users, Plane, User, Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: auth } = useGetCurrentAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/map", label: "Map", icon: Map },
    { href: "/safety", label: "Safety", icon: Shield },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/community", label: "Community", icon: Users },
    { href: "/travel", label: "Travel AI", icon: Plane },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <Link href="/" className="font-serif font-bold text-xl text-primary">Melanin Maps</Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "flex" : "hidden"} 
        md:flex flex-col w-full md:w-64 border-r bg-card p-6 gap-6
        fixed md:sticky top-[73px] md:top-0 h-[calc(100dvh-73px)] md:h-[100dvh] z-40 overflow-y-auto
      `}>
        <div className="hidden md:block">
          <Link href="/" className="font-serif font-bold text-2xl text-primary tracking-tight">Melanin Maps</Link>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t">
          {auth?.user ? (
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <User size={20} />
                <span>Profile</span>
              </div>
            </Link>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
