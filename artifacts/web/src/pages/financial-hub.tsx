import { useState, useEffect, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Shield, TrendingDown, TrendingUp, Briefcase, BookOpen, Home, Target, ExternalLink, Plus, Loader2, X, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface FinancialGoal {
  id: string; type: string; title: string; description: string | null;
  targetAmount: string; currentAmount: string; deadline: string | null;
  isAchieved: boolean; motivationNote: string | null; currency: string;
}
interface Resource { title: string; url: string; description: string; category: string; }

const GOAL_TYPES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  savings:        { label: "Savings Goal",    color: "#16A34A", icon: <DollarSign className="w-4 h-4" /> },
  emergency_fund: { label: "Emergency Fund",  color: "#CA922B", icon: <Shield className="w-4 h-4" /> },
  debt_payoff:    { label: "Pay Off Debt",    color: "#DC2626", icon: <TrendingDown className="w-4 h-4" /> },
  investment:     { label: "Investment",       color: "#2563EB", icon: <TrendingUp className="w-4 h-4" /> },
  business:       { label: "Business Fund",   color: "#7C3AED", icon: <Briefcase className="w-4 h-4" /> },
  education:      { label: "Education Fund",  color: "#0891B2", icon: <BookOpen className="w-4 h-4" /> },
  home:           { label: "Home Purchase",   color: "#D97706", icon: <Home className="w-4 h-4" /> },
  other:          { label: "Other Goal",      color: "#6B7280", icon: <Target className="w-4 h-4" /> },
};

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 28; const circ = 2 * Math.PI * r;
  return (
    <svg width={70} height={70} className="rotate-[-90deg]">
      <circle cx={35} cy={35} r={r} strokeWidth={6} stroke={color + "25"} fill="none" />
      <circle cx={35} cy={35} r={r} strokeWidth={6} stroke={color} fill="none"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, pct / 100))}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={35} y={35} textAnchor="middle" dominantBaseline="central"
        className="rotate-90" style={{ transform: "rotate(90deg) translate(0,-70px)", fontSize: 13, fontWeight: 700, fill: color }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function FinancialHub() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "resources">("goals");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checkinGoal, setCheckinGoal] = useState<FinancialGoal | null>(null);
  const [checkinAmount, setCheckinAmount] = useState("");

  // Create form
  const [newType, setNewType] = useState("savings");
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, rRes] = await Promise.all([
        fetch(`${BASE}api/financial/goals`, { credentials: "include" }),
        fetch(`${BASE}api/financial/resources`, { credentials: "include" }),
      ]);
      if (gRes.ok) { const d = await gRes.json(); setGoals(d.goals ?? []); }
      if (rRes.ok) { const d = await rRes.json(); setResources(d.resources ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) load(); else setLoading(false); }, [isAuthenticated, load]);

  const createGoal = async () => {
    if (!newTitle.trim() || !newTarget) { toast({ title: "Title and target amount are required", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}api/financial/goals`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, title: newTitle.trim(), targetAmount: parseFloat(newTarget), deadline: newDeadline || null, motivationNote: newNote.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Goal created!" });
      setShowCreate(false);
      setNewTitle(""); setNewTarget(""); setNewDeadline(""); setNewNote("");
      load();
    } catch { toast({ title: "Could not create goal", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const logCheckin = async () => {
    if (!checkinGoal || !checkinAmount) return;
    try {
      const res = await fetch(`${BASE}api/financial/goals/${checkinGoal.id}/checkin`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(checkinAmount) }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `$${checkinAmount} logged toward ${checkinGoal.title}` });
      setCheckinGoal(null); setCheckinAmount("");
      load();
    } catch { toast({ title: "Could not log progress", variant: "destructive" }); }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await fetch(`${BASE}api/financial/goals/${id}`, { method: "DELETE", credentials: "include" });
      setGoals(gs => gs.filter(g => g.id !== id));
      toast({ title: "Goal removed" });
    } catch { toast({ title: "Could not delete", variant: "destructive" }); }
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const resourceCategories = [...new Set(resources.map(r => r.category))];

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">Financial Hub</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Build wealth. Stay informed. Move forward.</p>
            </div>
            {isAuthenticated && activeTab === "goals" && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] hover:bg-[#b07e24] text-white rounded-full text-sm font-bold">
                <Plus className="w-4 h-4" /> New Goal
              </button>
            )}
          </div>
          <div className="flex gap-0 border-b border-white/10 mt-4">
            {(["goals", "resources"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px capitalize ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {tab === "goals" ? "My Goals" : "Resources"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 text-[#CA922B] mx-auto mb-4" />
            <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Sign in to track your financial goals</h2>
            <Link href="/login"><a className="px-6 py-3 bg-[#2B1507] text-white rounded-full font-bold">Sign In</a></Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
        ) : activeTab === "goals" ? (
          goals.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
              <h2 className="font-serif font-bold text-xl text-[#2B1507] mb-2">Set your first financial goal</h2>
              <p className="text-[#3A1F0E]/60 mb-6">Track savings, pay off debt, build an emergency fund — one goal at a time.</p>
              <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold">Create a Goal</button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const cfg = GOAL_TYPES[goal.type] ?? GOAL_TYPES.other;
                const target = parseFloat(goal.targetAmount);
                const current = parseFloat(goal.currentAmount);
                const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000) : null;
                return (
                  <div key={goal.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${goal.isAchieved ? "border-green-400" : "border-[#E8DDD0]"}`}>
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <ProgressRing pct={pct} color={cfg.color} />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: cfg.color }}>{Math.round(pct)}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-1" style={{ color: cfg.color, backgroundColor: cfg.color + "15" }}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {goal.isAchieved && <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle2 className="w-3 h-3" /> Achieved!</span>}
                            <h3 className="font-bold text-[#2B1507]">{goal.title}</h3>
                          </div>
                          <button onClick={() => deleteGoal(goal.id)} className="text-[#3A1F0E]/20 hover:text-red-400 transition-colors shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm text-[#3A1F0E]/60">{fmt(current)} of {fmt(target)}</p>
                        {daysLeft !== null && <p className="text-xs text-[#3A1F0E]/40 mt-1">{daysLeft > 0 ? `${daysLeft} days remaining` : "Deadline passed"}</p>}
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setCheckinGoal(goal); setCheckinAmount(""); }}
                            className="px-4 py-2 text-sm font-bold rounded-xl border-2 text-white transition-colors"
                            style={{ backgroundColor: cfg.color, borderColor: cfg.color }}>
                            Log Progress
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4 bg-[#FAF6EF] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-8">
            {resources.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
                <p className="text-[#3A1F0E]/60">No resources available yet.</p>
              </div>
            ) : resourceCategories.map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wide mb-3 capitalize">{cat}</h3>
                <div className="space-y-3">
                  {resources.filter(r => r.category === cat).map((res, i) => (
                    <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0] hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-4 h-4 text-[#CA922B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#2B1507]">{res.title}</p>
                        <p className="text-sm text-[#3A1F0E]/60 mt-0.5">{res.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">New Financial Goal</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-2 block">Goal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GOAL_TYPES).map(([key, cfg]) => (
                    <button key={key} onClick={() => setNewType(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all text-left ${newType === key ? "border-current" : "border-[#E8DDD0] text-[#3A1F0E]/60"}`}
                      style={newType === key ? { borderColor: cfg.color, color: cfg.color, backgroundColor: cfg.color + "10" } : {}}>
                      <span style={newType === key ? { color: cfg.color } : {}}>{cfg.icon}</span> {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Goal Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Emergency Fund — 3 months"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Target Amount ($) *</label>
                  <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="5000"
                    className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Deadline (optional)</label>
                  <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                    className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Your Why (optional)</label>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} placeholder="What will this goal make possible?"
                  className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
              </div>
            </div>
            <button onClick={createGoal} disabled={creating || !newTitle.trim() || !newTarget}
              className="w-full mt-6 py-4 bg-[#CA922B] text-white rounded-xl font-bold text-lg hover:bg-[#b07e24] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null} {creating ? "Creating…" : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      {/* Checkin Modal */}
      {checkinGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={e => e.target === e.currentTarget && setCheckinGoal(null)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-xl text-[#2B1507]">Log Progress</h2>
              <button onClick={() => setCheckinGoal(null)} className="p-2 hover:bg-[#FAF6EF] rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[#3A1F0E]/60 mb-4">{checkinGoal.title}</p>
            <label className="text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wide mb-1 block">Amount to add ($)</label>
            <input type="number" value={checkinAmount} onChange={e => setCheckinAmount(e.target.value)} placeholder="100" autoFocus
              className="w-full border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B] mb-4" />
            <button onClick={logCheckin} disabled={!checkinAmount}
              className="w-full py-4 bg-[#CA922B] text-white rounded-xl font-bold hover:bg-[#b07e24] disabled:opacity-50 transition-colors">
              Log ${checkinAmount || "0"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
