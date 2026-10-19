import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unlink,
} from "lucide-react";
import { Link } from "wouter";
import {
  deleteConnectedAppPermission,
  listConnectedApps,
  recordConnectedAppConsent,
  revokeConnectedApp,
  type ConnectedApp,
  type ConnectedAppCategory,
} from "@/features/connected-apps/api";

const CATEGORIES: Array<{
  id: ConnectedAppCategory;
  label: string;
  description: string;
}> = [
  {
    id: "travel",
    label: "Travel & plans",
    description:
      "Calendars, member-selected confirmations, events, files, and safe flight status setup.",
  },
  {
    id: "health",
    label: "Health",
    description:
      "Only with separate, purpose-specific health consent and a compatible provider.",
  },
  {
    id: "finance",
    label: "Finance",
    description:
      "Read-only budgeting connections only—never payments, transfers, or advice.",
  },
  {
    id: "everyday",
    label: "Everyday life",
    description:
      "Member-selected documents, storage, and family or school calendars.",
  },
];

function availabilityLabel(app: ConnectedApp): string {
  switch (app.availability) {
    case "member_selected_import":
      return "Ready for a member-selected import";
    case "native_permission_required":
      return "Needs device permission and a compatible build";
    case "provider_contract_required":
      return "Requires provider authorization before activation";
    case "unsupported":
      return "Not a supported data connection";
    default:
      return "Connection is designed but not configured";
  }
}

function availabilityAction(app: ConnectedApp): string {
  if (app.availability === "member_selected_import")
    return "Open Journeys to select an item";
  if (app.availability === "native_permission_required")
    return "Review native permission setup";
  if (app.availability === "unsupported") return "Why this is unavailable";
  return "Record purpose & review setup";
}

export function ConnectedAppsSettings() {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [boundary, setBoundary] = useState("");
  const [loading, setLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConnectedApp | null>(null);
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listConnectedApps();
      setApps(response.apps);
      setBoundary(response.boundary);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Connected Apps could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!availabilityChecked) return;
    void load();
  }, [availabilityChecked, load]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        apps: apps.filter((app) => app.category === category.id),
      })),
    [apps],
  );

  if (!availabilityChecked) {
    return (
      <section
        className="mt-8 rounded-3xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm"
        data-testid="connected-apps-settings-idle"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#2B1507]">
              Connected Apps
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#3A1F0E]/65">
              Connected Apps are disabled unless this environment has an
              approved release configuration. Checking availability does not
              authorize a connection, provider request, or data import.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAvailabilityChecked(true)}
            className="rounded-full border border-[#CA922B]/50 px-4 py-2 text-sm font-semibold text-[#2B1507] hover:bg-[#FFF8EC]"
          >
            Check availability
          </button>
        </div>
      </section>
    );
  }

  const openSetup = (app: ConnectedApp) => {
    if (app.availability === "unsupported") {
      setSelected(app);
      return;
    }
    if (app.availability === "member_selected_import") {
      window.location.assign("/journeys");
      return;
    }
    setPurpose("");
    setSelected(app);
  };

  const saveConsent = async () => {
    if (
      !selected ||
      !purpose.trim() ||
      saving ||
      selected.availability === "unsupported"
    )
      return;
    setSaving(true);
    try {
      await recordConnectedAppConsent({
        appKey: selected.key,
        purpose: purpose.trim(),
        dataTypes: selected.dataTypes,
        sensitiveDataAcknowledged: selected.sensitive,
      });
      setSelected(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This permission could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (app: ConnectedApp, action: "revoke" | "delete") => {
    try {
      if (action === "revoke") await revokeConnectedApp(app.key);
      else await deleteConnectedAppPermission(app.key);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This connection setting could not be updated.",
      );
    }
  };

  return (
    <section
      data-testid="connected-apps-settings"
      className="rounded-3xl border border-[#3A1F0E]/10 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CA922B]/10">
          <Link2 className="h-5 w-5 text-[#CA922B]" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-[#2B1507]">
            Connected Apps
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#3A1F0E]/60">
            Choose a connection only when it would help a specific task. Kinfolk
            never scans an inbox, calendar, file storage, health record, or
            financial account by itself.
          </p>
        </div>
      </div>
      {boundary ? (
        <p className="mt-4 rounded-xl border border-[#CA922B]/25 bg-[#FFF8EC] px-3 py-2 text-xs leading-5 text-[#6D4316]">
          {boundary}
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto font-bold underline"
          >
            Retry
          </button>
        </div>
      ) : null}
      {loading ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-[#3A1F0E]/55">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your connection settings…
        </p>
      ) : (
        <div className="mt-6 space-y-7">
          {grouped.map((category) => (
            <section
              key={category.id}
              className="border-t border-[#3A1F0E]/8 pt-6 first:border-t-0 first:pt-0"
            >
              <h4 className="text-sm font-bold text-[#2B1507]">
                {category.label}
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
                {category.description}
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {category.apps.map((app) => (
                  <article
                    key={app.key}
                    className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FFFDF9] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3A1F0E]/7">
                        <Lock className="h-4 w-4 text-[#8D5C17]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-semibold text-[#2B1507]">
                            {app.label}
                          </h5>
                          <span className="rounded-full bg-[#3A1F0E]/7 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3A1F0E]/55">
                            {app.permission?.status ?? "not connected"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">
                          {app.description}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#8D5C17]">
                      {availabilityLabel(app)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
                      {app.boundary}
                    </p>
                    {app.permission ? (
                      <p className="mt-2 text-xs text-[#3A1F0E]/50">
                        Purpose: {app.permission.purpose}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openSetup(app)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B1507] px-3 py-2 text-xs font-bold text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {availabilityAction(app)}
                      </button>
                      {app.permission ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void runAction(app, "revoke")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#8D5C17]"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                            Revoke
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(app, "delete")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete setting
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.label} connection setup`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1507]/45 p-4"
        >
          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-serif text-xl font-bold text-[#2B1507]">
                  {selected.label}
                </h4>
                <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">
                  {selected.description}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Connected Apps setup"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-[#3A1F0E]/60"
              >
                ×
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-[#FFF8EC] p-3 text-xs leading-5 text-[#6D4316]">
              {selected.boundary}
            </p>
            {selected.availability === "unsupported" ? (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-5 rounded-lg bg-[#2B1507] px-3 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            ) : (
              <>
                <label className="mt-5 block text-sm font-semibold text-[#2B1507]">
                  What should this help with?
                  <input
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    maxLength={160}
                    placeholder="For example, plan a member-selected trip"
                    className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm outline-none focus:border-[#CA922B]"
                  />
                </label>
                {selected.sensitive ? (
                  <p className="mt-3 text-xs leading-5 text-[#3A1F0E]/60">
                    By continuing, you acknowledge this is a sensitive-data
                    purpose record. It does not connect, fetch, or share any
                    health or financial data.
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={saving || !purpose.trim()}
                    onClick={() => void saveConsent()}
                    className="rounded-lg bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-55"
                  >
                    {saving ? "Saving…" : "Record consent"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setSelected(null)}
                    className="text-xs font-bold text-[#8D5C17]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
      <p className="mt-5 text-xs leading-5 text-[#3A1F0E]/50">
        For selected travel details, use{" "}
        <Link href="/journeys" className="font-bold text-[#8D5C17]">
          Kinfolk Journeys
        </Link>
        . You can review, revoke, or delete an app setting here at any time.
      </p>
    </section>
  );
}
