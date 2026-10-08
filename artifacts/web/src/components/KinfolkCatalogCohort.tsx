import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Loader2, Search, ShieldAlert } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
type CatalogState = "intake" | "review" | "ready" | "held" | "removed";
type CatalogRow = {
  businessId: string; name: string; city: string | null; state: string | null;
  category: string | null; listingStatus: string | null; isDuplicate: boolean;
  catalogState: CatalogState; reason: string; updatedAt: string;
};

export function KinfolkCatalogCohort() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<"all" | CatalogState>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50", state });
      if (search) params.set("search", search);
      const response = await authenticatedFetch(`${BASE}/api/admin/kinfolk-catalog?${params}`);
      const data = await response.json() as { error?: string; memberships?: CatalogRow[]; totalPages?: number; filteredTotal?: number };
      if (!response.ok) throw new Error(data.error ?? "Could not load catalog");
      setRows(Array.isArray(data.memberships) ? data.memberships : []);
      setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
      setFilteredTotal(typeof data.filteredTotal === "number" ? data.filteredTotal : 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load catalog"); }
    finally { setLoading(false); }
  }, [page, search, state]);

  useEffect(() => { void load(); }, [load]);
  const applySearch = () => { setPage(1); setSearch(searchInput.trim()); };

  return <section className="mx-auto max-w-7xl p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Business Admin · Internal Cohort</p><h1 className="mt-1 font-serif text-3xl font-bold text-[#3A1F0E]">Kinfolk Catalog intake</h1><p className="mt-2 max-w-3xl text-sm text-[#3A1F0E]/65">An explicit, auditable relationship to existing canonical businesses. It does not create a profile, change public listing status, or mark a business owner-verified.</p></div>
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"><strong>{filteredTotal.toLocaleString()}</strong> retained cohort membership{filteredTotal === 1 ? "" : "s"}</div>
    </div>
    <div className="mb-5 rounded-2xl border border-[#2B1507]/10 bg-white p-4"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-[#3A1F0E]/40" /><input aria-label="Search Kinfolk Catalog" className="w-full rounded-xl border border-[#2B1507]/15 py-2.5 pl-9 pr-3 text-sm focus:border-[#CA922B] focus:outline-none" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applySearch(); }} placeholder="Search name, city, or category" /></div><select aria-label="Filter catalog state" value={state} onChange={(event) => { setPage(1); setState(event.target.value as typeof state); }} className="rounded-xl border border-[#2B1507]/15 px-3 py-2.5 text-sm"><option value="all">All states</option>{["intake", "review", "ready", "held", "removed"].map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" onClick={applySearch} className="rounded-xl bg-[#2B1507] px-4 py-2.5 text-sm font-bold text-white">Search</button></div></div>
    {error && <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><ShieldAlert className="h-4 w-4" />{error}<button type="button" onClick={() => void load()} className="ml-auto underline">Retry</button></div>}
    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#CA922B]" /></div> : rows.length === 0 ? <div className="rounded-2xl border border-dashed border-[#2B1507]/20 bg-white py-16 text-center text-sm text-[#3A1F0E]/55"><ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-[#CA922B]" />No catalog memberships match this filter. Add an existing business from its Business Admin profile editor.</div> : <><div className="overflow-x-auto rounded-2xl border border-[#2B1507]/10 bg-white"><table className="min-w-[780px] w-full text-sm"><thead><tr className="border-b border-[#2B1507]/10 bg-[#FAF6EF] text-left text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/55"><th className="px-4 py-3">Existing business</th><th className="px-4 py-3">Catalog state</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Public lifecycle</th><th className="px-4 py-3">Updated</th></tr></thead><tbody>{rows.map((row) => <tr key={row.businessId} className="border-b border-[#2B1507]/5"><td className="px-4 py-3"><p className="font-bold text-[#3A1F0E]">{row.name}</p><p className="text-xs text-[#3A1F0E]/55">{[row.category, row.city, row.state].filter(Boolean).join(" · ")}</p></td><td className="px-4 py-3"><span className="rounded-full bg-[#CA922B]/10 px-2.5 py-1 text-xs font-bold text-[#704809]">{row.catalogState}</span></td><td className="max-w-md px-4 py-3 text-xs text-[#3A1F0E]/70">{row.reason}</td><td className="px-4 py-3 text-xs text-[#3A1F0E]/70">{row.listingStatus ?? "unknown"}</td><td className="px-4 py-3 text-xs text-[#3A1F0E]/55">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between text-sm text-[#3A1F0E]/60"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#2B1507]/15 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#2B1507]/15 px-3 py-2 disabled:opacity-40">Next</button></div></div></>}
  </section>;
}
