import { useMemo, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
export type KinfolkInlineMemoryConsentPlan = {
  purpose: string;
  ordinary: Array<{
    id: string;
    kind: "ordinary";
    label: string;
    content: string;
  }>;
  sensitive: Array<{
    id: string;
    kind: "sensitive";
    label: string;
    content: string;
  }>;
  oneTimeUseAvailable?: boolean;
};

export function KinfolkInlineMemoryConsent({
  message,
  plan,
  sessionId,
  onSaved,
  onDismiss,
  onUseOnce,
}: {
  message: string;
  plan: KinfolkInlineMemoryConsentPlan;
  sessionId?: string | null;
  onSaved: () => void;
  onDismiss: () => void;
  /** Queues a style instruction locally for exactly the next chat request. */
  onUseOnce?: (instruction: string) => void;
}) {
  const allItems = useMemo(() => [...plan.ordinary, ...plan.sensitive], [plan]);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [sensitivePassword, setSensitivePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedSensitive = plan.sensitive.some((item) =>
    selected.includes(item.id),
  );
  const save = async (ids: string[], confirmedSensitive = false) => {
    if (!ids.length) return;
    const includesSensitive = plan.sensitive.some((item) =>
      ids.includes(item.id),
    );
    const savingSensitive = includesSensitive && confirmedSensitive;
    if (includesSensitive && !savingSensitive) {
      setError("Confirm separately before Kinfolk saves a sensitive detail.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (includesSensitive) {
        if (!sensitivePassword)
          throw new Error(
            "Confirm your password before saving a sensitive detail.",
          );
        const reauth = await fetch(
          `${BASE}api/kinfolk/sensitive-memory-vault/reauth`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: sensitivePassword }),
          },
        );
        const reauthBody = (await reauth.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!reauth.ok)
          throw new Error(reauthBody.error ?? "Password confirmation failed.");
        setSensitivePassword("");
      }
      const response = await fetch(`${BASE}api/kinfolk/memory-consent`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          message,
          selectedIds: ids,
          sessionId: sessionId ?? undefined,
          ...(includesSensitive ? { sensitiveConsent: savingSensitive } : {}),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ?? "Kinfolk could not save the selected details.",
        );
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kinfolk could not save the selected details.",
      );
    } finally {
      setSaving(false);
    }
  };
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const saveAll = () => {
    if (plan.sensitive.length > 0) {
      setChoosing(true);
      setSelected(allItems.map((item) => item.id));
      setSensitiveConsent(false);
      return;
    }
    void save(allItems.map((item) => item.id));
  };
  return (
    <aside
      data-testid="kinfolk-inline-memory-consent"
      className="mt-3 rounded-2xl border border-[#CA922B]/35 bg-[#FFF8EC] p-4"
    >
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#8D5C17]" />
        <div>
          <p className="text-sm font-semibold text-[#2B1507]">
            What should Kinfolk remember?
          </p>
          <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/65">
            Nothing has been saved yet. Preferences can guide relevant searches.
            Personal details stay private and are used only when relevant—not
            for promotion, advertising, or community sharing.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
      {!choosing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : plan.oneTimeUseAvailable ? (
              "Save and use in future"
            ) : (
              "Save all for relevant use"
            )}
          </button>
          {plan.oneTimeUseAvailable && onUseOnce ? (
            <button
              type="button"
              onClick={() => {
                onUseOnce(message);
                onDismiss();
              }}
              disabled={saving}
              className="rounded-full border border-[#CA922B]/45 px-3 py-2 text-xs font-semibold text-[#8D5C17] disabled:opacity-60"
            >
              Use this once
            </button>
          ) : (
            plan.ordinary.length > 0 && (
              <button
                type="button"
                onClick={() => void save(plan.ordinary.map((item) => item.id))}
                disabled={saving}
                className="rounded-full border border-[#CA922B]/45 px-3 py-2 text-xs font-semibold text-[#8D5C17] disabled:opacity-60"
              >
                Save only preferences and interests
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => {
              setChoosing(true);
              setSelected([]);
              setSensitiveConsent(false);
              setSensitivePassword("");
            }}
            disabled={saving}
            className="px-2 py-2 text-xs font-semibold text-[#3A1F0E]/55"
          >
            {plan.oneTimeUseAvailable
              ? "Choose different instructions"
              : "Choose individually"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={saving}
            className="px-2 py-2 text-xs font-semibold text-[#3A1F0E]/55"
          >
            {plan.oneTimeUseAvailable ? "No memory" : "Don’t save"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {allItems.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="mt-0.5 accent-[#8D5C17]"
              />
              <span>
                <span className="block text-xs font-semibold text-[#2B1507]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#3A1F0E]/60">
                  {item.kind === "sensitive"
                    ? "Sensitive—used only when it helps with a relevant question."
                    : item.content}
                </span>
              </span>
            </label>
          ))}
          {selectedSensitive && (
            <>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#CA922B]/45 bg-white p-3">
                <input
                  type="checkbox"
                  checked={sensitiveConsent}
                  onChange={(event) =>
                    setSensitiveConsent(event.target.checked)
                  }
                  className="mt-0.5 accent-[#8D5C17]"
                />
                <span className="text-xs leading-5 text-[#3A1F0E]/70">
                  I separately confirm these selected sensitive details may be
                  saved privately for relevant Kinfolk use.
                </span>
              </label>
              <input
                aria-label="Confirm password before saving selected sensitive memories"
                type="password"
                value={sensitivePassword}
                onChange={(event) => setSensitivePassword(event.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-[#CA922B]/35 bg-white px-3 py-2 text-sm text-[#2B1507]"
              />
            </>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void save(selected, sensitiveConsent)}
              disabled={
                saving ||
                selected.length === 0 ||
                (selectedSensitive && (!sensitiveConsent || !sensitivePassword))
              }
              className="rounded-full bg-[#2B1507] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save selected"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={saving}
              className="text-xs font-semibold text-[#3A1F0E]/55"
            >
              Don’t save
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
