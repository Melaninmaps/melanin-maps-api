import { useEffect, useRef, useState } from "react";
import { ChevronDown, Shield, Store, UserRound } from "lucide-react";
import {
  accountContextLabel,
  type AccountContextSelection,
  useAccountContext,
} from "@/contexts/account-context";

function ContextIcon({ context }: { context: AccountContextSelection }) {
  if (context.kind === "business") return <Store className="h-3.5 w-3.5" aria-hidden="true" />;
  if (context.kind === "admin") return <Shield className="h-3.5 w-3.5" aria-hidden="true" />;
  return <UserRound className="h-3.5 w-3.5" aria-hidden="true" />;
}

export function AccountContextSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    activeContext,
    businessContexts,
    canUseAdminContext,
    loading,
    setActiveContext,
  } = useAccountContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function dismiss(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", dismiss);
    return () => document.removeEventListener("mousedown", dismiss);
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => {
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      const selected = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]');
      (selected ?? items?.[0])?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    window.setTimeout(() => toggleRef.current?.focus(), 0);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (!items.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = Math.max(0, items.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home" ? 0
      : event.key === "End" ? items.length - 1
        : event.key === "ArrowUp" ? (current - 1 + items.length) % items.length
          : (current + 1) % items.length;
    items[next]?.focus();
  };

  const activeTone = activeContext.kind === "admin"
    ? "border-amber-300/70 bg-amber-100/15 text-amber-100"
    : activeContext.kind === "business"
      ? "border-[#CA922B]/70 bg-[#CA922B]/15 text-[#F5EBD8]"
      : "border-white/25 bg-white/5 text-[#F5EBD8]";

  return (
    <div className="relative" ref={menuRef} data-testid="account-context-switcher">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch account context"
        data-testid="account-context-switcher-toggle"
        ref={toggleRef}
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors hover:border-[#CA922B] disabled:opacity-60 ${activeTone}`}
      >
        <ContextIcon context={activeContext} />
        <span className={compact ? "max-w-36 truncate" : "max-w-44 truncate"}>
          {loading ? "Loading workspace…" : accountContextLabel(activeContext)}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && !loading && (
        <div
          role="menu"
          aria-label="Available account contexts"
          data-testid="account-context-switcher-menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-[70] mt-2 w-80 rounded-2xl border border-[#3A1F0E]/15 bg-white p-2 text-[#2B1507] shadow-2xl"
        >
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A1F0E]/45">
            Workspaces
          </p>
          <button
            role="menuitemradio"
            aria-checked={activeContext.kind === "personal"}
            data-testid="account-context-option-personal"
            type="button"
            onClick={() => {
              setActiveContext({ kind: "personal" });
              closeMenu();
            }}
            className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${activeContext.kind === "personal" ? "bg-[#FAF1E4]" : "hover:bg-[#FAF6EF]"}`}
          >
            <span className="mt-0.5 rounded-lg bg-[#2B1507]/8 p-1.5 text-[#2B1507]"><UserRound className="h-4 w-4" aria-hidden="true" /></span>
            <span>
              <span className="block text-sm font-bold">Personal</span>
              <span className="mt-0.5 block text-xs leading-4 text-[#3A1F0E]/60">Private member preferences, memories, and conversation history stay here.</span>
            </span>
          </button>

          {businessContexts.map((business) => (
            <button
              key={business.businessId}
              role="menuitemradio"
              aria-checked={activeContext.kind === "business" && activeContext.businessId === business.businessId}
              data-testid={`account-context-option-business-${business.businessId}`}
              type="button"
              onClick={() => {
                setActiveContext(business);
                closeMenu();
              }}
              className={`mt-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${activeContext.kind === "business" && activeContext.businessId === business.businessId ? "bg-[#FAF1E4]" : "hover:bg-[#FAF6EF]"}`}
            >
              <span className="mt-0.5 rounded-lg bg-[#CA922B]/15 p-1.5 text-[#9A6717]"><Store className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{business.businessName}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#3A1F0E]/60">{business.managementRole === "owner" ? "Approved owner workspace" : "Approved manager workspace"} · personal memories stay private</span>
              </span>
            </button>
          ))}

          {canUseAdminContext && (
            <button
              role="menuitemradio"
              aria-checked={activeContext.kind === "admin"}
              data-testid="account-context-option-admin"
              type="button"
              onClick={() => {
                setActiveContext({ kind: "admin" });
                closeMenu();
              }}
              className={`mt-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${activeContext.kind === "admin" ? "bg-amber-50" : "hover:bg-amber-50/70"}`}
            >
              <span className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700"><Shield className="h-4 w-4" aria-hidden="true" /></span>
              <span>
                <span className="block text-sm font-bold text-amber-900">Admin</span>
                <span className="mt-0.5 block text-xs leading-4 text-amber-800/70">Platform administration is distinct from private member and business workspaces.</span>
              </span>
            </button>
          )}

          <p className="mx-3 mb-1 mt-3 border-t border-[#3A1F0E]/10 pt-3 text-[11px] leading-4 text-[#3A1F0E]/55">
            Switching clears active Kinfolk context before the next message. Business and Admin workspaces never reuse personal chat history.
          </p>
        </div>
      )}
    </div>
  );
}
