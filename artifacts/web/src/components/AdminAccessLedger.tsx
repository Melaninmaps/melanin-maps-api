import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, Eye, RefreshCw, Users } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type CurrentAccess = {
  email: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  tester_status: string | null;
  tester_access_source: string | null;
  tester_granted_at: string | null;
  testing_entitlement_ends_at: string | null;
  account_created_at: string | null;
  preapproved_at: string | null;
  applied_at: string | null;
  waitlist_id: string | null;
  waitlist_status: string | null;
  waitlist_created_at: string | null;
};

type AccessEvent = {
  email: string;
  user_id: string | null;
  event_type: "granted" | "registered" | "revoked" | "backfilled_active";
  access_source: string | null;
  created_at: string;
};

type AccessLedger = {
  days: number;
  currentAccess: CurrentAccess[];
  recentEvents: AccessEvent[];
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function accessState(row: CurrentAccess): { label: string; className: string } {
  if (!row.user_id)
    return {
      label: "Pre-approved — no account",
      className: "bg-amber-100 text-amber-800",
    };
  if (row.tester_status === "active")
    return { label: "Active tester", className: "bg-green-100 text-green-800" };
  return {
    label: "Account exists — entitlement pending",
    className: "bg-slate-100 text-slate-700",
  };
}

function parseTesterEmails(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function AdminAccessLedger() {
  const fetch = authenticatedFetch;
  const [ledger, setLedger] = useState<AccessLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [preview, setPreview] = useState<{
    eligible: number;
    alreadyActive: number;
    sample: Array<{ email: string; first_name: string | null; status: string }>;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [granting, setGranting] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkSource, setBulkSource] = useState<
    "testflight" | "android_test" | "admin_invite" | "website_test"
  >("admin_invite");
  const [bulkPreview, setBulkPreview] = useState<{
    totalEmails: number;
    willGrant: number;
    willPend: number;
    willSkip: number;
  } | null>(null);
  const [bulkPreviewing, setBulkPreviewing] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [founderRosterPreview, setFounderRosterPreview] = useState<{
    rosterCount: number;
    existingAccounts: number;
    activeTesters: number;
    retainedPasswordAccounts: number;
    missingAccounts: number;
    existingAccountsNeedingEntitlement: number;
  } | null>(null);
  const [founderRosterPreviewing, setFounderRosterPreviewing] = useState(false);
  const [founderRosterApplying, setFounderRosterApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}api/admin/access-ledger?days=14`, {
        credentials: "include",
      });
      const payload = (await response.json()) as Partial<AccessLedger> & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not load access history.");
      setLedger({
        days: payload.days ?? 14,
        currentAccess: payload.currentAccess ?? [],
        recentEvents: payload.recentEvents ?? [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load access history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const previewCity = async () => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setMessage("Enter a city before previewing access.");
      return;
    }
    setPreviewing(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ city: trimmedCity });
      if (state.trim()) params.set("state", state.trim().toUpperCase());
      const response = await fetch(
        `${BASE}api/admin/testers/waitlist-city-preview?${params}`,
        { credentials: "include" },
      );
      const payload = (await response.json()) as {
        eligible?: number;
        alreadyActive?: number;
        sample?: Array<{
          email: string;
          first_name: string | null;
          status: string;
        }>;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not preview city access.");
      setPreview({
        eligible: payload.eligible ?? 0,
        alreadyActive: payload.alreadyActive ?? 0,
        sample: payload.sample ?? [],
      });
    } catch (error) {
      setPreview(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not preview city access.",
      );
    } finally {
      setPreviewing(false);
    }
  };

  const grantCity = async () => {
    if (!preview || preview.eligible === 0) return;
    const scope = [city.trim(), state.trim().toUpperCase()]
      .filter(Boolean)
      .join(", ");
    if (
      !window.confirm(
        `Are you sure? This immediately grants tester access to ${preview.eligible} eligible waitlist address${preview.eligible === 1 ? "" : "es"} in ${scope}. It will not delete waitlist records or change account passwords.`,
      )
    )
      return;
    setGranting(true);
    setMessage(null);
    try {
      const response = await fetch(
        `${BASE}api/admin/testers/apply-waitlist-city`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: city.trim(),
            state: state.trim().toUpperCase() || undefined,
            accessSource: "website_test",
            confirmed: true,
          }),
        },
      );
      const payload = (await response.json()) as {
        accountGrants?: number;
        pendingGrants?: number;
        alreadyActive?: number;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not grant city access.");
      setMessage(
        `Access granted immediately: ${payload.accountGrants ?? 0} existing account${payload.accountGrants === 1 ? "" : "s"} and ${payload.pendingGrants ?? 0} pre-approved email${payload.pendingGrants === 1 ? "" : "s"}. ${payload.alreadyActive ?? 0} already active.`,
      );
      setPreview(null);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not grant city access.",
      );
    } finally {
      setGranting(false);
    }
  };

  const previewBulkEmails = async () => {
    const emails = parseTesterEmails(bulkEmails);
    if (emails.length === 0) {
      setMessage("Paste or upload at least one tester email address first.");
      return;
    }
    if (emails.length > 500) {
      setMessage("Import at most 500 email addresses at a time.");
      return;
    }
    setBulkPreviewing(true);
    setMessage(null);
    try {
      const response = await fetch(`${BASE}api/admin/testers/dry-run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, accessSource: bulkSource }),
      });
      const payload = (await response.json()) as {
        totalEmails?: number;
        willGrant?: number;
        willPend?: number;
        willSkip?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not preview tester import.");
      setBulkPreview({
        totalEmails: payload.totalEmails ?? emails.length,
        willGrant: payload.willGrant ?? 0,
        willPend: payload.willPend ?? 0,
        willSkip: payload.willSkip ?? 0,
      });
    } catch (error) {
      setBulkPreview(null);
      setMessage(error instanceof Error ? error.message : "Could not preview tester import.");
    } finally {
      setBulkPreviewing(false);
    }
  };

  const applyBulkEmails = async () => {
    const emails = parseTesterEmails(bulkEmails);
    if (!bulkPreview || emails.length === 0) return;
    if (
      !window.confirm(
        `Grant full tester access to ${bulkPreview.totalEmails} email address${bulkPreview.totalEmails === 1 ? "" : "es"}? Existing accounts are approved now; people without accounts are pre-approved for their first registration. Each imported address is also recorded in the unified waitlist.`,
      )
    )
      return;
    setBulkApplying(true);
    setMessage(null);
    try {
      const response = await fetch(`${BASE}api/admin/testers/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, accessSource: bulkSource }),
      });
      const payload = (await response.json()) as {
        updated?: number;
        pendingAdded?: number;
        skipped?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not grant tester access.");
      setMessage(
        `Tester access granted: ${payload.updated ?? 0} existing account${payload.updated === 1 ? "" : "s"} and ${payload.pendingAdded ?? 0} pre-approved email${payload.pendingAdded === 1 ? "" : "s"}. ${payload.skipped ?? 0} skipped.`,
      );
      setBulkPreview(null);
      setBulkEmails("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not grant tester access.");
    } finally {
      setBulkApplying(false);
    }
  };

  const previewFounderRoster = async () => {
    setFounderRosterPreviewing(true);
    setFounderRosterPreview(null);
    setMessage(null);
    try {
      const response = await fetch(`${BASE}api/admin/testers/founder-roster-preview`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        rosterCount?: number;
        existingAccounts?: number;
        activeTesters?: number;
        retainedPasswordAccounts?: number;
        missingAccounts?: number;
        existingAccountsNeedingEntitlement?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not inspect the founder tester roster.");
      }
      setFounderRosterPreview({
        rosterCount: payload.rosterCount ?? 0,
        existingAccounts: payload.existingAccounts ?? 0,
        activeTesters: payload.activeTesters ?? 0,
        retainedPasswordAccounts: payload.retainedPasswordAccounts ?? 0,
        missingAccounts: payload.missingAccounts ?? 0,
        existingAccountsNeedingEntitlement:
          payload.existingAccountsNeedingEntitlement ?? 0,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not inspect the founder tester roster.",
      );
    } finally {
      setFounderRosterPreviewing(false);
    }
  };

  const provisionFounderRoster = async () => {
    if (!founderRosterPreview) return;
    const { rosterCount, existingAccounts, missingAccounts } = founderRosterPreview;
    if (!window.confirm(
      `Confirm full tester access for the fixed founder roster of ${rosterCount} approved addresses? ${existingAccounts} existing account${existingAccounts === 1 ? "" : "s"} will keep every password, profile, post, media item, community record, and saved item. ${missingAccounts} missing account${missingAccounts === 1 ? "" : "s"} will receive the founder-approved one-time password and will be required to replace it immediately after sign-in. Pending-only accounts outside this roster are not changed.`,
    )) return;

    setFounderRosterApplying(true);
    setMessage(null);
    try {
      const response = await fetch(`${BASE}api/admin/testers/provision-founder-roster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const payload = (await response.json()) as {
        existingAccountsGranted?: number;
        missingAccountsCreated?: number;
        alreadyActive?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not provision the founder tester roster.");
      }
      setMessage(
        `Founder tester roster reconciled: ${payload.existingAccountsGranted ?? 0} existing account${payload.existingAccountsGranted === 1 ? "" : "s"} granted or restored, ${payload.missingAccountsCreated ?? 0} missing account${payload.missingAccountsCreated === 1 ? "" : "s"} created with a required first-login password change, and ${payload.alreadyActive ?? 0} already active.`,
      );
      await Promise.all([load(), previewFounderRoster()]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not provision the founder tester roster.",
      );
    } finally {
      setFounderRosterApplying(false);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#3A1F0E]">
            Access ledger
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#3A1F0E]/65">
            One private, administrator-only record of people granted access,
            including email addresses that have not created an account. Current
            access is live; the event panel shows the last 14 days recorded
            after this release is deployed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm font-semibold text-[#3A1F0E] hover:border-[#CA922B] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh
        </button>
      </div>

      <section className="mt-6 rounded-2xl border border-[#7A2637]/25 bg-[#7A2637]/[0.04] p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7A2637]" />
          <div>
            <h3 className="font-semibold text-[#3A1F0E]">
              Founder-approved tester roster
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">
              Inspect the fixed founder roster first. The preview shows aggregate
              counts only. If confirmed, existing accounts retain all account
              data; only roster addresses with no account receive a one-time
              password and must replace it on first sign-in.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void previewFounderRoster()}
          disabled={founderRosterPreviewing || founderRosterApplying}
          className="mt-4 rounded-xl bg-[#2B1507] px-4 py-2 text-sm font-bold text-white hover:bg-[#3A1F0E] disabled:opacity-50"
        >
          {founderRosterPreviewing ? "Checking roster…" : "Preview founder tester roster"}
        </button>
        {founderRosterPreview && (
          <div className="mt-4 rounded-xl border border-[#7A2637]/20 bg-white p-4">
            <p className="font-semibold text-[#3A1F0E]">
              {founderRosterPreview.rosterCount} approved addresses · {founderRosterPreview.existingAccounts} existing account{founderRosterPreview.existingAccounts === 1 ? "" : "s"} · {founderRosterPreview.activeTesters} already active tester{founderRosterPreview.activeTesters === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">
              {founderRosterPreview.retainedPasswordAccounts} existing account{founderRosterPreview.retainedPasswordAccounts === 1 ? "" : "s"} already retain a password. {founderRosterPreview.existingAccountsNeedingEntitlement} existing account{founderRosterPreview.existingAccountsNeedingEntitlement === 1 ? "" : "s"} need tester entitlement recovery. {founderRosterPreview.missingAccounts} missing account{founderRosterPreview.missingAccounts === 1 ? "" : "s"} would be created with the required first-login password change.
            </p>
            <button
              type="button"
              onClick={() => void provisionFounderRoster()}
              disabled={founderRosterApplying}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7A2637] px-4 py-2 text-sm font-bold text-white hover:bg-[#5C1B29] disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {founderRosterApplying ? "Restoring approved testers…" : "Confirm approved tester access"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[#CA922B]/30 bg-[#CA922B]/[0.06] p-5">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#8D5C17]" />
          <div>
            <h3 className="font-semibold text-[#3A1F0E]">
              Add access from the unified waitlist by city
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">
              Preview first, then explicitly confirm. The final action grants
              access immediately, preserves every original waitlist record, and
              grants an email without an account a pre-approval that attaches
              when they register.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
          <input
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPreview(null);
            }}
            placeholder="City, for example Houston"
            className="rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B]"
          />
          <input
            value={state}
            onChange={(event) => {
              setState(event.target.value.toUpperCase().slice(0, 2));
              setPreview(null);
            }}
            placeholder="TX"
            maxLength={2}
            className="rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B]"
          />
          <button
            type="button"
            onClick={() => void previewCity()}
            disabled={previewing || !city.trim()}
            className="rounded-xl bg-[#2B1507] px-4 py-2 text-sm font-bold text-white hover:bg-[#3A1F0E] disabled:opacity-50"
          >
            {previewing ? "Checking…" : "Preview access"}
          </button>
        </div>
        {preview && (
          <div className="mt-4 rounded-xl border border-[#CA922B]/25 bg-white p-4">
            <p className="font-semibold text-[#3A1F0E]">
              {preview.eligible} eligible · {preview.alreadyActive} already
              active
            </p>
            <p className="mt-1 text-xs text-[#3A1F0E]/60">
              Preview is read-only. Up to 25 addresses are shown below; no
              account or waitlist record has changed.
            </p>
            {preview.sample.length > 0 && (
              <p className="mt-3 break-words text-xs text-[#3A1F0E]/70">
                {preview.sample.map((row) => row.email).join(" · ")}
              </p>
            )}
            <button
              type="button"
              onClick={() => void grantCity()}
              disabled={granting || preview.eligible === 0}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#CA922B] px-4 py-2 text-sm font-bold text-white hover:bg-[#B77E1D] disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {granting
                ? "Granting…"
                : `Are you sure? Grant access to ${preview.eligible}`}
            </button>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-[#3A1F0E]/15 bg-white p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8D5C17]" />
          <div>
            <h3 className="font-semibold text-[#3A1F0E]">
              Bulk tester access — paste or upload emails
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">
              Import up to 500 addresses at once. Each is explicitly granted
              full tester access without membership-tier limits, and is added to
              the one unified waitlist with its source. Store enrollment does
              not grant MWM access until you take this action.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
          <textarea
            value={bulkEmails}
            onChange={(event) => {
              setBulkEmails(event.target.value);
              setBulkPreview(null);
            }}
            placeholder="tester.one@example.com&#10;tester.two@example.com"
            rows={6}
            className="w-full rounded-xl border border-[#3A1F0E]/15 bg-[#FFFCF7] px-3 py-2 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B]"
            aria-label="Tester emails to import"
          />
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/60">
              Access source
              <select
                value={bulkSource}
                onChange={(event) => {
                  setBulkSource(event.target.value as typeof bulkSource);
                  setBulkPreview(null);
                }}
                className="mt-1 w-full rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm font-medium text-[#3A1F0E] outline-none focus:border-[#CA922B]"
              >
                <option value="testflight">Apple TestFlight</option>
                <option value="android_test">Google Play test</option>
                <option value="admin_invite">Admin invite</option>
                <option value="website_test">Website test</option>
              </select>
            </label>
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#CA922B]/60 px-3 py-2 text-center text-sm font-semibold text-[#8D5C17] hover:bg-[#CA922B]/[0.06]">
              Upload .txt or .csv
              <input
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBulkEmails(await file.text());
                  setBulkPreview(null);
                  event.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void previewBulkEmails()}
              disabled={bulkPreviewing || parseTesterEmails(bulkEmails).length === 0}
              className="w-full rounded-xl bg-[#2B1507] px-4 py-2 text-sm font-bold text-white hover:bg-[#3A1F0E] disabled:opacity-50"
            >
              {bulkPreviewing ? "Previewing…" : "Preview import"}
            </button>
          </div>
        </div>
        {bulkPreview && (
          <div className="mt-4 rounded-xl border border-[#CA922B]/25 bg-[#CA922B]/[0.06] p-4">
            <p className="font-semibold text-[#3A1F0E]">
              {bulkPreview.totalEmails} unique email{bulkPreview.totalEmails === 1 ? "" : "s"} · {bulkPreview.willGrant} existing account{bulkPreview.willGrant === 1 ? "" : "s"} to grant · {bulkPreview.willPend} pre-approval{bulkPreview.willPend === 1 ? "" : "s"} to save · {bulkPreview.willSkip} skipped
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">
              Preview is read-only. The next button is the one deliberate grant.
            </p>
            <button
              type="button"
              onClick={() => void applyBulkEmails()}
              disabled={bulkApplying}
              className="mt-3 rounded-xl bg-[#CA922B] px-4 py-2 text-sm font-bold text-white hover:bg-[#B77E1D] disabled:opacity-50"
            >
              {bulkApplying ? "Granting…" : "Grant full tester access"}
            </button>
          </div>
        )}
      </section>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-[#3A1F0E]/10 bg-white px-4 py-3 text-sm text-[#3A1F0E]"
        >
          {message}
        </p>
      )}

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-[#3A1F0E]/10 bg-white">
          <div className="flex items-center justify-between border-b border-[#3A1F0E]/10 px-5 py-4">
            <h3 className="font-semibold text-[#3A1F0E]">
              Current access ({ledger?.currentAccess.length ?? 0})
            </h3>
            <Eye className="h-4 w-4 text-[#8D5C17]" />
          </div>
          <table className="min-w-[800px] w-full text-sm">
            <thead>
              <tr className="bg-[#FAF6EF] text-left text-[11px] uppercase tracking-wider text-[#3A1F0E]/50">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Access state</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Waitlist</th>
                <th className="px-4 py-3">Granted / pre-approved</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[#3A1F0E]/45"
                  >
                    Loading access records…
                  </td>
                </tr>
              ) : (
                (ledger?.currentAccess ?? []).map((row) => {
                  const stateInfo = accessState(row);
                  return (
                    <tr key={row.email} className="border-t border-[#3A1F0E]/7">
                      <td className="px-4 py-3 font-medium text-[#3A1F0E]">
                        {row.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${stateInfo.className}`}
                        >
                          {stateInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#3A1F0E]/65">
                        {row.user_id
                          ? `Created ${formatDate(row.account_created_at)}`
                          : "Not created"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#3A1F0E]/65">
                        {row.waitlist_id
                          ? `${row.waitlist_status ?? "pending"} · ${formatDate(row.waitlist_created_at)}`
                          : "Missing — review"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#3A1F0E]/65">
                        {formatDate(
                          row.tester_granted_at ?? row.preapproved_at,
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white">
          <div className="flex items-center gap-2 border-b border-[#3A1F0E]/10 px-5 py-4">
            <Clock className="h-4 w-4 text-[#8D5C17]" />
            <h3 className="font-semibold text-[#3A1F0E]">
              Recorded in the last 14 days
            </h3>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-4">
            {(ledger?.recentEvents ?? []).length === 0 ? (
              <p className="text-sm leading-6 text-[#3A1F0E]/55">
                No new access events have been recorded yet. Current active
                access was backfilled when this release deployed. Earlier
                revoked records cannot be recreated if they were deleted before
                an audit trail existed.
              </p>
            ) : (
              (ledger?.recentEvents ?? []).map((event, index) => (
                <article
                  key={`${event.email}-${event.created_at}-${index}`}
                  className="border-b border-[#3A1F0E]/7 py-3 last:border-0"
                >
                  <p className="break-all text-sm font-semibold text-[#3A1F0E]">
                    {event.email}
                  </p>
                  <p className="mt-1 text-xs text-[#8D5C17]">
                    {event.event_type.replace(/_/g, " ")} ·{" "}
                    {event.access_source ?? "source not recorded"}
                  </p>
                  <p className="mt-1 text-xs text-[#3A1F0E]/50">
                    {formatDate(event.created_at)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
