import { useState, useEffect } from "react";
import { Link } from "wouter";
import { CreditCard, FileText, ExternalLink, Download, ArrowLeft, Crown, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
  periodStart: number;
  periodEnd: number;
  createdAt: number;
  description: string | null;
};

type BillingStatus = {
  memberType: string;
  trialEndsAt: string | null;
  trialActive: boolean;
  trialDaysLeft: number;
  hasSubscription: boolean;
  foundingMemberNumber: number | null;
};

const PLAN_LABELS: Record<string, string> = {
  individual: "Explorer",
  business: "Business Starter",
  founding: "Founding Member",
  beta: "Beta Tester",
  business_referral: "Business Referral Partner",
};

function formatCents(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}api/billing/invoices`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${BASE}api/billing/subscription`, { credentials: "include" }).then((r) => r.json()),
    ]).then(([inv, sub]) => {
      setInvoices(inv.invoices ?? []);
      setBilling(sub.memberType ? sub : null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const planLabel = billing ? (PLAN_LABELS[billing.memberType] ?? billing.memberType) : "Community";

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="container mx-auto px-4 max-w-3xl py-12">
        <Link href="/profile">
          <button className="flex items-center gap-2 text-[#3A1F0E]/60 hover:text-[#3A1F0E] text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </Link>

        <h1 className="text-3xl font-serif font-bold text-[#2B1507] mb-2">Billing & Membership</h1>
        <p className="text-[#3A1F0E]/60 mb-10">Manage your plan, view invoices, and download receipts.</p>

        {/* Current Status */}
        <div className="bg-[#2B1507] rounded-3xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#F5EBD8]/60 text-xs font-bold uppercase tracking-wider mb-2">Current Plan</p>
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-6 h-6 text-[#CA922B]" />
                <span className="text-2xl font-serif font-bold text-white">{planLabel}</span>
              </div>
              {billing?.trialActive && (
                <div className="flex items-center gap-2 text-[#CA922B] text-sm">
                  <Clock className="w-4 h-4" />
                  <span><strong>{billing.trialDaysLeft} days</strong> remaining in your free trial</span>
                </div>
              )}
              {billing?.trialEndsAt && !billing.trialActive && !billing.hasSubscription && (
                <p className="text-[#F5EBD8]/60 text-sm">Trial ended — free Community access only</p>
              )}
              {billing?.hasSubscription && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active paid membership</span>
                </div>
              )}
              {billing?.foundingMemberNumber && (
                <p className="text-[#CA922B] text-sm mt-1">Founding Member #{billing.foundingMemberNumber}</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/membership">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-6">
                  {billing?.hasSubscription ? "Manage Plan" : "Upgrade Now"}
                </Button>
              </Link>
              {billing?.hasSubscription && (
                <button
                  onClick={() => fetch(`${BASE}api/stripe/portal`, { method: "POST", credentials: "include" })
                    .then((r) => r.json()).then((d) => d.url && window.open(d.url, "_blank"))}
                  className="text-[#F5EBD8]/60 hover:text-white text-sm text-center transition-colors"
                >
                  Cancel subscription →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div>
          <h2 className="text-xl font-serif font-bold text-[#2B1507] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#CA922B]" />
            Billing History
          </h2>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!loading && invoices.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#3A1F0E]/10">
              <CreditCard className="w-10 h-10 text-[#3A1F0E]/20 mx-auto mb-3" />
              <p className="text-[#3A1F0E]/60 font-medium">No billing history yet</p>
              <p className="text-[#3A1F0E]/40 text-sm mt-1">Invoices from paid subscriptions will appear here.</p>
            </div>
          )}

          {!loading && invoices.length > 0 && (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl p-5 border border-[#3A1F0E]/10 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-[#2B1507] text-sm">{formatDate(inv.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === "paid" ? "bg-green-100 text-green-700" :
                        inv.status === "open" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {inv.status ?? "—"}
                      </span>
                    </div>
                    <p className="text-[#3A1F0E]/50 text-xs truncate">
                      {inv.description ?? `${formatDate(inv.periodStart)} – ${formatDate(inv.periodEnd)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-[#2B1507]">{formatCents(inv.amount, inv.currency)}</span>
                    {inv.pdfUrl && (
                      <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#CA922B] hover:text-[#B38024] transition-colors" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {inv.hostedUrl && (
                      <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#3A1F0E]/40 hover:text-[#3A1F0E] transition-colors" title="View invoice">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[#3A1F0E]/40 text-xs mt-10">
          Questions about billing? Email us at{" "}
          <a href="mailto:hello@mappingwithmelanin.com" className="text-[#CA922B] hover:underline">
            hello@mappingwithmelanin.com
          </a>
        </p>
      </div>
    </div>
  );
}
